'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Send, Trash2, Users, RefreshCw, Megaphone } from 'lucide-react'
import api from '../../lib/api'

const MAX_LEN = 280

function timeAgo(iso) {
  if (!iso) return ''
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  const w = Math.floor(d / 7)
  if (w < 5) return `${w}w ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function PostCard({ post, isOwn, onKudos, onDelete }) {
  const [popping, setPopping] = useState(false)
  const [liked, setLiked] = useState(false)

  const handleKudos = () => {
    setPopping(true)
    setLiked(true)
    onKudos(post.id)
    setTimeout(() => setPopping(false), 450)
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25 }}
      style={{
        background: 'var(--glass-bg)', backdropFilter: 'blur(26px) saturate(1.6)', WebkitBackdropFilter: 'blur(26px) saturate(1.6)', 
        border: '1px solid var(--glass-border)',
        borderRadius: 20,
        padding: '1.1rem 1.25rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.6rem' }}>
        <div
          style={{
            width: 40, height: 40, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, rgba(46,125,255,0.25), rgba(21, 178, 207,0.12))',
            border: '1px solid rgba(46,125,255,0.3)',
            color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.95rem',
          }}
        >
          {(post.user?.name || 'A').charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
            {post.user?.name || 'Anonymous'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{timeAgo(post.createdAt)}</div>
        </div>
        {isOwn && (
          <button
            onClick={() => onDelete(post.id)}
            title="Delete post"
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', padding: '0.4rem', borderRadius: 10,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#FF6B6B')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <Trash2 size={17} />
          </button>
        )}
      </div>

      <p style={{ margin: '0 0 0.8rem', fontSize: '0.95rem', lineHeight: 1.55, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {post.content}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <motion.button
          onClick={handleKudos}
          whileTap={{ scale: 0.82 }}
          animate={popping ? { scale: [1, 1.45, 1] } : { scale: 1 }}
          transition={popping ? { duration: 0.4, ease: 'easeOut' } : { type: 'spring', stiffness: 400 }}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.45rem',
            background: liked ? 'rgba(46,125,255,0.14)' : 'transparent',
            border: liked ? '1px solid rgba(46,125,255,0.4)' : '1px solid var(--border)',
            borderRadius: 999, padding: '0.45rem 0.9rem', cursor: 'pointer',
            color: liked ? '#E14E42' : 'var(--text-muted)',
            fontWeight: 700, fontSize: '0.85rem',
          }}
          aria-label="Give kudos"
        >
          <Heart size={16} fill={liked ? '#E14E42' : 'none'} color={liked ? '#E14E42' : 'currentColor'} />
          <motion.span
            key={post.likes}
            initial={popping ? { scale: 1.6 } : false}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 18 }}
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {post.likes || 0}
          </motion.span>
        </motion.button>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>kudos</span>
      </div>
    </motion.article>
  )
}

export default function CommunityPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [draft, setDraft] = useState('')
  const [posting, setPosting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState(null)

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('nutriai_user') || 'null')
      if (u?.id) setCurrentUserId(u.id)
    } catch { /* ignore */ }
  }, [])

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/api/posts')
      const list = Array.isArray(res.data) ? res.data : []
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      setPosts(list)
    } catch (e) {
      setError(e?.response?.data?.error || 'Could not load the feed. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const handleShare = async () => {
    const content = draft.trim()
    if (!content || posting) return
    setPosting(true)
    try {
      const res = await api.post('/api/posts', { content: content.slice(0, MAX_LEN) })
      setPosts((p) => [res.data, ...p])
      setDraft('')
    } catch (e) {
      alert(e?.response?.data?.error || 'Could not share your post. Please try again.')
    } finally {
      setPosting(false)
    }
  }

  const handleKudos = useCallback(async (id) => {
    setPosts((p) => p.map((x) => (x.id === id ? { ...x, likes: (x.likes || 0) + 1 } : x)))
    try {
      const res = await api.post(`/api/posts/${id}/like`)
      setPosts((p) => p.map((x) => (x.id === id ? { ...x, likes: res.data.likes ?? x.likes } : x)))
    } catch {
      setPosts((p) => p.map((x) => (x.id === id ? { ...x, likes: Math.max(0, (x.likes || 1) - 1) } : x)))
    }
  }, [])

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Delete this post?')) return
    const prev = posts
    setPosts((p) => p.filter((x) => x.id !== id))
    try {
      await api.delete(`/api/posts/${id}`)
    } catch {
      setPosts(prev)
      alert('Could not delete the post. Please try again.')
    }
  }, [posts])

  const overLimit = draft.length > MAX_LEN

  const body = useMemo(() => {
    if (loading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(26px) saturate(1.6)', WebkitBackdropFilter: 'blur(26px) saturate(1.6)',  border: '1px solid var(--glass-border)', borderRadius: 20, padding: '1.1rem 1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.7rem', marginBottom: '0.7rem' }}>
                <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 14, width: '35%', borderRadius: 6, marginBottom: 6 }} />
                  <div className="skeleton" style={{ height: 11, width: '22%', borderRadius: 6 }} />
                </div>
              </div>
              <div className="skeleton" style={{ height: 14, width: '90%', borderRadius: 6, marginBottom: 6 }} />
              <div className="skeleton" style={{ height: 14, width: '60%', borderRadius: 6 }} />
            </div>
          ))}
        </div>
      )
    }
    if (error) {
      return (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--glass-bg)', backdropFilter: 'blur(26px) saturate(1.6)', WebkitBackdropFilter: 'blur(26px) saturate(1.6)',  border: '1px solid var(--glass-border)', borderRadius: 20 }}>
          <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.4rem' }}>The feed did not load</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.1rem' }}>{error}</p>
          <button
            onClick={fetchPosts}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'linear-gradient(135deg, #E14E42, #FF6B5E)', color: '#1A1714',
              border: 'none', borderRadius: 999, padding: '0.65rem 1.4rem',
              fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
            }}
          >
            <RefreshCw size={16} /> Try again
          </button>
        </div>
      )
    }
    if (posts.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', background: 'var(--glass-bg)', backdropFilter: 'blur(26px) saturate(1.6)', WebkitBackdropFilter: 'blur(26px) saturate(1.6)',  border: '1px solid var(--glass-border)', borderRadius: 20 }}>
          <div style={{ fontSize: '2.4rem', marginBottom: '0.8rem' }}>👏</div>
          <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.4rem' }}>No posts yet</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Share your first workout above — your crew is waiting.</p>
        </div>
      )
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        <AnimatePresence initial={false}>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isOwn={currentUserId && post.user?.id === currentUserId}
              onKudos={handleKudos}
              onDelete={handleDelete}
            />
          ))}
        </AnimatePresence>
      </div>
    )
  }, [loading, error, posts, currentUserId, fetchPosts, handleKudos, handleDelete])

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
      <header style={{ marginBottom: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
        <div
          style={{
            width: 46, height: 46, borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(46,125,255,0.25), rgba(21, 178, 207,0.12))',
            border: '1px solid rgba(46,125,255,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E14E42',
          }}
        >
          <Users size={22} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Community
          </h1>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Train together. Kudos keep everyone moving.
          </p>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'var(--glass-bg)', backdropFilter: 'blur(26px) saturate(1.6)', WebkitBackdropFilter: 'blur(26px) saturate(1.6)',  border: '1px solid var(--glass-border)',
          borderRadius: 20, padding: '1.1rem 1.25rem', marginBottom: '1.2rem',
        }}
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Share a workout, a PR, or a win from today…"
          rows={3}
          style={{
            width: '100%', resize: 'vertical', boxSizing: 'border-box',
            background: 'var(--bg-primary)', border: '1px solid var(--glass-border)',
            borderRadius: 12, padding: '0.7rem 0.9rem',
            color: 'var(--text-primary)', fontSize: '0.92rem', fontFamily: 'inherit',
            outline: 'none',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(46,125,255,0.5)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.7rem' }}>
          <span style={{ fontSize: '0.78rem', color: overLimit ? '#FF6B6B' : 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
            {draft.length}/{MAX_LEN}
          </span>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleShare}
            disabled={!draft.trim() || overLimit || posting}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: (!draft.trim() || overLimit || posting) ? 'var(--border)' : 'linear-gradient(135deg, #E14E42, #FF6B5E)',
              color: (!draft.trim() || overLimit || posting) ? 'var(--text-muted)' : '#1A1714',
              border: 'none', borderRadius: 999, padding: '0.6rem 1.3rem',
              fontWeight: 700, fontSize: '0.88rem',
              cursor: (!draft.trim() || overLimit || posting) ? 'not-allowed' : 'pointer',
              opacity: posting ? 0.7 : 1,
            }}
          >
            <Send size={15} /> {posting ? 'Sharing…' : 'Share'}
          </motion.button>
        </div>
      </motion.div>

      {body}

      <div style={{ marginTop: '1.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        <Megaphone size={14} />
        <span>Be kind. Celebrate effort — every kudos counts.</span>
      </div>

      <style jsx>{`
        .skeleton {
          background: linear-gradient(90deg, rgba(128,128,128,0.12) 25%, rgba(128,128,128,0.22) 50%, rgba(128,128,128,0.12) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite linear;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}
