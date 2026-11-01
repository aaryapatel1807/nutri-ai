// Focused tests for Phase 1/2 validation helpers — no DB, no network.
// Run: node --test test/validation.test.js
const { describe, it } = require('node:test')
const assert = require('node:assert')
const { parseWorkoutExercise, parseWorkoutNumber } = require('../routes/workouts')
const { localDayRange } = require('../routes/meals')

describe('parseWorkoutExercise', () => {
  it('accepts a full valid entry', () => {
    const r = parseWorkoutExercise({ name: 'Squat', sets: 4, reps: 8, weight: 80 }, 0)
    assert.equal(r.error, undefined)
    assert.deepEqual(r.value, { name: 'Squat', sets: 4, reps: 8, weight: 80 })
  })
  it('trims the name and floors fractional sets/reps', () => {
    const r = parseWorkoutExercise({ name: '  Bench ', sets: 3.7, reps: 10.9 }, 1)
    assert.equal(r.value.name, 'Bench')
    assert.equal(r.value.sets, 3)
    assert.equal(r.value.reps, 10)
  })
  it('omits absent optional fields', () => {
    const r = parseWorkoutExercise({ name: 'Plank' }, 0)
    assert.deepEqual(r.value, { name: 'Plank' })
  })
  it('rejects missing/blank names', () => {
    assert.match(parseWorkoutExercise({}, 0).error, /name is required/)
    assert.match(parseWorkoutExercise({ name: 42 }, 0).error, /name is required/)
    assert.match(parseWorkoutExercise(null, 2).error, /must be an object/)
  })
  it('rejects negative or non-numeric values, indexed in the message', () => {
    assert.match(parseWorkoutExercise({ name: 'X', weight: -5 }, 3).error, /exercises\[3\]\.weight/)
    assert.match(parseWorkoutExercise({ name: 'X', sets: -1 }, 0).error, /sets/)
    assert.match(parseWorkoutExercise({ name: 'X', reps: 'many' }, 0).error, /reps/)
  })
})

describe('parseWorkoutNumber', () => {
  it('accepts zero and floors', () => {
    assert.deepEqual(parseWorkoutNumber(0, 'duration'), { value: 0 })
    assert.deepEqual(parseWorkoutNumber(30.9, 'duration'), { value: 30 })
  })
  it('returns undefined for absent fields (caller keeps its default)', () => {
    assert.equal(parseWorkoutNumber(undefined, 'duration'), undefined)
    assert.equal(parseWorkoutNumber('', 'duration'), undefined)
  })
  it('rejects negatives and NaN', () => {
    assert.match(parseWorkoutNumber(-30, 'duration').error, /non-negative/)
    assert.match(parseWorkoutNumber('abc', 'duration').error, /non-negative/)
  })
})

describe('localDayRange', () => {
  it('maps a UTC day to a UTC 24h range when no offset is given', () => {
    const r = localDayRange('2026-11-01')
    assert.equal(r.start.toISOString(), '2026-11-01T00:00:00.000Z')
    assert.equal(r.end.toISOString(), '2026-11-02T00:00:00.000Z')
  })
  it('shifts the range by the caller timezone offset (IST: -330)', () => {
    // Local Nov 2 in IST starts at Nov 1 18:30 UTC — so a meal logged at
    // 01:00 IST Nov 2 (19:30 UTC Nov 1) falls inside "today".
    const r = localDayRange('2026-11-02', -330)
    assert.equal(r.start.toISOString(), '2026-11-01T18:30:00.000Z')
    assert.equal(r.end.toISOString(), '2026-11-02T18:30:00.000Z')
    const meal = new Date('2026-11-01T19:30:00.000Z')
    assert.ok(meal >= r.start && meal < r.end)
  })
  it('shifts the other way for US Eastern (offset 300 in standard time)', () => {
    const r = localDayRange('2026-11-02', 300)
    assert.equal(r.start.toISOString(), '2026-11-02T05:00:00.000Z')
    assert.equal(r.end.toISOString(), '2026-11-03T05:00:00.000Z')
  })
  it('rejects malformed or absent input (caller falls back to server day)', () => {
    assert.equal(localDayRange(''), null)
    assert.equal(localDayRange(undefined), null)
    assert.equal(localDayRange('01/11/2026'), null)
    assert.equal(localDayRange('2026-13-01'), null)
    assert.equal(localDayRange('2026-11-1'), null)
  })
})
