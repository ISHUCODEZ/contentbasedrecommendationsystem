# Content-Based Recommendation System - PRD

## Problem Statement
Design an advanced Content Based Recommendation System using MovieLens + Netflix datasets with 10 recommendation algorithms, evaluation metrics, authentication, user profiles, and 13 advanced features.

## Architecture
- **Backend**: FastAPI + Python (scikit-learn, gensim, sentence-transformers, bcrypt, PyJWT, D3 graph data)
- **Frontend**: React + TailwindCSS + Recharts + D3.js + Framer Motion
- **Database**: MongoDB (users, ratings, watchlist, recommendation history)
- **Datasets**: MovieLens (9,742) + Netflix (7,787) = 17,529 movies

## All 13 Advanced Features Implemented

1. **Explainable Recommendations** - Shows WHY each movie is recommended (shared genres, directors, cast)
2. **Cold-Start Quiz** - New users pick genres → instant personalized recommendations
3. **Time-Decay Weighting** - Recent ratings weighted more heavily
4. **Diversity & Serendipity Metrics** - Measures recommendation diversity and surprise factor
5. **SVD Matrix Factorization** - TruncatedSVD on user-item matrix
6. **Knowledge Graph** - Graph-based similarity using genre/director/cast nodes
7. **Sentiment-Weighted Tags** - Lexicon-based sentiment boosts/penalizes recommendations
8. **User Clustering** - K-Means clustering of 610 users into 8 taste profiles
9. **A/B Testing** - Side-by-side algorithm comparison with overlap/Jaccard metrics
10. **Source Badges** - MovieLens (ML) / Netflix (N) badges on cards
11. **Interactive Similarity Graph** - D3.js force-directed graph visualization
12. **10 Recommendation Algorithms** - TF-IDF, Genre, Combined, Word2Vec, BERT, Collaborative, Hybrid, SVD, KnowledgeGraph, Sentiment
13. **JWT Auth + User Profiles** - Ratings, watchlist, recommendation history

## Evaluation Metrics
- Precision@K, Recall@K, F1@K, MAP@K, NDCG@K
- Configurable K (5, 10, 20)
- All 10 models compared in bar/radar charts and detailed table
