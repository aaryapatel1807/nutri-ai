const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth.middleware')
const { prisma } = require('../prisma.config')

// GET /api/posts - get all posts (community feed)
router.get('/', auth, async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        user: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })
    res.json(posts)
  } catch (err) {
    console.error('Get posts error:', err.message)
    res.status(500).json({ error: 'Failed to fetch posts' })
  }
})

// GET /api/posts/mine - get current user's posts
router.get('/mine', auth, async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    })
    res.json(posts)
  } catch (err) {
    console.error('Get my posts error:', err.message)
    res.status(500).json({ error: 'Failed to fetch posts' })
  }
})

// POST /api/posts - create a post
router.post('/', auth, async (req, res) => {
  try {
    const { content, image } = req.body
    if (!content) return res.status(400).json({ error: 'Content is required' })

    const post = await prisma.post.create({
      data: { userId: req.userId, content, image: image || null }
    })
    res.status(201).json(post)
  } catch (err) {
    console.error('Create post error:', err.message)
    res.status(500).json({ error: 'Failed to create post' })
  }
})

// POST /api/posts/:id/like - like a post
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await prisma.post.update({
      where: { id: req.params.id },
      data: { likes: { increment: 1 } }
    })
    res.json(post)
  } catch (err) {
    console.error('Like post error:', err.message)
    res.status(500).json({ error: 'Failed to like post' })
  }
})

// DELETE /api/posts/:id - delete a post (only own posts)
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await prisma.post.findUnique({ where: { id: req.params.id } })
    if (!post) return res.status(404).json({ error: 'Post not found' })
    if (post.userId !== req.userId) return res.status(403).json({ error: 'Not your post' })

    await prisma.post.delete({ where: { id: req.params.id } })
    res.json({ message: 'Post deleted' })
  } catch (err) {
    console.error('Delete post error:', err.message)
    res.status(500).json({ error: 'Failed to delete post' })
  }
})

module.exports = router
