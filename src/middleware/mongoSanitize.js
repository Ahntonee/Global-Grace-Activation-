const { sanitize } = require("express-mongo-sanitize");

/*
 * express-mongo-sanitize's own middleware() wrapper does `req.query = target`
 * after sanitizing — harmless on Express 4, but Express 5 made `req.query` a
 * getter-only property, so that reassignment throws
 * "Cannot set property query of #<IncomingMessage> which has only a getter"
 * on every single request.
 *
 * The package's exported `sanitize()` helper already mutates the object in
 * place and returns the same reference, so we only need its side effect —
 * never reassign `req.query` (body/params are safely reassignable, but for
 * consistency we mutate all three in place the same way).
 */
module.exports = function mongoSanitizeSafe(options = {}) {
  return (req, res, next) => {
    if (req.body) sanitize(req.body, options);
    if (req.params) sanitize(req.params, options);
    if (req.query) sanitize(req.query, options);
    next();
  };
};
