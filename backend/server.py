from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from recommendation_engine import RecommendationEngine
from evaluation import run_evaluation

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Initialize Recommendation Engine
DATA_PATH = ROOT_DIR / 'data' / 'ml-latest-small'
rec_engine = RecommendationEngine(DATA_PATH)

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Cached evaluation results
_eval_cache = {}

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

VALID_ALGORITHMS = ('tfidf', 'genre', 'combined', 'word2vec', 'bert', 'collaborative', 'hybrid')


# ── Pydantic Models ──────────────────────────────────────────────

class MovieRating(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    movie_id: int
    rating: float
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MovieRatingCreate(BaseModel):
    user_id: str
    movie_id: int
    rating: float

class SearchRequest(BaseModel):
    query: str
    limit: Optional[int] = 20

class PersonalizedRecommendationRequest(BaseModel):
    user_ratings: List[dict]
    algorithm: Optional[str] = 'tfidf'
    top_n: Optional[int] = 10


# ── Routes ───────────────────────────────────────────────────────

@api_router.get("/")
async def root():
    return {"message": "Content-Based Recommendation System API"}


@api_router.get("/movies")
async def get_movies(
    genre: Optional[str] = None,
    limit: int = Query(default=50, le=200),
):
    try:
        if genre:
            movies = rec_engine.get_movies_by_genre(genre, limit)
        else:
            movies = (
                rec_engine.movies_df
                .sample(n=min(limit, len(rec_engine.movies_df)))
                [['movieId', 'title', 'genres']]
                .to_dict('records')
            )
        return {"movies": movies, "count": len(movies)}
    except Exception as e:
        logger.error(f"Error getting movies: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/movies/{movie_id}")
async def get_movie(movie_id: int):
    movie = rec_engine.get_movie_by_id(movie_id)
    if movie:
        return movie
    raise HTTPException(status_code=404, detail="Movie not found")


@api_router.post("/movies/{movie_id}/rate")
async def rate_movie(movie_id: int, rating_data: MovieRatingCreate):
    try:
        rating_obj = MovieRating(**rating_data.model_dump())
        doc = rating_obj.model_dump()
        doc['timestamp'] = doc['timestamp'].isoformat()
        await db.ratings.insert_one(doc)
        return {"message": "Rating saved", "rating": rating_obj.model_dump()}
    except Exception as e:
        logger.error(f"Error saving rating: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/recommendations/{movie_id}")
async def get_recommendations(
    movie_id: int,
    algorithm: str = Query(default='tfidf'),
    top_n: int = Query(default=10, le=50),
):
    if algorithm not in VALID_ALGORITHMS:
        raise HTTPException(status_code=400, detail=f"Invalid algorithm. Choose from: {VALID_ALGORITHMS}")
    dispatch = {
        'tfidf':         rec_engine.get_recommendations_tfidf,
        'genre':         rec_engine.get_recommendations_genre,
        'combined':      rec_engine.get_recommendations_combined,
        'word2vec':      rec_engine.get_recommendations_word2vec,
        'bert':          rec_engine.get_recommendations_bert,
        'collaborative': rec_engine.get_recommendations_collaborative,
        'hybrid':        rec_engine.get_recommendations_hybrid,
    }
    try:
        recs = dispatch[algorithm](movie_id, top_n)
        return {"movie_id": movie_id, "algorithm": algorithm, "recommendations": recs}
    except Exception as e:
        logger.error(f"Error getting recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/recommendations/personalized")
async def get_personalized_recommendations(request: PersonalizedRecommendationRequest):
    try:
        recs = rec_engine.get_personalized_recommendations(
            request.user_ratings, request.top_n, request.algorithm
        )
        return {"algorithm": request.algorithm, "recommendations": recs}
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/similarity/{movie_id_1}/{movie_id_2}")
async def compare_movies(movie_id_1: int, movie_id_2: int):
    result = rec_engine.compare_movies(movie_id_1, movie_id_2)
    if result:
        return result
    raise HTTPException(status_code=404, detail="One or both movies not found")


@api_router.get("/genres")
async def get_genres():
    return {"genres": rec_engine.get_all_genres()}


@api_router.post("/search")
async def search_movies(request: SearchRequest):
    try:
        results = rec_engine.search_movies(request.query, request.limit)
        return {"results": results, "count": len(results)}
    except Exception as e:
        logger.error(f"Error searching: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/user/{user_id}/ratings")
async def get_user_ratings(user_id: str):
    try:
        ratings = await db.ratings.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
        return {"ratings": ratings, "count": len(ratings)}
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/evaluation")
async def get_evaluation(
    k: int = Query(default=10, ge=1, le=50),
    n_users: int = Query(default=30, ge=5, le=100),
):
    """Run evaluation for all models and return metrics."""
    cache_key = f"{k}_{n_users}"
    if cache_key in _eval_cache:
        return _eval_cache[cache_key]
    try:
        result = run_evaluation(rec_engine, k_values=[5, k, 20], n_users=n_users)
        _eval_cache[cache_key] = result
        return result
    except Exception as e:
        logger.error(f"Evaluation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/models/status")
async def models_status():
    """Return which models are loaded."""
    return {
        "tfidf": rec_engine.tfidf_matrix is not None,
        "genre": True,
        "combined": True,
        "word2vec": rec_engine.w2v_embeddings is not None,
        "bert": rec_engine.bert_embeddings is not None,
        "collaborative": rec_engine.collab_matrix is not None,
        "hybrid": rec_engine.collab_matrix is not None and rec_engine.tfidf_matrix is not None,
    }


# ── App config ───────────────────────────────────────────────────

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
