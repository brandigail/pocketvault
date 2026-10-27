import type { TokenAccount } from '../../types'

export const MAX_FOLDER_LENGTH = 40

/**
 * Cleans a typed folder name. Blank means "no folder". If a folder with the same name in a different
 * case already exists, its spelling wins so "work" and "Work" never become two folders.
 */
export function normalizeFolder(input: string, existing: readonly string[] = []): string | undefined {
  const name = input.trim().replace(/\s+/g, ' ').slice(0, MAX_FOLDER_LENGTH)
  if (!name) return undefined
  return existing.find((candidate) => candidate.toLowerCase() === name.toLowerCase()) ?? name
}

/** Every folder in use, once each (ignoring case), sorted. */
export function folderNames(accounts: readonly TokenAccount[]): string[] {
  const seen = new Map<string, string>()
  for (const { folder } of accounts) {
    if (folder && !seen.has(folder.toLowerCase())) seen.set(folder.toLowerCase(), folder)
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b))
}

/** Keeps entries in the chosen folder (null = all) whose service, account or folder contains every word typed. */
export function filterAccounts<T extends { account: TokenAccount }>(entries: readonly T[], query: string, folder: string | null): T[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  return entries.filter(({ account }) => {
    if (folder !== null && account.folder?.toLowerCase() !== folder.toLowerCase()) return false
    const haystack = `${account.issuer} ${account.label} ${account.folder ?? ''}`.toLowerCase()
    return words.every((word) => haystack.includes(word))
  })
}
