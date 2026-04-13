import React from 'react';

const SimilarityBreakdown = ({ similarityData }) => {
  if (!similarityData) return null;

  const metrics = [
    { label: 'TF-IDF Similarity',  value: similarityData.tfidf_similarity,    color: '#E50914' },
    { label: 'Genre Similarity',    value: similarityData.genre_similarity,    color: '#F59E0B' },
    { label: 'Word2Vec Similarity', value: similarityData.word2vec_similarity, color: '#3B82F6' },
    { label: 'BERT Similarity',     value: similarityData.bert_similarity,     color: '#8B5CF6' },
    { label: 'Combined Score',      value: similarityData.combined_similarity, color: '#22C55E' },
  ].filter(m => m.value !== undefined && m.value !== null);

  return (
    <div className="bg-[#141414] border border-white/10 rounded-md p-6" data-testid="similarity-breakdown">
      <h3 className="text-xl font-semibold mb-4">Similarity Breakdown</h3>
      
      <div className="space-y-4">
        {metrics.map((metric, index) => (
          <div key={index}>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-neutral-300">{metric.label}</span>
              <span className="text-sm font-semibold">{(metric.value * 100).toFixed(1)}%</span>
            </div>
            <div className="similarity-bar">
              <div
                className="similarity-fill"
                style={{
                  width: `${metric.value * 100}%`,
                  backgroundColor: metric.color
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {similarityData.common_genres && similarityData.common_genres.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold mb-2 text-neutral-300">Common Genres</h4>
          <div className="flex flex-wrap gap-2">
            {similarityData.common_genres.map((genre, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-[#E50914]/20 border border-[#E50914]/40 rounded-full text-sm text-[#E50914]"
              >
                {genre}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SimilarityBreakdown;
