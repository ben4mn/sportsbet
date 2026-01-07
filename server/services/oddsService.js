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
    `${ODDS_API_BASE}/sports/${sportKey}/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=${markets}&bookmakers=${bookmakers}&oddsFormat=american`
  );

  // Check for rate limit errors
  if (response.status === 429 || response.status === 401) {
    const error = new Error('API rate limit exceeded');
    error.code = 'RATE_LIMIT';
    error.retryAfter = parseInt(response.headers.get('Retry-After')) || 60;
    throw error;
  }

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

export async function fetchPlayerProps(sport, eventId) {
  const sportKey = getSportKey(sport);

  if (!sportKey) {
    throw new Error(`Invalid sport. Supported: ${getSupportedSports().join(', ')}`);
  }

  if (!ODDS_API_KEY) {
    return getMockPlayerProps(sport, eventId);
  }

  // Different markets for different sports
  const markets = sport.toLowerCase() === 'nba'
    ? 'player_points,player_rebounds,player_assists,player_threes'
    : 'player_points,player_goals,player_assists,player_shots_on_goal';

  const response = await fetch(
    `${ODDS_API_BASE}/sports/${sportKey}/events/${eventId}/odds?apiKey=${ODDS_API_KEY}&regions=us&markets=${markets}&bookmakers=draftkings&oddsFormat=american`
  );

  // Check for rate limit errors
  if (response.status === 429 || response.status === 401) {
    const error = new Error('API rate limit exceeded');
    error.code = 'RATE_LIMIT';
    error.retryAfter = parseInt(response.headers.get('Retry-After')) || 60;
    throw error;
  }

  if (!response.ok) {
    throw new Error(`Odds API error: ${response.status}`);
  }

  const data = await response.json();
  return transformPlayerProps(data, sport);
}

function transformPlayerProps(data, sport) {
  const props = [];

  if (data.bookmakers) {
    data.bookmakers.forEach(bookmaker => {
      if (bookmaker.key === 'draftkings') {
        bookmaker.markets.forEach(market => {
          market.outcomes.forEach(outcome => {
            props.push({
              player: outcome.description || outcome.name,
              market: market.key,
              type: outcome.name, // Over/Under
              point: outcome.point,
              price: outcome.price
            });
          });
        });
      }
    });
  }

  return {
    eventId: data.id,
    sport: sport.toUpperCase(),
    props,
    isMockData: false
  };
}

function getMockPlayerProps(sport, eventId) {
  const mockProps = sport.toLowerCase() === 'nba' ? [
    { player: 'LeBron James', market: 'player_points', type: 'Over', point: 25.5, price: -115 },
    { player: 'LeBron James', market: 'player_points', type: 'Under', point: 25.5, price: -105 },
    { player: 'LeBron James', market: 'player_assists', type: 'Over', point: 7.5, price: -110 },
    { player: 'LeBron James', market: 'player_assists', type: 'Under', point: 7.5, price: -110 },
    { player: 'Anthony Davis', market: 'player_rebounds', type: 'Over', point: 11.5, price: -120 },
    { player: 'Anthony Davis', market: 'player_rebounds', type: 'Under', point: 11.5, price: 100 }
  ] : [
    { player: 'Auston Matthews', market: 'player_goals', type: 'Over', point: 0.5, price: -130 },
    { player: 'Auston Matthews', market: 'player_goals', type: 'Under', point: 0.5, price: 110 },
    { player: 'Connor McDavid', market: 'player_points', type: 'Over', point: 1.5, price: -115 },
    { player: 'Connor McDavid', market: 'player_points', type: 'Under', point: 1.5, price: -105 }
  ];

  return {
    eventId,
    sport: sport.toUpperCase(),
    props: mockProps,
    isMockData: true
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
    `${ODDS_API_BASE}/sports/${sportKey}/events/${gameId}/odds?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h,spreads,totals&bookmakers=draftkings&oddsFormat=american`
  );

  // Check for rate limit errors
  if (response.status === 429 || response.status === 401) {
    const error = new Error('API rate limit exceeded');
    error.code = 'RATE_LIMIT';
    error.retryAfter = parseInt(response.headers.get('Retry-After')) || 60;
    throw error;
  }

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
  fetchPlayerProps,
  getMockOdds
};
