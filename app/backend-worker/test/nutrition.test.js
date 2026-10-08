// Port of app/backend/tests/nutrition.test.js (node:test, CommonJS) to ESM for
// the Worker build. Covers utils/nutrition.js — the same 18 behaviors.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeMealInput, sumMacros, macroSplit, MEAL_TYPES } from '../src/utils/nutrition.js'

test('normalizeMealInput: happy path keeps values and parses the date', () => {
  const res = normalizeMealInput({
    name: 'Paneer Tikka',
    calories: 250,
    protein: 18,
    carbs: 12,
    fat: 14,
    mealType: 'Lunch',
    date: '2026-10-08T10:00:00.000Z',
  })
  assert.ok(!res.error)
  assert.equal(res.value.name, 'Paneer Tikka')
  assert.equal(res.value.calories, 250)
  assert.equal(res.value.mealType, 'Lunch')
  assert.ok(res.value.date instanceof Date)
})

test('normalizeMealInput: numeric strings coerce to numbers', () => {
  const res = normalizeMealInput({ calories: '120', protein: '10.5' })
  assert.ok(!res.error)
  assert.equal(res.value.calories, 120)
  assert.equal(res.value.protein, 10.5)
})

test('normalizeMealInput: missing macros default to 0, name to Unknown', () => {
  const res = normalizeMealInput({})
  assert.ok(!res.error)
  assert.equal(res.value.calories, 0)
  assert.equal(res.value.protein, 0)
  assert.equal(res.value.carbs, 0)
  assert.equal(res.value.fat, 0)
  assert.equal(res.value.name, 'Unknown')
})

test('normalizeMealInput: non-numeric macros become 0', () => {
  const res = normalizeMealInput({ calories: 'abc', protein: NaN })
  assert.ok(!res.error)
  assert.equal(res.value.calories, 0)
  assert.equal(res.value.protein, 0)
})

test('normalizeMealInput: negative macros clamp to 0', () => {
  const res = normalizeMealInput({ calories: -50, fat: -2 })
  assert.ok(!res.error)
  assert.equal(res.value.calories, 0)
  assert.equal(res.value.fat, 0)
})

test('normalizeMealInput: absurd values are capped', () => {
  const res = normalizeMealInput({ calories: 999999999, protein: 999999 })
  assert.ok(!res.error)
  assert.ok(res.value.calories <= 20000)
  assert.ok(res.value.protein <= 2000)
})

test('normalizeMealInput: invalid mealType falls back to Breakfast', () => {
  const res = normalizeMealInput({ mealType: 'Brunch' })
  assert.ok(!res.error)
  assert.equal(res.value.mealType, 'Breakfast')
})

test('normalizeMealInput: every valid MEAL_TYPE is accepted', () => {
  for (const t of MEAL_TYPES) {
    const res = normalizeMealInput({ mealType: t })
    assert.ok(!res.error)
    assert.equal(res.value.mealType, t)
  }
})

test('normalizeMealInput: invalid date returns an error', () => {
  const res = normalizeMealInput({ date: 'not-a-date' })
  assert.equal(res.error, 'Invalid date')
})

test('normalizeMealInput: blank name becomes Unknown', () => {
  const res = normalizeMealInput({ name: '   ' })
  assert.ok(!res.error)
  assert.equal(res.value.name, 'Unknown')
})

test('sumMacros: sums across meals', () => {
  const total = sumMacros([
    { calories: 300, protein: 20, carbs: 30, fat: 10 },
    { calories: 500, protein: 30, carbs: 50, fat: 20 },
  ])
  assert.deepEqual(total, { calories: 800, protein: 50, carbs: 80, fat: 30 })
})

test('sumMacros: empty array gives zeros', () => {
  assert.deepEqual(sumMacros([]), { calories: 0, protein: 0, carbs: 0, fat: 0 })
})

test('sumMacros: null/undefined entries tolerated', () => {
  assert.deepEqual(sumMacros(null), { calories: 0, protein: 0, carbs: 0, fat: 0 })
  assert.deepEqual(sumMacros(undefined), { calories: 0, protein: 0, carbs: 0, fat: 0 })
})

test('sumMacros: string numbers coerce, junk becomes 0', () => {
  const total = sumMacros([{ calories: '250', protein: 'abc', carbs: null, fat: undefined }])
  assert.equal(total.calories, 250)
  assert.equal(total.protein, 0)
  assert.equal(total.carbs, 0)
  assert.equal(total.fat, 0)
})

test('macroSplit: 30/40/30-ish split for a balanced meal', () => {
  // p:30g c:60g f:20g -> 120/240/180 kcal -> 22/44/33 %
  const split = macroSplit({ protein: 30, carbs: 60, fat: 20 })
  assert.deepEqual(split, { protein: 22, carbs: 44, fat: 33 })
})

test('macroSplit: all zeros returns zeros', () => {
  assert.deepEqual(macroSplit({ protein: 0, carbs: 0, fat: 0 }), {
    protein: 0,
    carbs: 0,
    fat: 0,
  })
})

test('macroSplit: single macro is 100%', () => {
  assert.deepEqual(macroSplit({ protein: 25, carbs: 0, fat: 0 }), {
    protein: 100,
    carbs: 0,
    fat: 0,
  })
})

test('macroSplit: percentages roughly sum to 100', () => {
  const split = macroSplit({ protein: 95, carbs: 210, fat: 70 })
  const total = split.protein + split.carbs + split.fat
  assert.ok(total >= 99 && total <= 101, `split summed to ${total}`)
})
