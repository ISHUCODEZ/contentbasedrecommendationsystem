import React from 'react';

const GenreFilter = ({ genres, selectedGenre, onSelectGenre }) => {
  return (
    <div className="px-4 md:px-8 lg:px-12 mb-8" data-testid="genre-filter">
      <h3 className="text-xl font-medium tracking-tight mb-4">Browse by Genre</h3>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => onSelectGenre(null)}
          className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${
            selectedGenre === null
              ? 'bg-[#E50914] text-white'
              : 'bg-[#1F1F1F] text-neutral-300 hover:bg-[#2A2A2A] border border-white/10'
          }`}
          data-testid="genre-all"
        >
          All
        </button>
        {genres.map((genre) => (
          <button
            key={genre}
            onClick={() => onSelectGenre(genre)}
            className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${
              selectedGenre === genre
                ? 'bg-[#E50914] text-white'
                : 'bg-[#1F1F1F] text-neutral-300 hover:bg-[#2A2A2A] border border-white/10'
            }`}
            data-testid={`genre-${genre.toLowerCase()}`}
          >
            {genre}
          </button>
        ))}
      </div>
    </div>
  );
};

export default GenreFilter;
