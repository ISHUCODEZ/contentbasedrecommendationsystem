import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { ArrowLeft, Star, Heart, Clock, Loader2, Trash2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProfilePage = ({ onBack, onMovieClick }) => {
  const { user, getAuthHeaders } = useAuth();
  const [tab, setTab] = useState('ratings');
  const [ratings, setRatings] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) loadData();
  }, [user, tab]);

  const loadData = async () => {
    setLoading(true);
    const headers = getAuthHeaders();
    try {
      if (tab === 'ratings') {
        const res = await axios.get(`${API}/profile/ratings`, { headers, withCredentials: true });
        setRatings(res.data.ratings);
      } else if (tab === 'watchlist') {
        const res = await axios.get(`${API}/profile/watchlist`, { headers, withCredentials: true });
        setWatchlist(res.data.watchlist);
      } else if (tab === 'history') {
        const res = await axios.get(`${API}/profile/recommendation-history`, { headers, withCredentials: true });
        setHistory(res.data.history);
      }
    } catch (err) {
      console.error('Error loading profile data:', err);
    }
    setLoading(false);
  };

  const tabs = [
    { id: 'ratings', label: 'My Ratings', icon: Star },
    { id: 'watchlist', label: 'Watchlist', icon: Heart },
    { id: 'history', label: 'Rec History', icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pt-20 pb-16" data-testid="profile-page">
      <div className="px-4 md:px-8 lg:px-12 mb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-neutral-400 hover:text-white mb-4" data-testid="profile-back-btn">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <h1 className="text-4xl md:text-5xl tracking-tighter font-bold mb-2">My Profile</h1>
        <p className="text-neutral-400">{user?.email}</p>
      </div>

      {/* Tabs */}
      <div className="px-4 md:px-8 lg:px-12 mb-8 flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
              tab === t.id ? 'bg-[#E50914] text-white' : 'bg-[#1F1F1F] text-neutral-400 hover:text-white border border-white/10'
            }`}
            data-testid={`profile-tab-${t.id}`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-4 md:px-8 lg:px-12">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#E50914] animate-spin" />
          </div>
        ) : (
          <>
            {tab === 'ratings' && (
              <div>
                {ratings.length === 0 ? (
                  <p className="text-neutral-500 py-8" data-testid="no-ratings-msg">You haven't rated any movies yet. Start rating to get personalized recommendations!</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="ratings-grid">
                    {ratings.map((r, i) => (
                      <div key={i} className="bg-[#141414] border border-white/5 rounded-md p-4 flex justify-between items-center">
                        <div>
                          <p className="font-semibold">Movie #{r.movie_id}</p>
                          <div className="flex items-center gap-1 mt-1">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} className="w-4 h-4" fill={s <= r.rating ? '#E50914' : 'none'} stroke={s <= r.rating ? '#E50914' : '#555'} />
                            ))}
                            <span className="ml-2 text-sm text-neutral-400">{r.rating}/5</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'watchlist' && (
              <div>
                {watchlist.length === 0 ? (
                  <p className="text-neutral-500 py-8" data-testid="no-watchlist-msg">Your watchlist is empty. Click the heart icon on movies to add them!</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="watchlist-grid">
                    {watchlist.map((w, i) => (
                      <div key={i} className="bg-[#141414] border border-white/5 rounded-md p-4 flex justify-between items-center">
                        <p className="font-semibold">Movie #{w.movie_id}</p>
                        <span className="text-xs text-neutral-500">{w.added_at?.split('T')[0]}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'history' && (
              <div>
                {history.length === 0 ? (
                  <p className="text-neutral-500 py-8" data-testid="no-history-msg">No recommendation history yet. Get recommendations and they'll appear here!</p>
                ) : (
                  <div className="space-y-4" data-testid="history-list">
                    {history.map((h, i) => (
                      <div key={i} className="bg-[#141414] border border-white/5 rounded-md p-4">
                        <div className="flex justify-between mb-2">
                          <span className="font-semibold">Movie #{h.movie_id} - {h.algorithm?.toUpperCase()}</span>
                          <span className="text-xs text-neutral-500">{h.timestamp?.split('T')[0]}</span>
                        </div>
                        <p className="text-sm text-neutral-400">
                          {h.recommendations?.length || 0} recommendations generated
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
