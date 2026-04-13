import React, { useState } from 'react';
import { Search, Film, BarChart3, User, LogOut } from 'lucide-react';

const Navbar = ({ onSearch, onNavigate, currentPage, user, onLogout, isGuest }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  return (
    <nav className="nav-header fixed top-0 w-full z-50 h-16 flex items-center justify-between px-4 md:px-8 lg:px-12">
      <div className="flex items-center gap-8">
        <button className="flex items-center gap-2" data-testid="logo" onClick={() => onNavigate('home')}>
          <Film className="w-8 h-8 text-[#E50914]" />
          <span className="text-2xl font-bold tracking-tight">MovieRec</span>
        </button>
        <div className="hidden md:flex items-center gap-6">
          <button
            onClick={() => onNavigate('home')}
            className={`text-sm font-medium transition-colors ${currentPage === 'home' ? 'text-white' : 'text-neutral-400 hover:text-white'}`}
            data-testid="nav-home"
          >
            Home
          </button>
          <button
            onClick={() => onNavigate('evaluation')}
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${currentPage === 'evaluation' ? 'text-white' : 'text-neutral-400 hover:text-white'}`}
            data-testid="nav-evaluation"
          >
            <BarChart3 className="w-4 h-4" />
            Evaluation
          </button>
          {user && (
            <button
              onClick={() => onNavigate('profile')}
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${currentPage === 'profile' ? 'text-white' : 'text-neutral-400 hover:text-white'}`}
              data-testid="nav-profile"
            >
              <User className="w-4 h-4" />
              Profile
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <form onSubmit={handleSearch} className="hidden sm:block" data-testid="search-form">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 lg:w-80 bg-[#141414] border border-white/10 rounded-md pl-10 pr-4 py-2 text-white placeholder-neutral-400 focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] text-sm"
              data-testid="search-input"
            />
          </div>
        </form>

        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-400 hidden lg:block">{user.name || user.email}</span>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white transition-colors"
              data-testid="logout-btn"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : isGuest ? (
          <button
            onClick={onLogout}
            className="text-sm text-neutral-400 hover:text-white transition-colors"
            data-testid="sign-in-btn"
          >
            Sign In
          </button>
        ) : null}
      </div>
    </nav>
  );
};

export default Navbar;
