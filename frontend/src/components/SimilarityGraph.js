import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import * as d3 from 'd3';
import { ArrowLeft, Network, Loader2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const GROUP_COLORS = {
  source: '#E50914', tfidf: '#F59E0B', genre: '#22C55E',
  collaborative: '#EC4899', bert: '#8B5CF6', cross: '#555',
};

const SimilarityGraph = ({ onBack }) => {
  const svgRef = useRef(null);
  const [movieId, setMovieId] = useState('1');
  const [loading, setLoading] = useState(false);
  const [graphData, setGraphData] = useState(null);

  const loadGraph = async () => {
    if (!movieId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API}/similarity-graph/${movieId}?top_n=15`);
      setGraphData(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    if (!graphData || !svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth || 800;
    const height = 500;
    svg.attr('width', width).attr('height', height);

    const simulation = d3.forceSimulation(graphData.nodes)
      .force('link', d3.forceLink(graphData.links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    const link = svg.append('g').selectAll('line')
      .data(graphData.links).enter().append('line')
      .attr('stroke', d => GROUP_COLORS[d.algorithm] || '#444')
      .attr('stroke-opacity', d => Math.max(0.2, d.weight))
      .attr('stroke-width', d => Math.max(1, d.weight * 3));

    const node = svg.append('g').selectAll('g')
      .data(graphData.nodes).enter().append('g')
      .call(d3.drag()
        .on('start', (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on('end', (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
      );

    node.append('circle')
      .attr('r', d => d.group === 'source' ? 16 : 10)
      .attr('fill', d => GROUP_COLORS[d.group] || '#3B82F6')
      .attr('stroke', '#fff').attr('stroke-width', d => d.group === 'source' ? 3 : 1);

    node.append('text')
      .text(d => d.title?.length > 20 ? d.title.slice(0, 18) + '...' : d.title)
      .attr('font-size', 10).attr('fill', '#ddd')
      .attr('dx', 14).attr('dy', 4);

    simulation.on('tick', () => {
      link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => simulation.stop();
  }, [graphData]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pt-20 pb-16" data-testid="similarity-graph-page">
      <div className="px-4 md:px-8 lg:px-12 mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-neutral-400 hover:text-white mb-4" data-testid="graph-back-btn">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <div className="flex items-center gap-3 mb-2">
          <Network className="w-8 h-8 text-[#E50914]" />
          <h1 className="text-4xl md:text-5xl tracking-tighter font-bold">Similarity Graph</h1>
        </div>
        <p className="text-neutral-400 mb-4">Interactive force-directed graph of movie similarities</p>
      </div>

      <div className="px-4 md:px-8 lg:px-12 mb-4 flex gap-4 items-end">
        <div>
          <label className="text-sm text-neutral-400 mb-1 block">Movie ID</label>
          <input type="number" value={movieId} onChange={e => setMovieId(e.target.value)}
            className="bg-[#1F1F1F] border border-white/10 rounded-md px-4 py-2 text-white w-32" data-testid="graph-movie-input" />
        </div>
        <button onClick={loadGraph} disabled={loading}
          className="bg-[#E50914] hover:bg-[#F6121D] text-white px-6 py-2 rounded-md font-semibold disabled:opacity-40" data-testid="graph-load-btn">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate Graph'}
        </button>
      </div>

      {/* Legend */}
      <div className="px-4 md:px-8 lg:px-12 mb-4 flex flex-wrap gap-4 text-xs">
        {Object.entries(GROUP_COLORS).filter(([k]) => k !== 'cross').map(([k, c]) => (
          <div key={k} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
            <span className="text-neutral-400 capitalize">{k}</span>
          </div>
        ))}
      </div>

      <div className="px-4 md:px-8 lg:px-12">
        <div className="bg-[#141414] border border-white/5 rounded-md overflow-hidden" style={{ minHeight: 500 }}>
          {loading ? (
            <div className="flex items-center justify-center h-[500px]">
              <Loader2 className="w-8 h-8 text-[#E50914] animate-spin" />
            </div>
          ) : (
            <svg ref={svgRef} style={{ width: '100%', height: 500 }} />
          )}
        </div>
      </div>
    </div>
  );
};

export default SimilarityGraph;
