const ODDS_API_KEY = process.env.ODDS_API_KEY;
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';

// Sport keys for The Odds API - NBA and NHL focus
const SPORT_KEYS = {
  nba: 'basketball_nba',
  nhl: 'icehockey_nhl'
};

export function getSportKey(sport) {
  return SPORT_KEYS[sport.toLowerCase()];
}

export function getSupportedSports() {
  return Object.keys(SPORT_KEYS);
}

export async function fetchOddsForSport(sport) {
  const sportKey = getSportKey(sport);

  if (!sportKey) {
    throw new Error(`Invalid sport. Supported: ${getSupportedSports().join(', ')}`);
  }

  if (!ODDS_API_KEY) {
    return getMockOdds(sport);
  }

  const markets = 'h2h,spreads,totals';
  const bookmakers = 'draftkings';

  const response = await fetch(
    `${ODDS_API_BASE}/sports/${sportKey}/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=${markets}&bookmakers=${bookmakers}`
  );

  if (!response.ok) {
    throw new Error(`Odds API error: ${response.status}`);
  }

  const data = await response.json();

  // Transform data for frontend
  return {
    sport: sport.toUpperCase(),
    games: data.map(game => transformGame(game, sport)),
    lastUpdated: new Date().toISOString()
  };
}

export async function fetchGameOdds(sport, gameId) {
  const sportKey = getSportKey(sport);

  if (!sportKey) {
    throw new Error(`Invalid sport. Supported: ${getSupportedSports().join(', ')}`);
  }

  if (!ODDS_API_KEY) {
    return getMockGameOdds(sport, gameId);
  }

  const response = await fetch(
    `${ODDS_API_BASE}/sports/${sportKey}/events/${gameId}/odds?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h,spreads,totals&bookmakers=draftkings`
  );

  if (!response.ok) {
    throw new Error(`Odds API error: ${response.status}`);
  }

  return response.json();
}

function transformGame(game, sport) {
  return {
    id: game.id,
    sport: sport.toUpperCase(),
    homeTeam: game.home_team,
    awayTeam: game.away_team,
    startTime: game.commence_time,
    bookmakers: game.bookmakers.map(book => ({
      name: book.key,
      markets: book.markets.map(market => ({
        type: market.key,
        outcomes: market.outcomes.map(outcome => ({
          name: outcome.name,
          price: outcome.price,
          point: outcome.point
        }))
      }))
    }))
  };
}

// Mock data for development
export function getMockOdds(sport) {
  const mockGames = {
    nba: [
      {
        id: 'mock-nba-1',
        sport: 'NBA',
        homeTeam: 'Los Angeles Lakers',
        awayTeam: 'Boston Celtics',
        startTime: new Date(Date.now() + 86400000).toISOString(),
        bookmakers: [{
          name: 'draftkings',
          markets: [
            {
              type: 'h2h',
              outcomes: [
                { name: 'Los Angeles Lakers', price: +120 },
                { name: 'Boston Celtics', price: -140 }
              ]
            },
            {
              type: 'spreads',
              outcomes: [
                { name: 'Los Angeles Lakers', price: -110, point: +3.5 },
                { name: 'Boston Celtics', price: -110, point: -3.5 }
              ]
            },
            {
              type: 'totals',
              outcomes: [
                { name: 'Over', price: -110, point: 224.5 },
                { name: 'Under', price: -110, point: 224.5 }
              ]
            }
          ]
        }]
      }
    ],
    nhl: [
      {
        id: 'mock-nhl-1',
        sport: 'NHL',
        homeTeam: 'Toronto Maple Leafs',
        awayTeam: 'Montreal Canadiens',
        startTime: new Date(Date.now() + 86400000).toISOString(),
        bookmakers: [{
          name: 'draftkings',
          markets: [
            {
              type: 'h2h',
              outcomes: [
                { name: 'Toronto Maple Leafs', price: -145 },
                { name: 'Montreal Canadiens', price: +125 }
              ]
            },
            {
              type: 'spreads',
              outcomes: [
                { name: 'Toronto Maple Leafs', price: -110, point: -1.5 },
                { name: 'Montreal Canadiens', price: -110, point: +1.5 }
              ]
            },
            {
              type: 'totals',
              outcomes: [
                { name: 'Over', price: -110, point: 6.5 },
                { name: 'Under', price: -110, point: 6.5 }
              ]
            }
          ]
        }]
      }
    ]
  };

  return {
    sport: sport.toUpperCase(),
    games: mockGames[sport.toLowerCase()] || [],
    lastUpdated: new Date().toISOString(),
    isMockData: true
  };
}

function getMockGameOdds(sport, gameId) {
  return {
    id: gameId,
    sport: sport.toUpperCase(),
    message: 'Mock data - configure ODDS_API_KEY for real data',
    isMockData: true
  };
}

export default {
  getSportKey,
  getSupportedSports,
  fetchOddsForSport,
  fetchGameOdds,
  getMockOdds
};
