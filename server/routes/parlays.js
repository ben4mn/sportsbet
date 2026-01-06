import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getDatabase } from '../db/database.js';

const router = Router();

// Get user's parlays
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const parlays = db.prepare(`
      SELECT * FROM parlays
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.user.userId);

    const formatted = parlays.map(p => ({
      id: p.id,
      name: p.name,
      legs: JSON.parse(p.legs),
      estimatedOdds: p.estimated_odds,
      estimatedPayout: p.estimated_payout,
      stake: p.stake,
      status: p.status,
      createdAt: p.created_at,
      updatedAt: p.updated_at
    }));

    res.json({ parlays: formatted });
  } catch (error) {
    console.error('Get parlays error:', error);
    res.status(500).json({ error: 'Failed to fetch parlays' });
  }
});

// Create a new parlay
router.post('/', authenticateToken, (req, res) => {
  try {
    const { name, legs, stake } = req.body;

    if (!legs || !Array.isArray(legs) || legs.length < 2) {
      return res.status(400).json({
        error: 'Parlay must have at least 2 legs'
      });
    }

    if (legs.length > 12) {
      return res.status(400).json({
        error: 'Parlay cannot have more than 12 legs'
      });
    }

    // Calculate combined odds
    const { decimalOdds, estimatedPayout } = calculateParlayOdds(legs, stake || 10);

    const db = getDatabase();
    const result = db.prepare(`
      INSERT INTO parlays (user_id, name, legs, estimated_odds, estimated_payout, stake, status)
      VALUES (?, ?, ?, ?, ?, ?, 'saved')
    `).run(
      req.user.userId,
      name || `Parlay ${new Date().toLocaleDateString()}`,
      JSON.stringify(legs),
      decimalOdds,
      estimatedPayout,
      stake || 10
    );

    res.status(201).json({
      id: result.lastInsertRowid,
      message: 'Parlay saved',
      estimatedOdds: decimalOdds,
      estimatedPayout
    });
  } catch (error) {
    console.error('Create parlay error:', error);
    res.status(500).json({ error: 'Failed to create parlay' });
  }
});

// Update a parlay
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { name, legs, stake, status } = req.body;

    const db = getDatabase();

    // Verify ownership
    const existing = db.prepare('SELECT * FROM parlays WHERE id = ? AND user_id = ?')
      .get(id, req.user.userId);

    if (!existing) {
      return res.status(404).json({ error: 'Parlay not found' });
    }

    const updatedLegs = legs || JSON.parse(existing.legs);
    const updatedStake = stake ?? existing.stake;

    const { decimalOdds, estimatedPayout } = calculateParlayOdds(updatedLegs, updatedStake);

    db.prepare(`
      UPDATE parlays SET
        name = ?,
        legs = ?,
        estimated_odds = ?,
        estimated_payout = ?,
        stake = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(
      name || existing.name,
      JSON.stringify(updatedLegs),
      decimalOdds,
      estimatedPayout,
      updatedStake,
      status || existing.status,
      id,
      req.user.userId
    );

    res.json({ message: 'Parlay updated' });
  } catch (error) {
    console.error('Update parlay error:', error);
    res.status(500).json({ error: 'Failed to update parlay' });
  }
});

// Delete a parlay
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const result = db.prepare('DELETE FROM parlays WHERE id = ? AND user_id = ?')
      .run(id, req.user.userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Parlay not found' });
    }

    res.json({ message: 'Parlay deleted' });
  } catch (error) {
    console.error('Delete parlay error:', error);
    res.status(500).json({ error: 'Failed to delete parlay' });
  }
});

// Calculate parlay odds from American odds
function calculateParlayOdds(legs, stake) {
  let decimalOdds = 1;

  for (const leg of legs) {
    const americanOdds = leg.price || leg.odds;
    let legDecimal;

    if (americanOdds > 0) {
      legDecimal = (americanOdds / 100) + 1;
    } else {
      legDecimal = (100 / Math.abs(americanOdds)) + 1;
    }

    decimalOdds *= legDecimal;
  }

  const estimatedPayout = stake * decimalOdds;

  return {
    decimalOdds: Math.round(decimalOdds * 100) / 100,
    estimatedPayout: Math.round(estimatedPayout * 100) / 100
  };
}

export default router;
