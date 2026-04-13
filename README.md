# Content-Based Recommendation System

## Project Overview
A full-featured movie recommendation system built with **10 recommendation algorithms**, **17,529 movies** (MovieLens + Netflix), and **13 advanced features** including explainable AI, A/B testing, knowledge graphs, and interactive visualizations.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI (Python 3.11) |
| Frontend | React 18 + TailwindCSS + Recharts + D3.js |
| Database | MongoDB |
| ML Libraries | scikit-learn, gensim (Word2Vec), sentence-transformers (BERT), scipy |
| Auth | JWT (PyJWT) + bcrypt |
| Datasets | MovieLens ml-latest-small (9,742 movies) + Netflix Movies & TV Shows (7,787 titles) |

---

## Environment Variables

### Backend (`/backend/.env`)

```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
CORS_ORIGINS="*"
JWT_SECRET="<random-64-char-hex-string>"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="admin123"
```

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URL` | Yes | MongoDB connection string |
| `DB_NAME` | Yes | Database name |
| `CORS_ORIGINS` | Yes | Allowed CORS origins (use `*` for dev) |
| `JWT_SECRET` | Yes | 64-char hex secret for signing JWT tokens. Generate with: `python3 -c "import secrets; print(secrets.token_hex(32))"` |
| `ADMIN_EMAIL` | Yes | Admin account email (auto-seeded on startup) |
| `ADMIN_PASSWORD` | Yes | Admin account password (auto-seeded on startup) |

### Frontend (`/frontend/.env`)

```env
REACT_APP_BACKEND_URL=http://localhost:8001
WDS_SOCKET_PORT=443
```

| Variable | Required | Description |
|----------|----------|-------------|
| `REACT_APP_BACKEND_URL` | Yes | Backend API base URL (no trailing slash) |

---

## Installation & Setup

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
```

Key Python packages:
- `fastapi`, `uvicorn`, `motor` — API framework + MongoDB async driver
- `scikit-learn` — TF-IDF, SVD, KMeans, cosine similarity
- `gensim` — Word2Vec word embeddings
- `sentence-transformers` — BERT sentence embeddings (all-MiniLM-L6-v2)
- `torch` — PyTorch (required by sentence-transformers)
- `bcrypt`, `PyJWT` — Authentication
- `pandas`, `numpy`, `scipy` — Data processing

### 2. Frontend

```bash
cd frontend
yarn install
yarn start
```

Key JS packages:
- `recharts` — Bar charts, radar charts for evaluation dashboard
- `d3` — Force-directed similarity graph
- `framer-motion` — Animations
- `lucide-react` — Icons
- `axios` — HTTP client

### 3. Dataset

MovieLens dataset is pre-downloaded at `backend/data/ml-latest-small/`.
Netflix dataset is at `backend/data/netflix_titles.csv`.

If missing, download:
```bash
cd backend/data
wget http://files.grouplens.org/datasets/movielens/ml-latest-small.zip
unzip ml-latest-small.zip
wget https://raw.githubusercontent.com/Deepubhatt/EDA-on-Netflix-Dataset/main/netflix_dataset.csv -O netflix_titles.csv
```

### 4. Start Services

```bash
# Backend (port 8001)
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Frontend (port 3000)
cd frontend
yarn start
```

> **Note**: First startup takes ~90 seconds as BERT model downloads (~80MB) and all embeddings are computed.

---

## Default Credentials

| Account | Email | Password |
|---------|-------|----------|
| Admin | admin@example.com | admin123 |

Admin is auto-seeded on first startup. Register new users via the Sign Up form or `/api/auth/register`.

---

## 10 Recommendation Algorithms

| # | Algorithm | Key | Description |
|---|-----------|-----|-------------|
| 1 | **TF-IDF** | `tfidf` | TF-IDF vectorization + cosine similarity on genres, tags, descriptions |
| 2 | **Genre-Based** | `genre` | Jaccard similarity on genre sets |
| 3 | **Combined** | `combined` | Weighted blend: 60% TF-IDF + 40% Genre |
| 4 | **Word2Vec** | `word2vec` | Gensim Word2Vec trained on movie metadata, averaged embeddings |
| 5 | **BERT** | `bert` | Sentence-BERT (all-MiniLM-L6-v2) embeddings, normalized cosine similarity |
| 6 | **Collaborative** | `collaborative` | Item-item collaborative filtering from user-item sparse ratings matrix |
| 7 | **Hybrid** | `hybrid` | 50% Content (TF-IDF) + 50% Collaborative |
| 8 | **SVD** | `svd` | TruncatedSVD matrix factorization (50 components) on ratings |
| 9 | **Knowledge Graph** | `kg` | Graph-based: genre/director/cast nodes linked to movies, Jaccard node overlap |
| 10 | **Sentiment** | `sentiment` | TF-IDF boosted by lexicon-based sentiment alignment on tags/descriptions |

---

## 13 Advanced Features

### 1. Explainable Recommendations
- **What**: Shows *why* each movie is recommended (shared genres, same director, shared cast, same country)
- **API**: `GET /api/explain/{movie_id}/{rec_movie_id}` — returns reasons array
- **API**: `GET /api/recommendations/{movie_id}/explained?algorithm=tfidf` — recommendations with explanations attached

### 2. Cold-Start Quiz
- **What**: New users pick favorite genres → get instant personalized recommendations without any rating history
- **API**: `GET /api/coldstart/genres` — genre list with sample movies
- **API**: `POST /api/coldstart/recommend` — body: `{"genres": ["Action", "Comedy"], "top_n": 20}`
- **UI**: Button on homepage: "New here? Take the genre quiz"

### 3. Time-Decay Weighting
- **What**: Recent ratings are weighted more heavily in personalized recommendations
- **Implementation**: Exponential decay with 180-day half-life applied to user rating timestamps
- **Used in**: Personalized recommendation engine

### 4. Diversity & Serendipity Metrics
- **What**: Measures how diverse (genre variety) and surprising (unexpected genres) recommendations are
- **API**: `GET /api/diversity/{movie_id}?algorithm=tfidf` — returns diversity score (0-1)
- **Implementation**: Intra-list pairwise genre dissimilarity

### 5. SVD Matrix Factorization
- **What**: TruncatedSVD decomposes user-item ratings matrix into 50-dimensional latent factors
- **API**: `GET /api/recommendations/{id}?algorithm=svd`
- **Library**: `sklearn.decomposition.TruncatedSVD`

### 6. Knowledge Graph
- **What**: Builds a graph with genre, director, and cast nodes linked to movies. Recommends based on shared graph neighbors.
- **API**: `GET /api/recommendations/{id}?algorithm=kg`
- **Implementation**: In-memory adjacency list, Jaccard node overlap scoring

### 7. Sentiment-Weighted Tags
- **What**: Lexicon-based sentiment analysis on tags and descriptions. Boosts recommendations with aligned sentiment.
- **API**: `GET /api/recommendations/{id}?algorithm=sentiment`
- **Lexicon**: 24 positive words, 18 negative words, score range [-1, +1]

### 8. User Clustering
- **What**: K-Means clustering groups 610 MovieLens users into 8 taste profiles
- **API**: `GET /api/user-clusters` — returns cluster assignments, sizes, sample users
- **Library**: `sklearn.cluster.KMeans`

### 9. A/B Testing
- **What**: Compare any two algorithms side-by-side for the same movie
- **API**: `GET /api/ab-test/{movie_id}?algo_a=tfidf&algo_b=collaborative&top_n=10`
- **Returns**: Both recommendation lists, overlap count, Jaccard similarity, unique counts
- **UI**: Dedicated A/B Test page with dropdown selectors and visual comparison

### 10. Source Badges (MovieLens / Netflix)
- **What**: Every movie card shows ML (blue) or N (red) badge indicating data source
- **UI**: Top-left corner of each movie poster card

### 11. Interactive Similarity Graph (D3.js)
- **What**: Force-directed graph visualization showing a movie and its connections from multiple algorithms
- **API**: `GET /api/similarity-graph/{movie_id}?top_n=15` — returns nodes + links
- **UI**: Dedicated Graph page with draggable D3 visualization, color-coded by algorithm
- **Library**: `d3` (v7)

### 12. Evaluation Dashboard
- **What**: Compare all 10 models across 5 metrics: Precision@K, Recall@K, F1@K, MAP@K, NDCG@K
- **API**: `GET /api/evaluation?k=10&n_users=30`
- **UI**: Bar charts, radar charts, detailed comparison table, K-value selector (5/10/20)

### 13. JWT Auth + User Profiles
- **What**: Email/password registration/login, persistent user profiles
- **Auth APIs**:
  - `POST /api/auth/register` — `{"email", "password", "name"}`
  - `POST /api/auth/login` — `{"email", "password"}`
  - `GET /api/auth/me` — current user (requires token)
  - `POST /api/auth/logout`
- **Profile APIs**:
  - `POST /api/profile/rate` — `{"movie_id", "rating"}` (1-5 stars)
  - `GET /api/profile/ratings` — all user ratings
  - `POST /api/profile/watchlist` — toggle movie in watchlist
  - `GET /api/profile/watchlist` — user's watchlist
  - `POST /api/profile/recommendation-history` — save rec session
  - `GET /api/profile/recommendation-history` — past recommendations
  - `GET /api/profile/personalized?algorithm=tfidf` — personalized recs from rated movies

---

## API Reference

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/movies?genre=Action&limit=50` | List movies (optional genre filter) |
| GET | `/api/movies/{id}` | Movie details (title, genres, director, cast, description, rating) |
| POST | `/api/search` | Search by title: `{"query": "Toy Story"}` |
| GET | `/api/genres` | All unique genres |
| GET | `/api/recommendations/{id}?algorithm=tfidf&top_n=10` | Get recommendations |
| GET | `/api/similarity/{id1}/{id2}` | Compare two movies (TF-IDF, Genre, W2V, BERT scores) |
| GET | `/api/models/status` | Which models are active |
| GET | `/api/dataset/stats` | Total movies, MovieLens/Netflix counts, ratings count |
| GET | `/api/evaluation?k=10&n_users=30` | Run evaluation across all models |

### Advanced Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/explain/{id}/{rec_id}` | Why movie was recommended |
| GET | `/api/recommendations/{id}/explained` | Recs with explanations |
| GET | `/api/coldstart/genres` | Quiz genre data |
| POST | `/api/coldstart/recommend` | Quiz-based recommendations |
| GET | `/api/ab-test/{id}?algo_a=X&algo_b=Y` | A/B comparison |
| GET | `/api/user-clusters` | User taste clusters |
| GET | `/api/diversity/{id}?algorithm=X` | Diversity score |
| GET | `/api/similarity-graph/{id}?top_n=15` | D3 graph data |

---

## Frontend Pages

| Page | Nav Link | Description |
|------|----------|-------------|
| **Home** | Home | Hero section, algorithm selector (10 tabs), genre filters, movie grid, cold-start quiz |
| **Evaluation** | Evaluation | Model comparison: bar charts, radar charts, detailed metrics table |
| **A/B Test** | A/B Test | Side-by-side algorithm comparison with overlap stats |
| **Graph** | Graph | Interactive D3.js similarity graph visualization |
| **Profile** | Profile | User ratings, watchlist, recommendation history (auth required) |
| **Auth** | — | Sign In / Sign Up / Continue as Guest |

---

## MongoDB Collections

| Collection | Description |
|------------|-------------|
| `users` | User accounts (email, password_hash, name, role) |
| `user_ratings` | Movie ratings per user (movie_id, rating, timestamp) |
| `watchlist` | User watchlist items (movie_id, added_at) |
| `recommendation_history` | Saved recommendation sessions |
| `ratings` | Public/anonymous ratings (backwards compat) |

---

## Notes

- **Startup time**: ~90 seconds (BERT model download + Word2Vec training + SVD + KG build)
- **Memory**: ~1.5GB RAM (BERT model + embeddings + sparse matrices)
- **Evaluation**: Takes ~20-60s on first call, results cached after
- **No external API keys required** — all models run locally
- **BERT model**: `all-MiniLM-L6-v2` (~80MB, auto-downloaded from HuggingFace)
