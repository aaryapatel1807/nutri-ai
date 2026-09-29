'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../lib/api'
import useIsMobile from '../../lib/useIsMobile'

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

export default function BarcodeScanner() {
  const isMobile = useIsMobile()
  const [cameraSupported] = useState(() => typeof window !== 'undefined' && 'BarcodeDetector' in window)
  const [cameraOn, setCameraOn] = useState(false)
  const [code, setCode] = useState('')
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mealType, setMealType] = useState('Snack')
  const [logging, setLogging] = useState(false)
  const [logged, setLogged] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const scanTimer = useRef(null)

  const card = {
    background: 'var(--bg-card)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid var(--border)',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 8px 32px var(--shadow-color)',
  }

  const inputStyle = {
    background: 'var(--border)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '12px 16px',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: "'Satoshi', sans-serif",
  }

  const stopCamera = () => {
    if (scanTimer.current) { clearInterval(scanTimer.current); scanTimer.current = null }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setCameraOn(false)
  }

  useEffect(() => () => stopCamera(), [])

  const startCamera = async () => {
    setError('')
    setProduct(null)
    setLogged(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      setCameraOn(true)
      // Defer to next frame so the <video> element has mounted
      requestAnimationFrame(async () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
        }
        try {
          const detector = new window.BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'qr_code']
          })
          scanTimer.current = setInterval(async () => {
            if (!videoRef.current || videoRef.current.readyState < 2) return
            try {
              const barcodes = await detector.detect(videoRef.current)
              if (barcodes.length > 0 && barcodes[0].rawValue) {
                const found = barcodes[0].rawValue
                stopCamera()
                setCode(found)
                lookup(found)
              }
            } catch { /* detection hiccup — keep scanning */ }
          }, 500)
        } catch {
          setError('Barcode detection is not available on this device. Please enter the code manually.')
          stopCamera()
        }
      })
    } catch {
      setError('Camera access was denied. Please enter the barcode manually.')
    }
  }

  const lookup = async (rawCode) => {
    const clean = String(rawCode).trim()
    if (!/^[0-9]{4,20}$/.test(clean)) {
      setError('Please enter a valid numeric barcode.')
      return
    }
    setLoading(true)
    setError('')
    setProduct(null)
    setLogged(false)
    try {
      const res = await api.get(`/api/barcode/${clean}`)
      setProduct(res.data)
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Product not found in the database. Try the food search in Meal Logger instead.')
      } else {
        setError(err.response?.data?.error || 'Barcode lookup failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const logProduct = async () => {
    if (!product) return
    setLogging(true)
    setError('')
    try {
      await api.post('/api/barcode/log', { code: product.code, mealType })
      setLogged(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to log this product.')
    } finally {
      setLogging(false)
    }
  }

  const scanAnother = () => {
    setProduct(null)
    setCode('')
    setLogged(false)
    setError('')
    setMealType('Snack')
  }

  return (
    <div style={{ width: '100%', maxWidth: '720px', margin: '0 auto' }}>

      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '28px' }}
      >
        <h1 style={{
          fontFamily: "'Clash Display',sans-serif",
          fontSize: '2rem', fontWeight: 700,
          color: 'var(--text-primary)', margin: 0, marginBottom: '6px'
        }}>Barcode Scan 📷</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
          Scan a packaged food barcode for instant nutrition facts
        </p>
      </motion.div>

      {/* SCAN CARD */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ ...card, marginBottom: '24px', textAlign: 'center' }}
      >
        <AnimatePresence mode="wait">
          {cameraOn ? (
            <motion.div key="camera" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{
                position: 'relative', borderRadius: '16px', overflow: 'hidden',
                border: '2px solid rgba(21, 178, 207,0.4)', marginBottom: '16px',
                background: '#000'
              }}>
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  style={{ width: '100%', maxHeight: '360px', objectFit: 'cover', display: 'block' }}
                />
                {/* Scan frame overlay */}
                <div style={{
                  position: 'absolute', inset: '20%',
                  border: '2px dashed #15B2CF', borderRadius: '12px',
                  pointerEvents: 'none',
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.35)'
                }} />
                <div style={{
                  position: 'absolute', bottom: '12px', left: 0, right: 0,
                  color: '#fff', fontSize: '0.85rem', fontWeight: 600,
                  textShadow: '0 1px 8px rgba(0,0,0,0.8)'
                }}>
                  Point the camera at a barcode…
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={stopCamera}
                style={{
                  padding: '12px 24px', background: 'var(--border)',
                  border: '1px solid var(--border)', borderRadius: '12px',
                  color: 'var(--text-primary)', cursor: 'pointer',
                  fontSize: '0.9rem', fontWeight: 600
                }}>
                Stop Camera
              </motion.button>
            </motion.div>
          ) : (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>🏷️</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 20px' }}>
                {cameraSupported
                  ? 'Use your camera to scan a barcode, or type it in below.'
                  : 'Camera barcode scanning is not supported in this browser — enter the code manually.'}
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '20px' }}>
                {cameraSupported && (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={startCamera}
                    style={{
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg,#15B2CF,#4FD3ED)',
                      border: 'none', borderRadius: '12px',
                      color: '#000', fontWeight: 700, cursor: 'pointer',
                      fontSize: '0.9rem', fontFamily: "'Satoshi',sans-serif"
                    }}>
                    📷 Start Camera Scan
                  </motion.button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', maxWidth: '420px', margin: '0 auto' }}>
                <input
                  placeholder="Enter barcode (e.g. 8901030…)"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                  onKeyDown={e => e.key === 'Enter' && lookup(code)}
                  inputMode="numeric"
                  style={inputStyle}
                />
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => lookup(code)}
                  disabled={loading || !code}
                  style={{
                    padding: '12px 20px', flexShrink: 0,
                    background: 'rgba(21, 178, 207,0.12)',
                    border: '1px solid rgba(21, 178, 207,0.35)',
                    borderRadius: '12px', color: '#15B2CF',
                    fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
                    opacity: code ? 1 : 0.5
                  }}>
                  {loading ? '…' : 'Look up'}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              marginTop: '16px', padding: '10px 16px',
              background: 'rgba(46,125,255,0.08)',
              border: '1px solid rgba(46,125,255,0.3)',
              borderRadius: '12px', color: '#1FA8C9', fontSize: '0.85rem'
            }}>
            {error}
          </motion.div>
        )}
      </motion.div>

      {/* LOADING */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ ...card, textAlign: 'center', marginBottom: '24px' }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{ fontSize: '2rem', display: 'inline-block' }}
          >🔍</motion.div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '8px 0 0' }}>
            Looking up product…
          </p>
        </motion.div>
      )}

      {/* PRODUCT RESULT */}
      <AnimatePresence>
        {product && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            style={{
              ...card, marginBottom: '24px',
              border: '1px solid rgba(21, 178, 207,0.25)',
              boxShadow: '0 0 40px rgba(21, 178, 207,0.12), 0 8px 32px var(--shadow-color)'
            }}
          >
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {product.image && (
                <img
                  src={product.image}
                  alt={product.name}
                  style={{
                    width: isMobile ? '100%' : '120px', height: isMobile ? '200px' : '120px',
                    objectFit: 'contain', borderRadius: '12px',
                    background: 'var(--border)', padding: '8px'
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{
                  display: 'inline-block', fontSize: '0.72rem', fontWeight: 700,
                  color: '#15B2CF', background: 'rgba(21, 178, 207,0.1)',
                  border: '1px solid rgba(21, 178, 207,0.3)',
                  borderRadius: '99px', padding: '3px 12px', marginBottom: '8px'
                }}>
                  ✓ PRODUCT FOUND
                </div>
                <h2 style={{
                  fontFamily: "'Clash Display',sans-serif",
                  color: 'var(--text-primary)', fontSize: '1.3rem',
                  margin: '0 0 4px', fontWeight: 700
                }}>{product.name}</h2>
                {product.brand && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 4px' }}>
                    {product.brand}
                  </p>
                )}
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: 0 }}>
                  {product.perServing && product.servingSize
                    ? `Per serving (${product.servingSize})`
                    : 'Per 100g'}
                </p>
              </div>
            </div>

            {/* Macro grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)',
              gap: '12px', marginBottom: '20px'
            }}>
              {[
                { label: 'Calories', val: product.calories, unit: 'kcal', color: '#15B2CF' },
                { label: 'Protein', val: product.protein, unit: 'g', color: '#7B61FF' },
                { label: 'Carbs', val: product.carbs, unit: 'g', color: '#4FD3ED' },
                { label: 'Fat', val: product.fat, unit: 'g', color: '#1FA8C9' },
              ].map(m => (
                <div key={m.label} style={{
                  background: 'var(--border)', borderRadius: '12px',
                  padding: '14px', textAlign: 'center',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{
                    color: m.color, fontFamily: "'Clash Display',sans-serif",
                    fontSize: '1.4rem', fontWeight: 700
                  }}>{m.val}<span style={{ fontSize: '0.75rem' }}>{m.unit}</span></div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '2px' }}>{m.label}</div>
                </div>
              ))}
            </div>

            {logged ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  textAlign: 'center', padding: '16px',
                  background: 'rgba(46,204,113,0.08)',
                  border: '1px solid rgba(46,204,113,0.3)',
                  borderRadius: '12px', marginBottom: '16px'
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '4px' }}>✅</div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.95rem' }}>
                  Logged to {mealType}!
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '12px' }}>
                  <button
                    onClick={scanAnother}
                    style={{
                      padding: '10px 20px', background: 'var(--border)',
                      border: '1px solid var(--border)', borderRadius: '10px',
                      color: 'var(--text-primary)', cursor: 'pointer',
                      fontSize: '0.85rem', fontWeight: 600
                    }}>
                    Scan Another
                  </button>
                  <a
                    href="/meal-logger"
                    style={{
                      padding: '10px 20px', background: 'rgba(21, 178, 207,0.12)',
                      border: '1px solid rgba(21, 178, 207,0.35)', borderRadius: '10px',
                      color: '#15B2CF', fontSize: '0.85rem', fontWeight: 700,
                      textDecoration: 'none'
                    }}>
                    View Meal Log →
                  </a>
                </div>
              </motion.div>
            ) : (
              <>
                {/* Meal type picker */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  {MEAL_TYPES.map(t => (
                    <motion.button
                      key={t}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setMealType(t)}
                      style={{
                        padding: '8px 18px', borderRadius: '99px',
                        border: mealType === t ? 'none' : '1px solid var(--border)',
                        background: mealType === t
                          ? 'linear-gradient(135deg,#15B2CF,#4FD3ED)'
                          : 'var(--bg-card)',
                        color: mealType === t ? '#000' : 'var(--text-muted)',
                        fontWeight: mealType === t ? 700 : 400,
                        cursor: 'pointer', fontSize: '0.82rem',
                        fontFamily: "'Satoshi',sans-serif"
                      }}>
                      {t}
                    </motion.button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={logProduct}
                    disabled={logging}
                    style={{
                      flex: 1, padding: '14px',
                      background: 'linear-gradient(135deg,#15B2CF,#4FD3ED)',
                      border: 'none', borderRadius: '14px',
                      color: '#000', fontWeight: 800, cursor: 'pointer',
                      fontSize: '0.95rem', fontFamily: "'Clash Display',sans-serif",
                      opacity: logging ? 0.6 : 1
                    }}>
                    {logging ? 'Logging…' : `🍽️ Log to ${mealType}`}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={scanAnother}
                    style={{
                      padding: '14px 20px', background: 'var(--border)',
                      border: '1px solid var(--border)', borderRadius: '14px',
                      color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem'
                    }}>
                    Discard
                  </motion.button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '8px' }}>
        Nutrition data from Open Food Facts — the free, open food database.
      </p>
    </div>
  )
}
