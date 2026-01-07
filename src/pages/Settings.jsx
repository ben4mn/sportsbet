import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const NBA_TEAMS = [
  'Atlanta Hawks', 'Boston Celtics', 'Brooklyn Nets', 'Charlotte Hornets',
  'Chicago Bulls', 'Cleveland Cavaliers', 'Dallas Mavericks', 'Denver Nuggets',
  'Detroit Pistons', 'Golden State Warriors', 'Houston Rockets', 'Indiana Pacers',
  'Los Angeles Clippers', 'Los Angeles Lakers', 'Memphis Grizzlies', 'Miami Heat',
  'Milwaukee Bucks', 'Minnesota Timberwolves', 'New Orleans Pelicans', 'New York Knicks',
  'Oklahoma City Thunder', 'Orlando Magic', 'Philadelphia 76ers', 'Phoenix Suns',
  'Portland Trail Blazers', 'Sacramento Kings', 'San Antonio Spurs', 'Toronto Raptors',
  'Utah Jazz', 'Washington Wizards'
];

const NHL_TEAMS = [
  'Anaheim Ducks', 'Arizona Coyotes', 'Boston Bruins', 'Buffalo Sabres',
  'Calgary Flames', 'Carolina Hurricanes', 'Chicago Blackhawks', 'Colorado Avalanche',
  'Columbus Blue Jackets', 'Dallas Stars', 'Detroit Red Wings', 'Edmonton Oilers',
  'Florida Panthers', 'Los Angeles Kings', 'Minnesota Wild', 'Montreal Canadiens',
  'Nashville Predators', 'New Jersey Devils', 'New York Islanders', 'New York Rangers',
  'Ottawa Senators', 'Philadelphia Flyers', 'Pittsburgh Penguins', 'San Jose Sharks',
  'Seattle Kraken', 'St. Louis Blues', 'Tampa Bay Lightning', 'Toronto Maple Leafs',
  'Vancouver Canucks', 'Vegas Golden Knights', 'Washington Capitals', 'Winnipeg Jets'
];

const BET_TYPES = [
  { id: 'moneyline', name: 'Moneyline', description: 'Pick the winner' },
  { id: 'spread', name: 'Spread', description: 'Point spread betting' },
  { id: 'totals', name: 'Totals', description: 'Over/under on points' },
  { id: 'props', name: 'Player Props', description: 'Individual player performance' }
];

const RISK_LEVELS = [
  { id: 'conservative', name: 'Conservative', description: '2-3 leg parlays with favorites' },
  { id: 'moderate', name: 'Moderate', description: '3-5 legs with mixed picks' },
  { id: 'aggressive', name: 'Aggressive', description: '5+ legs with higher odds' }
];

const FOCUS_RISK_LEVELS = [
  { id: 'conservative', name: 'Conservative' },
  { id: 'normal', name: 'Normal' },
  { id: 'aggressive', name: 'Aggressive' },
  { id: 'yolo', name: 'YOLO' }
];

export default function Settings() {
  const { user, updatePreferences } = useAuth();

  const [favoriteTeams, setFavoriteTeams] = useState([]);
  const [betTypes, setBetTypes] = useState(['moneyline', 'spread', 'totals']);
  const [riskTolerance, setRiskTolerance] = useState('moderate');
  const [bankroll, setBankroll] = useState(0);
  const [teamFocus, setTeamFocus] = useState([]);
  const [avoidTeams, setAvoidTeams] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('nba');

  useEffect(() => {
    if (user?.preferences) {
      setFavoriteTeams(user.preferences.favoriteTeams || []);
      setBetTypes(user.preferences.betTypes || ['moneyline', 'spread', 'totals']);
      setRiskTolerance(user.preferences.riskTolerance || 'moderate');
      setBankroll(user.preferences.bankroll || 0);
      setTeamFocus(user.preferences.teamFocus || []);
      setAvoidTeams(user.preferences.avoidTeams || []);
    }
  }, [user]);

  async function handleSave() {
    setSaving(true);
    setMessage('');

    try {
      await updatePreferences({
        favoriteTeams,
        betTypes,
        riskTolerance,
        bankroll,
        teamFocus,
        avoidTeams
      });
      setMessage('Preferences saved!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  }

  function toggleTeam(team) {
    setFavoriteTeams(prev =>
      prev.includes(team)
        ? prev.filter(t => t !== team)
        : [...prev, team]
    );
  }

  function toggleBetType(typeId) {
    setBetTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(t => t !== typeId)
        : [...prev, typeId]
    );
  }

  function addTeamFocus(team) {
    if (!teamFocus.find(tf => tf.team === team)) {
      setTeamFocus(prev => [...prev, { team, risk: 'normal', alwaysInclude: false }]);
    }
  }

  function removeTeamFocus(team) {
    setTeamFocus(prev => prev.filter(tf => tf.team !== team));
  }

  function updateTeamFocusRisk(team, risk) {
    setTeamFocus(prev => prev.map(tf =>
      tf.team === team ? { ...tf, risk } : tf
    ));
  }

  function toggleTeamFocusAlwaysInclude(team) {
    setTeamFocus(prev => prev.map(tf =>
      tf.team === team ? { ...tf, alwaysInclude: !tf.alwaysInclude } : tf
    ));
  }

  function toggleAvoidTeam(team) {
    setAvoidTeams(prev =>
      prev.includes(team)
        ? prev.filter(t => t !== team)
        : [...prev, team]
    );
  }

  const teamsByTab = {
    nba: NBA_TEAMS,
    nhl: NHL_TEAMS
  };

  return (
    <div className="page-container" style={{ maxWidth: '42rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Settings</h1>

      {/* Account Info */}
      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontWeight: '600', marginBottom: '1rem' }}>Account</h2>
        <div style={{ color: 'var(--text-secondary)' }}>
          <p>Email: <span style={{ color: 'var(--text-primary)' }}>{user?.email}</span></p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Member since {new Date(user?.created_at).toLocaleDateString()}
          </p>
        </div>
      </section>

      {/* Favorite Teams */}
      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontWeight: '600', marginBottom: '1rem' }}>Favorite Teams</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Select your favorite teams for personalized suggestions
        </p>

        {/* Sport Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {['nba', 'nhl'].map(sport => (
            <button
              key={sport}
              onClick={() => setActiveTab(sport)}
              className="btn btn-sm"
              style={{
                background: activeTab === sport ? 'var(--primary)' : 'var(--bg-elevated)',
                color: activeTab === sport ? 'white' : 'var(--text-secondary)'
              }}
            >
              {sport.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Teams Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', maxHeight: '15rem', overflowY: 'auto' }}>
          {teamsByTab[activeTab].map(team => (
            <button
              key={team}
              onClick={() => toggleTeam(team)}
              style={{
                padding: '0.5rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                textAlign: 'left',
                background: favoriteTeams.includes(team) ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-elevated)',
                color: favoriteTeams.includes(team) ? 'var(--primary)' : 'var(--text-primary)',
                border: favoriteTeams.includes(team) ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent'
              }}
            >
              {team}
            </button>
          ))}
        </div>

        {favoriteTeams.length > 0 && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Selected ({favoriteTeams.length}):</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {favoriteTeams.map(team => (
                <span
                  key={team}
                  className="badge badge-success"
                  style={{ fontSize: '0.75rem', cursor: 'pointer' }}
                  onClick={() => toggleTeam(team)}
                >
                  {team} ×
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Team Focus */}
      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontWeight: '600', marginBottom: '1rem' }}>Team Focus (Optional)</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Configure special focus for specific teams in suggestions
        </p>

        {/* Add Team Focus from favorites */}
        {favoriteTeams.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Add from your favorites:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {favoriteTeams
                .filter(team => !teamFocus.find(tf => tf.team === team))
                .map(team => (
                  <button
                    key={team}
                    onClick={() => addTeamFocus(team)}
                    className="badge"
                    style={{ background: 'var(--bg-elevated)', fontSize: '0.75rem' }}
                  >
                    + {team}
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Team Focus List */}
        {teamFocus.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {teamFocus.map(tf => (
              <div key={tf.team} style={{ padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '500' }}>{tf.team}</span>
                  <button
                    onClick={() => removeTeamFocus(tf.team)}
                    style={{ color: 'var(--danger)', fontSize: '0.875rem' }}
                  >
                    Remove
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Risk:</span>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {FOCUS_RISK_LEVELS.map(level => (
                      <button
                        key={level.id}
                        onClick={() => updateTeamFocusRisk(tf.team, level.id)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          background: tf.risk === level.id ? 'var(--primary)' : 'var(--bg-surface)',
                          color: tf.risk === level.id ? 'white' : 'var(--text-secondary)'
                        }}
                      >
                        {level.name}
                      </button>
                    ))}
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={tf.alwaysInclude}
                    onChange={() => toggleTeamFocusAlwaysInclude(tf.team)}
                  />
                  <span style={{ color: 'var(--text-secondary)' }}>Always include when available</span>
                </label>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>
            No team focus set. Add from your favorites above.
          </p>
        )}
      </section>

      {/* Teams to Avoid */}
      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontWeight: '600', marginBottom: '1rem' }}>Teams to Avoid (Optional)</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Exclude these teams from suggestions
        </p>

        {/* Add Teams to Avoid */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            {['nba', 'nhl'].map(sport => (
              <button
                key={sport}
                onClick={() => setActiveTab(sport)}
                style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  background: activeTab === sport ? 'var(--primary)' : 'var(--bg-elevated)',
                  color: activeTab === sport ? 'white' : 'var(--text-secondary)'
                }}
              >
                {sport.toUpperCase()}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '8rem', overflowY: 'auto' }}>
            {teamsByTab[activeTab]
              .filter(team => !avoidTeams.includes(team))
              .map(team => (
                <button
                  key={team}
                  onClick={() => toggleAvoidTeam(team)}
                  className="badge"
                  style={{ background: 'var(--bg-elevated)', fontSize: '0.75rem' }}
                >
                  + {team}
                </button>
              ))}
          </div>
        </div>

        {avoidTeams.length > 0 && (
          <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Avoiding ({avoidTeams.length}):</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {avoidTeams.map(team => (
                <span
                  key={team}
                  className="badge badge-danger"
                  style={{ fontSize: '0.75rem', cursor: 'pointer' }}
                  onClick={() => toggleAvoidTeam(team)}
                >
                  {team} ×
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Bet Types */}
      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontWeight: '600', marginBottom: '1rem' }}>Preferred Bet Types</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {BET_TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => toggleBetType(type.id)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                textAlign: 'left',
                background: betTypes.includes(type.id) ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-elevated)',
                border: betTypes.includes(type.id) ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent'
              }}
            >
              <div style={{ fontWeight: '500' }}>{type.name}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{type.description}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Risk Tolerance */}
      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontWeight: '600', marginBottom: '1rem' }}>Risk Tolerance</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {RISK_LEVELS.map(level => (
            <button
              key={level.id}
              onClick={() => setRiskTolerance(level.id)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                textAlign: 'left',
                background: riskTolerance === level.id ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-elevated)',
                border: riskTolerance === level.id ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent'
              }}
            >
              <div style={{ fontWeight: '500' }}>{level.name}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{level.description}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Bankroll (Optional) */}
      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontWeight: '600', marginBottom: '1rem' }}>Bankroll Tracking (Optional)</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Set a reference bankroll for percentage-based stake suggestions
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>$</span>
          <input
            type="number"
            min="0"
            value={bankroll}
            onChange={(e) => setBankroll(Number(e.target.value) || 0)}
            className="form-input"
            style={{ flex: 1 }}
            placeholder="0"
          />
        </div>
      </section>

      {/* Save Button */}
      {message && (
        <div style={{
          marginBottom: '1rem',
          padding: '0.75rem',
          borderRadius: 'var(--radius-md)',
          textAlign: 'center',
          background: message.includes('Failed') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
          color: message.includes('Failed') ? 'var(--danger)' : 'var(--primary)'
        }}>
          {message}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="btn btn-primary"
        style={{ width: '100%' }}
      >
        {saving ? 'Saving...' : 'Save Preferences'}
      </button>
    </div>
  );
}
