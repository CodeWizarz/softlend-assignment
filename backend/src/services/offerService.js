const db = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const customerService = require('./customerService');

const VALID_TRANSITIONS = {
  pending: ['active'],
  active: ['disbursed'],
  disbursed: []
};

const offerService = {
  create(customerId, offerData) {
    customerService.getById(customerId);
    const stmt = db.prepare(
      `INSERT INTO offers (customer_id, lender, amount, interest_rate, tenure_months, min_score_required)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    const result = stmt.run(
      customerId, offerData.lender, offerData.amount,
      offerData.interest_rate, offerData.tenure_months,
      offerData.min_score_required || 650
    );
    return {
      id: result.lastInsertRowid,
      lender: offerData.lender,
      amount: offerData.amount,
      interest_rate: offerData.interest_rate,
      tenure_months: offerData.tenure_months,
      min_score_required: offerData.min_score_required || 650,
      status: 'pending'
    };
  },

  list(customerId, { locked } = {}) {
    const customer = customerService.getById(customerId);
    const score = customer.cibil_score || 0;
    let offers = db.prepare('SELECT * FROM offers WHERE customer_id = ?').all(customerId);

    offers = offers.map(o => {
      const locked = score < o.min_score_required;
      return {
        ...o,
        locked,
        score_gap: locked ? o.min_score_required - score : 0
      };
    });

    if (locked === 'true') {
      offers = offers.filter(o => o.locked);
    } else if (locked === 'false') {
      offers = offers.filter(o => !o.locked);
    }

    return offers;
  },

  updateStatus(offerId, newStatus) {
    const offer = db.prepare('SELECT * FROM offers WHERE id = ?').get(offerId);
    if (!offer) {
      throw new AppError('Offer not found', 'OFFER_NOT_FOUND', 404);
    }

    const allowed = VALID_TRANSITIONS[offer.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new AppError(
        `Invalid transition from ${offer.status} to ${newStatus}`,
        'INVALID_TRANSITION',
        422
      );
    }

    if (newStatus === 'active') {
      const customer = customerService.getById(offer.customer_id);
      const score = customer.cibil_score || 0;
      if (score < offer.min_score_required) {
        throw new AppError(
          `Offer is locked. Customer score ${score} is below required ${offer.min_score_required}.`,
          'OFFER_LOCKED',
          422
        );
      }
    }

    db.prepare('UPDATE offers SET status = ? WHERE id = ?').run(newStatus, offerId);
    return { ...offer, status: newStatus };
  },

  calculateEMI(offerId) {
    const offer = db.prepare('SELECT * FROM offers WHERE id = ?').get(offerId);
    if (!offer) {
      throw new AppError('Offer not found', 'OFFER_NOT_FOUND', 404);
    }

    const P = offer.amount;
    const annualRate = offer.interest_rate;
    const n = offer.tenure_months;
    const r = annualRate / 12 / 100;

    if (r === 0) {
      return {
        offer_id: offer.id,
        principal: P,
        interest_rate: annualRate,
        tenure_months: n,
        monthly_emi: Math.round(P / n * 100) / 100
      };
    }

    const emi = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    return {
      offer_id: offer.id,
      principal: P,
      interest_rate: annualRate,
      tenure_months: n,
      monthly_emi: Math.round(emi * 100) / 100
    };
  }
};

module.exports = offerService;
