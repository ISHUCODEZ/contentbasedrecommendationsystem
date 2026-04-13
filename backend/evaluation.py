"""
Evaluation module: Precision@K, Recall@K, F1@K, MAP@K, NDCG@K
Uses a leave-one-out style evaluation on the MovieLens ratings dataset.
"""
import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
import logging, time

logger = logging.getLogger(__name__)

ALGO_NAMES = ['TF-IDF', 'Genre', 'Combined', 'Word2Vec', 'BERT', 'Collaborative', 'Hybrid']


def _dcg(relevances, k):
    """Discounted cumulative gain."""
    r = np.array(relevances[:k], dtype=float)
    if r.size == 0:
        return 0.0
    return np.sum(r / np.log2(np.arange(2, r.size + 2)))


def ndcg_at_k(predicted, relevant, k):
    """Normalized Discounted Cumulative Gain @K."""
    rel = [1.0 if p in relevant else 0.0 for p in predicted[:k]]
    dcg = _dcg(rel, k)
    ideal = _dcg(sorted(rel, reverse=True), k)
    return dcg / ideal if ideal > 0 else 0.0


def precision_at_k(predicted, relevant, k):
    pred_k = predicted[:k]
    hits = len(set(pred_k) & set(relevant))
    return hits / k if k > 0 else 0.0


def recall_at_k(predicted, relevant, k):
    pred_k = predicted[:k]
    hits = len(set(pred_k) & set(relevant))
    return hits / len(relevant) if len(relevant) > 0 else 0.0


def f1_at_k(precision, recall):
    return (2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0


def average_precision(predicted, relevant, k):
    """Average precision @K."""
    score = 0.0
    hits = 0
    for i, p in enumerate(predicted[:k]):
        if p in relevant:
            hits += 1
            score += hits / (i + 1)
    return score / min(len(relevant), k) if relevant else 0.0


def run_evaluation(rec_engine, k_values=None, n_users=50):
    """
    Evaluate all algorithms on a sample of users.
    Returns {k: {algo: {precision, recall, f1, map, ndcg}}}
    """
    if k_values is None:
        k_values = [5, 10, 20]

    ratings = rec_engine.ratings_df.copy()

    # Pick users who have rated enough movies (>= 10)
    user_counts = ratings.groupby('userId').size()
    eligible = user_counts[user_counts >= 10].index.tolist()
    np.random.seed(42)
    sample_users = np.random.choice(eligible, size=min(n_users, len(eligible)), replace=False)

    # For each user: high-rated movies (>= 4) as "relevant"
    results = {k: {algo: {'precision': [], 'recall': [], 'f1': [],
                           'map': [], 'ndcg': []} for algo in ALGO_NAMES}
               for k in k_values}

    algo_dispatch = {
        'TF-IDF':         rec_engine.get_recommendations_tfidf,
        'Genre':          rec_engine.get_recommendations_genre,
        'Combined':       rec_engine.get_recommendations_combined,
        'Word2Vec':       rec_engine.get_recommendations_word2vec,
        'BERT':           rec_engine.get_recommendations_bert,
        'Collaborative':  rec_engine.get_recommendations_collaborative,
        'Hybrid':         rec_engine.get_recommendations_hybrid,
    }

    max_k = max(k_values)
    start = time.time()

    for uid in sample_users:
        user_ratings = ratings[ratings['userId'] == uid]
        liked = user_ratings[user_ratings['rating'] >= 4.0]['movieId'].tolist()
        if len(liked) < 2:
            continue

        # Use first liked movie as query, rest as ground truth
        query_movie = liked[0]
        relevant = set(liked[1:])

        for algo_name, fn in algo_dispatch.items():
            try:
                recs = fn(query_movie, top_n=max_k)
                predicted = [r['movieId'] for r in recs]
            except Exception:
                predicted = []

            for k in k_values:
                p = precision_at_k(predicted, relevant, k)
                r = recall_at_k(predicted, relevant, k)
                f = f1_at_k(p, r)
                ap = average_precision(predicted, relevant, k)
                n = ndcg_at_k(predicted, relevant, k)

                results[k][algo_name]['precision'].append(p)
                results[k][algo_name]['recall'].append(r)
                results[k][algo_name]['f1'].append(f)
                results[k][algo_name]['map'].append(ap)
                results[k][algo_name]['ndcg'].append(n)

    elapsed = time.time() - start
    logger.info(f"Evaluation completed in {elapsed:.1f}s for {len(sample_users)} users")

    # Aggregate means
    output = {}
    for k in k_values:
        output[k] = {}
        for algo in ALGO_NAMES:
            d = results[k][algo]
            output[k][algo] = {
                'precision': float(np.mean(d['precision'])) if d['precision'] else 0,
                'recall':    float(np.mean(d['recall'])) if d['recall'] else 0,
                'f1':        float(np.mean(d['f1'])) if d['f1'] else 0,
                'map':       float(np.mean(d['map'])) if d['map'] else 0,
                'ndcg':      float(np.mean(d['ndcg'])) if d['ndcg'] else 0,
            }

    return {'k_values': k_values, 'results': output, 'n_users': len(sample_users),
            'elapsed_seconds': round(elapsed, 2)}
