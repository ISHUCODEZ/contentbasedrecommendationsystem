import React from 'react';
import { Play, Info, TrendingUp } from 'lucide-react';

const HeroSection = ({ movie, onShowDetails, onGetRecommendations }) => {
  if (!movie) return null;

  const backgroundImage = 'https://images.unsplash.com/photo-1688678004647-945d5aaf91c1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAxODF8MHwxfHNlYXJjaHwxfHxtb3ZpZSUyMHRoZWF0ZXIlMjBzY3JlZW58ZW58MHx8fHwxNzc2MDcyMDg1fDA&ixlib=rb-4.1.0&q=85';

  return (
    <div
      className="hero-section"
      style={{ backgroundImage: `url(${backgroundImage})` }}
      data-testid="hero-section"
    >
      <div className="hero-overlay"></div>
      <div className="relative z-10 px-4 md:px-8 lg:px-12 max-w-2xl">
        <h1 className="text-4xl md:text-5xl lg:text-6xl tracking-tighter font-bold mb-4">
          {movie.title}
        </h1>
        <p className="text-base leading-relaxed text-neutral-300 mb-2">
          {movie.genres}
        </p>
        {movie.average_rating > 0 && (
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center gap-1 bg-[#E50914] px-3 py-1 rounded-md">
              <TrendingUp className="w-4 h-4" />
              <span className="font-semibold">{movie.average_rating.toFixed(1)}</span>
            </div>
            <span className="text-sm text-neutral-400">{movie.rating_count} ratings</span>
          </div>
        )}
        <div className="flex gap-4">
          <button
            onClick={() => onGetRecommendations(movie.movieId)}
            className="flex items-center gap-2 bg-[#E50914] hover:bg-[#F6121D] text-white px-6 py-3 rounded-md font-semibold transition-colors"
            data-testid="hero-get-recommendations-btn"
          >
            <Play className="w-5 h-5" />
            Get Recommendations
          </button>
          <button
            onClick={() => onShowDetails(movie)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-md font-semibold transition-colors border border-white/20"
            data-testid="hero-more-info-btn"
          >
            <Info className="w-5 h-5" />
            More Info
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
