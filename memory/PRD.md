# Content-Based Recommendation System - PRD

## Problem Statement
Design a Content Based Recommendation System using MovieLens and Netflix dataset.

## Architecture
- **Backend**: FastAPI + Python (scikit-learn, gensim, sentence-transformers)
- **Frontend**: React + TailwindCSS + Recharts
- **Database**: MongoDB (user ratings storage)
- **Dataset**: MovieLens ml-latest-small (9,742 movies, 100,836 ratings)

## Core Requirements
1. Movie search and personalized recommendations
2. Multiple recommendation algorithms
3. User rating system
4. Genre browsing with filters
5. Model evaluation and comparison

## What's Been Implemented (April 2026)

### 7 Recommendation Algorithms
- **TF-IDF + Cosine Similarity** - Text-based similarity on genres + tags
- **Genre-Based Matching** - Jaccard similarity on genre sets
- **Combined** - Weighted blend (60% TF-IDF + 40% Genre)
- **Word2Vec** - Gensim Word2Vec trained on movie metadata
- **Sentence-BERT** - all-MiniLM-L6-v2 embeddings for semantic similarity
- **Collaborative Filtering** - Item-item CF from user-item ratings matrix
- **Hybrid** - 50% Content (TF-IDF) + 50% Collaborative

### Evaluation Metrics
- Precision@K, Recall@K, F1@K, MAP@K, NDCG@K
- Configurable K values (5, 10, 20)
- Leave-one-out style evaluation on sampled users
- Results cached for performance

### Frontend Features
- Netflix-style dark cinematic UI
- Hero section with featured movie
- 7-algorithm tab selector
- Genre filter pills
- Movie detail modal with star rating
- Search functionality
- Dedicated Evaluation page with:
  - Bar charts (all metrics × all models)
  - Radar chart (multi-dimensional comparison)
  - Detailed comparison table (Model A vs Model B)
  - Model status indicators
  - K-value selector

## Prioritized Backlog
- P0: Complete (all core features implemented)
- P1: User authentication for personalized profiles
- P1: Netflix dataset integration (currently MovieLens only)
- P2: A/B testing framework for algorithms
- P2: Real-time recommendation updates based on browsing history

## Next Tasks
1. Add user authentication for persistent profiles
2. Integrate Netflix dataset
3. Add more movie metadata (TMDB API for posters, descriptions, cast)
4. Implement real-time collaborative filtering updates
