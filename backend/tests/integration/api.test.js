const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const request = require('supertest');

const dbFile = path.join(__dirname, '..', '..', 'data', 'test-int.db');
process.env.DB_PATH = './data/test-int.db';
process.env.RATE_LIMIT_MAX = '1000';

if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);

let app;

describe('API Integration Tests', () => {
  before(() => {
    app = require('../../src/app');
  });

  after(() => {
    try { fs.unlinkSync(dbFile); } catch {}
  });

  it('GET /health returns 200 with status', async () => {
    const res = await request(app).get('/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
    assert.equal(res.body.service, 'softlend-api');
    assert.ok(res.body.timestamp);
    assert.ok(res.body.uptime);
    assert.equal(res.body.database, 'ok');
  });

  it('GET /api/docs redirects to Swagger UI', async () => {
    const res = await request(app).get('/api/docs/');
    assert.equal(res.status, 200);
    assert.ok(res.text.includes('swagger'));
  });

  it('POST /api/v1/customers creates a customer', async () => {
    const res = await request(app)
      .post('/api/v1/customers')
      .send({ name: 'Integration Test', mobile: '1111111111', pan: 'ABCDE1234F' });
    assert.equal(res.status, 201);
    assert.equal(res.body.name, 'Integration Test');
    assert.ok(res.body.id);
  });

  it('POST /api/v1/customers rejects duplicate mobile', async () => {
    const res = await request(app)
      .post('/api/v1/customers')
      .send({ name: 'Duplicate', mobile: '1111111111', pan: 'FGHIJ5678K' });
    assert.equal(res.status, 409);
    assert.equal(res.body.code, 'DUPLICATE_MOBILE');
  });

  it('POST /api/v1/customers rejects invalid PAN', async () => {
    const res = await request(app)
      .post('/api/v1/customers')
      .send({ name: 'Bad PAN', mobile: '2222222222', pan: 'INVALID' });
    assert.equal(res.status, 400);
    assert.equal(res.body.code, 'VALIDATION_ERROR');
  });

  it('POST /api/v1/customers/:id/credit-score updates score', async () => {
    const customer = await request(app)
      .post('/api/v1/customers')
      .send({ name: 'Score Test', mobile: '3333333333', pan: 'KLMNO9012P' });

    const res = await request(app)
      .post(`/api/v1/customers/${customer.body.id}/credit-score`)
      .send({ cibil_score: 720 });
    assert.equal(res.status, 200);
    assert.equal(res.body.cibil_score, 720);
  });

  it('POST /api/v1/customers/:id/credit-gaps adds a gap', async () => {
    const customer = await request(app)
      .post('/api/v1/customers')
      .send({ name: 'Gap Test', mobile: '4444444444', pan: 'QRSTU3456V' });

    const res = await request(app)
      .post(`/api/v1/customers/${customer.body.id}/credit-gaps`)
      .send({
        factor: 'Credit utilisation',
        current_value: '87%',
        ideal_value: 'below 30%',
        impact: 'high',
        estimated_score_gain: 35,
        action_description: 'Pay down credit card'
      });
    assert.equal(res.status, 201);
    assert.equal(res.body.status, 'open');
  });

  it('GET /api/v1/customers/:id/credit-profile returns profile', async () => {
    const customer = await request(app)
      .post('/api/v1/customers')
      .send({ name: 'Profile Test', mobile: '5555555555', pan: 'WXYZA7890B' });

    await request(app)
      .post(`/api/v1/customers/${customer.body.id}/credit-score`)
      .send({ cibil_score: 680 });

    const res = await request(app)
      .get(`/api/v1/customers/${customer.body.id}/credit-profile`);
    assert.equal(res.status, 200);
    assert.equal(res.body.customer_id, customer.body.id);
    assert.ok(res.body.potential_score >= 680);
    assert.ok(Array.isArray(res.body.gaps));
  });

  it('POST /api/v1/customers/:id/offers creates an offer', async () => {
    const customer = await request(app)
      .post('/api/v1/customers')
      .send({ name: 'Offer Test', mobile: '6666666666', pan: 'BCDEF1234G' });

    const res = await request(app)
      .post(`/api/v1/customers/${customer.body.id}/offers`)
      .send({ lender: 'HDFC Bank', amount: 500000, interest_rate: 10.5, tenure_months: 36 });
    assert.equal(res.status, 201);
    assert.equal(res.body.lender, 'HDFC Bank');
    assert.equal(res.body.status, 'pending');
  });

  it('GET /api/v1/customers/:id/offers returns gated offers', async () => {
    const customer = await request(app)
      .post('/api/v1/customers')
      .send({ name: 'List Offers', mobile: '7777777777', pan: 'CDEFG2345H' });

    await request(app)
      .post(`/api/v1/customers/${customer.body.id}/offers`)
      .send({ lender: 'HDFC', amount: 500000, interest_rate: 10.5, tenure_months: 36, min_score_required: 700 });
    await request(app)
      .post(`/api/v1/customers/${customer.body.id}/offers`)
      .send({ lender: 'Bajaj', amount: 300000, interest_rate: 13, tenure_months: 24, min_score_required: 500 });

    const res = await request(app)
      .get(`/api/v1/customers/${customer.body.id}/offers`);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    res.body.forEach(o => {
      assert.ok('locked' in o);
      assert.ok('score_gap' in o);
    });
  });

  it('PATCH /api/v1/offers/:id/status rejects locked offers', async () => {
    const customer = await request(app)
      .post('/api/v1/customers')
      .send({ name: 'Locked Test', mobile: '8888888888', pan: 'DEFGH3456I' });

    await request(app)
      .post(`/api/v1/customers/${customer.body.id}/credit-score`)
      .send({ cibil_score: 620 });

    const offer = await request(app)
      .post(`/api/v1/customers/${customer.body.id}/offers`)
      .send({ lender: 'HDFC', amount: 500000, interest_rate: 10.5, tenure_months: 36, min_score_required: 700 });

    const res = await request(app)
      .patch(`/api/v1/offers/${offer.body.id}/status`)
      .send({ status: 'active' });
    assert.equal(res.status, 422);
    assert.equal(res.body.code, 'OFFER_LOCKED');
  });

  it('GET /api/v1/offers/:id/emi calculates correctly', async () => {
    const customer = await request(app)
      .post('/api/v1/customers')
      .send({ name: 'EMI Test', mobile: '9999999999', pan: 'EFGHI4567J' });

    const offer = await request(app)
      .post(`/api/v1/customers/${customer.body.id}/offers`)
      .send({ lender: 'Test', amount: 500000, interest_rate: 10.5, tenure_months: 36 });

    const res = await request(app)
      .get(`/api/v1/offers/${offer.body.id}/emi`);
    assert.equal(res.status, 200);
    assert.ok(res.body.monthly_emi > 0);
    assert.equal(res.body.principal, 500000);
  });

  it('404 routes return consistent error', async () => {
    const res = await request(app).get('/api/v1/nonexistent');
    assert.equal(res.status, 404);
    assert.equal(res.body.code, 'ROUTE_NOT_FOUND');
  });

  it('X-Request-ID header is set on responses', async () => {
    const res = await request(app).get('/health');
    assert.ok(res.headers['x-request-id']);
  });
});
