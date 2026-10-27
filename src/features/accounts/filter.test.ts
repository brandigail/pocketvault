import { describe, expect, it } from 'vitest'
import type { TokenAccount } from '../../types'
import { filterAccounts, folderNames, normalizeFolder } from './filter'

const account = (id: string, issuer: string, label: string, folder?: string): { account: TokenAccount } => ({
  account: { id, issuer, label, algorithm: 'SHA1', digits: 6, period: 30, createdAt: '', sortOrder: 0, ...(folder ? { folder } : {}) },
})

const entries = [
  account('1', 'GitHub', 'octocat@example.com', 'Work'),
  account('2', 'Google', 'jane@example.com', 'Personal'),
  account('3', 'AWS', 'admin', 'work'),
  account('4', 'Netlify', 'brandon'),
]

describe('normalizeFolder', () => {
  it('trims, collapses spaces and treats blank as no folder', () => {
    expect(normalizeFolder('  Side   projects ')).toBe('Side projects')
    expect(normalizeFolder('   ')).toBeUndefined()
  })

  it('reuses the spelling of an existing folder regardless of case', () => {
    expect(normalizeFolder('WORK', ['Personal', 'Work'])).toBe('Work')
    expect(normalizeFolder('Banking', ['Work'])).toBe('Banking')
  })

  it('limits the length', () => {
    expect(normalizeFolder('x'.repeat(100))).toHaveLength(40)
  })
})

describe('folderNames', () => {
  it('lists each folder once, ignoring case, sorted', () => {
    expect(folderNames(entries.map((entry) => entry.account))).toEqual(['Personal', 'Work'])
  })
})

describe('filterAccounts', () => {
  const ids = (list: { account: TokenAccount }[]) => list.map((entry) => entry.account.id)

  it('returns everything for an empty query and no folder', () => {
    expect(ids(filterAccounts(entries, '', null))).toEqual(['1', '2', '3', '4'])
  })

  it('matches service or account name, ignoring case', () => {
    expect(ids(filterAccounts(entries, 'GIT', null))).toEqual(['1'])
    expect(ids(filterAccounts(entries, 'jane', null))).toEqual(['2'])
  })

  it('requires every word to match', () => {
    expect(ids(filterAccounts(entries, 'example work', null))).toEqual(['1'])
    expect(ids(filterAccounts(entries, 'example nothing', null))).toEqual([])
  })

  it('filters by folder, ignoring case, and combines with the query', () => {
    expect(ids(filterAccounts(entries, '', 'Work'))).toEqual(['1', '3'])
    expect(ids(filterAccounts(entries, 'aws', 'Work'))).toEqual(['3'])
    expect(ids(filterAccounts(entries, 'google', 'Work'))).toEqual([])
  })
})
