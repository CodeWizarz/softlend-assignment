const db = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

const customerService = {
  create({ name, mobile, pan }) {
    const existing = db.prepare('SELECT id FROM customers WHERE mobile = ?').get(mobile);
    if (existing) {
      throw new AppError('Mobile number already exists', 'DUPLICATE_MOBILE', 409);
    }

    const stmt = db.prepare(
      'INSERT INTO customers (name, mobile, pan) VALUES (?, ?, ?)'
    );
    const result = stmt.run(name, mobile, pan);
    return { id: result.lastInsertRowid, name, mobile };
  },

  getById(id) {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    if (!customer) {
      throw new AppError('Customer not found', 'CUSTOMER_NOT_FOUND', 404);
    }
    return customer;
  },

  updateCreditScore(id, cibilScore) {
    const customer = this.getById(id);
    db.prepare(
      'UPDATE customers SET cibil_score = ?, score_fetched_at = datetime(\'now\') WHERE id = ?'
    ).run(cibilScore, id);
    return { ...customer, cibil_score: cibilScore, score_fetched_at: new Date().toISOString() };
  }
};

module.exports = customerService;
