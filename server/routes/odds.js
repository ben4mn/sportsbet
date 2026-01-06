import { Router } from 'express';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

const ODDS_API_KEY = process.env.ODDS_API_KEY;
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';

// Sport keys for The Odds API
const SPORT_KEYS = {
  nfl: 'americanfootball_nfl',
  nba: 'basketball_nba',
  mlb: 'baseball_mlb'
};

// Get upcoming games with odds for a sport
router.get('/:sport', optionalAuth, async (req, res) => {
  try {
    const { sport } = req.params;
    const sportKey = SPORT_KEYS[sport.toLowerCase()];

    if (!sportKey) {
      return res.status(400).json({
        error: 'Invalid sport. Supported: nfl, nba, mlb'
      });
    }

    if (!ODDS_API_KEY) {
      // Return mock data if no API key (for development)
      return res.json(getMockOdds(sport));
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
    const games = data.map(game => ({
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
    }));

    res.json({
      sport: sport.toUpperCase(),
      games,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Odds fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch odds' });
  }
});

// Get odds for a specific game
router.get('/:sport/:gameId', optionalAuth, async (req, res) => {
  try {
    const { sport, gameId } = req.params;
    const sportKey = SPORT_KEYS[sport.toLowerCase()];

    if (!sportKey) {
      return res.status(400).json({
        error: 'Invalid sport. Supported: nfl, nba, mlb'
      });
    }

    if (!ODDS_API_KEY) {
      return res.json(getMockGameOdds(sport, gameId));
    }

    const response = await fetch(
      `${ODDS_API_BASE}/sports/${sportKey}/events/${gameId}/odds?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h,spreads,totals&bookmakers=draftkings`
    );

    if (!response.ok) {
      throw new Error(`Odds API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Game odds fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch game odds' });
  }
});

// Mock data for development
function getMockOdds(sport) {
  const mockGames = {
    nfl: [
      {
        id: 'mock-nfl-1',
        sport: 'NFL',
        homeTeam: 'Kansas City Chiefs',
        awayTeam: 'Buffalo Bills',
        startTime: new Date(Date.now() + 86400000).toISOString(),
        bookmakers: [{
          name: 'draftkings',
          markets: [
            {
              type: 'h2h',
              outcomes: [
                { name: 'Kansas City Chiefs', price: -150 },
                { name: 'Buffalo Bills', price: +130 }
              ]
            },
            {
              type: 'spreads',
              outcomes: [
                { name: 'Kansas City Chiefs', price: -110, point: -3.5 },
                { name: 'Buffalo Bills', price: -110, point: +3.5 }
              ]
            },
            {
              type: 'totals',
              outcomes: [
                { name: 'Over', price: -110, point: 48.5 },
                { name: 'Under', price: -110, point: 48.5 }
              ]
            }
          ]
        }]
      }
    ],
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
    mlb: [
      {
        id: 'mock-mlb-1',
        sport: 'MLB',
        homeTeam: 'New York Yankees',
        awayTeam: 'Boston Red Sox',
        startTime: new Date(Date.now() + 86400000).toISOString(),
        bookmakers: [{
          name: 'draftkings',
          markets: [
            {
              type: 'h2h',
              outcomes: [
                { name: 'New York Yankees', price: -130 },
                { name: 'Boston Red Sox', price: +110 }
              ]
            },
            {
              type: 'totals',
              outcomes: [
                { name: 'Over', price: -110, point: 8.5 },
                { name: 'Under', price: -110, point: 8.5 }
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

export default router;
