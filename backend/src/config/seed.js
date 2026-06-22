const db = require('./database');
const runMigrations = require('./migrate');

runMigrations();

const customers = [
  { name: 'Ravi Kumar', mobile: '9876543210', pan: 'ABCDE1234F', score: 620 },
  { name: 'Priya Sharma', mobile: '9876543211', pan: 'FGHIJ5678K', score: 750 },
  { name: 'Amit Patel', mobile: '9876543212', pan: 'KLMNO9012P', score: 580 },
  { name: 'Sneha Reddy', mobile: '9876543213', pan: 'QRSTU3456V', score: 690 },
  { name: 'Vikram Singh', mobile: '9876543214', pan: 'WXYZA7890B', score: 480 }
];

const gapTemplates = [
  { factor: 'Credit utilisation', current: '87%', ideal: 'below 30%', impact: 'high', gain: 35, action: 'Pay down your HDFC credit card from ₹43,500 to below ₹15,000' },
  { factor: 'Missed EMI', current: '2 missed in 2023', ideal: '0 missed', impact: 'high', gain: 25, action: 'Clear overdue amount of ₹4,200 on Bajaj Finserv loan' },
  { factor: 'Credit age', current: '1.2 years', ideal: '3+ years', impact: 'medium', gain: 10, action: 'Avoid closing your oldest credit card' },
  { factor: 'Written-off account', current: '1 account', ideal: '0 accounts', impact: 'high', gain: 40, action: 'Settle written-off account with IDBI Bank' },
  { factor: 'Hard enquiries', current: '5 in 6 months', ideal: '≤3', impact: 'medium', gain: 10, action: 'Avoid applying for new credit for 6 months' },
  { factor: 'Default history', current: '1 account', ideal: '0 accounts', impact: 'high', gain: 30, action: 'Settle defaulted personal loan with Tata Capital' }
];

const offerTemplates = [
  { lender: 'HDFC Bank', amount: 500000, rate: 10.5, tenure: 36, minScore: 700 },
  { lender: 'Bajaj Finserv', amount: 300000, rate: 13.0, tenure: 24, minScore: 620 },
  { lender: 'ICICI Bank', amount: 750000, rate: 11.0, tenure: 48, minScore: 720 },
  { lender: 'SBI', amount: 250000, rate: 9.8, tenure: 60, minScore: 650 },
  { lender: 'Axis Bank', amount: 1000000, rate: 10.2, tenure: 36, minScore: 750 },
  { lender: 'Kotak Mahindra', amount: 400000, rate: 14.5, tenure: 24, minScore: 600 },
  { lender: 'Yes Bank', amount: 150000, rate: 15.0, tenure: 12, minScore: 550 }
];

const insertCustomer = db.prepare(
  'INSERT OR IGNORE INTO customers (name, mobile, pan, cibil_score, score_fetched_at) VALUES (?, ?, ?, ?, datetime(\'now\'))'
);
const insertGap = db.prepare(
  'INSERT INTO credit_gaps (customer_id, factor, current_value, ideal_value, impact, estimated_score_gain, action_description) VALUES (?, ?, ?, ?, ?, ?, ?)'
);
const insertOffer = db.prepare(
  'INSERT INTO offers (customer_id, lender, amount, interest_rate, tenure_months, min_score_required) VALUES (?, ?, ?, ?, ?, ?)'
);

db.exec('DELETE FROM offers; DELETE FROM credit_gaps; DELETE FROM customers;');

for (const c of customers) {
  insertCustomer.run(c.name, c.mobile, c.pan, c.score);
}

const customerRows = db.prepare('SELECT id, cibil_score FROM customers ORDER BY id').all();

for (const cr of customerRows) {
  const score = cr.cibil_score;
  const gapsForThisCustomer = gapTemplates.filter(() => {
    if (score >= 700) return Math.random() < 0.2;
    if (score >= 600) return Math.random() < 0.5;
    return Math.random() < 0.8;
  });

  for (const g of gapsForThisCustomer) {
    insertGap.run(cr.id, g.factor, g.current, g.ideal, g.impact, g.gain, g.action);
  }

  const offersForThisCustomer = offerTemplates.filter(() => Math.random() < 0.7);
  for (const o of offersForThisCustomer) {
    insertOffer.run(cr.id, o.lender, o.amount, o.rate, o.tenure, o.minScore);
  }
}

console.log(`Seeded ${customerRows.length} customers with gaps and offers.`);

if (require.main === module) {
  process.exit(0);
}
