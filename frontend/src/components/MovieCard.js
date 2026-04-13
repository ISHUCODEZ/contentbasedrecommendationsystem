import React from 'react';
import { TrendingUp } from 'lucide-react';

const posterImages = [
  'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2OTV8MHwxfHNlYXJjaHw0fHxtb3ZpZSUyMHBvc3RlcnxlbnwwfHx8fDE3NzYwNzIwNzF8MA&ixlib=rb-4.1.0&q=85',
  'https://images.unsplash.com/photo-1635805737707-575885ab0820?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2OTV8MHwxfHNlYXJjaHwyfHxtb3ZpZSUyMHBvc3RlcnxlbnwwfHx8fDE3NzYwNzIwNzF8MA&ixlib=rb-4.1.0&q=85',
  'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2OTV8MHwxfHNlYXJjaHwxfHxtb3ZpZSUyMHBvc3RlcnxlbnwwfHx8fDE3NzYwNzIwNzF8MA&ixlib=rb-4.1.0&q=85',
];

const MovieCard = ({ movie, onClick, showScore = false, index }) => {
  const posterUrl = posterImages[(index || 0) % posterImages.length];
  const isNetflix = movie.source === 'netflix';

  return (
    <div
      className="movie-card relative rounded-md overflow-hidden min-w-[160px] w-40 h-60 md:w-48 md:h-72 flex-shrink-0 bg-[#141414] group"
      onClick={onClick}
      data-testid={`movie-card-${movie.movieId}`}
    >
      <img src={posterUrl} alt={movie.title} className="w-full h-full object-cover" />
      {/* Source badge */}
      <div className="absolute top-2 left-2">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isNetflix ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
          {isNetflix ? 'N' : 'ML'}
        </span>
      </div>
      <div className="movie-card-overlay">
        <h3 className="text-sm font-semibold mb-1 line-clamp-2">{movie.title}</h3>
        {showScore && movie.similarity_score !== undefined && (
          <div className="flex items-center gap-1 text-xs text-[#E50914]">
            <TrendingUp className="w-3 h-3" />
            <span>{(movie.similarity_score * 100).toFixed(0)}% Match</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieCard;
