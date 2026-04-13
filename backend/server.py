from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Query, Request, Response
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os, logging, uuid
from datetime import datetime, timezone
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from recommendation_engine import RecommendationEngine
from evaluation import run_evaluation
from auth import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    get_current_user, seed_admin,
)

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Recommendation Engine
DATA_PATH = ROOT_DIR / 'data' / 'ml-latest-small'
rec_engine = RecommendationEngine(DATA_PATH)

app = FastAPI()
api = APIRouter(prefix="/api")

_eval_cache = {}

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

VALID_ALGOS = ('tfidf', 'genre', 'combined', 'word2vec', 'bert', 'collaborative', 'hybrid')


# ═══════════════════════ Pydantic Models ═══════════════════════

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = ""

class LoginRequest(BaseModel):
    email: str
    password: str

class MovieRatingCreate(BaseModel):
    movie_id: int
    rating: float

class SearchRequest(BaseModel):
    query: str
    limit: Optional[int] = 20

class PersonalizedRecommendationRequest(BaseModel):
    user_ratings: List[dict]
    algorithm: Optional[str] = 'tfidf'
    top_n: Optional[int] = 10

class WatchlistRequest(BaseModel):
    movie_id: int


# ═══════════════════════ AUTH ENDPOINTS ═══════════════════════

def _set_auth_cookies(response: Response, access: str, refresh: str):
    response.set_cookie("access_token", access, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")


@api.post("/auth/register")
async def register(req: RegisterRequest, response: Response):
    email = req.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "Email already registered")
    doc = {
        "email": email,
        "password_hash": hash_password(req.password),
        "name": req.name or email.split("@")[0],
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.users.insert_one(doc)
    uid = str(result.inserted_id)
    access = create_access_token(uid, email)
    refresh = create_refresh_token(uid)
    _set_auth_cookies(response, access, refresh)
    return {"id": uid, "email": email, "name": doc["name"], "role": "user", "token": access}


@api.post("/auth/login")
async def login(req: LoginRequest, response: Response):
    email = req.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(401, "Invalid email or password")
    uid = str(user["_id"])
    access = create_access_token(uid, email)
    refresh = create_refresh_token(uid)
    _set_auth_cookies(response, access, refresh)
    return {"id": uid, "email": email, "name": user.get("name", ""), "role": user.get("role", "user"), "token": access}


@api.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request, db)
    return {"id": user["_id"], "email": user["email"], "name": user.get("name", ""), "role": user.get("role", "user")}


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out"}


# ═══════════════════════ USER PROFILE ═══════════════════════

@api.post("/profile/rate")
async def rate_movie(req: MovieRatingCreate, request: Request):
    user = await get_current_user(request, db)
    uid = user["_id"]
    # Upsert rating
    await db.user_ratings.update_one(
        {"user_id": uid, "movie_id": req.movie_id},
        {"$set": {"user_id": uid, "movie_id": req.movie_id, "rating": req.rating,
                  "timestamp": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    return {"message": "Rating saved", "movie_id": req.movie_id, "rating": req.rating}


@api.get("/profile/ratings")
async def get_my_ratings(request: Request):
    user = await get_current_user(request, db)
    ratings = await db.user_ratings.find({"user_id": user["_id"]}, {"_id": 0}).to_list(1000)
    return {"ratings": ratings, "count": len(ratings)}


@api.post("/profile/watchlist")
async def add_to_watchlist(req: WatchlistRequest, request: Request):
    user = await get_current_user(request, db)
    uid = user["_id"]
    existing = await db.watchlist.find_one({"user_id": uid, "movie_id": req.movie_id})
    if existing:
        await db.watchlist.delete_one({"user_id": uid, "movie_id": req.movie_id})
        return {"message": "Removed from watchlist", "movie_id": req.movie_id, "in_watchlist": False}
    await db.watchlist.insert_one({
        "user_id": uid, "movie_id": req.movie_id,
        "added_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"message": "Added to watchlist", "movie_id": req.movie_id, "in_watchlist": True}


@api.get("/profile/watchlist")
async def get_watchlist(request: Request):
    user = await get_current_user(request, db)
    items = await db.watchlist.find({"user_id": user["_id"]}, {"_id": 0}).to_list(500)
    return {"watchlist": items, "count": len(items)}


@api.post("/profile/recommendation-history")
async def save_recommendation_history(request: Request):
    user = await get_current_user(request, db)
    body = await request.json()
    await db.recommendation_history.insert_one({
        "user_id": user["_id"],
        "movie_id": body.get("movie_id"),
        "algorithm": body.get("algorithm"),
        "recommendations": body.get("recommendations", []),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    return {"message": "History saved"}


@api.get("/profile/recommendation-history")
async def get_recommendation_history(request: Request):
    user = await get_current_user(request, db)
    history = await db.recommendation_history.find(
        {"user_id": user["_id"]}, {"_id": 0}
    ).sort("timestamp", -1).to_list(50)
    return {"history": history, "count": len(history)}


@api.get("/profile/personalized")
async def get_my_personalized(request: Request, algorithm: str = 'tfidf', top_n: int = 10):
    user = await get_current_user(request, db)
    ratings = await db.user_ratings.find({"user_id": user["_id"]}, {"_id": 0}).to_list(1000)
    if not ratings:
        return {"algorithm": algorithm, "recommendations": [], "message": "Rate some movies first!"}
    user_ratings = [{"movie_id": r["movie_id"], "rating": r["rating"]} for r in ratings]
    recs = rec_engine.get_personalized_recommendations(user_ratings, top_n, algorithm)
    return {"algorithm": algorithm, "recommendations": recs}


# ═══════════════════════ MOVIE ENDPOINTS ═══════════════════════

@api.get("/")
async def root():
    return {"message": "Content-Based Recommendation System API"}


@api.get("/movies")
async def get_movies(
    genre: Optional[str] = None,
    source: Optional[str] = None,
    limit: int = Query(default=50, le=200),
):
    try:
        if genre:
            movies = rec_engine.get_movies_by_genre(genre, limit)
        else:
            df = rec_engine.movies_df
            if source:
                df = df[df['source'] == source]
            movies = df.sample(n=min(limit, len(df)))[['movieId', 'title', 'genres', 'source']].to_dict('records')
        if source:
            movies = [m for m in movies if m.get('source') == source]
        return {"movies": movies, "count": len(movies)}
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(500, str(e))


@api.get("/movies/{movie_id}")
async def get_movie(movie_id: int):
    movie = rec_engine.get_movie_by_id(movie_id)
    if movie:
        return movie
    raise HTTPException(404, "Movie not found")


@api.post("/movies/{movie_id}/rate")
async def rate_movie_public(movie_id: int, rating_data: dict):
    """Public rating endpoint (backwards compat)."""
    try:
        doc = {
            "id": str(uuid.uuid4()),
            "user_id": rating_data.get("user_id", "anonymous"),
            "movie_id": movie_id,
            "rating": rating_data.get("rating", 0),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        await db.ratings.insert_one(doc)
        return {"message": "Rating saved"}
    except Exception as e:
        raise HTTPException(500, str(e))


@api.get("/recommendations/{movie_id}")
async def get_recommendations(
    movie_id: int,
    algorithm: str = Query(default='tfidf'),
    top_n: int = Query(default=10, le=50),
):
    if algorithm not in VALID_ALGOS:
        raise HTTPException(400, f"Invalid algorithm. Choose from: {VALID_ALGOS}")
    dispatch = {
        'tfidf': rec_engine.get_recommendations_tfidf,
        'genre': rec_engine.get_recommendations_genre,
        'combined': rec_engine.get_recommendations_combined,
        'word2vec': rec_engine.get_recommendations_word2vec,
        'bert': rec_engine.get_recommendations_bert,
        'collaborative': rec_engine.get_recommendations_collaborative,
        'hybrid': rec_engine.get_recommendations_hybrid,
    }
    try:
        recs = dispatch[algorithm](movie_id, top_n)
        return {"movie_id": movie_id, "algorithm": algorithm, "recommendations": recs}
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(500, str(e))


@api.post("/recommendations/personalized")
async def get_personalized_recommendations(request: PersonalizedRecommendationRequest):
    try:
        recs = rec_engine.get_personalized_recommendations(request.user_ratings, request.top_n, request.algorithm)
        return {"algorithm": request.algorithm, "recommendations": recs}
    except Exception as e:
        raise HTTPException(500, str(e))


@api.get("/similarity/{movie_id_1}/{movie_id_2}")
async def compare_movies(movie_id_1: int, movie_id_2: int):
    result = rec_engine.compare_movies(movie_id_1, movie_id_2)
    if result:
        return result
    raise HTTPException(404, "One or both movies not found")


@api.get("/genres")
async def get_genres():
    return {"genres": rec_engine.get_all_genres()}


@api.post("/search")
async def search_movies(request: SearchRequest):
    try:
        results = rec_engine.search_movies(request.query, request.limit)
        return {"results": results, "count": len(results)}
    except Exception as e:
        raise HTTPException(500, str(e))


@api.get("/evaluation")
async def get_evaluation(
    k: int = Query(default=10, ge=1, le=50),
    n_users: int = Query(default=30, ge=5, le=100),
):
    cache_key = f"{k}_{n_users}"
    if cache_key in _eval_cache:
        return _eval_cache[cache_key]
    try:
        result = run_evaluation(rec_engine, k_values=[5, k, 20], n_users=n_users)
        _eval_cache[cache_key] = result
        return result
    except Exception as e:
        logger.error(f"Evaluation error: {e}")
        raise HTTPException(500, str(e))


@api.get("/models/status")
async def models_status():
    return {
        "tfidf": rec_engine.tfidf_matrix is not None,
        "genre": True,
        "combined": True,
        "word2vec": rec_engine.w2v_embeddings is not None,
        "bert": rec_engine.bert_embeddings is not None,
        "collaborative": rec_engine.collab_matrix is not None,
        "hybrid": rec_engine.collab_matrix is not None and rec_engine.tfidf_matrix is not None,
    }


@api.get("/dataset/stats")
async def dataset_stats():
    ml_count = len(rec_engine.movies_df[rec_engine.movies_df['source'] == 'movielens'])
    nf_count = len(rec_engine.movies_df[rec_engine.movies_df['source'] == 'netflix'])
    return {
        "total_movies": len(rec_engine.movies_df),
        "movielens_count": ml_count,
        "netflix_count": nf_count,
        "total_ratings": len(rec_engine.ratings_df),
    }


# ═══════════════════════ APP CONFIG ═══════════════════════

app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await seed_admin(db)
    logger.info("Admin seeded, indexes created")


@app.on_event("shutdown")
async def shutdown():
    client.close()
