"""TMDB poster fetcher — bulk-fetches poster URLs and caches them in MongoDB."""
import os
import logging
import asyncio
import pandas as pd
from pathlib import Path

logger = logging.getLogger(__name__)

TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500"


async def fetch_poster_batch(session, tmdb_ids, api_key):
    """Fetch poster paths for a batch of tmdb IDs."""
    import aiohttp
    results = {}
    for tmdb_id in tmdb_ids:
        if not tmdb_id or pd.isna(tmdb_id):
            continue
        url = f"https://api.themoviedb.org/3/movie/{int(tmdb_id)}?api_key={api_key}"
        try:
            async with session.get(url) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    poster = data.get("poster_path")
                    if poster:
                        results[int(tmdb_id)] = f"{TMDB_IMAGE_BASE}{poster}"
                elif resp.status == 429:
                    # Rate limited — wait and retry
                    await asyncio.sleep(1)
        except Exception:
            pass
    return results


async def load_cached_posters(db):
    """Load all cached poster URLs from MongoDB."""
    docs = await db.poster_cache.find({}, {"_id": 0}).to_list(50000)
    return {d["movieId"]: d["poster_url"] for d in docs}


async def cache_posters(db, poster_map):
    """Save poster URLs to MongoDB."""
    if not poster_map:
        return
    ops = []
    for movie_id, url in poster_map.items():
        ops.append({
            "movieId": movie_id,
            "poster_url": url,
        })
    # Upsert in bulk
    from pymongo import UpdateOne
    bulk_ops = [
        UpdateOne({"movieId": o["movieId"]}, {"$set": o}, upsert=True)
        for o in ops
    ]
    if bulk_ops:
        await db.poster_cache.bulk_write(bulk_ops)


async def fetch_and_cache_posters(db, data_path: Path, batch_size=40):
    """Main function: read links.csv, fetch missing posters from TMDB, cache in MongoDB."""
    api_key = os.environ.get("TMDB_API_KEY")
    if not api_key:
        logger.info("No TMDB_API_KEY set, skipping poster fetch")
        return {}

    # Load links.csv for movieId -> tmdbId mapping
    links_path = data_path / "links.csv"
    if not links_path.exists():
        logger.warning("links.csv not found")
        return {}

    links_df = pd.read_csv(links_path)
    movie_to_tmdb = dict(zip(links_df["movieId"], links_df["tmdbId"]))

    # Load already cached
    cached = await load_cached_posters(db)
    logger.info(f"Already cached: {len(cached)} posters")

    # Find missing
    missing = {mid: tid for mid, tid in movie_to_tmdb.items()
               if mid not in cached and pd.notna(tid)}

    if not missing:
        logger.info("All posters already cached")
        return cached

    logger.info(f"Fetching {len(missing)} missing posters from TMDB...")

    import aiohttp
    new_posters = {}
    items = list(missing.items())

    async with aiohttp.ClientSession() as session:
        for i in range(0, len(items), batch_size):
            batch = items[i:i + batch_size]
            tmdb_ids = [tid for _, tid in batch]
            movie_ids = [mid for mid, _ in batch]

            fetched = await fetch_poster_batch(session, tmdb_ids, api_key)

            # Map back tmdbId -> movieId
            tmdb_to_movie = {int(tid): mid for mid, tid in batch if pd.notna(tid)}
            for tmdb_id, url in fetched.items():
                movie_id = tmdb_to_movie.get(tmdb_id)
                if movie_id:
                    new_posters[movie_id] = url

            # Rate limit: TMDB allows ~40 requests per 10 seconds
            if i + batch_size < len(items):
                await asyncio.sleep(0.3)

            # Cache periodically
            if len(new_posters) >= 100:
                await cache_posters(db, new_posters)
                cached.update(new_posters)
                logger.info(f"Cached {len(cached)} posters so far...")
                new_posters = {}

    # Final cache
    if new_posters:
        await cache_posters(db, new_posters)
        cached.update(new_posters)

    logger.info(f"Total cached posters: {len(cached)}")
    return cached
