// got this from /routes/myEvents.js
const {wantsJson} = require('../utils/validation');

module.exports = function requireLogin(req, res, next) {
  if (req.user) return next();
  if (wantsJson(req)) return res.status(401).json({error: 'Authentication required.'});
  const nextUrl = encodeURIComponent(req.originalUrl || '/');
  return res.redirect(`/login?next=${nextUrl}`);
};
