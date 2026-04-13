import React, { useState, useEffect } from 'react';
import '@/App.css';
import axios from 'axios';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import MovieRow from './components/MovieRow';
import MovieDetailsModal from './components/MovieDetailsModal';
import AlgorithmSelector from './components/AlgorithmSelector';
import GenreFilter from './components/GenreFilter';
import SimilarityBreakdown from './components/SimilarityBreakdown';
import EvaluationPage from './components/EvaluationPage';
import { Loader2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [page, setPage] = useState('home'); // 'home' | 'evaluation'
  const [featuredMovie, setFeaturedMovie] = useState(null);
  const [movies, setMovies] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('tfidf');
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [similarityData, setSimilarityData] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedGenre) {
      loadMoviesByGenre(selectedGenre);
    } else {
      loadMovies();
    }
  }, [selectedGenre]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const genresRes = await axios.get(`${API}/genres`);
      setGenres(genresRes.data.genres.filter(g => g !== '(no genres listed)').slice(0, 15));
      await loadMovies();
      setLoading(false);
    } catch (error) {
      console.error('Error loading initial data:', error);
      setLoading(false);
    }
  };

  const loadMovies = async () => {
    try {
      const res = await axios.get(`${API}/movies?limit=50`);
      setMovies(res.data.movies);
      if (res.data.movies.length > 0) {
        const randomMovie = res.data.movies[Math.floor(Math.random() * res.data.movies.length)];
        const movieDetails = await axios.get(`${API}/movies/${randomMovie.movieId}`);
        setFeaturedMovie(movieDetails.data);
      }
    } catch (error) {
      console.error('Error loading movies:', error);
    }
  };

  const loadMoviesByGenre = async (genre) => {
    try {
      const res = await axios.get(`${API}/movies?genre=${genre}&limit=50`);
      setMovies(res.data.movies);
    } catch (error) {
      console.error('Error loading movies by genre:', error);
    }
  };

  const handleGetRecommendations = async (movieId) => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API}/recommendations/${movieId}?algorithm=${selectedAlgorithm}&top_n=20`
      );
      setRecommendations(res.data.recommendations);
      setLoading(false);
      window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
    } catch (error) {
      console.error('Error getting recommendations:', error);
      setLoading(false);
    }
  };

  const handleMovieClick = async (movie) => {
    try {
      const movieDetails = await axios.get(`${API}/movies/${movie.movieId}`);
      setSelectedMovie(movieDetails.data);
      setShowModal(true);
      if (featuredMovie && movie.movieId !== featuredMovie.movieId) {
        const simRes = await axios.get(`${API}/similarity/${featuredMovie.movieId}/${movie.movieId}`);
        setSimilarityData(simRes.data);
      }
    } catch (error) {
      console.error('Error loading movie details:', error);
    }
  };

  const handleSearch = async (query) => {
    try {
      setLoading(true);
      const res = await axios.post(`${API}/search`, { query, limit: 30 });
      setSearchResults(res.data.results);
      setLoading(false);
    } catch (error) {
      console.error('Error searching movies:', error);
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedMovie(null);
    setSimilarityData(null);
  };

  if (page === 'evaluation') {
    return (
      <div data-testid="app-container">
        <Navbar onSearch={handleSearch} onNavigate={setPage} currentPage={page} />
        <EvaluationPage onBack={() => setPage('home')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]" data-testid="app-container">
      <Navbar onSearch={handleSearch} onNavigate={setPage} currentPage={page} />

      {loading && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Loader2 className="w-12 h-12 text-[#E50914] animate-spin" data-testid="loader" />
        </div>
      )}

      <HeroSection
        movie={featuredMovie}
        onShowDetails={handleMovieClick}
        onGetRecommendations={handleGetRecommendations}
      />

      <div className="mt-8">
        <AlgorithmSelector
          selectedAlgorithm={selectedAlgorithm}
          onSelectAlgorithm={setSelectedAlgorithm}
        />

        <GenreFilter
          genres={genres}
          selectedGenre={selectedGenre}
          onSelectGenre={setSelectedGenre}
        />

        {searchResults.length > 0 && (
          <MovieRow
            title="Search Results"
            movies={searchResults}
            onMovieClick={handleMovieClick}
          />
        )}

        {recommendations.length > 0 && (
          <>
            <MovieRow
              title={`Recommended Movies (${selectedAlgorithm.toUpperCase()})`}
              movies={recommendations}
              onMovieClick={handleMovieClick}
              showScore={true}
            />
            {similarityData && (
              <div className="px-4 md:px-8 lg:px-12 mb-8">
                <SimilarityBreakdown similarityData={similarityData} />
              </div>
            )}
          </>
        )}

        {movies.length > 0 && (
          <MovieRow
            title={selectedGenre ? `${selectedGenre} Movies` : 'Popular Movies'}
            movies={movies.slice(0, 20)}
            onMovieClick={handleMovieClick}
          />
        )}

        {!selectedGenre && genres.slice(0, 5).map((genre) => (
          <MovieRow
            key={genre}
            title={`${genre} Movies`}
            movies={movies.filter(m => m.genres?.includes(genre)).slice(0, 15)}
            onMovieClick={handleMovieClick}
          />
        ))}
      </div>

      {showModal && (
        <MovieDetailsModal
          movie={selectedMovie}
          onClose={handleCloseModal}
          onGetRecommendations={handleGetRecommendations}
        />
      )}

      <footer className="mt-16 py-8 border-t border-white/10 text-center text-neutral-400">
        <p className="text-sm">Content-Based Recommendation System | MovieLens Dataset</p>
      </footer>
    </div>
  );
}

export default App;
