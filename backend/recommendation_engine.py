import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from scipy.sparse import csr_matrix
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class RecommendationEngine:
    def __init__(self, data_path: Path):
        self.data_path = data_path
        self.movies_df = None
        self.ratings_df = None
        self.tfidf_matrix = None
        self.tfidf_vectorizer = None
        self.w2v_embeddings = None
        self.bert_embeddings = None
        self.collab_matrix = None
        self.collab_movie_ids = None
        self.load_data()
        self.prepare_features()
        self._build_word2vec_embeddings()
        self._build_bert_embeddings()
        self._build_collaborative_matrix()

    # ── DATA LOADING ─────────────────────────────────────────────────

    def load_data(self):
        self.movies_df = pd.read_csv(self.data_path / 'movies.csv')
        self.ratings_df = pd.read_csv(self.data_path / 'ratings.csv')
        self.tags_df = pd.read_csv(self.data_path / 'tags.csv')

        # Build richer text column: genres + user tags
        tags_agg = (
            self.tags_df.groupby('movieId')['tag']
            .apply(lambda x: ' '.join(x.astype(str)))
            .reset_index()
        )
        self.movies_df = self.movies_df.merge(tags_agg, on='movieId', how='left')
        self.movies_df['tag'] = self.movies_df['tag'].fillna('')

        # ── Load Netflix dataset for richer metadata ──
        netflix_path = self.data_path.parent / 'netflix_titles.csv'
        self.netflix_df = None
        if netflix_path.exists():
            self.netflix_df = pd.read_csv(netflix_path)
            self.netflix_df = self.netflix_df.fillna('')
            # Assign movieIds continuing from MovieLens max
            max_ml_id = self.movies_df['movieId'].max()
            self.netflix_df['movieId'] = range(max_ml_id + 1, max_ml_id + 1 + len(self.netflix_df))
            self.netflix_df['genres'] = self.netflix_df['listed_in'].str.replace(', ', '|')
            self.netflix_df['tag'] = ''
            self.netflix_df['source'] = 'netflix'
            logger.info(f"Loaded {len(self.netflix_df)} Netflix titles")

        # Mark MovieLens source and add placeholder metadata
        self.movies_df['source'] = 'movielens'
        self.movies_df['director'] = ''
        self.movies_df['cast'] = ''
        self.movies_df['description'] = ''
        self.movies_df['country'] = ''
        self.movies_df['release_year'] = self.movies_df['title'].str.extract(r'\((\d{4})\)').astype(float)

        # ── Merge Netflix metadata into unified dataframe ──
        if self.netflix_df is not None:
            nf = self.netflix_df[['movieId', 'title', 'genres', 'tag', 'source',
                                   'director', 'cast', 'description', 'country',
                                   'release_year']].copy()
            nf['release_year'] = pd.to_numeric(nf['release_year'], errors='coerce')
            self.movies_df = pd.concat([self.movies_df, nf], ignore_index=True)

        # ── Build combined features text for ML models ──
        self.movies_df['combined_features'] = (
            self.movies_df['genres'].fillna('').str.replace('|', ' ', regex=False)
            + ' ' + self.movies_df['tag'].fillna('')
            + ' ' + self.movies_df['director'].fillna('')
            + ' ' + self.movies_df['cast'].fillna('').str.replace(', ', ' ', regex=False)
            + ' ' + self.movies_df['description'].fillna('')
        )
        logger.info(f"Combined dataset: {len(self.movies_df)} movies, {len(self.ratings_df)} ratings")

    # ── TF-IDF ───────────────────────────────────────────────────────

    def prepare_features(self):
        self.tfidf_vectorizer = TfidfVectorizer(stop_words='english', max_features=5000)
        self.tfidf_matrix = self.tfidf_vectorizer.fit_transform(
            self.movies_df['combined_features']
        )
        logger.info(f"TF-IDF matrix: {self.tfidf_matrix.shape}")

    # ── WORD2VEC ─────────────────────────────────────────────────────

    def _build_word2vec_embeddings(self):
        try:
            from gensim.models import Word2Vec
            sentences = [doc.lower().split() for doc in self.movies_df['combined_features']]
            model = Word2Vec(sentences, vector_size=100, window=5, min_count=1,
                             workers=2, epochs=20, seed=42)
            embeds = []
            for sent in sentences:
                vecs = [model.wv[w] for w in sent if w in model.wv]
                embeds.append(np.mean(vecs, axis=0) if vecs else np.zeros(100))
            self.w2v_embeddings = np.array(embeds, dtype=np.float32)
            del model  # free RAM
            logger.info("Word2Vec embeddings built")
        except Exception as e:
            logger.error(f"Word2Vec init failed: {e}")
            self.w2v_embeddings = None

    # ── SENTENCE-BERT ────────────────────────────────────────────────

    def _build_bert_embeddings(self):
        try:
            from sentence_transformers import SentenceTransformer
            model = SentenceTransformer('all-MiniLM-L6-v2')
            texts = self.movies_df['combined_features'].tolist()
            self.bert_embeddings = model.encode(texts, batch_size=128,
                                                 show_progress_bar=False,
                                                 normalize_embeddings=True).astype(np.float32)
            del model  # free RAM
            logger.info("BERT embeddings built")
        except Exception as e:
            logger.error(f"BERT init failed: {e}")
            self.bert_embeddings = None

    # ── COLLABORATIVE FILTERING ──────────────────────────────────────

    def _build_collaborative_matrix(self):
        """Item-item collaborative filtering from user-item ratings."""
        try:
            # Build pivot: movieId × userId  (sparse)
            rated_movies = self.ratings_df['movieId'].unique()
            self.collab_movie_ids = list(rated_movies)
            movie_idx = {m: i for i, m in enumerate(self.collab_movie_ids)}
            user_ids = self.ratings_df['userId'].unique()
            user_idx = {u: i for i, u in enumerate(user_ids)}

            rows, cols, vals = [], [], []
            for _, r in self.ratings_df.iterrows():
                rows.append(movie_idx[r['movieId']])
                cols.append(user_idx[r['userId']])
                vals.append(r['rating'])

            self.collab_matrix = csr_matrix(
                (vals, (rows, cols)),
                shape=(len(self.collab_movie_ids), len(user_ids)),
                dtype=np.float32,
            )
            logger.info(f"Collaborative matrix: {self.collab_matrix.shape}")
        except Exception as e:
            logger.error(f"Collaborative matrix build failed: {e}")
            self.collab_matrix = None

    # ── GENRE HELPERS ────────────────────────────────────────────────

    def _compute_genre_similarity_pair(self, idx1, idx2):
        g1 = set(self.movies_df.iloc[idx1]['genres'].split('|'))
        g2 = set(self.movies_df.iloc[idx2]['genres'].split('|'))
        inter = len(g1 & g2)
        union = len(g1 | g2)
        return inter / union if union else 0

    # ── RECOMMENDATION METHODS ───────────────────────────────────────

    def _recs_from_sim_vector(self, sim_vector, idx, top_n, algo_name):
        scores = list(enumerate(sim_vector))
        scores[idx] = (idx, -1)  # exclude self
        scores.sort(key=lambda x: x[1], reverse=True)
        scores = scores[:top_n]
        idxs = [s[0] for s in scores]
        vals = [float(s[1]) for s in scores]
        recs = self.movies_df.iloc[idxs][['movieId', 'title', 'genres', 'source']].copy()
        recs['similarity_score'] = vals
        recs['algorithm'] = algo_name
        return recs.to_dict('records')

    def get_recommendations_tfidf(self, movie_id: int, top_n=10):
        try:
            idx = self.movies_df[self.movies_df['movieId'] == movie_id].index[0]
            sim = cosine_similarity(self.tfidf_matrix[idx], self.tfidf_matrix).flatten()
            return self._recs_from_sim_vector(sim, idx, top_n, 'TF-IDF')
        except IndexError:
            return []

    def get_recommendations_genre(self, movie_id: int, top_n=10):
        try:
            idx = self.movies_df[self.movies_df['movieId'] == movie_id].index[0]
            sims = np.array([self._compute_genre_similarity_pair(idx, i)
                             for i in range(len(self.movies_df))])
            return self._recs_from_sim_vector(sims, idx, top_n, 'Genre-Based')
        except IndexError:
            return []

    def get_recommendations_combined(self, movie_id: int, top_n=10):
        try:
            idx = self.movies_df[self.movies_df['movieId'] == movie_id].index[0]
            tfidf_sim = cosine_similarity(self.tfidf_matrix[idx], self.tfidf_matrix).flatten()
            genre_sims = np.array([self._compute_genre_similarity_pair(idx, i)
                                   for i in range(len(self.movies_df))])
            combined = 0.6 * tfidf_sim + 0.4 * genre_sims
            return self._recs_from_sim_vector(combined, idx, top_n, 'Combined')
        except IndexError:
            return []

    def get_recommendations_word2vec(self, movie_id: int, top_n=10):
        if self.w2v_embeddings is None:
            return []
        try:
            idx = self.movies_df[self.movies_df['movieId'] == movie_id].index[0]
            vec = self.w2v_embeddings[idx].reshape(1, -1)
            sim = cosine_similarity(vec, self.w2v_embeddings).flatten()
            return self._recs_from_sim_vector(sim, idx, top_n, 'Word2Vec')
        except IndexError:
            return []

    def get_recommendations_bert(self, movie_id: int, top_n=10):
        if self.bert_embeddings is None:
            return []
        try:
            idx = self.movies_df[self.movies_df['movieId'] == movie_id].index[0]
            vec = self.bert_embeddings[idx].reshape(1, -1)
            sim = cosine_similarity(vec, self.bert_embeddings).flatten()
            return self._recs_from_sim_vector(sim, idx, top_n, 'BERT')
        except IndexError:
            return []

    def get_recommendations_collaborative(self, movie_id: int, top_n=10):
        if self.collab_matrix is None:
            return []
        try:
            if movie_id not in self.collab_movie_ids:
                return []
            col_idx = self.collab_movie_ids.index(movie_id)
            vec = self.collab_matrix[col_idx]
            sim = cosine_similarity(vec, self.collab_matrix).flatten()
            # Map back to full movies_df indices
            results = []
            scores_with_ids = sorted(
                [(self.collab_movie_ids[i], float(sim[i])) for i in range(len(sim))
                 if self.collab_movie_ids[i] != movie_id],
                key=lambda x: x[1], reverse=True
            )[:top_n]
            for mid, score in scores_with_ids:
                row = self.movies_df[self.movies_df['movieId'] == mid]
                if len(row):
                    r = row.iloc[0]
                    results.append({
                        'movieId': int(r['movieId']),
                        'title': r['title'],
                        'genres': r['genres'],
                        'similarity_score': score,
                        'algorithm': 'Collaborative'
                    })
            return results
        except Exception:
            return []

    def get_recommendations_hybrid(self, movie_id: int, top_n=10):
        """Weighted hybrid: 50% content (TF-IDF) + 50% collaborative."""
        try:
            idx = self.movies_df[self.movies_df['movieId'] == movie_id].index[0]
            content_sim = cosine_similarity(self.tfidf_matrix[idx], self.tfidf_matrix).flatten()

            # collaborative scores mapped to full movie set
            collab_scores = np.zeros(len(self.movies_df))
            if self.collab_matrix is not None and movie_id in self.collab_movie_ids:
                col_idx = self.collab_movie_ids.index(movie_id)
                raw = cosine_similarity(
                    self.collab_matrix[col_idx], self.collab_matrix
                ).flatten()
                for i, mid in enumerate(self.collab_movie_ids):
                    full_idx = self.movies_df[self.movies_df['movieId'] == mid].index
                    if len(full_idx):
                        collab_scores[full_idx[0]] = raw[i]

            hybrid = 0.5 * content_sim + 0.5 * collab_scores
            return self._recs_from_sim_vector(hybrid, idx, top_n, 'Hybrid')
        except IndexError:
            return []

    # ── PERSONALIZED ─────────────────────────────────────────────────

    def get_personalized_recommendations(self, user_ratings, top_n=10, algorithm='tfidf'):
        if not user_ratings:
            return []
        profile = np.zeros(len(self.movies_df))
        dispatch = {
            'tfidf': lambda idx: cosine_similarity(self.tfidf_matrix[idx], self.tfidf_matrix).flatten(),
            'word2vec': lambda idx: cosine_similarity(
                self.w2v_embeddings[idx].reshape(1, -1), self.w2v_embeddings
            ).flatten() if self.w2v_embeddings is not None else np.zeros(len(self.movies_df)),
            'bert': lambda idx: cosine_similarity(
                self.bert_embeddings[idx].reshape(1, -1), self.bert_embeddings
            ).flatten() if self.bert_embeddings is not None else np.zeros(len(self.movies_df)),
        }
        sim_fn = dispatch.get(algorithm, dispatch['tfidf'])
        for r in user_ratings:
            try:
                idx = self.movies_df[self.movies_df['movieId'] == r['movie_id']].index[0]
                profile += sim_fn(idx) * r['rating']
            except IndexError:
                continue
        if profile.sum() > 0:
            profile /= len(user_ratings)
        rated_ids = {r['movie_id'] for r in user_ratings}
        scores = [(i, profile[i]) for i in range(len(profile))
                  if self.movies_df.iloc[i]['movieId'] not in rated_ids]
        scores.sort(key=lambda x: x[1], reverse=True)
        scores = scores[:top_n]
        idxs = [s[0] for s in scores]
        vals = [float(s[1]) for s in scores]
        recs = self.movies_df.iloc[idxs][['movieId', 'title', 'genres']].copy()
        recs['similarity_score'] = vals
        recs['algorithm'] = 'Personalized'
        return recs.to_dict('records')

    # ── COMPARE ──────────────────────────────────────────────────────

    def compare_movies(self, mid1: int, mid2: int):
        try:
            i1 = self.movies_df[self.movies_df['movieId'] == mid1].index[0]
            i2 = self.movies_df[self.movies_df['movieId'] == mid2].index[0]
            tfidf = float(cosine_similarity(self.tfidf_matrix[i1], self.tfidf_matrix[i2])[0][0])
            genre = self._compute_genre_similarity_pair(i1, i2)
            w2v = 0.0
            if self.w2v_embeddings is not None:
                w2v = float(cosine_similarity(
                    self.w2v_embeddings[i1].reshape(1, -1),
                    self.w2v_embeddings[i2].reshape(1, -1)
                )[0][0])
            bert = 0.0
            if self.bert_embeddings is not None:
                bert = float(cosine_similarity(
                    self.bert_embeddings[i1].reshape(1, -1),
                    self.bert_embeddings[i2].reshape(1, -1)
                )[0][0])
            g1 = set(self.movies_df.iloc[i1]['genres'].split('|'))
            g2 = set(self.movies_df.iloc[i2]['genres'].split('|'))
            return {
                'tfidf_similarity': tfidf,
                'genre_similarity': float(genre),
                'word2vec_similarity': w2v,
                'bert_similarity': bert,
                'combined_similarity': float(0.6 * tfidf + 0.4 * genre),
                'common_genres': list(g1 & g2),
            }
        except IndexError:
            return None

    # ── UTILITY ──────────────────────────────────────────────────────

    def get_all_genres(self):
        genres = set()
        for g in self.movies_df['genres'].dropna():
            genres.update(g.split('|'))
        return sorted(genres)

    def search_movies(self, query, limit=20):
        q = query.lower()
        res = self.movies_df[self.movies_df['title'].str.lower().str.contains(q, na=False)]
        return res.head(limit)[['movieId', 'title', 'genres', 'source']].to_dict('records')

    def get_movies_by_genre(self, genre, limit=20):
        res = self.movies_df[self.movies_df['genres'].str.contains(genre, case=False, na=False)]
        return res.head(limit)[['movieId', 'title', 'genres', 'source']].to_dict('records')

    def get_movie_by_id(self, movie_id):
        row = self.movies_df[self.movies_df['movieId'] == movie_id]
        if len(row) == 0:
            return None
        r = row.iloc[0]
        mr = self.ratings_df[self.ratings_df['movieId'] == movie_id]
        result = {
            'movieId': int(r['movieId']),
            'title': r['title'],
            'genres': r['genres'],
            'average_rating': float(mr['rating'].mean()) if len(mr) else 0.0,
            'rating_count': int(len(mr)),
            'source': str(r.get('source', 'movielens')),
            'director': str(r.get('director', '')),
            'cast': str(r.get('cast', '')),
            'description': str(r.get('description', '')),
            'country': str(r.get('country', '')),
        }
        ry = r.get('release_year')
        result['release_year'] = int(ry) if pd.notna(ry) else None
        return result
