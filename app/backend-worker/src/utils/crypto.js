// ─── Cryptography helpers (WebCrypto — Workers-safe) ───────────────────────
// Ports app/backend/utils/tokenCrypto.js to the Web Crypto API.
//
// AES-256-GCM format is byte-for-byte compatible with the Node version:
// "iv:ciphertext:tag" (all base64), so rows encrypted by the Express backend
// decrypt correctly here and vice versa.
//
// Password strategy (see docs/cloudflare-migration.md for the full rationale):
//   - NEW hashes: PBKDF2-SHA256 via WebCrypto (native, fast).
//     Format: "pbkdf2$100000$<saltB64>$<hashB64>".
//   - LEGACY hashes: bcrypt ($2a$/$2b$, cost 10) from the Express backend are
//     verified with hash-wasm (WASM bcrypt — the fastest option on Workers)
//     and transparently UPGRADED to PBKDF2 on the next successful login.
//   - Passwords are capped at 72 chars (bcrypt's own limit; also bounds the
//     PBKDF2 work factor against DoS).

import { bcryptVerify } from 'hash-wasm'

const te = new TextEncoder()
const td = new TextDecoder()

const IV_LEN = 12
const PBKDF2_ITERATIONS = 100000
const PBKDF2_SALT_LEN = 16
const PBKDF2_KEY_LEN = 32
export const MAX_PASSWORD_LEN = 72

// --- base64 ---------------------------------------------------------------

function b64encode(bytes) {
  let s = ''
  const CHUNK = 0x8000
  for (let i = 0; i < bytes.length; i += CHUNK) {
    s += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(s)
}

function b64decode(b64) {
  const s = atob(b64)
  const bytes = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i)
  return bytes
}

function hexEncode(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// --- random / hash ----------------------------------------------------------

/** n random bytes as a lowercase hex string. */
export function randomHex(n) {
  return hexEncode(crypto.getRandomValues(new Uint8Array(n)))
}

/** SHA-256 hex digest — used for refresh/reset token hashes (DB storage). */
export async function sha256Hex(str) {
  const digest = await crypto.subtle.digest('SHA-256', te.encode(String(str)))
  return hexEncode(new Uint8Array(digest))
}

// hashToken keeps the original name so route code ports 1:1 (now async).
export const hashToken = sha256Hex

// --- AES-256-GCM token encryption -------------------------------------------

function getKeyMaterial(tokenEncryptionKey, isProduction) {
  const hex = tokenEncryptionKey
  if (!hex) {
    if (isProduction) {
      throw new Error(
        'TOKEN_ENCRYPTION_KEY is required in production (refusing to store OAuth tokens unencrypted)'
      )
    }
    // Dev-only fallback: deterministic key so local development works without
    // any setup. NEVER deploy to production without a real key.
    console.warn('TOKEN_ENCRYPTION_KEY not set — using insecure dev fallback key')
    return sha256Hex('nutriai-dev-only-fallback-key').then((h) =>
      Uint8Array.from(h.match(/../g).map((b) => parseInt(b, 16)))
    )
  }
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error('TOKEN_ENCRYPTION_KEY must be 64 hex chars (32 bytes)')
  }
  return Promise.resolve(Uint8Array.from(hex.match(/../g).map((b) => parseInt(b, 16))))
}

async function importAesKey(raw) {
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ])
}

/** Encrypt a UTF-8 string → "iv:ciphertext:tag" (all base64). */
export async function encryptToken(plaintext, tokenEncryptionKey, isProduction = false) {
  if (!plaintext) return plaintext
  const raw = await getKeyMaterial(tokenEncryptionKey, isProduction)
  const key = await importAesKey(raw)
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN))
  const ctAndTag = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, te.encode(String(plaintext)))
  )
  // WebCrypto appends the 16-byte auth tag to the ciphertext.
  const ct = ctAndTag.slice(0, ctAndTag.length - 16)
  const tag = ctAndTag.slice(ctAndTag.length - 16)
  return [b64encode(iv), b64encode(ct), b64encode(tag)].join(':')
}

/** Decrypt a value produced by encryptToken. Throws on tamper/invalid input. */
export async function decryptToken(payload, tokenEncryptionKey, isProduction = false) {
  if (!payload) return payload
  const parts = String(payload).split(':')
  if (parts.length !== 3) throw new Error('Invalid encrypted token format')
  const raw = await getKeyMaterial(tokenEncryptionKey, isProduction)
  const key = await importAesKey(raw)
  const [ivB64, ctB64, tagB64] = parts
  const iv = b64decode(ivB64)
  const ct = b64decode(ctB64)
  const tag = b64decode(tagB64)
  const combined = new Uint8Array(ct.length + tag.length)
  combined.set(ct, 0)
  combined.set(tag, ct.length)
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, combined)
  return td.decode(pt)
}

/**
 * Lenient read for the plaintext→encrypted migration: values written before
 * encryption are raw tokens, not "iv:ct:tag". Try decrypt; if the value is not
 * in encrypted format, return it as-is.
 */
export async function decryptTokenLenient(payload, tokenEncryptionKey, isProduction = false) {
  if (!payload) return payload
  if (String(payload).split(':').length !== 3) return String(payload) // legacy plaintext
  return decryptToken(payload, tokenEncryptionKey, isProduction)
}

// --- passwords ---------------------------------------------------------------

function pbkdf2Params() {
  return { iterations: PBKDF2_ITERATIONS, saltLen: PBKDF2_SALT_LEN, keyLen: PBKDF2_KEY_LEN }
}

function parsePbkdf2(stored) {
  const m = /^pbkdf2\$(\d+)\$([A-Za-z0-9+/=]+)\$([A-Za-z0-9+/=]+)$/.exec(stored)
  if (!m) return null
  return { iterations: Number(m[1]), salt: b64decode(m[2]), hash: b64decode(m[3]) }
}

/** Hash a new password with PBKDF2-SHA256 (WebCrypto). */
export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length === 0) {
    throw new Error('Password is required')
  }
  if (password.length > MAX_PASSWORD_LEN) {
    throw new Error(`Password must be at most ${MAX_PASSWORD_LEN} characters`)
  }
  const { iterations, saltLen, keyLen } = pbkdf2Params()
  const salt = crypto.getRandomValues(new Uint8Array(saltLen))
  const keyMaterial = await crypto.subtle.importKey('raw', te.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    keyLen * 8
  )
  return `pbkdf2$${iterations}$${b64encode(salt)}$${b64encode(new Uint8Array(bits))}`
}

/**
 * Verify a password against a stored hash.
 * Returns { valid: boolean, upgradedHash: string | null } — upgradedHash is set
 * when a legacy bcrypt hash verified and should be re-stored as PBKDF2.
 */
export async function verifyPassword(password, stored) {
  if (!stored) return { valid: false, upgradedHash: null }
  // Legacy bcrypt hashes from the Express backend ($2a$/$2b$).
  if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
    const valid = await bcryptVerify({ password, hash: stored })
    if (!valid) return { valid: false, upgradedHash: null }
    return { valid: true, upgradedHash: await hashPassword(password) }
  }
  const parsed = parsePbkdf2(stored)
  if (!parsed) return { valid: false, upgradedHash: null }
  const keyMaterial = await crypto.subtle.importKey('raw', te.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: parsed.salt, iterations: parsed.iterations, hash: 'SHA-256' },
      keyMaterial,
      parsed.hash.length * 8
    )
  )
  // Constant-time comparison.
  if (bits.length !== parsed.hash.length) return { valid: false, upgradedHash: null }
  let diff = 0
  for (let i = 0; i < bits.length; i++) diff |= bits[i] ^ parsed.hash[i]
  return { valid: diff === 0, upgradedHash: null }
}
