const express = require('express')
const router = express.Router()
const axios = require('axios')
const jwt = require('jsonwebtoken')

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000'

function getUserId(req) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) throw new Error('No token')
  const { userId } = jwt.verify(token, process.env.JWT_SECRET)
  return userId
}

// POST /api/ml/detect-food
// ML service exposes: POST /detect  (with multipart file)
router.post('/detect-food', async (req, res) => {
  try {
    getUserId(req) // auth check
    const response = await axios.post(`${ML_SERVICE_URL}/detect`, {
      image: req.body.image
    })
    res.json(response.data)
  } catch (error) {
    console.error('Food detection error:', error.message)
    res.status(500).json({ error: 'Food detection failed' })
  }
})

// POST /api/ml/recipe-suggestions
// ML service exposes: POST /recipe-suggestions
router.post('/recipe-suggestions', async (req, res) => {
  try {
    getUserId(req)
    const response = await axios.post(`${ML_SERVICE_URL}/recipe-suggestions`, {
      ingredients: req.body.ingredients,
      dietary_preferences: req.body.dietary_preferences,
      meal_type: req.body.meal_type
    })
    res.json(response.data)
  } catch (error) {
    console.error('Recipe suggestions error:', error.message)
    res.status(500).json({ error: 'Recipe suggestions failed' })
  }
})

// POST /api/ml/nutrition-forecast
// ML service exposes: POST /forecast
router.post('/nutrition-forecast', async (req, res) => {
  try {
    getUserId(req)
    const response = await axios.post(`${ML_SERVICE_URL}/forecast`, {
      user_data: req.body.user_data,
      historical_data: req.body.historical_data
    })
    res.json(response.data)
  } catch (error) {
    console.error('Nutrition forecast error:', error.message)
    res.status(500).json({ error: 'Nutrition forecast failed' })
  }
})

// POST /api/ml/chat
// ML service exposes: POST /chat
router.post('/chat', async (req, res) => {
  try {
    getUserId(req)
    const response = await axios.post(`${ML_SERVICE_URL}/chat`, {
      message: req.body.message,
      history: req.body.history,
      user_data: req.body.user_data
    })
    res.json(response.data)
  } catch (error) {
    console.error('Chat error:', error.message)
    res.status(500).json({ error: 'Chat failed' })
  }
})

module.exports = router
