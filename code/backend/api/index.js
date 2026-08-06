// Vercel serverless entry point
// All requests are routed here by vercel.json
require('dotenv').config();
const app = require('../src/app');

module.exports = app;
