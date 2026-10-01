const jwt = require('jsonwebtoken')

// NOTE (2026-10-01 security fix): the register()/login() methods that used to
// live here were dead code — routes/auth.js implements auth inline and no
// route ever mounted AuthController. They were removed to avoid two competing
// auth policies. Only token verification (used by authMiddleware) remains.
class AuthService {
  async verifyToken(token) {
    try {
      // Pin the algorithm: the client must not be able to downgrade or swap
      // it (e.g. none/RS256 confusion attacks).
      return jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] })
    } catch (error) {
      throw new Error('Invalid token')
    }
  }

  async getUserById(userId) {
    const { prisma } = require('../prisma.config')
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new Error('User not found')
    }
    const { password: _pw, ...safeUser } = user
    return safeUser
  }
}

module.exports = AuthService
