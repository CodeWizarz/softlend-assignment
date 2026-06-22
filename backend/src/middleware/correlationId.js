const { AsyncLocalStorage } = require('async_hooks');
const crypto = require('crypto');

const als = new AsyncLocalStorage();

function correlationId(req, res, next) {
  const id = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-ID', id);
  als.run({ requestId: id }, () => next());
}

function getCorrelationId() {
  const store = als.getStore();
  return store ? store.requestId : null;
}

module.exports = { correlationId, getCorrelationId };
