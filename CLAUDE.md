# PocketVault: Offline TOTP Authenticator

Read the portfolio-root `CLAUDE.md` first for global rules. This file is the brief for this project.

## What it is
A 2FA code generator that works entirely offline. Scan or paste otpauth URIs, see rolling 6-digit codes with a countdown, and keep secrets encrypted at rest behind a PIN.

## Stack
React, Vite, TypeScript strict, Tailwind CSS, Web Crypto API (HMAC for TOTP, PBKDF2 + AES-GCM for storage), `jsqr` for camera QR decoding, IndexedDB, vite-plugin-pwa. No backend. Hosted on Netlify. (PWA chosen over Expo to ship faster.) No Supabase, no Vercel, no Gemini/OpenAI.

## MVP (build first)
1. TOTP engine (RFC 6238, SHA-1/256/512, 6/8 digits, 30 s period) via Web Crypto, verified against RFC test vectors.
2. Account list with live codes, countdown ring and tap-to-copy; add via camera QR scan, otpauth URI paste or manual entry.
3. Encrypted storage: PIN-derived key (PBKDF2) wraps the secrets with AES-GCM; auto-lock and wrong-PIN lockout delay.

## Phase 2
Biometric unlock via WebAuthn where supported, Encrypted backup export/import, Folders and search, HOTP support.

## Data model (put in `types/`)
```ts
export interface TokenAccount { id: string; issuer: string; label: string; algorithm: 'SHA1' | 'SHA256' | 'SHA512'; digits: 6 | 8; period: number; createdAt: string }
export interface StoredSecret { accountId: string; ciphertext: string; iv: string } // secret is encrypted, never stored in plain text
export interface VaultMeta { salt: string; iterations: number; verifier: string; failedAttempts: number; lockedUntil: number | null }
```

## Rules specific to this project
- Unit-test the TOTP code against the RFC 6238 test vectors before building UI.
- Never log or persist plaintext secrets; keep the derived key in memory only and clear it on lock.
- Camera scanning needs HTTPS and permission handling; always offer manual entry as a fallback.
- Seed demo accounts with obviously fake secrets only, labelled "Demo".
- Never include real service secrets in the repo.
- Seed realistic demo data so the app looks alive on first load without sign-up.

## Start here
1. Scaffold Vite + Tailwind + vite-plugin-pwa, commit.
2. Implement and test the TOTP module against RFC vectors.
3. Work through `PLAN.md` from step 2.
