import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Suggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(null);

  const { user } = useAuth();

  useEffect(() => {
    fetchSuggestions();
  }, []);

  async function fetchSuggestions() {
    try {
      const res = await fetch('/api/suggestions/daily', {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setLoading(false);
    }
  }

  async function analyzeParlay(suggestion) {
    setAnalyzing(suggestion.id);
    try {
      const res = await fetch('/api/suggestions/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ legs: suggestion.legs })
      });

      if (res.ok) {
        const data = await res.json();
        setSuggestions(prev =>
          prev.map(s =>
            s.id === suggestion.id
              ? { ...s, analysis: data.analysis }
              : s
          )
        );
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setAnalyzing(null);
    }
  }

  const riskColors = {
    low: 'badge-green',
    medium: 'badge-yellow',
    high: 'badge-red'
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Daily Suggestions</h1>
        <p className="text-slate-400">
          AI-generated parlay suggestions based on current odds and trends.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-200">
          <strong>Research Only:</strong> These suggestions are for educational purposes.
          Always do your own research. Past performance does not guarantee future results.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card animate-pulse">
              <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
              <div className="h-20 bg-slate-700 rounded"></div>
            </div>
          ))}
        </div>
      ) : suggestions.length > 0 ? (
        <div className="space-y-6">
          {suggestions.map(suggestion => (
            <div key={suggestion.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{suggestion.name}</h3>
                  <p className="text-sm text-slate-400">{suggestion.description}</p>
                </div>
                <span className={`badge ${riskColors[suggestion.riskLevel] || 'badge-yellow'}`}>
                  {suggestion.riskLevel} risk
                </span>
              </div>

              {/* Legs */}
              <div className="space-y-2 mb-4">
                {suggestion.legs.map((leg, idx) => (
                  <div
                    key={idx}
                    className="bg-dark-800 rounded-lg p-3 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">{leg.team}</div>
                      <div className="text-sm text-slate-400 capitalize">
                        {leg.type}
                        {leg.point && ` (${leg.point})`}
                      </div>
                    </div>
                    <span className={`font-medium ${leg.price > 0 ? 'text-primary' : ''}`}>
                      {leg.price > 0 ? '+' : ''}{leg.price}
                    </span>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 text-sm mb-4">
                <div>
                  <span className="text-slate-400">Legs: </span>
                  <span className="font-medium">{suggestion.legs.length}</span>
                </div>
                <div>
                  <span className="text-slate-400">Est. Odds: </span>
                  <span className="font-medium text-primary">
                    +{Math.round((suggestion.estimatedOdds - 1) * 100)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">$10 Payout: </span>
                  <span className="font-medium text-primary">
                    ${(10 * suggestion.estimatedOdds).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* AI Analysis */}
              {suggestion.analysis ? (
                <div className="bg-dark-800 rounded-lg p-4 mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span className="font-medium">AI Analysis</span>
                  </div>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{suggestion.analysis}</p>
                </div>
              ) : suggestion.aiReasoning ? (
                <div className="bg-dark-800 rounded-lg p-4 mt-4">
                  <p className="text-sm text-slate-300">{suggestion.aiReasoning}</p>
                </div>
              ) : (
                <button
                  onClick={() => analyzeParlay(suggestion)}
                  disabled={analyzing === suggestion.id}
                  className="btn btn-secondary w-full mt-2"
                >
                  {analyzing === suggestion.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing...
                    </span>
                  ) : (
                    'Get AI Analysis'
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <svg className="w-12 h-12 mx-auto text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <p className="text-slate-400">No suggestions available right now</p>
          <p className="text-sm text-slate-500 mt-1">Check back later for new picks</p>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-8 card bg-dark-800/50">
        <h3 className="font-semibold mb-3">How Suggestions Work</h3>
        <ul className="text-sm text-slate-400 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-primary">1.</span>
            We analyze current odds from DraftKings
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">2.</span>
            AI considers team performance and trends
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">3.</span>
            Suggestions are categorized by risk level
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">4.</span>
            Always verify odds before any decisions
          </li>
        </ul>
      </div>
    </div>
  );
}
