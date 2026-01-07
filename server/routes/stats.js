import { Router } from 'express';
import { optionalAuth } from '../middleware/auth.js';
import {
  getTeams,
  getTeamStats,
  searchPlayers,
  getPlayerStats,
  getNhlRoster
} from '../services/statsService.js';

const router = Router();

const SUPPORTED_SPORTS = ['nba', 'nhl'];

// Get teams for a sport
router.get('/:sport/teams', optionalAuth, async (req, res) => {
  try {
    const { sport } = req.params;

    if (!SUPPORTED_SPORTS.includes(sport.toLowerCase())) {
      return res.status(400).json({
        error: `Invalid sport. Supported: ${SUPPORTED_SPORTS.join(', ')}`
      });
    }

    const data = await getTeams(sport);
    res.json(data);
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Get team stats
router.get('/:sport/team/:teamId', optionalAuth, async (req, res) => {
  try {
    const { sport, teamId } = req.params;

    if (!SUPPORTED_SPORTS.includes(sport.toLowerCase())) {
      return res.status(400).json({
        error: `Invalid sport. Supported: ${SUPPORTED_SPORTS.join(', ')}`
      });
    }

    const data = await getTeamStats(sport, teamId);
    res.json(data);
  } catch (error) {
    console.error('Get team stats error:', error);
    res.status(500).json({ error: 'Failed to fetch team stats' });
  }
});

// Get NHL roster (NHL-specific)
router.get('/nhl/roster/:teamAbbr', optionalAuth, async (req, res) => {
  try {
    const { teamAbbr } = req.params;
    const data = await getNhlRoster(teamAbbr);
    res.json(data);
  } catch (error) {
    console.error('Get NHL roster error:', error);
    res.status(500).json({ error: 'Failed to fetch roster' });
  }
});

// Search players
router.get('/:sport/players', optionalAuth, async (req, res) => {
  try {
    const { sport } = req.params;
    const { search } = req.query;

    if (!SUPPORTED_SPORTS.includes(sport.toLowerCase())) {
      return res.status(400).json({
        error: `Invalid sport. Supported: ${SUPPORTED_SPORTS.join(', ')}`
      });
    }

    if (!search || search.length < 2) {
      return res.status(400).json({
        error: 'Search query must be at least 2 characters'
      });
    }

    const data = await searchPlayers(sport, search);
    res.json(data);
  } catch (error) {
    console.error('Search players error:', error);
    res.status(500).json({ error: 'Failed to search players' });
  }
});

// Get player stats
router.get('/:sport/player/:playerId', optionalAuth, async (req, res) => {
  try {
    const { sport, playerId } = req.params;

    if (!SUPPORTED_SPORTS.includes(sport.toLowerCase())) {
      return res.status(400).json({
        error: `Invalid sport. Supported: ${SUPPORTED_SPORTS.join(', ')}`
      });
    }

    const data = await getPlayerStats(sport, playerId);
    res.json(data);
  } catch (error) {
    console.error('Get player stats error:', error);
    res.status(500).json({ error: 'Failed to fetch player stats' });
  }
});

export default router;
