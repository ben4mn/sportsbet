import { Router } from 'express';
import { optionalAuth } from '../middleware/auth.js';
import { getDatabase } from '../db/database.js';
import { generateSuggestions, analyzeParlay } from '../services/claudeService.js';

const router = Router();

// Get daily suggestions
router.get('/daily', optionalAuth, async (req, res) => {
  try {
    let preferences = null;

    if (req.user) {
      const db = getDatabase();
      const prefs = db.prepare('SELECT * FROM preferences WHERE user_id = ?')
        .get(req.user.userId);

      if (prefs) {
        preferences = {
          favoriteTeams: JSON.parse(prefs.favorite_teams || '[]'),
          betTypes: JSON.parse(prefs.bet_types || '[]'),
          riskTolerance: prefs.risk_tolerance
        };
      }
    }

    // Generate suggestions based on preferences
    const suggestions = await generateSuggestions(preferences);

    res.json({
      suggestions,
      generatedAt: new Date().toISOString(),
      disclaimer: 'These are AI-generated suggestions for RESEARCH ONLY. Not financial advice.'
    });
  } catch (error) {
    console.error('Daily suggestions error:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

// Analyze a custom parlay
router.post('/analyze', optionalAuth, async (req, res) => {
  try {
    const { legs } = req.body;

    if (!legs || legs.length < 2) {
      return res.status(400).json({
        error: 'At least 2 legs required for analysis'
      });
    }

    const analysis = await analyzeParlay(legs);

    // Save to history if logged in
    if (req.user) {
      const db = getDatabase();
      db.prepare(`
        INSERT INTO suggestions (user_id, parlay_data, ai_analysis)
        VALUES (?, ?, ?)
      `).run(req.user.userId, JSON.stringify(legs), analysis);
    }

    res.json({
      analysis,
      disclaimer: 'This analysis is for RESEARCH ONLY. Not financial or betting advice.'
    });
  } catch (error) {
    console.error('Analyze parlay error:', error);
    res.status(500).json({ error: 'Failed to analyze parlay' });
  }
});

export default router;
