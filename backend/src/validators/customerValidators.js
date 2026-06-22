const { body, param } = require('express-validator');

const createCustomer = [
  body('name')
    .trim().notEmpty().withMessage('Name is required'),
  body('mobile')
    .trim().notEmpty().withMessage('Mobile is required')
    .matches(/^\d{10}$/).withMessage('Mobile must be exactly 10 digits'),
  body('pan')
    .trim().notEmpty().withMessage('PAN is required')
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).withMessage('PAN must match format: ABCDE1234F')
];

const updateCreditScore = [
  param('id').isInt({ min: 1 }).withMessage('Customer ID must be a positive integer'),
  body('cibil_score')
    .isInt({ min: 300, max: 900 }).withMessage('CIBIL score must be between 300 and 900')
];

const addCreditGap = [
  param('id').isInt({ min: 1 }).withMessage('Customer ID must be a positive integer'),
  body('factor').trim().notEmpty().withMessage('Factor is required'),
  body('current_value').trim().notEmpty().withMessage('Current value is required'),
  body('ideal_value').trim().notEmpty().withMessage('Ideal value is required'),
  body('impact')
    .isIn(['high', 'medium', 'low']).withMessage('Impact must be high, medium, or low'),
  body('estimated_score_gain')
    .isInt({ min: 0 }).withMessage('Estimated score gain must be a non-negative integer'),
  body('action_description').trim().notEmpty().withMessage('Action description is required')
];

const customerIdParam = [
  param('id').isInt({ min: 1 }).withMessage('Customer ID must be a positive integer')
];

const createOffer = [
  param('id').isInt({ min: 1 }).withMessage('Customer ID must be a positive integer'),
  body('lender').trim().notEmpty().withMessage('Lender is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('interest_rate').isFloat({ min: 0 }).withMessage('Interest rate must be a positive number'),
  body('tenure_months').isInt({ min: 1 }).withMessage('Tenure months must be a positive integer'),
  body('min_score_required')
    .optional().isInt({ min: 300, max: 900 }).withMessage('Min score must be between 300 and 900')
];

const resolveGap = [
  param('id').isInt({ min: 1 }).withMessage('Gap ID must be a positive integer')
];

const updateOfferStatus = [
  param('id').isInt({ min: 1 }).withMessage('Offer ID must be a positive integer'),
  body('status')
    .isIn(['active', 'disbursed']).withMessage('Status must be active or disbursed')
];

const emiParam = [
  param('id').isInt({ min: 1 }).withMessage('Offer ID must be a positive integer')
];

module.exports = {
  createCustomer,
  updateCreditScore,
  addCreditGap,
  customerIdParam,
  createOffer,
  resolveGap,
  updateOfferStatus,
  emiParam
};
