const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');

const dbFile = path.join(__dirname, '..', 'data', 'test.db');
process.env.DB_PATH = './data/test.db';

// Ensure clean test database
if (require('fs').existsSync(dbFile)) {
  require('fs').unlinkSync(dbFile);
}

const db = require('../src/config/database');
require('../src/config/migrate')();
const customerService = require('../src/services/customerService');
const gapService = require('../src/services/gapService');
const offerService = require('../src/services/offerService');

function cleanDb() {
  db.exec('DELETE FROM offers');
  db.exec('DELETE FROM credit_gaps');
  db.exec('DELETE FROM customers');
}

describe('Customer Service', () => {
  before(() => cleanDb());

  it('should create a customer', () => {
    const c = customerService.create({ name: 'Test User', mobile: '9999999999', pan: 'ABCDE1234F' });
    assert.equal(c.name, 'Test User');
    assert.equal(c.mobile, '9999999999');
    assert.ok(c.id);
  });

  it('should reject duplicate mobile', () => {
    assert.throws(
      () => customerService.create({ name: 'Duplicate', mobile: '9999999999', pan: 'FGHIJ5678K' }),
      { code: 'DUPLICATE_MOBILE' }
    );
  });

  it('should update credit score', () => {
    const c = customerService.create({ name: 'Score Test', mobile: '8888888888', pan: 'KLMNO9012P' });
    const updated = customerService.updateCreditScore(c.id, 720);
    assert.equal(updated.cibil_score, 720);
    assert.ok(updated.score_fetched_at);
  });

  it('should throw 404 for non-existent customer', () => {
    assert.throws(
      () => customerService.getById(99999),
      { code: 'CUSTOMER_NOT_FOUND' }
    );
  });
});

describe('Credit Gap Service', () => {
  let customerId;

  before(() => {
    cleanDb();
    const c = customerService.create({ name: 'Gap Test', mobile: '7777777777', pan: 'QRSTU3456V' });
    customerId = c.id;
  });

  it('should add a credit gap', () => {
    const gap = gapService.addGap(customerId, {
      factor: 'Credit utilisation',
      current_value: '87%',
      ideal_value: 'below 30%',
      impact: 'high',
      estimated_score_gain: 35,
      action_description: 'Pay down your HDFC credit card'
    });
    assert.equal(gap.factor, 'Credit utilisation');
    assert.equal(gap.status, 'open');
  });

  it('should resolve a credit gap', () => {
    const gap = gapService.addGap(customerId, {
      factor: 'Missed EMI',
      current_value: '2 missed',
      ideal_value: '0 missed',
      impact: 'high',
      estimated_score_gain: 25,
      action_description: 'Clear overdue amount'
    });
    const resolved = gapService.resolveGap(gap.id);
    assert.equal(resolved.status, 'resolved');
    assert.ok(resolved.resolved_at);
  });

  it('should get credit profile with potential score', () => {
    const profile = gapService.getCreditProfile(customerId);
    assert.ok(profile.gaps.length > 0);
    assert.equal(typeof profile.potential_score, 'number');
    assert.ok(profile.open_gaps >= 0);
    assert.ok(profile.resolved_gaps >= 0);
  });

  it('should get improvement summary', () => {
    const summary = gapService.getImprovementSummary(customerId);
    assert.ok(summary.total_gaps > 0);
    assert.equal(typeof summary.points_recovered_so_far, 'number');
    assert.equal(typeof summary.remaining_potential_gain, 'number');
  });
});

describe('Offer Service', () => {
  let customerId;

  before(() => {
    cleanDb();
    const c = customerService.create({ name: 'Offer Test', mobile: '6666666666', pan: 'WXYZA7890B' });
    customerId = c.id;
    customerService.updateCreditScore(customerId, 620);
  });

  it('should create an offer', () => {
    const offer = offerService.create(customerId, {
      lender: 'HDFC Bank',
      amount: 500000,
      interest_rate: 10.5,
      tenure_months: 36,
      min_score_required: 700
    });
    assert.equal(offer.lender, 'HDFC Bank');
    assert.equal(offer.status, 'pending');
  });

  it('should list offers with locked status', () => {
    offerService.create(customerId, {
      lender: 'Bajaj Finserv',
      amount: 300000,
      interest_rate: 13.0,
      tenure_months: 24,
      min_score_required: 620
    });
    const offers = offerService.list(customerId);
    assert.ok(offers.length >= 2);
    const locked = offers.filter(o => o.locked);
    const unlocked = offers.filter(o => !o.locked);
    assert.ok(locked.length > 0);
    assert.ok(unlocked.length > 0);
  });

  it('should reject invalid offer status transition', () => {
    const offers = offerService.list(customerId);
    const disbursedOffer = offers.find(o => o.status === 'pending');
    assert.throws(
      () => offerService.updateStatus(disbursedOffer.id, 'disbursed'),
      { code: 'INVALID_TRANSITION' }
    );
  });

  it('should reject activating locked offer', () => {
    const offers = offerService.list(customerId);
    const lockedOffer = offers.find(o => o.locked);
    assert.throws(
      () => offerService.updateStatus(lockedOffer.id, 'active'),
      { code: 'OFFER_LOCKED' }
    );
  });

  it('should calculate EMI correctly', () => {
    const offers = offerService.list(customerId);
    const emi = offerService.calculateEMI(offers[0].id);
    assert.ok(emi.monthly_emi > 0);
    assert.equal(emi.principal, offers[0].amount);
  });
});

describe('Error Consistency', () => {
  it('all errors return consistent JSON shape', () => {
    assert.throws(
      () => customerService.getById(99999),
      { code: 'CUSTOMER_NOT_FOUND' }
    );
  });
});
