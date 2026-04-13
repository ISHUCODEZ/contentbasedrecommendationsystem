# Content-Based Recommendation System - PRD

## Problem Statement
Design a Content Based Recommendation System using MovieLens and Netflix dataset with word embeddings, hybrid recommendations, evaluation metrics, authentication, and user profiles.

## Architecture
- **Backend**: FastAPI + Python (scikit-learn, gensim, sentence-transformers, bcrypt, PyJWT)
- **Frontend**: React + TailwindCSS + Recharts + Framer Motion
- **Database**: MongoDB (users, ratings, watchlist, recommendation history)
- **Datasets**: MovieLens ml-latest-small (9,742 movies) + Netflix Movies & TV Shows (7,787 titles) = 17,529 total

## What's Been Implemented (April 2026)

### Phase 1: Core Recommendation System
- TF-IDF + Cosine Similarity
- Genre-Based Matching (Jaccard)
- Combined (weighted TF-IDF + Genre)
- Netflix-style dark cinematic UI

### Phase 2: Advanced Models + Evaluation
- Word2Vec (Gensim) embeddings
- Sentence-BERT (all-MiniLM-L6-v2)
- Collaborative Filtering (item-item CF)
- Hybrid (50% content + 50% collaborative)
- Evaluation: Precision@K, Recall@K, F1@K, MAP@K, NDCG@K
- Model comparison dashboard with bar/radar charts

### Phase 3: Netflix + Auth + Profiles
- Netflix Movies & TV Shows dataset integrated (7,787 titles with director, cast, description)
- JWT email/password authentication (bcrypt hashing)
- User profiles: ratings, watchlist/favorites, recommendation history
- Source badges (MovieLens/Netflix) on movie cards
- Rich movie metadata display (director, cast, country, description)

## Prioritized Backlog
- P1: Netflix ratings data (currently metadata only)
- P2: Real movie posters via TMDB API (when user provides key)
- P2: A/B testing framework for recommendation algorithms
- P3: Social features (share recommendations, follow users)
