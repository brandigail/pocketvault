import { describe, expect, it } from 'vitest'
import { lockoutDelayMs } from './lockout'

describe('lockoutDelayMs', () => {
  it('allows the first three wrong PINs without delay', () => {
    expect([0, 1, 2].map(lockoutDelayMs)).toEqual([0, 0, 0])
  })

  it('doubles the delay from 30 seconds', () => {
    expect([3, 4, 5, 6].map(lockoutDelayMs)).toEqual([30_000, 60_000, 120_000, 240_000])
  })

  it('caps at one hour', () => {
    expect(lockoutDelayMs(10)).toBe(3_600_000)
    expect(lockoutDelayMs(500)).toBe(3_600_000)
  })
})
