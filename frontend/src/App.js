import React, { useState, useEffect } from 'react';
import '@/App.css';
import axios from 'axios';
import { AuthProvider, useAuth } from './components/AuthContext';
import AuthPage from './components/AuthPage';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import MovieRow from './components/MovieRow';
import MovieDetailsModal from './components/MovieDetailsModal';
import AlgorithmSelector from './components/AlgorithmSelector';
import GenreFilter from './components/GenreFilter';
import SimilarityBreakdown from './components/SimilarityBreakdown';
import EvaluationPage from './components/EvaluationPage';
import ProfilePage from './components/ProfilePage';
import ColdStartQuiz from './components/ColdStartQuiz';
import ABTestPage from './components/ABTestPage';
import SimilarityGraph from './components/SimilarityGraph';
import { Loader2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function AppContent() {
  const { user, loading: authLoading, login, register, logout, getAuthHeaders } = useAuth();
  const [page, setPage] = useState('home');
  const [isGuest, setIsGuest] = useState(false);
  const [showColdStart, setShowColdStart] = useState(false);
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
  const [datasetStats, setDatasetStats] = useState(null);

  const isAuthenticated = user || isGuest;

  useEffect(() => {
    if (isAuthenticated) loadInitialData();
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      if (selectedGenre) loadMoviesByGenre(selectedGenre);
      else loadMovies();
    }
  }, [selectedGenre, isAuthenticated]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [genresRes, statsRes] = await Promise.all([
        axios.get(`${API}/genres`),
        axios.get(`${API}/dataset/stats`),
      ]);
      setGenres(genresRes.data.genres.filter(g => g !== '(no genres listed)').slice(0, 18));
      setDatasetStats(statsRes.data);
      await loadMovies();
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
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
      console.error('Error:', error);
    }
  };

  const loadMoviesByGenre = async (genre) => {
    try {
      const res = await axios.get(`${API}/movies?genre=${genre}&limit=50`);
      setMovies(res.data.movies);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleGetRecommendations = async (movieId) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/recommendations/${movieId}?algorithm=${selectedAlgorithm}&top_n=20`);
      setRecommendations(res.data.recommendations);
      // Save to history if authenticated
      if (user) {
        try {
          await axios.post(`${API}/profile/recommendation-history`, {
            movie_id: movieId,
            algorithm: selectedAlgorithm,
            recommendations: res.data.recommendations.slice(0, 5).map(r => r.title),
          }, { headers: getAuthHeaders(), withCredentials: true });
        } catch {}
      }
      setLoading(false);
      window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const handleMovieClick = async (movie) => {
    try {
      const movieDetails = await axios.get(`${API}/movies/${movie.movieId}`);
      setSelectedMovie(movieDetails.data);
      setShowModal(true);
      if (featuredMovie && movie.movieId !== featuredMovie.movieId) {
        try {
          const simRes = await axios.get(`${API}/similarity/${featuredMovie.movieId}/${movie.movieId}`);
          setSimilarityData(simRes.data);
        } catch {}
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSearch = async (query) => {
    try {
      setLoading(true);
      setPage('home');
      const res = await axios.post(`${API}/search`, { query, limit: 30 });
      setSearchResults(res.data.results);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const handleRateMovie = async (movieId, rating) => {
    if (!user) return;
    try {
      await axios.post(`${API}/profile/rate`, { movie_id: movieId, rating },
        { headers: getAuthHeaders(), withCredentials: true });
    } catch (err) {
      console.error('Error rating:', err);
    }
  };

  const handleToggleWatchlist = async (movieId) => {
    if (!user) return;
    try {
      const res = await axios.post(`${API}/profile/watchlist`, { movie_id: movieId },
        { headers: getAuthHeaders(), withCredentials: true });
      return res.data.in_watchlist;
    } catch (err) {
      console.error('Error watchlist:', err);
      return null;
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedMovie(null);
    setSimilarityData(null);
  };

  const handleLogout = async () => {
    await logout();
    setIsGuest(false);
    setPage('home');
  };

  // Auth check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#E50914] animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthPage
        onLogin={login}
        onRegister={register}
        onSkip={() => setIsGuest(true)}
      />
    );
  }

  if (page === 'evaluation') {
    return (
      <div data-testid="app-container">
        <Navbar onSearch={handleSearch} onNavigate={setPage} currentPage={page} user={user} onLogout={handleLogout} isGuest={isGuest} />
        <EvaluationPage onBack={() => setPage('home')} />
      </div>
    );
  }

  if (page === 'profile') {
    return (
      <div data-testid="app-container">
        <Navbar onSearch={handleSearch} onNavigate={setPage} currentPage={page} user={user} onLogout={handleLogout} isGuest={isGuest} />
        <ProfilePage onBack={() => setPage('home')} onMovieClick={handleMovieClick} />
      </div>
    );
  }

  if (page === 'abtest') {
    return (
      <div data-testid="app-container">
        <Navbar onSearch={handleSearch} onNavigate={setPage} currentPage={page} user={user} onLogout={handleLogout} isGuest={isGuest} />
        <ABTestPage onBack={() => setPage('home')} />
      </div>
    );
  }

  if (page === 'graph') {
    return (
      <div data-testid="app-container">
        <Navbar onSearch={handleSearch} onNavigate={setPage} currentPage={page} user={user} onLogout={handleLogout} isGuest={isGuest} />
        <SimilarityGraph onBack={() => setPage('home')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]" data-testid="app-container">
      <Navbar onSearch={handleSearch} onNavigate={setPage} currentPage={page} user={user} onLogout={handleLogout} isGuest={isGuest} />

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

      {/* Dataset Stats Banner */}
      {datasetStats && (
        <div className="px-4 md:px-8 lg:px-12 mt-6 mb-4">
          <div className="flex flex-wrap gap-4 text-sm text-neutral-400">
            <span className="bg-[#141414] border border-white/5 px-3 py-1 rounded-md">
              {datasetStats.total_movies.toLocaleString()} Movies
            </span>
            <span className="bg-[#141414] border border-white/5 px-3 py-1 rounded-md">
              <span className="text-blue-400">MovieLens</span>: {datasetStats.movielens_count.toLocaleString()}
            </span>
            <span className="bg-[#141414] border border-white/5 px-3 py-1 rounded-md">
              <span className="text-red-400">Netflix</span>: {datasetStats.netflix_count.toLocaleString()}
            </span>
            <span className="bg-[#141414] border border-white/5 px-3 py-1 rounded-md">
              {datasetStats.total_ratings.toLocaleString()} Ratings
            </span>
          </div>
        </div>
      )}

      <div className="mt-4">
        <AlgorithmSelector selectedAlgorithm={selectedAlgorithm} onSelectAlgorithm={setSelectedAlgorithm} />
        <GenreFilter genres={genres} selectedGenre={selectedGenre} onSelectGenre={setSelectedGenre} />

        {/* Cold Start Quiz */}
        {showColdStart && (
          <ColdStartQuiz onComplete={(recs) => { setRecommendations(recs); setShowColdStart(false); }} />
        )}

        {!showColdStart && recommendations.length === 0 && !searchResults.length && (
          <div className="px-4 md:px-8 lg:px-12 mb-6">
            <button
              onClick={() => setShowColdStart(true)}
              className="bg-[#1F1F1F] hover:bg-[#2A2A2A] border border-white/10 text-neutral-300 px-5 py-2.5 rounded-lg text-sm transition-colors"
              data-testid="show-quiz-btn"
            >
              New here? Take the genre quiz for personalized picks
            </button>
          </div>
        )}

        {searchResults.length > 0 && (
          <MovieRow title="Search Results" movies={searchResults} onMovieClick={handleMovieClick} />
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
          onRate={handleRateMovie}
          onToggleWatchlist={handleToggleWatchlist}
          isAuthenticated={!!user}
        />
      )}

      <footer className="mt-16 py-8 border-t border-white/10 text-center text-neutral-400">
        <p className="text-sm">Content-Based Recommendation System | MovieLens + Netflix Dataset</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
