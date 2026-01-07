// Stats service for NBA (BALLDONTLIE) and NHL (Official NHL API)

const BALLDONTLIE_BASE = 'https://api.balldontlie.io/v1';
const NHL_API_BASE = 'https://api-web.nhle.com/v1';

// NBA Teams (static list for quick lookup)
const NBA_TEAMS = [
  { id: 1, name: 'Atlanta Hawks', abbreviation: 'ATL', conference: 'East' },
  { id: 2, name: 'Boston Celtics', abbreviation: 'BOS', conference: 'East' },
  { id: 3, name: 'Brooklyn Nets', abbreviation: 'BKN', conference: 'East' },
  { id: 4, name: 'Charlotte Hornets', abbreviation: 'CHA', conference: 'East' },
  { id: 5, name: 'Chicago Bulls', abbreviation: 'CHI', conference: 'East' },
  { id: 6, name: 'Cleveland Cavaliers', abbreviation: 'CLE', conference: 'East' },
  { id: 7, name: 'Dallas Mavericks', abbreviation: 'DAL', conference: 'West' },
  { id: 8, name: 'Denver Nuggets', abbreviation: 'DEN', conference: 'West' },
  { id: 9, name: 'Detroit Pistons', abbreviation: 'DET', conference: 'East' },
  { id: 10, name: 'Golden State Warriors', abbreviation: 'GSW', conference: 'West' },
  { id: 11, name: 'Houston Rockets', abbreviation: 'HOU', conference: 'West' },
  { id: 12, name: 'Indiana Pacers', abbreviation: 'IND', conference: 'East' },
  { id: 13, name: 'LA Clippers', abbreviation: 'LAC', conference: 'West' },
  { id: 14, name: 'Los Angeles Lakers', abbreviation: 'LAL', conference: 'West' },
  { id: 15, name: 'Memphis Grizzlies', abbreviation: 'MEM', conference: 'West' },
  { id: 16, name: 'Miami Heat', abbreviation: 'MIA', conference: 'East' },
  { id: 17, name: 'Milwaukee Bucks', abbreviation: 'MIL', conference: 'East' },
  { id: 18, name: 'Minnesota Timberwolves', abbreviation: 'MIN', conference: 'West' },
  { id: 19, name: 'New Orleans Pelicans', abbreviation: 'NOP', conference: 'West' },
  { id: 20, name: 'New York Knicks', abbreviation: 'NYK', conference: 'East' },
  { id: 21, name: 'Oklahoma City Thunder', abbreviation: 'OKC', conference: 'West' },
  { id: 22, name: 'Orlando Magic', abbreviation: 'ORL', conference: 'East' },
  { id: 23, name: 'Philadelphia 76ers', abbreviation: 'PHI', conference: 'East' },
  { id: 24, name: 'Phoenix Suns', abbreviation: 'PHX', conference: 'West' },
  { id: 25, name: 'Portland Trail Blazers', abbreviation: 'POR', conference: 'West' },
  { id: 26, name: 'Sacramento Kings', abbreviation: 'SAC', conference: 'West' },
  { id: 27, name: 'San Antonio Spurs', abbreviation: 'SAS', conference: 'West' },
  { id: 28, name: 'Toronto Raptors', abbreviation: 'TOR', conference: 'East' },
  { id: 29, name: 'Utah Jazz', abbreviation: 'UTA', conference: 'West' },
  { id: 30, name: 'Washington Wizards', abbreviation: 'WAS', conference: 'East' }
];

// ============ NBA Functions (BALLDONTLIE) ============

export async function getNbaTeams() {
  return { teams: NBA_TEAMS };
}

export async function getNbaTeamStats(teamId) {
  // BALLDONTLIE doesn't have a direct team stats endpoint
  // We return the team info plus any cached stats
  const team = NBA_TEAMS.find(t => t.id === parseInt(teamId));
  if (!team) {
    throw new Error('Team not found');
  }

  return {
    team,
    stats: {
      message: 'Team statistics require game-by-game aggregation',
      note: 'Use player stats for detailed analysis'
    }
  };
}

export async function searchNbaPlayers(query) {
  const apiKey = process.env.BALLDONTLIE_API_KEY;
  const headers = apiKey ? { Authorization: apiKey } : {};

  try {
    const response = await fetch(
      `${BALLDONTLIE_BASE}/players?search=${encodeURIComponent(query)}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`BALLDONTLIE API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      players: data.data.map(p => ({
        id: p.id,
        firstName: p.first_name,
        lastName: p.last_name,
        position: p.position,
        team: p.team?.full_name || 'Unknown'
      }))
    };
  } catch (error) {
    console.error('NBA player search error:', error);
    return { players: [], error: error.message };
  }
}

export async function getNbaPlayerStats(playerId) {
  const apiKey = process.env.BALLDONTLIE_API_KEY;
  const headers = apiKey ? { Authorization: apiKey } : {};

  try {
    // Get current season stats
    const currentYear = new Date().getFullYear();
    const season = new Date().getMonth() >= 9 ? currentYear : currentYear - 1;

    const response = await fetch(
      `${BALLDONTLIE_BASE}/season_averages?season=${season}&player_ids[]=${playerId}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`BALLDONTLIE API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      playerId,
      season,
      stats: data.data[0] || null
    };
  } catch (error) {
    console.error('NBA player stats error:', error);
    return { playerId, stats: null, error: error.message };
  }
}

// ============ NHL Functions (Official NHL API) ============

export async function getNhlTeams() {
  try {
    const response = await fetch(`${NHL_API_BASE}/standings/now`);
    if (!response.ok) {
      throw new Error(`NHL API error: ${response.status}`);
    }

    const data = await response.json();

    const teams = data.standings.map(team => ({
      id: team.teamAbbrev.default,
      name: team.teamName.default,
      abbreviation: team.teamAbbrev.default,
      conference: team.conferenceName,
      division: team.divisionName,
      wins: team.wins,
      losses: team.losses,
      otLosses: team.otLosses,
      points: team.points,
      gamesPlayed: team.gamesPlayed,
      goalFor: team.goalFor,
      goalAgainst: team.goalAgainst,
      streakCode: team.streakCode,
      streakCount: team.streakCount
    }));

    return { teams };
  } catch (error) {
    console.error('NHL teams error:', error);
    return { teams: [], error: error.message };
  }
}

export async function getNhlTeamStats(teamAbbr) {
  try {
    const response = await fetch(`${NHL_API_BASE}/club-stats/${teamAbbr}/now`);
    if (!response.ok) {
      throw new Error(`NHL API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      teamAbbr,
      skaters: data.skaters?.slice(0, 10) || [],
      goalies: data.goalies || []
    };
  } catch (error) {
    console.error('NHL team stats error:', error);
    return { teamAbbr, error: error.message };
  }
}

export async function getNhlRoster(teamAbbr) {
  try {
    const response = await fetch(`${NHL_API_BASE}/roster/${teamAbbr}/current`);
    if (!response.ok) {
      throw new Error(`NHL API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      teamAbbr,
      forwards: data.forwards || [],
      defensemen: data.defensemen || [],
      goalies: data.goalies || []
    };
  } catch (error) {
    console.error('NHL roster error:', error);
    return { teamAbbr, error: error.message };
  }
}

export async function getNhlPlayerStats(playerId) {
  try {
    // Get current season
    const currentYear = new Date().getFullYear();
    const season = new Date().getMonth() >= 9
      ? `${currentYear}${currentYear + 1}`
      : `${currentYear - 1}${currentYear}`;

    const response = await fetch(
      `${NHL_API_BASE}/player/${playerId}/game-log/${season}/2`
    );

    if (!response.ok) {
      throw new Error(`NHL API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      playerId,
      season,
      gameLog: data.gameLog?.slice(0, 10) || []
    };
  } catch (error) {
    console.error('NHL player stats error:', error);
    return { playerId, error: error.message };
  }
}

// ============ Generic Interface ============

export async function getTeams(sport) {
  switch (sport.toLowerCase()) {
    case 'nba':
      return getNbaTeams();
    case 'nhl':
      return getNhlTeams();
    default:
      throw new Error(`Unsupported sport: ${sport}`);
  }
}

export async function getTeamStats(sport, teamId) {
  switch (sport.toLowerCase()) {
    case 'nba':
      return getNbaTeamStats(teamId);
    case 'nhl':
      return getNhlTeamStats(teamId);
    default:
      throw new Error(`Unsupported sport: ${sport}`);
  }
}

export async function searchPlayers(sport, query) {
  switch (sport.toLowerCase()) {
    case 'nba':
      return searchNbaPlayers(query);
    case 'nhl':
      // NHL API doesn't have a search - return empty
      return { players: [], note: 'NHL player search not available' };
    default:
      throw new Error(`Unsupported sport: ${sport}`);
  }
}

export async function getPlayerStats(sport, playerId) {
  switch (sport.toLowerCase()) {
    case 'nba':
      return getNbaPlayerStats(playerId);
    case 'nhl':
      return getNhlPlayerStats(playerId);
    default:
      throw new Error(`Unsupported sport: ${sport}`);
  }
}

export default {
  getTeams,
  getTeamStats,
  searchPlayers,
  getPlayerStats,
  getNbaTeams,
  getNhlTeams,
  getNhlRoster
};
