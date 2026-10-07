// foods-db tests — run with: npx vitest run lib/foods-db.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import {
  FOODS, CATEGORIES, searchFoods, scaleFood,
  getRecentFoods, addRecentFood,
  getFavoriteFoods, toggleFavorite, isFavorite,
} from './foods-db.js'

// Minimal localStorage stub (node has none)
const store = new Map()
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
}

beforeEach(() => store.clear())

describe('FOODS dataset', () => {
  it('has 100+ curated entries with valid macros', () => {
    expect(FOODS.length).toBeGreaterThanOrEqual(100)
    for (const f of FOODS) {
      expect(f.name).toBeTruthy()
      expect(f.kcal).toBeGreaterThan(0)
      for (const k of ['p', 'c', 'f']) {
        expect(f[k]).toBeGreaterThanOrEqual(0)
      }
      expect(CATEGORIES).toContain(f.cat)
    }
  })

  it('has no duplicate names', () => {
    const names = FOODS.map((f) => f.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('covers Indian staples (core audience)', () => {
    const names = FOODS.map((f) => f.name.toLowerCase())
    for (const staple of ['roti', 'dal', 'dosa', 'paneer', 'biryani']) {
      expect(names.some((n) => n.includes(staple))).toBe(true)
    }
  })
})

describe('searchFoods', () => {
  it('finds by exact and partial name', () => {
    expect(searchFoods('dosa').map((f) => f.name)).toContain('Dosa - Plain (1)')
    expect(searchFoods('paneer').length).toBeGreaterThanOrEqual(3)
  })

  it('matches tags (e.g. chapati → roti)', () => {
    expect(searchFoods('chapati')[0].name).toContain('Roti')
  })

  it('requires every token to match (chicken biryani)', () => {
    const r = searchFoods('chicken biryani')
    expect(r.length).toBeGreaterThan(0)
    expect(r[0].name.toLowerCase()).toContain('biryani')
  })

  it('returns empty for gibberish', () => {
    expect(searchFoods('xyzqwerty123')).toHaveLength(0)
  })

  it('is case-insensitive', () => {
    expect(searchFoods('PANEER').length).toBe(searchFoods('paneer').length)
  })

  it('returns category-ordered list for empty query', () => {
    expect(searchFoods('').length).toBeGreaterThan(0)
  })
})

describe('scaleFood', () => {
  it('scales macros by portion factor', () => {
    const s = scaleFood({ name: 'x', kcal: 200, p: 10, c: 20, f: 5 }, 1.5)
    expect(s.kcal).toBe(300)
    expect(s.p).toBe(15)
  })

  it('handles 0.5x', () => {
    expect(scaleFood({ name: 'x', kcal: 89, p: 1, c: 23, f: 0 }, 0.5).kcal).toBe(45)
  })
})

describe('recents & favorites', () => {
  it('tracks recents most-recent-first, deduped', () => {
    addRecentFood('Banana')
    addRecentFood('Roti (2 pieces)')
    addRecentFood('Banana')
    expect(getRecentFoods().map((f) => f.name)).toEqual(['Banana', 'Roti (2 pieces)'])
  })

  it('toggles favorites', () => {
    expect(isFavorite('Banana')).toBe(false)
    toggleFavorite('Banana')
    expect(isFavorite('Banana')).toBe(true)
    expect(getFavoriteFoods().map((f) => f.name)).toContain('Banana')
    toggleFavorite('Banana')
    expect(isFavorite('Banana')).toBe(false)
  })
})
