# PocketVault

Offline TOTP authenticator with encrypted storage, QR scanning and PIN lock. Zero network needed.

## Planned features
- TOTP engine (RFC 6238, SHA-1/256/512, 6/8 digits, 30 s period) via Web Crypto, verified against RFC test vectors.
- Account list with live codes, countdown ring and tap-to-copy; add via camera QR scan, otpauth URI paste or manual entry.
- Encrypted storage: PIN-derived key (PBKDF2) wraps the secrets with AES-GCM; auto-lock and wrong-PIN lockout delay.

### Phase 2
- Biometric unlock via WebAuthn where supported
- Encrypted backup export/import
- Folders and search
- HOTP support

## Stack
React, Vite, TypeScript strict, Tailwind CSS, Web Crypto API (HMAC for TOTP, PBKDF2 + AES-GCM for storage), `jsqr` for camera QR decoding, IndexedDB, vite-plugin-pwa. No backend, Netlify

## Live demo
Live demo: TBD

## Run locally
Run locally: TBD

## Status
Not started
