import React from 'react';
import MovieCard from './MovieCard';

const MovieRow = ({ title, movies, onMovieClick, showScore = false }) => {
  if (!movies || movies.length === 0) return null;

  return (
    <div className="mb-8" data-testid={`movie-row-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4 px-4 md:px-8 lg:px-12">
        {title}
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x px-4 md:px-8 lg:px-12">
        {movies.map((movie, index) => (
          <MovieCard
            key={movie.movieId || index}
            movie={movie}
            onClick={() => onMovieClick(movie)}
            showScore={showScore}
            index={index}
          />
        ))}
      </div>
    </div>
  );
};

export default MovieRow;
