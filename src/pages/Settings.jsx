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

export default function Settings() {
  const { user, updatePreferences } = useAuth();

  const [favoriteTeams, setFavoriteTeams] = useState([]);
  const [betTypes, setBetTypes] = useState(['moneyline', 'spread', 'totals']);
  const [riskTolerance, setRiskTolerance] = useState('moderate');
  const [bankroll, setBankroll] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('nba');

  useEffect(() => {
    if (user?.preferences) {
      setFavoriteTeams(user.preferences.favoriteTeams || []);
      setBetTypes(user.preferences.betTypes || ['moneyline', 'spread', 'totals']);
      setRiskTolerance(user.preferences.riskTolerance || 'moderate');
      setBankroll(user.preferences.bankroll || 0);
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
        bankroll
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

  const teamsByTab = {
    nba: NBA_TEAMS,
    nhl: NHL_TEAMS
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Account Info */}
      <section className="card mb-6">
        <h2 className="font-semibold mb-4">Account</h2>
        <div className="text-slate-400">
          <p>Email: <span className="text-white">{user?.email}</span></p>
          <p className="text-sm mt-1">
            Member since {new Date(user?.created_at).toLocaleDateString()}
          </p>
        </div>
      </section>

      {/* Favorite Teams */}
      <section className="card mb-6">
        <h2 className="font-semibold mb-4">Favorite Teams</h2>
        <p className="text-sm text-slate-400 mb-4">
          Select your favorite teams for personalized suggestions
        </p>

        {/* Sport Tabs */}
        <div className="flex gap-2 mb-4">
          {['nba', 'nhl'].map(sport => (
            <button
              key={sport}
              onClick={() => setActiveTab(sport)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                activeTab === sport
                  ? 'bg-primary text-white'
                  : 'bg-dark-800 text-slate-400 hover:text-white'
              }`}
            >
              {sport.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Teams Grid */}
        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
          {teamsByTab[activeTab].map(team => (
            <button
              key={team}
              onClick={() => toggleTeam(team)}
              className={`p-2 rounded text-sm text-left transition-colors ${
                favoriteTeams.includes(team)
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'bg-dark-800 hover:bg-dark-700'
              }`}
            >
              {team}
            </button>
          ))}
        </div>

        {favoriteTeams.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <p className="text-sm text-slate-400 mb-2">Selected ({favoriteTeams.length}):</p>
            <div className="flex flex-wrap gap-2">
              {favoriteTeams.map(team => (
                <span
                  key={team}
                  className="badge badge-green text-xs cursor-pointer hover:bg-red-500/20 hover:text-red-400"
                  onClick={() => toggleTeam(team)}
                >
                  {team} &times;
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Bet Types */}
      <section className="card mb-6">
        <h2 className="font-semibold mb-4">Preferred Bet Types</h2>
        <div className="space-y-2">
          {BET_TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => toggleBetType(type.id)}
              className={`w-full p-3 rounded-lg text-left transition-colors ${
                betTypes.includes(type.id)
                  ? 'bg-primary/20 border border-primary/30'
                  : 'bg-dark-800 hover:bg-dark-700'
              }`}
            >
              <div className="font-medium">{type.name}</div>
              <div className="text-sm text-slate-400">{type.description}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Risk Tolerance */}
      <section className="card mb-6">
        <h2 className="font-semibold mb-4">Risk Tolerance</h2>
        <div className="space-y-2">
          {RISK_LEVELS.map(level => (
            <button
              key={level.id}
              onClick={() => setRiskTolerance(level.id)}
              className={`w-full p-3 rounded-lg text-left transition-colors ${
                riskTolerance === level.id
                  ? 'bg-primary/20 border border-primary/30'
                  : 'bg-dark-800 hover:bg-dark-700'
              }`}
            >
              <div className="font-medium">{level.name}</div>
              <div className="text-sm text-slate-400">{level.description}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Bankroll (Optional) */}
      <section className="card mb-6">
        <h2 className="font-semibold mb-4">Bankroll Tracking (Optional)</h2>
        <p className="text-sm text-slate-400 mb-4">
          Set a reference bankroll for percentage-based stake suggestions
        </p>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">$</span>
          <input
            type="number"
            min="0"
            value={bankroll}
            onChange={(e) => setBankroll(Number(e.target.value) || 0)}
            className="flex-1"
            placeholder="0"
          />
        </div>
      </section>

      {/* Save Button */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg text-center ${
          message.includes('Failed') ? 'bg-red-500/10 text-red-400' : 'bg-primary/10 text-primary'
        }`}>
          {message}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="btn btn-primary w-full"
      >
        {saving ? 'Saving...' : 'Save Preferences'}
      </button>
    </div>
  );
}
