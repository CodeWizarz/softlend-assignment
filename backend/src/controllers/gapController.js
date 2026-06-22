const gapService = require('../services/gapService');

const gapController = {
  addGap(req, res, next) {
    try {
      const result = gapService.addGap(parseInt(req.params.id), req.body);
      return res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  resolveGap(req, res, next) {
    try {
      const result = gapService.resolveGap(parseInt(req.params.id));
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = gapController;
