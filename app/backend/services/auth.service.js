const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const UserRepository = require('../repositories/user.repository')

class AuthService {
  constructor() {
    this.userRepo = new UserRepository()
  }

  async register(userData) {
    const { name, email, password } = userData

    if (!name || !email || !password) {
      throw new Error('All fields required')
    }

    const existingUser = await this.userRepo.findByEmail(email)
    if (existingUser) {
      throw new Error('Email already registered')
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    
    const user = await this.userRepo.create({
      name,
      email,
      password: hashedPassword
    })

    const token = jwt.sign(
      { userId: user.id }, 
      process.env.JWT_SECRET, 
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    )

    return {
      token,
      user: { id: user.id, email: user.email, name: user.name }
    }
  }

  async login(email, password) {
    if (!email || !password) {
      throw new Error('Email and password required')
    }

    const user = await this.userRepo.findByEmail(email)
    if (!user) {
      throw new Error('Invalid email or password')
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      throw new Error('Invalid email or password')
    }

    const token = jwt.sign(
      { userId: user.id }, 
      process.env.JWT_SECRET, 
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    )
    
    const { password: _pw, ...safeUser } = user
    return { token, user: safeUser }
  }

  async verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET)
    } catch (error) {
      throw new Error('Invalid token')
    }
  }

  async getUserById(userId) {
    const user = await this.userRepo.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }
    const { password: _pw, ...safeUser } = user
    return safeUser
  }
}

module.exports = AuthService
