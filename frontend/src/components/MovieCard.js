import React from 'react';
import { TrendingUp, Film } from 'lucide-react';

const GENRE_COLORS = {
  'Action': '#DC2626', 'Adventure': '#EA580C', 'Animation': '#D97706',
  'Children': '#65A30D', 'Comedy': '#16A34A', 'Crime': '#475569',
  'Documentary': '#0891B2', 'Drama': '#7C3AED', 'Fantasy': '#C026D3',
  'Film-Noir': '#1E293B', 'Horror': '#991B1B', 'IMAX': '#0369A1',
  'Musical': '#DB2777', 'Mystery': '#4338CA', 'Romance': '#E11D48',
  'Sci-Fi': '#0284C7', 'Thriller': '#B91C1C', 'War': '#57534E',
  'Western': '#92400E', 'Comedies': '#16A34A', 'Dramas': '#7C3AED',
  'Documentaries': '#0891B2', 'TV Shows': '#6366F1',
  'International Movies': '#0D9488', 'International TV Shows': '#0D9488',
};

function getGenreColor(genres) {
  if (!genres) return '#374151';
  const first = genres.split('|')[0].trim();
  return GENRE_COLORS[first] || '#374151';
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const MovieCard = ({ movie, onClick, showScore = false, index }) => {
  const color = getGenreColor(movie.genres);
  const hash = hashStr(movie.title || '');
  const isNetflix = movie.source === 'netflix';
  // Create a subtle pattern variation per movie
  const angle = (hash % 360);
  const darkerColor = color + '99';

  return (
    <div
      className="movie-card relative rounded-md overflow-hidden min-w-[160px] w-40 h-60 md:w-48 md:h-72 flex-shrink-0 group"
      onClick={onClick}
      data-testid={`movie-card-${movie.movieId}`}
    >
      {/* Genre-colored gradient poster */}
      <div
        className="w-full h-full flex flex-col items-center justify-center p-3"
        style={{
          background: `linear-gradient(${angle}deg, ${color}, #0A0A0A 85%)`,
        }}
      >
        <Film className="w-8 h-8 mb-3 opacity-30 text-white" />
        <p className="text-center text-xs font-semibold text-white/90 line-clamp-3 leading-tight">
          {movie.title}
        </p>
        <p className="text-center text-[10px] text-white/50 mt-1.5 line-clamp-1">
          {movie.genres?.split('|').slice(0, 2).join(' / ')}
        </p>
      </div>

      {/* Source badge */}
      <div className="absolute top-2 left-2">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isNetflix ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
          {isNetflix ? 'N' : 'ML'}
        </span>
      </div>

      {/* Hover overlay */}
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
