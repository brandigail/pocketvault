# PocketVault: Build Plan

- [x] 1. Scaffold the project (stack in `CLAUDE.md`), strict `tsconfig`, lint, `netlify.toml`, `.env.example`; first working commit
- [x] 2. Storage layer (IndexedDB) and `types/`
- [x] 3. Base32 decode and TOTP engine with RFC test-vector tests
- [x] 4. otpauth URI parser with tests
- [x] 5. PIN setup, key derivation and encrypted secret storage
- [x] 6. Lock screen with lockout delay and auto-lock
- [x] 7. Account list with live codes and countdown ring
- [x] 8. Add account: manual entry and URI paste
- [x] 9. Camera QR scanning with jsqr
- [x] 10. Edit, delete and reorder accounts
- [x] 11. Seed demo accounts
- [x] 12. Offline verification (airplane mode)
- [x] 13. PWA manifest, offline shell, update banner
- [x] 14. Mobile polish at 375px
- [x] 15. Quality gate: `npm run build`, lint and `tsc --noEmit` all pass; no console errors; core flow tested at 375px and desktop
- [x] 16. README: pitch, features, stack, architecture notes, screenshot placeholders, run steps, 3-bullet "what to demo to a recruiter", Phase 2 list
- [x] 17. Deploy to Netlify, set env vars, verify the public URL end to end
- [x] 18. Push to GitHub and update the live URL in `README.md` and the root `LINKS.md`

## Phase 2

- [x] 19. HOTP: RFC 4226 engine with test vectors, otpauth `hotp` links, counter stored per account, "next code" button
- [ ] 20. Folders and search: folder per account, folder chips, search box, compact header with a settings button
- [ ] 21. Settings screen and encrypted backup: password-protected export (PIN re-check) and import with duplicate skipping
- [ ] 22. Biometric unlock (optional): WebAuthn PRF wraps the vault key, enable/disable in settings, PIN always works
- [ ] 23. Phase 2 quality gate, README and security notes, deploy, verify on the live URL
