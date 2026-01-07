import { Router } from 'express';
import { optionalAuth } from '../middleware/auth.js';
import {
  fetchOddsForSport,
  fetchGameOdds,
  getSupportedSports,
  getMockOdds
} from '../services/oddsService.js';

const router = Router();

// Get upcoming games with odds for a sport
router.get('/:sport', optionalAuth, async (req, res) => {
  try {
    const { sport } = req.params;
    const supportedSports = getSupportedSports();

    if (!supportedSports.includes(sport.toLowerCase())) {
      return res.status(400).json({
        error: `Invalid sport. Supported: ${supportedSports.join(', ')}`
      });
    }

    const data = await fetchOddsForSport(sport);
    res.json(data);
  } catch (error) {
    console.error('Odds fetch error:', error);
    if (error.code === 'RATE_LIMIT') {
      return res.status(429).json({
        error: 'rate_limit',
        message: 'API quota exceeded. Please try again later.',
        retryAfter: error.retryAfter
      });
    }
    res.status(500).json({ error: 'Failed to fetch odds' });
  }
});

// Get odds for a specific game
router.get('/:sport/:gameId', optionalAuth, async (req, res) => {
  try {
    const { sport, gameId } = req.params;
    const supportedSports = getSupportedSports();

    if (!supportedSports.includes(sport.toLowerCase())) {
      return res.status(400).json({
        error: `Invalid sport. Supported: ${supportedSports.join(', ')}`
      });
    }

    const data = await fetchGameOdds(sport, gameId);
    res.json(data);
  } catch (error) {
    console.error('Game odds fetch error:', error);
    if (error.code === 'RATE_LIMIT') {
      return res.status(429).json({
        error: 'rate_limit',
        message: 'API quota exceeded. Please try again later.',
        retryAfter: error.retryAfter
      });
    }
    res.status(500).json({ error: 'Failed to fetch game odds' });
  }
});

export default router;
