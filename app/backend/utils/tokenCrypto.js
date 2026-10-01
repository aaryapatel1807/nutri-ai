// ---------------------------------------------------------------------------
// AES-256-GCM helpers for encrypting sensitive tokens at rest (e.g. Google
// OAuth access/refresh tokens in the ConnectedAccount table).
//
// Key: TOKEN_ENCRYPTION_KEY env var — 64 hex chars (32 bytes). Generate with:
//   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
//
// Fail-closed: in production the process refuses to boot without a key, so a
// misconfigured deploy can never silently write plaintext tokens.
// ---------------------------------------------------------------------------
const crypto = require('crypto')

const ALGO = 'aes-256-gcm'
const IV_LEN = 12

function getKey() {
  const hex = process.env.TOKEN_ENCRYPTION_KEY
  if (!hex) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'TOKEN_ENCRYPTION_KEY is required in production (refusing to store OAuth tokens unencrypted)'
      )
    }
    // Dev-only fallback: deterministic key so local development works without
    // any setup. NEVER set NODE_ENV=production without a real key.
    console.warn('⚠️  TOKEN_ENCRYPTION_KEY not set — using insecure dev fallback key')
    return crypto.createHash('sha256').update('nutriai-dev-only-fallback-key').digest()
  }
  const key = Buffer.from(hex, 'hex')
  if (key.length !== 32) {
    throw new Error('TOKEN_ENCRYPTION_KEY must be 64 hex chars (32 bytes)')
  }
  return key
}

// Encrypt a UTF-8 string → "iv:ciphertext:tag" (all base64). Authenticated:
// any tampering is detected on decrypt.
function encryptToken(plaintext) {
  if (!plaintext) return plaintext
  const key = getKey()
  const iv = crypto.randomBytes(IV_LEN)
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  const ct = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv.toString('base64'), ct.toString('base64'), tag.toString('base64')].join(':')
}

// Decrypt a value produced by encryptToken. Throws on tamper/invalid input.
function decryptToken(payload) {
  if (!payload) return payload
  const parts = String(payload).split(':')
  if (parts.length !== 3) throw new Error('Invalid encrypted token format')
  const key = getKey()
  const [ivB64, ctB64, tagB64] = parts
  const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(ivB64, 'base64'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
  return Buffer.concat([
    decipher.update(Buffer.from(ctB64, 'base64')),
    decipher.final(),
  ]).toString('utf8')
}

// Lenient read for the plaintext→encrypted migration: values written before
// this fix are raw tokens, not "iv:ct:tag". Try decrypt; if the value is not
// in encrypted format, return it as-is so legacy rows keep working until
// they are re-encrypted on the next write.
function decryptTokenLenient(payload) {
  if (!payload) return payload
  if (String(payload).split(':').length !== 3) return String(payload) // legacy plaintext
  return decryptToken(payload)
}

// Hash an opaque token (refresh/reset tokens) for DB storage — the raw value
// is only ever shown to the client once, the DB keeps the SHA-256 digest.
function hashToken(rawToken) {
  return crypto.createHash('sha256').update(String(rawToken)).digest('hex')
}

module.exports = { encryptToken, decryptToken, decryptTokenLenient, hashToken }
