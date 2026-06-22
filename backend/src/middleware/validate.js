const { validationResult } = require('express-validator');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const first = errors.array()[0];
    return res.status(400).json({
      error: first.msg,
      code: 'VALIDATION_ERROR'
    });
  }
  next();
}

module.exports = validate;
