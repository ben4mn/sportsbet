import { useState, useEffect } from 'react';
import { getTeams, getTeamStats, searchPlayers, getPlayerStats } from '../services/statsApi.js';

export default function Research() {
  const [sport, setSport] = useState('nba');
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamStats, setTeamStats] = useState(null);
  const [playerSearch, setPlayerSearch] = useState('');
  const [playerResults, setPlayerResults] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerStats, setPlayerStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTeams();
  }, [sport]);

  async function fetchTeams() {
    setLoading(true);
    setError(null);
    setSelectedTeam(null);
    setTeamStats(null);
    try {
      const data = await getTeams(sport);
      setTeams(data.teams || []);
    } catch (err) {
      setError('Failed to load teams');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleTeamSelect(team) {
    setSelectedTeam(team);
    setTeamStats(null);
    try {
      const teamId = sport === 'nhl' ? team.abbreviation : team.id;
      const data = await getTeamStats(sport, teamId);
      setTeamStats(data);
    } catch (err) {
      console.error('Failed to load team stats:', err);
    }
  }

  async function handlePlayerSearch(e) {
    e.preventDefault();
    if (playerSearch.length < 2) return;

    try {
      const data = await searchPlayers(sport, playerSearch);
      setPlayerResults(data.players || []);
    } catch (err) {
      console.error('Failed to search players:', err);
    }
  }

  async function handlePlayerSelect(player) {
    setSelectedPlayer(player);
    setPlayerStats(null);
    try {
      const data = await getPlayerStats(sport, player.id);
      setPlayerStats(data);
    } catch (err) {
      console.error('Failed to load player stats:', err);
    }
  }

  return (
    <div className="page-container">
      <header className="section-header">
        <h1>Research Center</h1>
        <p className="text-muted">Explore team and player statistics for NBA and NHL</p>
      </header>

      {/* Sport Selector */}
      <div className="sport-tabs">
        <button
          className={`sport-tab ${sport === 'nba' ? 'active' : ''}`}
          onClick={() => setSport('nba')}
        >
          NBA
        </button>
        <button
          className={`sport-tab ${sport === 'nhl' ? 'active' : ''}`}
          onClick={() => setSport('nhl')}
        >
          NHL
        </button>
      </div>

      <div className="research-grid">
        {/* Teams Section */}
        <section className="section">
          <h2>Teams</h2>

          {loading ? (
            <div className="loading-spinner">Loading teams...</div>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : (
            <div className="teams-list">
              {teams.map(team => (
                <button
                  key={team.id || team.abbreviation}
                  className={`team-button ${selectedTeam?.id === team.id || selectedTeam?.abbreviation === team.abbreviation ? 'active' : ''}`}
                  onClick={() => handleTeamSelect(team)}
                >
                  <span className="team-name">{team.name}</span>
                  {team.abbreviation && (
                    <span className="team-abbr">{team.abbreviation}</span>
                  )}
                  {sport === 'nhl' && team.points !== undefined && (
                    <span className="team-record">
                      {team.wins}-{team.losses}-{team.otLosses} ({team.points} pts)
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Team Stats */}
        {selectedTeam && (
          <section className="section">
            <h2>{selectedTeam.name} Stats</h2>
            <div className="card">
              {sport === 'nhl' && teamStats?.skaters && (
                <>
                  <h3 className="text-lg mb-3">Top Skaters</h3>
                  <div className="stats-table">
                    {teamStats.skaters.map((skater, idx) => (
                      <div key={idx} className="stats-row">
                        <span>{skater.firstName?.default} {skater.lastName?.default}</span>
                        <span>{skater.goals || 0}G {skater.assists || 0}A {skater.points || 0}P</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {sport === 'nba' && (
                <div className="text-muted">
                  <p>Team: {selectedTeam.name}</p>
                  <p>Conference: {selectedTeam.conference}</p>
                  <p className="text-sm mt-2">
                    For detailed NBA stats, search for individual players below.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Player Search (NBA only) */}
      {sport === 'nba' && (
        <section className="section">
          <h2>Player Search</h2>
          <form onSubmit={handlePlayerSearch} className="player-search-form">
            <input
              type="text"
              placeholder="Search players (e.g., LeBron)"
              value={playerSearch}
              onChange={(e) => setPlayerSearch(e.target.value)}
              className="input"
            />
            <button type="submit" className="btn btn-primary">Search</button>
          </form>

          {playerResults.length > 0 && (
            <div className="player-results">
              {playerResults.map(player => (
                <button
                  key={player.id}
                  className={`player-button ${selectedPlayer?.id === player.id ? 'active' : ''}`}
                  onClick={() => handlePlayerSelect(player)}
                >
                  <span>{player.firstName} {player.lastName}</span>
                  <span className="text-muted">{player.position} - {player.team}</span>
                </button>
              ))}
            </div>
          )}

          {selectedPlayer && playerStats && (
            <div className="card mt-4">
              <h3>{selectedPlayer.firstName} {selectedPlayer.lastName}</h3>
              {playerStats.stats ? (
                <div className="player-stats-grid">
                  <div className="stat-item">
                    <span className="stat-value">{playerStats.stats.pts?.toFixed(1) || '-'}</span>
                    <span className="stat-label">PPG</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{playerStats.stats.reb?.toFixed(1) || '-'}</span>
                    <span className="stat-label">RPG</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{playerStats.stats.ast?.toFixed(1) || '-'}</span>
                    <span className="stat-label">APG</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{playerStats.stats.fg_pct ? (playerStats.stats.fg_pct * 100).toFixed(1) + '%' : '-'}</span>
                    <span className="stat-label">FG%</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{playerStats.stats.fg3_pct ? (playerStats.stats.fg3_pct * 100).toFixed(1) + '%' : '-'}</span>
                    <span className="stat-label">3P%</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{playerStats.stats.games_played || '-'}</span>
                    <span className="stat-label">GP</span>
                  </div>
                </div>
              ) : (
                <p className="text-muted">No stats available for this season</p>
              )}
            </div>
          )}
        </section>
      )}

      {/* Disclaimer */}
      <div className="alert alert-warning mt-4">
        <strong>Research Tool:</strong> Stats are for informational purposes only.
        Data may be delayed or incomplete.
      </div>
    </div>
  );
}
