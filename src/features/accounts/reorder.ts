import type { TokenAccount } from '../../types'

/**
 * Moves one account a single place up (-1) or down (1) in a list already sorted for display.
 * Returns only the accounts whose `sortOrder` changed, renumbered from 1, so it also repairs
 * lists where several accounts share a value. Returns an empty list if the move is not possible.
 */
export function moveAccount(sorted: TokenAccount[], id: string, direction: -1 | 1): TokenAccount[] {
  const from = sorted.findIndex((account) => account.id === id)
  const to = from + direction
  if (from === -1 || to < 0 || to >= sorted.length) return []

  const reordered = [...sorted]
  const [moved] = reordered.splice(from, 1)
  if (!moved) return []
  reordered.splice(to, 0, moved)

  const original = new Map(sorted.map((account) => [account.id, account.sortOrder]))
  return reordered
    .map((account, index) => ({ ...account, sortOrder: index + 1 }))
    .filter((account) => account.sortOrder !== original.get(account.id))
}
