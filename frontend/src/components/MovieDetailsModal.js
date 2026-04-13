import React, { useState } from 'react';
import { X, Star, TrendingUp } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MovieDetailsModal = ({ movie, onClose, onGetRecommendations }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [userId] = useState('user_' + Math.random().toString(36).substr(2, 9));
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  if (!movie) return null;

  const handleRating = async (ratingValue) => {
    try {
      await axios.post(`${API}/movies/${movie.movieId}/rate`, {
        user_id: userId,
        movie_id: movie.movieId,
        rating: ratingValue
      });
      setRating(ratingValue);
      setRatingSubmitted(true);
      setTimeout(() => setRatingSubmitted(false), 2000);
    } catch (error) {
      console.error('Error rating movie:', error);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
      data-testid="movie-details-modal"
    >
      <div
        className="bg-[#141414] border border-white/10 rounded-md max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 bg-black/60 hover:bg-black/80 p-2 rounded-full transition-colors"
            data-testid="close-modal-btn"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative h-64 bg-gradient-to-b from-transparent to-[#141414]">
            <img
              src="https://images.unsplash.com/photo-1688678004647-945d5aaf91c1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAxODF8MHwxfHNlYXJjaHwxfHxtb3ZpZSUyMHRoZWF0ZXIlMjBzY3JlZW58ZW58MHx8fHwxNzc2MDcyMDg1fDA&ixlib=rb-4.1.0&q=85"
              alt={movie.title}
              className="w-full h-full object-cover opacity-50"
            />
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-3xl font-bold mb-2" data-testid="modal-movie-title">{movie.title}</h2>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {movie.genres && movie.genres.split('|').map((genre, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-[#1F1F1F] border border-white/10 rounded-full text-sm text-neutral-300"
              >
                {genre}
              </span>
            ))}
          </div>

          {movie.average_rating > 0 && (
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2 bg-[#E50914] px-4 py-2 rounded-md">
                <TrendingUp className="w-5 h-5" />
                <span className="text-lg font-bold">{movie.average_rating.toFixed(1)}</span>
              </div>
              <span className="text-neutral-400">{movie.rating_count} ratings</span>
            </div>
          )}

          <div className="mb-6">
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
                  <Star
                    className="w-8 h-8"
                    fill={star <= (hoveredRating || rating) ? '#E50914' : 'none'}
                    stroke={star <= (hoveredRating || rating) ? '#E50914' : '#A3A3A3'}
                  />
                </button>
              ))}
            </div>
            {ratingSubmitted && (
              <p className="text-sm text-green-500 mt-2">Rating submitted successfully!</p>
            )}
          </div>

          <button
            onClick={() => {
              onGetRecommendations(movie.movieId);
              onClose();
            }}
            className="w-full bg-[#E50914] hover:bg-[#F6121D] text-white py-3 rounded-md font-semibold transition-colors"
            data-testid="get-recommendations-btn"
          >
            Get Similar Movies
          </button>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailsModal;
