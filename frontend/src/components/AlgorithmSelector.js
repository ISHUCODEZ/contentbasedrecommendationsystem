import React from 'react';

const AlgorithmSelector = ({ selectedAlgorithm, onSelectAlgorithm }) => {
  const algorithms = [
    { id: 'tfidf',         label: 'TF-IDF',         description: 'Text similarity' },
    { id: 'genre',         label: 'Genre',           description: 'Genre matching' },
    { id: 'combined',      label: 'Combined',        description: 'TF-IDF + Genre' },
    { id: 'word2vec',      label: 'Word2Vec',        description: 'Word embeddings' },
    { id: 'bert',          label: 'BERT',            description: 'Sentence embeddings' },
    { id: 'collaborative', label: 'Collaborative',   description: 'User-item CF' },
    { id: 'hybrid',        label: 'Hybrid',          description: 'Content + Collab' },
    { id: 'svd',           label: 'SVD',             description: 'Matrix factorization' },
    { id: 'kg',            label: 'KnowledgeGraph',  description: 'Graph-based' },
    { id: 'sentiment',     label: 'Sentiment',       description: 'Sentiment-weighted' },
  ];

  return (
    <div className="px-4 md:px-8 lg:px-12 mb-8" data-testid="algorithm-selector">
      <h3 className="text-xl font-medium tracking-tight mb-4">Recommendation Algorithm</h3>
      <div className="flex flex-wrap gap-2 bg-black/40 p-2 rounded-lg border border-white/10">
        {algorithms.map((algo) => (
          <button
            key={algo.id}
            onClick={() => onSelectAlgorithm(algo.id)}
            className={`algorithm-tab px-4 py-2 rounded-lg font-medium transition-all ${
              selectedAlgorithm === algo.id
                ? 'active'
                : 'bg-transparent text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
            data-testid={`algorithm-tab-${algo.id}`}
          >
            <div>
              <div className="font-semibold text-sm">{algo.label}</div>
              <div className="text-xs opacity-80">{algo.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AlgorithmSelector;
