const BadgeService = require('../services/badge.service')

class BadgeController {
  constructor() {
    this.badgeService = new BadgeService()
  }

  async getBadges(req, res) {
    try {
      const userId = req.userId
      const badges = await this.badgeService.getAllBadges(userId)
      
      res.json({
        success: true,
        data: badges
      })
    } catch (error) {
      console.log('Get badges error:', error.message)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch badges'
      })
    }
  }

  async getBadgeProgress(req, res) {
    try {
      const userId = req.userId
      const progress = await this.badgeService.getBadgeProgress(userId)
      
      res.json({
        success: true,
        data: progress
      })
    } catch (error) {
      console.log('Get badge progress error:', error.message)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch badge progress'
      })
    }
  }

  async getUserXP(req, res) {
    try {
      const userId = req.userId
      const xpData = await this.badgeService.getUserXP(userId)
      
      res.json({
        success: true,
        data: xpData
      })
    } catch (error) {
      console.log('Get user XP error:', error.message)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user XP'
      })
    }
  }
}

module.exports = BadgeController
