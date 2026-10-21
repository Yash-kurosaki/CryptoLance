/**
 * Lightweight request body validation helpers.
 * Each function returns { valid: boolean, message?: string }
 */

/**
 * Assert that all required keys are present and non-empty in req.body.
 * @param {string[]} fields
 * @returns Express middleware
 */
function requireFields(...fields) {
  return (req, res, next) => {
    const missing = fields.filter(
      (f) => req.body[f] === undefined || req.body[f] === null || req.body[f] === ''
    );
    if (missing.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missing.join(', ')}`,
      });
    }
    next();
  };
}

/**
 * Assert that all required query params are present.
 * @param {string[]} params
 * @returns Express middleware
 */
function requireQuery(...params) {
  return (req, res, next) => {
    const missing = params.filter(
      (p) => req.query[p] === undefined || req.query[p] === ''
    );
    if (missing.length > 0) {
      return res.status(400).json({
        error: `Missing required query parameters: ${missing.join(', ')}`,
      });
    }
    next();
  };
}

module.exports = { requireFields, requireQuery };
