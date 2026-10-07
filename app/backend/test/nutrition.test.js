// Backend unit tests — run with: node --test test/
// Zero dependencies (node:test is built-in). No DB, no network.
const { describe, it } = require('node:test')
const assert = require('node:assert/strict')

// ─── utils/nutrition ─────────────────────────────────────────────────────────
const { normalizeMealInput, sumMacros, macroSplit } = require('../utils/nutrition')

describe('normalizeMealInput', () => {
  it('normalizes a valid meal', () => {
    const { value, error } = normalizeMealInput({
      name: 'Dal Rice', calories: 380, protein: 14, carbs: 72, fat: 4, mealType: 'Lunch',
    })
    assert.equal(error, undefined)
    assert.equal(value.name, 'Dal Rice')
    assert.equal(value.calories, 380)
    assert.equal(value.mealType, 'Lunch')
    assert.ok(value.date instanceof Date)
  })

  it('defaults name to Unknown and mealType to Breakfast', () => {
    const { value } = normalizeMealInput({ calories: 100 })
    assert.equal(value.name, 'Unknown')
    assert.equal(value.mealType, 'Breakfast')
  })

  it('rejects unknown mealType with Breakfast default', () => {
    const { value } = normalizeMealInput({ mealType: 'Brunch' })
    assert.equal(value.mealType, 'Breakfast')
  })

  it('coerces numeric strings and blanks to 0', () => {
    const { value } = normalizeMealInput({ calories: '250', protein: '', carbs: null, fat: undefined })
    assert.equal(value.calories, 250)
    assert.equal(value.protein, 0)
    assert.equal(value.carbs, 0)
    assert.equal(value.fat, 0)
  })

  it('clamps negative macros to 0', () => {
    const { value } = normalizeMealInput({ calories: -50, protein: -3 })
    assert.equal(value.calories, 0)
    assert.equal(value.protein, 0)
  })

  it('caps absurd values', () => {
    const { value } = normalizeMealInput({ calories: 99999999 })
    assert.ok(value.calories <= 20000)
  })

  it('rejects invalid dates', () => {
    const { error } = normalizeMealInput({ date: 'not-a-date' })
    assert.equal(error, 'Invalid date')
  })

  it('accepts a valid date string', () => {
    const { value, error } = normalizeMealInput({ date: '2026-10-01' })
    assert.equal(error, undefined)
    assert.equal(value.date.toISOString().slice(0, 10), '2026-10-01')
  })

  it('trims whitespace-only names to Unknown', () => {
    const { value } = normalizeMealInput({ name: '   ' })
    assert.equal(value.name, 'Unknown')
  })
})

describe('sumMacros', () => {
  it('sums across meals, tolerating missing fields', () => {
    const t = sumMacros([
      { calories: 100, protein: 10, carbs: 20, fat: 5 },
      { calories: 200 },
    ])
    assert.deepEqual(t, { calories: 300, protein: 10, carbs: 20, fat: 5 })
  })

  it('returns zeros for empty input', () => {
    assert.deepEqual(sumMacros([]), { calories: 0, protein: 0, carbs: 0, fat: 0 })
  })
})

describe('macroSplit', () => {
  it('computes calorie-based percentages', () => {
    // 50g protein = 200kcal, 50g carbs = 200kcal, 20g fat = 180kcal → 580 total
    const s = macroSplit({ protein: 50, carbs: 50, fat: 20 })
    assert.equal(s.protein + s.carbs + s.fat >= 99, true)
    assert.ok(Math.abs(s.protein - 34) <= 1)
  })

  it('returns zeros when there is nothing to split', () => {
    assert.deepEqual(macroSplit({ protein: 0, carbs: 0, fat: 0 }), { protein: 0, carbs: 0, fat: 0 })
  })
})

// ─── utils/tokenCrypto ───────────────────────────────────────────────────────
process.env.TOKEN_ENCRYPTION_KEY = 'a'.repeat(64) // test-only key, never committed as a secret
const { encryptToken, decryptToken, decryptTokenLenient, hashToken } = require('../utils/tokenCrypto')

describe('tokenCrypto', () => {
  it('encrypt/decrypt round-trips', () => {
    const ct = encryptToken('my-refresh-token')
    assert.notEqual(ct, 'my-refresh-token')
    assert.equal(decryptToken(ct), 'my-refresh-token')
  })

  it('produces different ciphertexts for the same plaintext (random IV)', () => {
    assert.notEqual(encryptToken('x'), encryptToken('x'))
  })

  it('decryptTokenLenient passes legacy plaintext through', () => {
    assert.equal(decryptTokenLenient('plain-old-token'), 'plain-old-token')
  })

  it('decryptToken throws on tampered input', () => {
    assert.throws(() => decryptToken('a:b:c'), Error)
  })

  it('hashToken is deterministic sha256 hex', () => {
    const h1 = hashToken('abc')
    const h2 = hashToken('abc')
    assert.equal(h1, h2)
    assert.match(h1, /^[0-9a-f]{64}$/)
    assert.notEqual(hashToken('abc'), hashToken('abd'))
  })
})
