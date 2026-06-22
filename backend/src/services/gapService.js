const db = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const customerService = require('./customerService');

const gapService = {
  addGap(customerId, gapData) {
    customerService.getById(customerId);
    const stmt = db.prepare(
      `INSERT INTO credit_gaps (customer_id, factor, current_value, ideal_value, impact, estimated_score_gain, action_description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    const result = stmt.run(
      customerId, gapData.factor, gapData.current_value,
      gapData.ideal_value, gapData.impact,
      gapData.estimated_score_gain, gapData.action_description
    );
    return { id: result.lastInsertRowid, factor: gapData.factor, status: 'open' };
  },

  resolveGap(gapId) {
    const gap = db.prepare('SELECT * FROM credit_gaps WHERE id = ?').get(gapId);
    if (!gap) {
      throw new AppError('Credit gap not found', 'GAP_NOT_FOUND', 404);
    }
    if (gap.status === 'resolved') {
      throw new AppError('Credit gap is already resolved', 'GAP_ALREADY_RESOLVED', 422);
    }
    db.prepare(
      'UPDATE credit_gaps SET status = \'resolved\', resolved_at = datetime(\'now\') WHERE id = ?'
    ).run(gapId);
    return { id: gapId, factor: gap.factor, status: 'resolved', resolved_at: new Date().toISOString() };
  },

  getCustomerGaps(customerId) {
    customerService.getById(customerId);
    return db.prepare('SELECT * FROM credit_gaps WHERE customer_id = ? ORDER BY created_at DESC').all(customerId);
  },

  getCreditProfile(customerId) {
    const customer = customerService.getById(customerId);
    const gaps = db.prepare(
      'SELECT * FROM credit_gaps WHERE customer_id = ? ORDER BY created_at DESC'
    ).all(customerId);

    const openGaps = gaps.filter(g => g.status === 'open');
    const resolvedGaps = gaps.filter(g => g.status === 'resolved');
    const potentialScore = (customer.cibil_score || 0) +
      openGaps.reduce((sum, g) => sum + g.estimated_score_gain, 0);

    return {
      customer_id: customer.id,
      name: customer.name,
      cibil_score: customer.cibil_score,
      score_fetched_at: customer.score_fetched_at,
      potential_score: potentialScore,
      gaps: gaps.map(g => ({
        id: g.id,
        factor: g.factor,
        impact: g.impact,
        estimated_score_gain: g.estimated_score_gain,
        action_description: g.action_description,
        status: g.status
      })),
      open_gaps: openGaps.length,
      resolved_gaps: resolvedGaps.length
    };
  },

  getImprovementSummary(customerId) {
    const customer = customerService.getById(customerId);
    const gaps = db.prepare('SELECT * FROM credit_gaps WHERE customer_id = ?').all(customerId);

    const resolvedGaps = gaps.filter(g => g.status === 'resolved');
    const openGaps = gaps.filter(g => g.status === 'open');

    const pointsRecovered = resolvedGaps.reduce((s, g) => s + g.estimated_score_gain, 0);
    const remainingPotential = openGaps.reduce((s, g) => s + g.estimated_score_gain, 0);

    return {
      customer_id: customer.id,
      name: customer.name,
      current_score: customer.cibil_score,
      total_gaps: gaps.length,
      resolved_gaps: resolvedGaps.length,
      open_gaps: openGaps.length,
      points_recovered_so_far: pointsRecovered,
      remaining_potential_gain: remainingPotential,
      projected_score: (customer.cibil_score || 0) + remainingPotential,
      resolved: resolvedGaps.map(g => ({
        id: g.id,
        factor: g.factor,
        estimated_score_gain: g.estimated_score_gain,
        resolved_at: g.resolved_at
      })),
      pending: openGaps.map(g => ({
        id: g.id,
        factor: g.factor,
        impact: g.impact,
        estimated_score_gain: g.estimated_score_gain,
        action_description: g.action_description
      }))
    };
  }
};

module.exports = gapService;
