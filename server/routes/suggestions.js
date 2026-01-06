import { Router } from 'express';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { getDatabase } from '../db/database.js';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

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

// Generate AI suggestions
async function generateSuggestions(preferences) {
  // Default suggestions without AI
  const defaultSuggestions = [
    {
      id: 'sug-1',
      name: 'Conservative Pick',
      description: 'Lower risk combination with favorites',
      legs: [
        { team: 'Example Team A', type: 'moneyline', price: -150 },
        { team: 'Example Team B', type: 'spread', point: -3.5, price: -110 }
      ],
      riskLevel: 'low',
      estimatedOdds: 2.6
    },
    {
      id: 'sug-2',
      name: 'Balanced Pick',
      description: 'Mix of favorites and slight underdogs',
      legs: [
        { team: 'Example Team C', type: 'moneyline', price: -120 },
        { team: 'Example Team D', type: 'totals', point: 'Over 45.5', price: -110 },
        { team: 'Example Team E', type: 'moneyline', price: +105 }
      ],
      riskLevel: 'medium',
      estimatedOdds: 5.2
    },
    {
      id: 'sug-3',
      name: 'Value Play',
      description: 'Higher risk, higher potential reward',
      legs: [
        { team: 'Example Team F', type: 'moneyline', price: +130 },
        { team: 'Example Team G', type: 'moneyline', price: +145 },
        { team: 'Example Team H', type: 'spread', point: +6.5, price: -105 }
      ],
      riskLevel: 'high',
      estimatedOdds: 10.8
    }
  ];

  if (!anthropic) {
    return defaultSuggestions;
  }

  try {
    const prompt = buildSuggestionsPrompt(preferences);

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    });

    const aiContent = response.content[0].text;
    // Parse AI response or return defaults
    return defaultSuggestions.map((s, i) => ({
      ...s,
      aiReasoning: aiContent.split('\n\n')[i] || 'Analysis based on current odds and trends.'
    }));
  } catch (error) {
    console.error('AI suggestions error:', error);
    return defaultSuggestions;
  }
}

// Analyze a specific parlay
async function analyzeParlay(legs) {
  if (!anthropic) {
    return `
**Parlay Analysis**

This ${legs.length}-leg parlay combines multiple bets that all must win for a payout.

**Risk Assessment**: ${legs.length <= 3 ? 'Moderate' : legs.length <= 5 ? 'High' : 'Very High'}

**Key Considerations**:
- Each additional leg significantly reduces win probability
- Consider the correlation between picks
- Check for any scheduling conflicts or injury reports

**Reminder**: This is for research purposes only. Past performance does not guarantee future results.
    `.trim();
  }

  try {
    const prompt = `Analyze this sports parlay for research purposes. Be concise.

Legs: ${JSON.stringify(legs, null, 2)}

Provide:
1. Brief risk assessment
2. Key factors to consider
3. Potential concerns

End with a reminder this is for research only, not betting advice.`;

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    });

    return response.content[0].text;
  } catch (error) {
    console.error('AI analysis error:', error);
    return 'Analysis unavailable. Please try again later.';
  }
}

function buildSuggestionsPrompt(preferences) {
  let prompt = `Generate brief analysis for 3 sports parlay suggestions (conservative, balanced, aggressive).
Focus on general betting strategy principles.

`;

  if (preferences?.favoriteTeams?.length) {
    prompt += `User's favorite teams: ${preferences.favoriteTeams.join(', ')}\n`;
  }

  if (preferences?.riskTolerance) {
    prompt += `Risk tolerance: ${preferences.riskTolerance}\n`;
  }

  prompt += `
Keep responses brief (2-3 sentences each). End with a research disclaimer.`;

  return prompt;
}

export default router;
