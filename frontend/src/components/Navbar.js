import React, { useState } from 'react';
import { Search, Film, BarChart3, User, LogOut, Shuffle, Network } from 'lucide-react';

const Navbar = ({ onSearch, onNavigate, currentPage, user, onLogout, isGuest }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  const navLink = (page, label, Icon) => (
    <button
      onClick={() => onNavigate(page)}
      className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${currentPage === page ? 'text-white' : 'text-neutral-400 hover:text-white'}`}
      data-testid={`nav-${page}`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {label}
    </button>
  );

  return (
    <nav className="nav-header fixed top-0 w-full z-50 h-16 flex items-center justify-between px-4 md:px-8 lg:px-12">
      <div className="flex items-center gap-6">
        <button className="flex items-center gap-2" data-testid="logo" onClick={() => onNavigate('home')}>
          <Film className="w-7 h-7 text-[#E50914]" />
          <span className="text-xl font-bold tracking-tight">MovieRec</span>
        </button>
        <div className="hidden md:flex items-center gap-5">
          {navLink('home', 'Home')}
          {navLink('evaluation', 'Evaluation', BarChart3)}
          {navLink('abtest', 'A/B Test', Shuffle)}
          {navLink('graph', 'Graph', Network)}
          {user && navLink('profile', 'Profile', User)}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <form onSubmit={handleSearch} className="hidden sm:block" data-testid="search-form">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text" placeholder="Search movies..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 lg:w-72 bg-[#141414] border border-white/10 rounded-md pl-9 pr-3 py-1.5 text-white placeholder-neutral-400 focus:outline-none focus:border-[#E50914] text-sm"
              data-testid="search-input"
            />
          </div>
        </form>
        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-400 hidden lg:block">{user.name || user.email}</span>
            <button onClick={onLogout} className="text-neutral-400 hover:text-white transition-colors" data-testid="logout-btn">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : isGuest ? (
          <button onClick={onLogout} className="text-sm text-neutral-400 hover:text-white" data-testid="sign-in-btn">Sign In</button>
        ) : null}
      </div>
    </nav>
  );
};

export default Navbar;
