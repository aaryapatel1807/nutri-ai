const AuthService = require('../services/auth.service')

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      })
    }

    const authService = new AuthService()
    const decoded = await authService.verifyToken(token)
    req.userId = decoded.userId
    
    next()
  } catch (error) {
    console.log('Auth middleware error:', error.message)
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    })
  }
}

const rateLimit = require('express-rate-limit')

const rateLimitMiddleware = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    message: {
      success: false,
      error: 'Too many requests',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
  })
}

// Per-user variant — keys on the authenticated userId (falls back to IP for
// unauthenticated callers). Must be mounted AFTER authMiddleware so req.userId
// is set. NOTE: express-rate-limit's default store is in-memory, which is
// best-effort on serverless (cold starts reset it). It still blunts bursts
// against warm instances; the DB-backed daily quota in routes/mlProxy.js is
// the hard guarantee for the AI free tier.
const userRateLimitMiddleware = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    keyGenerator: (req) => req.userId || req.ip,
    message: {
      success: false,
      error: 'Too many requests — please slow down',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
  })
}

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err)

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(400).json({
      success: false,
      error: 'Unique constraint violation'
    })
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: 'Record not found'
    })
  }

  // Default error
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  })
}

module.exports = {
  authMiddleware,
  rateLimitMiddleware,
  userRateLimitMiddleware,
  errorHandler
}
