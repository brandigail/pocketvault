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
- [ ] 16. README: pitch, features, stack, architecture notes, screenshot placeholders, run steps, 3-bullet "what to demo to a recruiter", Phase 2 list
- [ ] 17. Deploy to Netlify, set env vars, verify the public URL end to end
- [ ] 18. Push to GitHub and update the live URL in `README.md` and the root `LINKS.md`
