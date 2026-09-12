// Vercel serverless entry point.
//
// Vercel runs each request as a serverless function invocation.
// It does NOT call app.listen() — instead it imports the Express app
// and handles the HTTP lifecycle itself.
//
// We import from src/app.js (which mounts all routes and middleware)
// rather than src/server.js (which calls app.listen and connectDB).
// The database pool in src/config/db.js is created lazily on first query,
// so no explicit connect call is needed here.

const app = require('../src/app');

module.exports = app;
