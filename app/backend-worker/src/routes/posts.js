// ─── Posts routes (Hono) ────────────────────────────────────────────────────
// Port of app/backend/routes/posts.js.

import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'

const app = new Hono()
const auth = authMiddleware()

// GET /api/posts
app.get('/', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    const posts = await prisma.post.findMany({
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return c.json(posts)
  } catch (err) {
    console.error('Get posts error:', err.message)
    return c.json({ error: 'Failed to fetch posts' }, 500)
  }
})

// GET /api/posts/mine
app.get('/mine', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    const posts = await prisma.post.findMany({
      where: { userId: c.get('userId') },
      orderBy: { createdAt: 'desc' },
    })
    return c.json(posts)
  } catch (err) {
    console.error('Get my posts error:', err.message)
    return c.json({ error: 'Failed to fetch posts' }, 500)
  }
})

// POST /api/posts
app.post('/', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    const { content, image } = await c.req.json()
    if (!content) return c.json({ error: 'Content is required' }, 400)
    const post = await prisma.post.create({
      data: { userId: c.get('userId'), content, image: image || null },
    })
    return c.json(post, 201)
  } catch (err) {
    console.error('Create post error:', err.message)
    return c.json({ error: 'Failed to create post' }, 500)
  }
})

// POST /api/posts/:id/like
app.post('/:id/like', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    const id = c.req.param('id')
    const existing = await prisma.post.findUnique({ where: { id } })
    if (!existing) return c.json({ error: 'Post not found' }, 404)
    const post = await prisma.post.update({
      where: { id },
      data: { likes: { increment: 1 } },
    })
    return c.json(post)
  } catch (err) {
    console.error('Like post error:', err.message)
    return c.json({ error: 'Failed to like post' }, 500)
  }
})

// DELETE /api/posts/:id
app.delete('/:id', auth, async (c) => {
  try {
    const prisma = c.get('prisma')
    const id = c.req.param('id')
    const post = await prisma.post.findUnique({ where: { id } })
    if (!post) return c.json({ error: 'Post not found' }, 404)
    if (post.userId !== c.get('userId')) return c.json({ error: 'Not your post' }, 403)
    await prisma.post.delete({ where: { id } })
    return c.json({ message: 'Post deleted' })
  } catch (err) {
    console.error('Delete post error:', err.message)
    return c.json({ error: 'Failed to delete post' }, 500)
  }
})

export default app
