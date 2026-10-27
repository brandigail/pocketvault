import { describe, expect, it } from 'vitest'
import type { TokenAccount } from '../../types'
import { moveAccount } from './reorder'

const account = (id: string, sortOrder: number): TokenAccount => ({
  id,
  issuer: id,
  label: '',
  algorithm: 'SHA1',
  digits: 6,
  period: 30,
  createdAt: '2026-01-01T00:00:00.000Z',
  sortOrder,
})

const orders = (changed: TokenAccount[]) => Object.fromEntries(changed.map((a) => [a.id, a.sortOrder]))

describe('moveAccount', () => {
  const list = [account('a', 1), account('b', 2), account('c', 3)]

  it('swaps an account with its upper neighbour', () => {
    expect(orders(moveAccount(list, 'b', -1))).toEqual({ a: 2, b: 1 })
  })

  it('swaps an account with its lower neighbour', () => {
    expect(orders(moveAccount(list, 'b', 1))).toEqual({ b: 3, c: 2 })
  })

  it('does nothing at the ends or for an unknown id', () => {
    expect(moveAccount(list, 'a', -1)).toEqual([])
    expect(moveAccount(list, 'c', 1)).toEqual([])
    expect(moveAccount(list, 'zzz', 1)).toEqual([])
  })

  it('repairs lists where accounts share the same sortOrder', () => {
    const tied = [account('a', 0), account('b', 0), account('c', 0)]
    expect(orders(moveAccount(tied, 'c', -1))).toEqual({ a: 1, c: 2, b: 3 })
  })
})
