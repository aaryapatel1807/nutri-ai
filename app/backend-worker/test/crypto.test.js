// Tests for utils/crypto.js — the WebCrypto port.
// Covers: randomHex, SHA-256, AES-GCM roundtrip + format compatibility,
// legacy plaintext passthrough, PBKDF2 hashing, and legacy bcrypt upgrade.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  randomHex,
  sha256Hex,
  hashToken,
  encryptToken,
  decryptToken,
  decryptTokenLenient,
  hashPassword,
  verifyPassword,
  MAX_PASSWORD_LEN,
} from '../src/utils/crypto.js'
import { bcrypt } from 'hash-wasm'

const TEST_KEY = 'a'.repeat(64) // 64 hex chars, dev-only test key

test('randomHex returns the right number of hex chars', () => {
  const h = randomHex(16)
  assert.equal(h.length, 32)
  assert.match(h, /^[0-9a-f]+$/)
  assert.notEqual(randomHex(16), randomHex(16))
})

test('sha256Hex matches the known digest', async () => {
  assert.equal(
    await sha256Hex('abc'),
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
  )
})

test('hashToken is an alias for sha256Hex', async () => {
  assert.equal(await hashToken('reset-token-1'), await sha256Hex('reset-token-1'))
})

test('AES-GCM encrypt/decrypt roundtrips', async () => {
  const ct = await encryptToken('hello-google-fit', TEST_KEY, false)
  assert.equal(typeof ct, 'string')
  assert.equal(ct.split(':').length, 3, 'format must be iv:ct:tag')
  assert.equal(await decryptToken(ct, TEST_KEY, false), 'hello-google-fit')
})

test('AES-GCM decrypt rejects tampered ciphertext', async () => {
  const ct = await encryptToken('secret', TEST_KEY, false)
  const [iv, payload, tag] = ct.split(':')
  const tampered = [iv, payload.slice(0, -2) + 'AA', tag].join(':')
  await assert.rejects(() => decryptToken(tampered, TEST_KEY, false))
})

test('decryptTokenLenient passes through legacy plaintext rows', async () => {
  const legacy = 'ya29.plaintext-oauth-token-from-before-encryption'
  assert.equal(await decryptTokenLenient(legacy, TEST_KEY, false), legacy)
})

test('decryptTokenLenient decrypts new-format rows', async () => {
  const ct = await encryptToken('new-token', TEST_KEY, false)
  assert.equal(await decryptTokenLenient(ct, TEST_KEY, false), 'new-token')
})

test('hashPassword produces a pbkdf2 hash and verifyPassword accepts it', async () => {
  const h = await hashPassword('correct-horse-123')
  assert.match(h, /^pbkdf2\$100000\$/)
  const { valid, upgradedHash } = await verifyPassword('correct-horse-123', h)
  assert.equal(valid, true)
  assert.equal(upgradedHash, null)
})

test('verifyPassword rejects the wrong password', async () => {
  const h = await hashPassword('correct-horse-123')
  const { valid } = await verifyPassword('wrong-password', h)
  assert.equal(valid, false)
})

test('verifyPassword rejects unknown hash formats', async () => {
  const { valid } = await verifyPassword('anything', 'not-a-hash')
  assert.equal(valid, false)
})

test('hashPassword enforces the 72-char cap', async () => {
  await assert.rejects(() => hashPassword('x'.repeat(MAX_PASSWORD_LEN + 1)), /at most 72/)
  // Exactly 72 is fine.
  await hashPassword('x'.repeat(MAX_PASSWORD_LEN))
})

test('legacy bcrypt hashes verify and upgrade to PBKDF2', async () => {
  // Simulate a hash written by the old Express backend (bcrypt cost 10).
  // costFactor 4 here keeps the test fast; the verify path is identical.
  const legacy = await bcrypt({ password: 'old-user-pw', salt: new Uint8Array(16).fill(7), costFactor: 4, outputType: 'encoded' })
  assert.match(legacy, /^\$2[aby]\$/)
  const { valid, upgradedHash } = await verifyPassword('old-user-pw', legacy)
  assert.equal(valid, true)
  assert.ok(upgradedHash, 'should offer an upgraded hash')
  assert.match(upgradedHash, /^pbkdf2\$/)
  // The upgraded hash verifies too.
  const again = await verifyPassword('old-user-pw', upgradedHash)
  assert.equal(again.valid, true)
})

test('legacy bcrypt rejects wrong password', async () => {
  const legacy = await bcrypt({ password: 'old-user-pw', salt: new Uint8Array(16).fill(7), costFactor: 4, outputType: 'encoded' })
  const { valid } = await verifyPassword('not-the-password', legacy)
  assert.equal(valid, false)
})
