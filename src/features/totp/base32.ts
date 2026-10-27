const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

/** Decodes RFC 4648 Base32. Tolerates lowercase, spaces, dashes and `=` padding, as authenticator apps show secrets that way. */
export function decodeBase32(input: string): Uint8Array<ArrayBuffer> {
  const clean = input.replace(/[\s-]/g, '').replace(/=+$/, '').toUpperCase()
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
