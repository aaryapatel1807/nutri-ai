// exercise-db tests — run with: npx vitest run lib/exercise-db.test.js
import { describe, it, expect } from 'vitest'
import { getExerciseInfo, EXERCISE_INFO_COUNT } from './exercise-db.js'

describe('exercise-db', () => {
  it('covers a large share of in-app workout exercises', () => {
    expect(EXERCISE_INFO_COUNT).toBeGreaterThanOrEqual(50)
  })

  it('returns step-by-step instructions for known exercises', () => {
    const info = getExerciseInfo('Barbell Bench Press')
    expect(info).not.toBeNull()
    expect(info.instructions.length).toBeGreaterThanOrEqual(3)
    expect(info.instructions.every((s) => typeof s === 'string' && s.length > 10)).toBe(true)
  })

  it('resolves case-insensitively', () => {
    expect(getExerciseInfo('barbell bench press')).not.toBeNull()
  })

  it('returns null for unknown exercises', () => {
    expect(getExerciseInfo('Moonwalk Sprint')).toBeNull()
  })

  it('carries level/equipment metadata', () => {
    const info = getExerciseInfo('Deadlift')
    expect(info).not.toBeNull()
    expect(typeof info.level).toBe('string')
  })
})
