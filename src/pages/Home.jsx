import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  const [featuredGames, setFeaturedGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedGames();
  }, []);

  async function fetchFeaturedGames() {
    try {
      const sports = ['nfl', 'nba', 'mlb'];
      const allGames = [];

      for (const sport of sports) {
        const res = await fetch(`/api/odds/${sport}`);
        if (res.ok) {
          const data = await res.json();
          allGames.push(...(data.games || []).slice(0, 2));
        }
      }

      setFeaturedGames(allGames.slice(0, 6));
    } catch (error) {
      console.error('Failed to fetch games:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container">
      {/* Hero Section */}
      <section className="hero">
        <h1>
          Sports Betting <span className="text-primary">Research Tool</span>
        </h1>
        <p className="hero-subtitle">
          Build and analyze parlay bets with real-time odds from DraftKings.
          AI-powered suggestions to help with your research.
        </p>
        <div className="hero-actions">
          <Link to="/builder" className="btn btn-primary">
            Start Building
          </Link>
          <Link to="/suggestions" className="btn btn-secondary">
            View Suggestions
          </Link>
        </div>
      </section>

      {/* Featured Games */}
      <section className="section">
        <div className="section-header">
          <h2>Upcoming Games</h2>
          <Link to="/builder" className="text-primary text-sm">View all</Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 grid-cols-2 grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="card">
                <div className="skeleton" style={{ height: '16px', width: '60px', marginBottom: '1rem' }}></div>
                <div className="skeleton" style={{ height: '24px', marginBottom: '0.5rem' }}></div>
                <div className="skeleton" style={{ height: '24px', width: '75%' }}></div>
              </div>
            ))}
          </div>
        ) : featuredGames.length > 0 ? (
          <div className="grid grid-cols-1 grid-cols-2 grid-cols-3">
            {featuredGames.map(game => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        ) : (
          <div className="card text-center" style={{ padding: '3rem 1rem' }}>
            <p className="text-muted">No upcoming games available</p>
            <p className="text-xs text-muted mt-1">Check back later or configure your API key</p>
          </div>
        )}
      </section>

      {/* Features */}
      <section className="section">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3>Parlay Builder</h3>
            <p>Build parlays with 2-12 legs. See real-time odds and estimated payouts.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3>AI Suggestions</h3>
            <p>Get AI-powered parlay suggestions based on your preferences and current odds.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3>Live Odds</h3>
            <p>Real-time odds from DraftKings for NFL, NBA, and MLB games.</p>
          </div>
        </div>
      </section>

      {/* Disclaimer Banner */}
      <div className="alert alert-warning text-center">
        <strong>Research Only:</strong> This tool does not place bets. All odds are estimates. Gamble responsibly. Call 1-800-GAMBLER for help.
      </div>
    </div>
  );
}

function GameCard({ game }) {
  const moneyline = game.bookmakers?.[0]?.markets?.find(m => m.type === 'h2h');

  return (
    <Link to="/builder" className="game-card card-clickable" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
      <div className="game-card-header">
        <span className="badge badge-success">{game.sport}</span>
        <span>{new Date(game.startTime).toLocaleDateString()}</span>
      </div>

      <div className="game-card-teams">
        <div className="game-card-team">
          <span>{game.awayTeam}</span>
          {moneyline && (
            <span className={`odds ${moneyline.outcomes[1]?.price > 0 ? 'odds-positive' : 'odds-negative'}`}>
              {moneyline.outcomes[1]?.price > 0 ? '+' : ''}{moneyline.outcomes[1]?.price}
            </span>
          )}
        </div>
        <div className="game-card-team">
          <span>{game.homeTeam}</span>
          {moneyline && (
            <span className={`odds ${moneyline.outcomes[0]?.price > 0 ? 'odds-positive' : 'odds-negative'}`}>
              {moneyline.outcomes[0]?.price > 0 ? '+' : ''}{moneyline.outcomes[0]?.price}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
