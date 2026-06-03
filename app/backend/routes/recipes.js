const express = require('express')
const router = express.Router()
const { authMiddleware } = require('../middleware/auth.middleware')
const { prisma } = require('../prisma.config')

// GET /api/recipes - get all saved recipes for user
router.get('/', authMIddleware, async (req, res) => {
  try {
    const recipes = await prisma.recipe.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    })
    res.json(recipes)
  } catch (err) {
    console.error('Get recipes error:', err.message)
    res.status(500).json({ error: 'Failed to fetch recipes' })
  }
})

// GET /api/recipes/:id - get a single recipe
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const recipe = await prisma.recipe.findUnique({ where: { id: req.params.id } })
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' })
    if (recipe.userId !== req.userId) return res.status(403).json({ error: 'Not authorized' })
    res.json(recipe)
  } catch (err) {
    console.error('Get recipe error:', err.message)
    res.status(500).json({ error: 'Failed to fetch recipe' })
  }
})

// POST /api/recipes - save a new recipe
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, ingredients, instructions, calories, protein, carbs, fat, imageUrl } = req.body
    if (!title || !ingredients || !instructions)
      return res.status(400).json({ error: 'title, ingredients, and instructions are required' })

    const recipe = await prisma.recipe.create({
      data: {
        userId: req.userId,
        title,
        ingredients,
        instructions,
        calories: calories ? parseFloat(calories) : null,
        protein: protein ? parseFloat(protein) : null,
        carbs: carbs ? parseFloat(carbs) : null,
        fat: fat ? parseFloat(fat) : null,
        imageUrl: imageUrl || null
      }
    })
    res.status(201).json(recipe)
  } catch (err) {
    console.error('Create recipe error:', err.message)
    res.status(500).json({ error: 'Failed to save recipe' })
  }
})

// PUT /api/recipes/:id - update a recipe
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await prisma.recipe.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ error: 'Recipe not found' })
    if (existing.userId !== req.userId) return res.status(403).json({ error: 'Not authorized' })

    const { title, ingredients, instructions, calories, protein, carbs, fat, imageUrl } = req.body

    const updated = await prisma.recipe.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(ingredients && { ingredients }),
        ...(instructions && { instructions }),
        ...(calories !== undefined && { calories: parseFloat(calories) }),
        ...(protein !== undefined && { protein: parseFloat(protein) }),
        ...(carbs !== undefined && { carbs: parseFloat(carbs) }),
        ...(fat !== undefined && { fat: parseFloat(fat) }),
        ...(imageUrl !== undefined && { imageUrl })
      }
    })
    res.json(updated)
  } catch (err) {
    console.error('Update recipe error:', err.message)
    res.status(500).json({ error: 'Failed to update recipe' })
  }
})

// DELETE /api/recipes/:id - delete a recipe
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const recipe = await prisma.recipe.findUnique({ where: { id: req.params.id } })
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' })
    if (recipe.userId !== req.userId) return res.status(403).json({ error: 'Not authorized' })

    await prisma.recipe.delete({ where: { id: req.params.id } })
    res.json({ message: 'Recipe deleted' })
  } catch (err) {
    console.error('Delete recipe error:', err.message)
    res.status(500).json({ error: 'Failed to delete recipe' })
  }
})

module.exports = router
