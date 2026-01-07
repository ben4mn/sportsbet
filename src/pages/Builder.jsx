import { useState, useEffect } from 'react';
import { useParlay } from '../context/ParlayContext';
import { useAuth } from '../context/AuthContext';

const SPORTS = [
  { id: 'nba', name: 'NBA', icon: '🏀' },
  { id: 'nhl', name: 'NHL', icon: '🏒' }
];

export default function Builder() {
  const [activeSport, setActiveSport] = useState('nba');
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSlip, setShowSlip] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const { legs, stake, setStake, addLeg, removeLeg, clearParlay, calculateOdds, isValid } = useParlay();
  const { user } = useAuth();

  useEffect(() => {
    fetchGames(activeSport);
  }, [activeSport]);

  async function fetchGames(sport) {
    setLoading(true);
    try {
      const res = await fetch(`/api/odds/${sport}`);
      if (res.ok) {
        const data = await res.json();
        setGames(data.games || []);
      }
    } catch (error) {
      console.error('Failed to fetch games:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleAddLeg(game, market, outcome) {
    try {
      addLeg({
        gameId: game.id,
        sport: activeSport.toUpperCase(),
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        type: market.type,
        selection: outcome.name,
        price: outcome.price,
        point: outcome.point
      });
      setShowSlip(true);
    } catch (error) {
      alert(error.message);
    }
  }

  async function handleSaveParlay() {
    if (!user) {
      alert('Please sign in to save parlays');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/parlays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ legs, stake })
      });

      if (res.ok) {
        setSaveMessage('Parlay saved!');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save');
      }
    } catch (error) {
      alert('Failed to save parlay');
    } finally {
      setSaving(false);
    }
  }

  const odds = calculateOdds();

  return (
    <div className="page-container">
      {/* Sport Tabs */}
      <div className="sport-tabs">
        {SPORTS.map(sport => (
          <button
            key={sport.id}
            onClick={() => setActiveSport(sport.id)}
            className={`sport-tab ${activeSport === sport.id ? 'active' : ''}`}
          >
            {sport.icon} {sport.name}
          </button>
        ))}
      </div>

      <div className="layout-with-sidebar">
        {/* Games List */}
        <div className="layout-main">
          <h2 style={{ marginBottom: '1rem' }}>Upcoming Games</h2>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="card">
                  <div className="skeleton" style={{ height: '20px', width: '30%', marginBottom: '1rem' }}></div>
                  <div className="skeleton" style={{ height: '100px' }}></div>
                </div>
              ))}
            </div>
          ) : games.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {games.map(game => (
                <GameCard
                  key={game.id}
                  game={game}
                  onAddLeg={handleAddLeg}
                  selectedLegs={legs}
                />
              ))}
            </div>
          ) : (
            <div className="card text-center" style={{ padding: '3rem 1rem' }}>
              <p className="text-muted">No games available for {activeSport.toUpperCase()}</p>
            </div>
          )}
        </div>

        {/* Parlay Slip - Desktop */}
        <div className="layout-sidebar md:block hidden">
          <div className="layout-sidebar-sticky">
            <ParlaySlip
              legs={legs}
              stake={stake}
              setStake={setStake}
              odds={odds}
              isValid={isValid}
              onRemove={removeLeg}
              onClear={clearParlay}
              onSave={handleSaveParlay}
              saving={saving}
              saveMessage={saveMessage}
              user={user}
            />
          </div>
        </div>
      </div>

      {/* Mobile Slip Button */}
      {legs.length > 0 && (
        <button
          onClick={() => setShowSlip(true)}
          className="btn btn-primary btn-block md:hidden"
          style={{
            position: 'fixed',
            bottom: 'calc(var(--mobile-nav-height) + 1rem)',
            left: '1rem',
            right: '1rem',
            width: 'auto',
            zIndex: 50
          }}
        >
          View Slip ({legs.length} legs) - {odds.americanOdds}
        </button>
      )}

      {/* Mobile Slip Modal */}
      {showSlip && (
        <div className="overlay md:hidden" onClick={() => setShowSlip(false)}>
          <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
            <div className="bottom-sheet-handle" />
            <div className="bottom-sheet-content">
              <ParlaySlip
                legs={legs}
                stake={stake}
                setStake={setStake}
                odds={odds}
                isValid={isValid}
                onRemove={removeLeg}
                onClear={clearParlay}
                onSave={handleSaveParlay}
                saving={saving}
                saveMessage={saveMessage}
                user={user}
                onClose={() => setShowSlip(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GameCard({ game, onAddLeg, selectedLegs }) {
  const markets = game.bookmakers?.[0]?.markets || [];

  function isSelected(marketType, outcomeName) {
    return selectedLegs.some(
      leg => leg.gameId === game.id && leg.type === marketType && leg.selection === outcomeName
    );
  }

  return (
    <div className="game-card">
      <div className="game-card-header">
        <span>{new Date(game.startTime).toLocaleString()}</span>
        <span className="badge badge-success">{game.sport}</span>
      </div>

      <div className="game-card-teams">
        <div className="game-card-team">
          <span>{game.awayTeam}</span>
        </div>
        <div className="game-card-team">
          <span>@ {game.homeTeam}</span>
        </div>
      </div>

      <div className="game-card-markets">
        {markets.map(market => (
          <div key={market.type} className="market-section">
            <div className="market-label">
              {market.type === 'h2h' ? 'Moneyline' : market.type === 'spreads' ? 'Spread' : 'Total'}
            </div>
            <div className="market-buttons">
              {market.outcomes.map(outcome => (
                <button
                  key={outcome.name}
                  onClick={() => onAddLeg(game, market, outcome)}
                  disabled={isSelected(market.type, outcome.name)}
                  className={`market-btn ${isSelected(market.type, outcome.name) ? 'selected' : ''}`}
                >
                  <span className="market-btn-selection">{outcome.name}</span>
                  <div className="market-btn-odds">
                    {outcome.point && (
                      <span className="market-btn-point">
                        {outcome.point > 0 ? '+' : ''}{outcome.point}
                      </span>
                    )}
                    <span className={outcome.price > 0 ? 'odds-positive' : ''}>
                      {outcome.price > 0 ? '+' : ''}{outcome.price}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ParlaySlip({ legs, stake, setStake, odds, isValid, onRemove, onClear, onSave, saving, saveMessage, user, onClose }) {
  return (
    <div className="parlay-slip">
      <div className="parlay-slip-header">
        <h3>Parlay Slip</h3>
        {legs.length > 0 && (
          <button onClick={onClear} className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}>
            Clear All
          </button>
        )}
      </div>

      {legs.length === 0 ? (
        <div className="parlay-slip-empty">
          Add selections to build your parlay
        </div>
      ) : (
        <>
          <div className="parlay-slip-body">
            {legs.map(leg => (
              <div key={leg.id} className="parlay-leg">
                <div className="parlay-leg-info">
                  <div className="parlay-leg-selection">{leg.selection}</div>
                  <div className="parlay-leg-game">{leg.awayTeam} @ {leg.homeTeam}</div>
                  <div className="parlay-leg-type">
                    {leg.type === 'h2h' ? 'Moneyline' : leg.type}
                    {leg.point && ` (${leg.point > 0 ? '+' : ''}${leg.point})`}
                  </div>
                </div>
                <div className="parlay-leg-actions">
                  <span className={`parlay-leg-odds ${leg.price > 0 ? 'odds-positive' : ''}`}>
                    {leg.price > 0 ? '+' : ''}{leg.price}
                  </span>
                  <button onClick={() => onRemove(leg.id)} className="parlay-leg-remove">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="parlay-slip-footer">
            <div className="parlay-slip-stake">
              <label className="form-label">Stake Amount ($)</label>
              <input
                type="number"
                min="1"
                value={stake}
                onChange={(e) => setStake(Number(e.target.value) || 0)}
                className="form-input"
                style={{ textAlign: 'center' }}
              />
            </div>

            <div className="parlay-slip-stats">
              <div className="parlay-slip-stat">
                <span className="parlay-slip-stat-label">Legs</span>
                <span className="parlay-slip-stat-value">{legs.length}</span>
              </div>
              <div className="parlay-slip-stat">
                <span className="parlay-slip-stat-label">Total Odds</span>
                <span className="parlay-slip-stat-value">{odds.americanOdds}</span>
              </div>
              <div className="parlay-slip-stat">
                <span className="parlay-slip-stat-label">Potential Profit</span>
                <span className="parlay-slip-stat-value text-primary">${odds.profit}</span>
              </div>
            </div>

            <div className="parlay-slip-total">
              <span>Potential Payout</span>
              <span className="parlay-slip-total-value">${odds.payout}</span>
            </div>

            {!isValid && legs.length < 2 && (
              <p className="text-xs text-center mt-4" style={{ color: 'var(--warning)' }}>
                Add at least 2 legs to create a valid parlay
              </p>
            )}

            {saveMessage && (
              <p className="text-sm text-center mt-4 text-primary">{saveMessage}</p>
            )}

            <button
              onClick={onSave}
              disabled={!isValid || saving || !user}
              className="btn btn-primary btn-block mt-4"
            >
              {!user ? 'Sign in to Save' : saving ? 'Saving...' : 'Save Parlay'}
            </button>

            <p className="parlay-slip-disclaimer">
              For research only. Not a real bet.
            </p>
          </div>
        </>
      )}

      {onClose && (
        <div style={{ padding: '0 1rem 1rem' }}>
          <button onClick={onClose} className="btn btn-secondary btn-block">
            Close
          </button>
        </div>
      )}
    </div>
  );
}
