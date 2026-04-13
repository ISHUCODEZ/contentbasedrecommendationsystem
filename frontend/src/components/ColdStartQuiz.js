import React, { useState } from 'react';
import axios from 'axios';
import { Sparkles, Check, ArrowRight, Loader2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ColdStartQuiz = ({ onComplete }) => {
  const [genres, setGenres] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('loading');

  React.useEffect(() => {
    loadGenres();
  }, []);

  const loadGenres = async () => {
    try {
      const res = await axios.get(`${API}/coldstart/genres`);
      setGenres(res.data.genres.filter(g => g.genre !== '(no genres listed)'));
      setStep('select');
    } catch { setStep('select'); }
  };

  const toggle = (g) => {
    const next = new Set(selected);
    next.has(g) ? next.delete(g) : next.add(g);
    setSelected(next);
  };

  const handleSubmit = async () => {
    if (selected.size === 0) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API}/coldstart/recommend`, {
        genres: Array.from(selected), top_n: 20,
      });
      onComplete(res.data.recommendations);
    } catch { onComplete([]); }
    setLoading(false);
  };

  if (step === 'loading') {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 text-[#E50914] animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 lg:px-12 py-8" data-testid="coldstart-quiz">
      <div className="max-w-3xl mx-auto text-center mb-8">
        <Sparkles className="w-10 h-10 text-[#E50914] mx-auto mb-4" />
        <h2 className="text-3xl font-bold mb-2">What do you enjoy watching?</h2>
        <p className="text-neutral-400">Pick at least 3 genres to get personalized recommendations</p>
      </div>
      <div className="flex flex-wrap gap-3 justify-center max-w-4xl mx-auto mb-8">
        {genres.map((g) => (
          <button
            key={g.genre}
            onClick={() => toggle(g.genre)}
            className={`px-5 py-3 rounded-lg font-medium transition-all border ${
              selected.has(g.genre)
                ? 'bg-[#E50914] border-[#E50914] text-white scale-105'
                : 'bg-[#1F1F1F] border-white/10 text-neutral-300 hover:border-white/30'
            }`}
            data-testid={`quiz-genre-${g.genre.toLowerCase()}`}
          >
            {selected.has(g.genre) && <Check className="w-4 h-4 inline mr-1" />}
            {g.genre}
          </button>
        ))}
      </div>
      <div className="text-center">
        <button
          onClick={handleSubmit}
          disabled={selected.size < 1 || loading}
          className="bg-[#E50914] hover:bg-[#F6121D] text-white px-8 py-3 rounded-lg font-semibold transition-all disabled:opacity-40 flex items-center gap-2 mx-auto"
          data-testid="quiz-submit-btn"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
          Get Recommendations ({selected.size} selected)
        </button>
      </div>
    </div>
  );
};

export default ColdStartQuiz;
