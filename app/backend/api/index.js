// Vercel serverless entrypoint — re-exports the Express app.
// server.js only calls app.listen() when run directly, so importing it here is safe.
const app = require('../server')

module.exports = app
