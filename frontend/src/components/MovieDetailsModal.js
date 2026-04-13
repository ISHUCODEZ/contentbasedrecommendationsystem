import React, { useState } from 'react';
import { X, Star, TrendingUp, Heart, MapPin, Clapperboard, Users } from 'lucide-react';

const MovieDetailsModal = ({ movie, onClose, onGetRecommendations, onRate, onToggleWatchlist, isAuthenticated }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);

  if (!movie) return null;

  const handleRating = async (ratingValue) => {
    setRating(ratingValue);
    if (onRate) {
      await onRate(movie.movieId, ratingValue);
    }
    setRatingSubmitted(true);
    setTimeout(() => setRatingSubmitted(false), 2000);
  };

  const handleWatchlist = async () => {
    if (onToggleWatchlist) {
      const result = await onToggleWatchlist(movie.movieId);
      if (result !== null) setInWatchlist(result);
    }
  };

  const sourceColor = movie.source === 'netflix' ? 'text-red-500' : 'text-blue-400';
  const sourceLabel = movie.source === 'netflix' ? 'Netflix' : 'MovieLens';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose} data-testid="movie-details-modal">
      <div className="bg-[#141414] border border-white/10 rounded-md max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <button onClick={onClose} className="absolute top-4 right-4 z-10 bg-black/60 hover:bg-black/80 p-2 rounded-full transition-colors" data-testid="close-modal-btn">
            <X className="w-6 h-6" />
          </button>
          <div className="relative h-48 bg-gradient-to-b from-[#1F1F1F] to-[#141414] flex items-center justify-center">
            <Clapperboard className="w-16 h-16 text-neutral-600" />
            <div className="absolute top-4 left-4">
              <span className={`text-xs font-bold px-2 py-1 rounded ${sourceColor} bg-black/60`} data-testid="movie-source-badge">
                {sourceLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-3xl font-bold mb-2" data-testid="modal-movie-title">{movie.title}</h2>

          {movie.release_year && (
            <p className="text-neutral-400 text-sm mb-3">{movie.release_year}</p>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            {movie.genres && movie.genres.split('|').map((genre, i) => (
              <span key={i} className="px-3 py-1 bg-[#1F1F1F] border border-white/10 rounded-full text-sm text-neutral-300">{genre}</span>
            ))}
          </div>

          {/* Metadata */}
          {movie.director && (
            <div className="flex items-start gap-2 mb-2 text-sm">
              <span className="text-neutral-500 min-w-[70px]">Director:</span>
              <span className="text-neutral-300">{movie.director}</span>
            </div>
          )}
          {movie.cast && (
            <div className="flex items-start gap-2 mb-2 text-sm">
              <Users className="w-4 h-4 text-neutral-500 mt-0.5 flex-shrink-0" />
              <span className="text-neutral-300 line-clamp-2">{movie.cast}</span>
            </div>
          )}
          {movie.country && (
            <div className="flex items-center gap-2 mb-2 text-sm">
              <MapPin className="w-4 h-4 text-neutral-500 flex-shrink-0" />
              <span className="text-neutral-300">{movie.country}</span>
            </div>
          )}
          {movie.description && (
            <p className="text-neutral-400 text-sm mb-4 leading-relaxed" data-testid="movie-description">{movie.description}</p>
          )}

          {movie.average_rating > 0 && (
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2 bg-[#E50914] px-4 py-2 rounded-md">
                <TrendingUp className="w-5 h-5" />
                <span className="text-lg font-bold">{movie.average_rating.toFixed(1)}</span>
              </div>
              <span className="text-neutral-400">{movie.rating_count} ratings</span>
            </div>
          )}

          {/* Rating */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Rate this movie</h3>
            <div className="flex gap-2" data-testid="rating-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                  data-testid={`rating-star-${star}`}
                >
                  <Star className="w-8 h-8" fill={star <= (hoveredRating || rating) ? '#E50914' : 'none'} stroke={star <= (hoveredRating || rating) ? '#E50914' : '#A3A3A3'} />
                </button>
              ))}
            </div>
            {ratingSubmitted && <p className="text-sm text-green-500 mt-2">Rating submitted!</p>}
            {!isAuthenticated && <p className="text-xs text-neutral-500 mt-1">Sign in to save ratings to your profile</p>}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { onGetRecommendations(movie.movieId); onClose(); }}
              className="flex-1 bg-[#E50914] hover:bg-[#F6121D] text-white py-3 rounded-md font-semibold transition-colors"
              data-testid="get-recommendations-btn"
            >
              Get Similar Movies
            </button>
            {isAuthenticated && (
              <button
                onClick={handleWatchlist}
                className={`px-4 py-3 rounded-md border transition-colors ${
                  inWatchlist ? 'bg-[#E50914]/20 border-[#E50914] text-[#E50914]' : 'bg-[#1F1F1F] border-white/10 text-neutral-400 hover:text-white'
                }`}
                data-testid="watchlist-btn"
              >
                <Heart className="w-5 h-5" fill={inWatchlist ? '#E50914' : 'none'} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailsModal;
