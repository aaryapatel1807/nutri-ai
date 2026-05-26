const z = require('zod')
const AuthService = require('../services/auth.service')

// Validation schemas
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
})

class AuthController {
  constructor() {
    this.authService = new AuthService()
  }

  async register(req, res) {
    try {
      // Validate input
      const validatedData = registerSchema.parse(req.body)
      console.log('Register:', validatedData.email)

      const result = await this.authService.register(validatedData)
      
      res.status(201).json({
        success: true,
        data: result,
        message: 'User registered successfully'
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors
        })
      }
      
      console.log('Register error:', error.message)
      res.status(400).json({
        success: false,
        error: error.message
      })
    }
  }

  async login(req, res) {
    try {
      // Validate input
      const validatedData = loginSchema.parse(req.body)

      const result = await this.authService.login(validatedData.email, validatedData.password)
      
      res.json({
        success: true,
        data: result,
        message: 'Login successful'
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors
        })
      }
      
      console.log('Login error:', error.message)
      res.status(401).json({
        success: false,
        error: error.message
      })
    }
  }

  async getMe(req, res) {
    try {
      const userId = req.userId // Set by auth middleware
      
      const user = await this.authService.getUserById(userId)
      
      res.json({
        success: true,
        data: user
      })
    } catch (error) {
      console.log('Get user error:', error.message)
      res.status(404).json({
        success: false,
        error: error.message
      })
    }
  }

  async updateProfile(req, res) {
    try {
      const userId = req.userId
      const updateData = req.body

      // Strip sensitive fields
      delete updateData.password
      delete updateData.email
      delete updateData.id
      delete updateData.createdAt

      const user = await this.authService.userRepo.updateProfile(userId, updateData)
      
      res.json({
        success: true,
        data: user,
        message: 'Profile updated successfully'
      })
    } catch (error) {
      console.log('Profile update error:', error.message)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }
}

module.exports = AuthController
