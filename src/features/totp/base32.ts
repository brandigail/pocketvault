const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

/** Canonical form of a Base32 secret: uppercase, without spaces, dashes or `=` padding. */
export function normalizeBase32(input: string): string {
  return input.replace(/[\s-]/g, '').replace(/=+$/, '').toUpperCase()
}

/** Decodes RFC 4648 Base32. Accepts the loose formats that services display secrets in. */
export function decodeBase32(input: string): Uint8Array<ArrayBuffer> {
  const clean = normalizeBase32(input)
  if (clean.length === 0) throw new Error('Secret is empty')

  const bytes: number[] = []
  let buffer = 0
  let bits = 0
  for (const char of clean) {
    const value = ALPHABET.indexOf(char)
    if (value === -1) throw new Error(`Invalid Base32 character: ${char}`)
    buffer = (buffer << 5) | value
    bits += 5
    if (bits >= 8) {
      bits -= 8
      bytes.push((buffer >> bits) & 0xff)
      buffer &= (1 << bits) - 1
    }
  }
  if (bytes.length === 0) throw new Error('Secret is too short')
  return new Uint8Array(bytes)
}
