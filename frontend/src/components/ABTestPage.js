import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Shuffle, Loader2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ALGO_OPTIONS = [
  'tfidf', 'genre', 'combined', 'word2vec', 'bert', 'collaborative', 'hybrid', 'svd', 'kg', 'sentiment',
];
const ALGO_COLORS = {
  tfidf: '#E50914', genre: '#F59E0B', combined: '#22C55E', word2vec: '#3B82F6',
  bert: '#8B5CF6', collaborative: '#EC4899', hybrid: '#14B8A6', svd: '#F97316',
  kg: '#06B6D4', sentiment: '#A855F7',
};

const ABTestPage = ({ onBack }) => {
  const [movieId, setMovieId] = useState('');
  const [algoA, setAlgoA] = useState('tfidf');
  const [algoB, setAlgoB] = useState('collaborative');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runTest = async () => {
    if (!movieId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API}/ab-test/${movieId}?algo_a=${algoA}&algo_b=${algoB}&top_n=10`);
      setResult(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const RecColumn = ({ data, color }) => (
    <div className="flex-1 min-w-0">
      <h3 className="text-lg font-bold mb-3" style={{ color }}>{data.name.toUpperCase()}</h3>
      <div className="space-y-2">
        {data.recommendations.map((r, i) => (
          <div key={i} className="bg-[#1F1F1F] border border-white/5 rounded-md p-3 flex justify-between items-center">
            <div className="min-w-0 mr-2">
              <p className="text-sm font-medium truncate">{r.title}</p>
              <p className="text-xs text-neutral-500">{r.genres?.split('|').slice(0, 3).join(', ')}</p>
            </div>
            <span className="text-xs font-mono" style={{ color }}>{(r.similarity_score * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pt-20 pb-16" data-testid="ab-test-page">
      <div className="px-4 md:px-8 lg:px-12 mb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-neutral-400 hover:text-white mb-4" data-testid="ab-back-btn">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <div className="flex items-center gap-3 mb-2">
          <Shuffle className="w-8 h-8 text-[#E50914]" />
          <h1 className="text-4xl md:text-5xl tracking-tighter font-bold">A/B Testing</h1>
        </div>
        <p className="text-neutral-400">Compare two algorithms side-by-side for the same movie</p>
      </div>

      <div className="px-4 md:px-8 lg:px-12 mb-8">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-sm text-neutral-400 mb-1 block">Movie ID</label>
            <input
              type="number" value={movieId} onChange={(e) => setMovieId(e.target.value)}
              placeholder="e.g. 1"
              className="bg-[#1F1F1F] border border-white/10 rounded-md px-4 py-2 text-white w-32"
              data-testid="ab-movie-input"
            />
          </div>
          <div>
            <label className="text-sm text-neutral-400 mb-1 block">Algorithm A</label>
            <select value={algoA} onChange={(e) => setAlgoA(e.target.value)}
              className="bg-[#1F1F1F] border border-white/10 rounded-md px-4 py-2 text-white"
              data-testid="ab-algo-a-select"
            >
              {ALGO_OPTIONS.map(a => <option key={a} value={a}>{a.toUpperCase()}</option>)}
            </select>
          </div>
          <div className="text-neutral-500 font-bold text-xl">VS</div>
          <div>
            <label className="text-sm text-neutral-400 mb-1 block">Algorithm B</label>
            <select value={algoB} onChange={(e) => setAlgoB(e.target.value)}
              className="bg-[#1F1F1F] border border-white/10 rounded-md px-4 py-2 text-white"
              data-testid="ab-algo-b-select"
            >
              {ALGO_OPTIONS.map(a => <option key={a} value={a}>{a.toUpperCase()}</option>)}
            </select>
          </div>
          <button onClick={runTest} disabled={loading || !movieId}
            className="bg-[#E50914] hover:bg-[#F6121D] text-white px-6 py-2 rounded-md font-semibold disabled:opacity-40"
            data-testid="ab-run-btn"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Run Test'}
          </button>
        </div>
      </div>

      {result && (
        <div className="px-4 md:px-8 lg:px-12">
          {/* Stats */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="bg-[#141414] border border-white/5 px-4 py-3 rounded-md">
              <span className="text-neutral-400 text-sm">Overlap:</span>
              <span className="ml-2 font-bold">{result.overlap_count} movies</span>
            </div>
            <div className="bg-[#141414] border border-white/5 px-4 py-3 rounded-md">
              <span className="text-neutral-400 text-sm">Jaccard Similarity:</span>
              <span className="ml-2 font-bold">{(result.jaccard_similarity * 100).toFixed(1)}%</span>
            </div>
            <div className="bg-[#141414] border border-white/5 px-4 py-3 rounded-md">
              <span className="text-neutral-400 text-sm">Unique to A:</span>
              <span className="ml-2 font-bold">{result.unique_to_a}</span>
            </div>
            <div className="bg-[#141414] border border-white/5 px-4 py-3 rounded-md">
              <span className="text-neutral-400 text-sm">Unique to B:</span>
              <span className="ml-2 font-bold">{result.unique_to_b}</span>
            </div>
          </div>
          {/* Side by side */}
          <div className="flex gap-6">
            <RecColumn data={result.algorithm_a} color={ALGO_COLORS[algoA] || '#fff'} />
            <div className="w-px bg-white/10 self-stretch" />
            <RecColumn data={result.algorithm_b} color={ALGO_COLORS[algoB] || '#fff'} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ABTestPage;
