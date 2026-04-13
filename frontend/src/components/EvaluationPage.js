import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { Loader2, BarChart3, ArrowLeft } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ALGO_COLORS = {
  'TF-IDF':         '#E50914',
  'Genre':          '#F59E0B',
  'Combined':       '#22C55E',
  'Word2Vec':       '#3B82F6',
  'BERT':           '#8B5CF6',
  'Collaborative':  '#EC4899',
  'Hybrid':         '#14B8A6',
};

const METRIC_LABELS = {
  precision: 'Precision@K',
  recall:    'Recall@K',
  f1:        'F1@K',
  map:       'MAP@K',
  ndcg:      'NDCG@K',
};

const EvaluationPage = ({ onBack }) => {
  const [evalData, setEvalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedK, setSelectedK] = useState(10);
  const [modelStatus, setModelStatus] = useState(null);

  const fetchEvaluation = useCallback(async () => {
    setLoading(true);
    try {
      const [evalRes, statusRes] = await Promise.all([
        axios.get(`${API}/evaluation?k=${selectedK}&n_users=30`),
        axios.get(`${API}/models/status`),
      ]);
      setEvalData(evalRes.data);
      setModelStatus(statusRes.data);
    } catch (err) {
      console.error('Evaluation fetch failed', err);
    }
    setLoading(false);
  }, [selectedK]);

  useEffect(() => {
    fetchEvaluation();
  }, [fetchEvaluation]);

  /* ── chart data builders ── */
  const buildBarData = (kVal) => {
    if (!evalData?.results?.[kVal]) return [];
    const algos = Object.keys(evalData.results[kVal]);
    return Object.keys(METRIC_LABELS).map((metric) => {
      const row = { metric: METRIC_LABELS[metric] };
      algos.forEach((a) => {
        row[a] = +(evalData.results[kVal][a][metric] * 100).toFixed(2);
      });
      return row;
    });
  };

  const buildRadarData = (kVal) => {
    if (!evalData?.results?.[kVal]) return [];
    return Object.keys(METRIC_LABELS).map((metric) => {
      const row = { metric: METRIC_LABELS[metric] };
      Object.keys(evalData.results[kVal]).forEach((a) => {
        row[a] = +(evalData.results[kVal][a][metric] * 100).toFixed(2);
      });
      return row;
    });
  };

  const buildComparisonTable = (kVal) => {
    if (!evalData?.results?.[kVal]) return [];
    return Object.entries(evalData.results[kVal]).map(([algo, m]) => ({
      algo,
      ...Object.fromEntries(
        Object.entries(m).map(([k, v]) => [k, (v * 100).toFixed(2)])
      ),
    }));
  };

  const kOptions = evalData?.k_values || [5, 10, 20];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pt-20 pb-16" data-testid="evaluation-page">
      {/* Header */}
      <div className="px-4 md:px-8 lg:px-12 mb-8 flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
          data-testid="eval-back-btn"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-[#E50914]" />
          <h1 className="text-4xl md:text-5xl tracking-tighter font-bold">Model Evaluation</h1>
        </div>
      </div>

      {/* K selector */}
      <div className="px-4 md:px-8 lg:px-12 mb-8 flex flex-wrap items-center gap-4">
        <span className="text-neutral-400 font-medium">K value:</span>
        <div className="flex gap-2 bg-black/40 p-1 rounded-full border border-white/10">
          {kOptions.map((k) => (
            <button
              key={k}
              onClick={() => setSelectedK(k)}
              className={`px-5 py-2 rounded-full font-semibold transition-all ${
                selectedK === k
                  ? 'bg-[#E50914] text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
              data-testid={`k-selector-${k}`}
            >
              K={k}
            </button>
          ))}
        </div>
        {evalData && (
          <span className="text-xs text-neutral-500 ml-auto">
            Evaluated on {evalData.n_users} users in {evalData.elapsed_seconds}s
          </span>
        )}
      </div>

      {/* Model status */}
      {modelStatus && (
        <div className="px-4 md:px-8 lg:px-12 mb-8">
          <h3 className="text-lg font-semibold mb-3">Model Status</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(modelStatus).map(([model, active]) => (
              <div
                key={model}
                className={`px-4 py-2 rounded-md border text-sm font-medium ${
                  active
                    ? 'border-green-500/40 bg-green-500/10 text-green-400'
                    : 'border-red-500/40 bg-red-500/10 text-red-400'
                }`}
                data-testid={`model-status-${model}`}
              >
                {model.toUpperCase()}: {active ? 'Active' : 'Inactive'}
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-12 h-12 text-[#E50914] animate-spin" />
          <span className="ml-4 text-neutral-400 text-lg">
            Running evaluation across all models...
          </span>
        </div>
      ) : evalData ? (
        <>
          {/* ── Bar Chart ── */}
          <div className="px-4 md:px-8 lg:px-12 mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6">
              Performance Comparison @ K={selectedK}
            </h2>
            <div className="bg-[#141414] border border-white/5 rounded-md p-6">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={buildBarData(selectedK)} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="metric" tick={{ fill: '#A3A3A3', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#A3A3A3', fontSize: 12 }} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F1F1F', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                    labelStyle={{ color: '#fff' }}
                    itemStyle={{ color: '#ddd' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: 12 }} />
                  {Object.keys(ALGO_COLORS).map((algo) => (
                    <Bar key={algo} dataKey={algo} fill={ALGO_COLORS[algo]} radius={[4, 4, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Radar Chart ── */}
          <div className="px-4 md:px-8 lg:px-12 mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6">
              Radar Overview @ K={selectedK}
            </h2>
            <div className="bg-[#141414] border border-white/5 rounded-md p-6 flex justify-center">
              <ResponsiveContainer width="100%" height={420}>
                <RadarChart data={buildRadarData(selectedK)} outerRadius={150}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#A3A3A3', fontSize: 11 }} />
                  <PolarRadiusAxis tick={{ fill: '#A3A3A3', fontSize: 10 }} />
                  {Object.keys(ALGO_COLORS).map((algo) => (
                    <Radar
                      key={algo}
                      name={algo}
                      dataKey={algo}
                      stroke={ALGO_COLORS[algo]}
                      fill={ALGO_COLORS[algo]}
                      fillOpacity={0.12}
                    />
                  ))}
                  <Legend wrapperStyle={{ paddingTop: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F1F1F', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                    labelStyle={{ color: '#fff' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Comparison Table ── */}
          <div className="px-4 md:px-8 lg:px-12 mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6">
              Model A vs Model B — Detailed Table @ K={selectedK}
            </h2>
            <div className="bg-[#141414] border border-white/5 rounded-md overflow-x-auto">
              <table className="w-full text-sm" data-testid="comparison-table">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-4 px-6 text-neutral-400 font-medium">Model</th>
                    {Object.values(METRIC_LABELS).map((l) => (
                      <th key={l} className="text-center py-4 px-4 text-neutral-400 font-medium">{l}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {buildComparisonTable(selectedK).map((row, i) => (
                    <tr key={row.algo} className={i % 2 === 0 ? 'bg-white/[0.02]' : ''}>
                      <td className="py-3 px-6 font-semibold" style={{ color: ALGO_COLORS[row.algo] || '#fff' }}>
                        {row.algo}
                      </td>
                      {Object.keys(METRIC_LABELS).map((m) => (
                        <td key={m} className="text-center py-3 px-4 font-mono text-neutral-200">
                          {row[m]}%
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default EvaluationPage;
