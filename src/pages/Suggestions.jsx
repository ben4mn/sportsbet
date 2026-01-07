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
    low: 'badge-success',
    medium: 'badge-warning',
    high: 'badge-danger'
  };

  return (
    <div className="page-container">
      <div className="section-header mb-4">
        <h1>Daily Suggestions</h1>
        <p className="text-muted">
          AI-generated parlay suggestions based on current odds and trends.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="alert alert-warning mb-4">
        <strong>Research Only:</strong> These suggestions are for educational purposes.
        Always do your own research. Past performance does not guarantee future results.
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card">
              <div className="skeleton" style={{ height: '24px', width: '40%', marginBottom: '1rem' }}></div>
              <div className="skeleton" style={{ height: '80px' }}></div>
            </div>
          ))}
        </div>
      ) : suggestions.length > 0 ? (
        <div className="grid gap-4">
          {suggestions.map(suggestion => (
            <div key={suggestion.id} className="suggestion-card">
              <div className="suggestion-card-header">
                <div className="suggestion-card-title">
                  <div>
                    <div className="suggestion-card-name">{suggestion.name}</div>
                    <div className="suggestion-card-desc">{suggestion.description}</div>
                  </div>
                  <span className={`badge ${riskColors[suggestion.riskLevel] || 'badge-warning'}`}>
                    {suggestion.riskLevel} risk
                  </span>
                </div>
              </div>

              <div className="suggestion-card-body">
                {/* Legs */}
                <div className="parlay-slip-body" style={{ padding: 0, maxHeight: 'none' }}>
                  {suggestion.legs.map((leg, idx) => (
                    <div key={idx} className="parlay-leg">
                      <div className="parlay-leg-info">
                        <div className="parlay-leg-selection">{leg.team}</div>
                        <div className="parlay-leg-detail">
                          {leg.type}
                          {leg.point && ` (${leg.point})`}
                        </div>
                      </div>
                      <span className={`parlay-leg-odds ${leg.price > 0 ? 'odds-positive' : 'odds-negative'}`}>
                        {leg.price > 0 ? '+' : ''}{leg.price}
                      </span>
                    </div>
                  ))}
                </div>

                {/* AI Analysis */}
                {(suggestion.analysis || suggestion.aiReasoning) && (
                  <div className="card mt-4" style={{ background: 'var(--bg-base)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <svg style={{ width: '20px', height: '20px', color: 'var(--primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span className="font-semibold">AI Analysis</span>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                      {suggestion.analysis || suggestion.aiReasoning}
                    </p>
                  </div>
                )}

                {!suggestion.analysis && !suggestion.aiReasoning && (
                  <button
                    onClick={() => analyzeParlay(suggestion)}
                    disabled={analyzing === suggestion.id}
                    className="btn btn-secondary"
                    style={{ width: '100%', marginTop: '1rem' }}
                  >
                    {analyzing === suggestion.id ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <span className="spinner" style={{ width: '16px', height: '16px' }}></span>
                        Analyzing...
                      </span>
                    ) : (
                      'Get AI Analysis'
                    )}
                  </button>
                )}
              </div>

              {/* Stats */}
              <div className="suggestion-card-stats">
                <div>
                  <span className="suggestion-stat-label">Legs:</span>
                  <span className="suggestion-stat-value">{suggestion.legs.length}</span>
                </div>
                <div>
                  <span className="suggestion-stat-label">Est. Odds:</span>
                  <span className="suggestion-stat-value" style={{ color: 'var(--primary)' }}>
                    +{Math.round((suggestion.estimatedOdds - 1) * 100)}
                  </span>
                </div>
                <div>
                  <span className="suggestion-stat-label">$10 Payout:</span>
                  <span className="suggestion-stat-value" style={{ color: 'var(--primary)' }}>
                    ${(10 * suggestion.estimatedOdds).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center" style={{ padding: '3rem 1rem' }}>
          <svg style={{ width: '48px', height: '48px', margin: '0 auto 1rem', color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <p className="text-muted">No suggestions available right now</p>
          <p className="text-xs text-muted mt-1">Check back later for new picks</p>
        </div>
      )}

      {/* Info Section */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <h3 style={{ fontWeight: 600, marginBottom: '0.75rem' }}>How Suggestions Work</h3>
        <ul style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <span style={{ color: 'var(--primary)' }}>1.</span>
            We analyze current odds from The Odds API
          </li>
          <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <span style={{ color: 'var(--primary)' }}>2.</span>
            AI considers team performance and trends
          </li>
          <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <span style={{ color: 'var(--primary)' }}>3.</span>
            Suggestions are categorized by risk level
          </li>
          <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <span style={{ color: 'var(--primary)' }}>4.</span>
            Always verify odds before any decisions
          </li>
        </ul>
      </div>
    </div>
  );
}
