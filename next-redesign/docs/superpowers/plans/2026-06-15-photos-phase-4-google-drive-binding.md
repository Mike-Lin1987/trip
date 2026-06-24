# Photos Phase 4 Google Drive Binding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the `/photos` page to the existing Google Drive album folder so the app can authenticate, scan album day folders, build `dayFolderMap`, and show missing folder actions before Phase 5 uploads.

**Architecture:** Keep upload out of scope. Add a focused Drive service that wraps Google Identity Services token auth and Drive REST folder operations. The UI stores only the selected root folder ID and scan result locally; access tokens stay in memory and are requested from a user button click.

**Tech Stack:** Next.js App Router, React client component, TypeScript, Vitest, Google Identity Services token model, Google Drive API v3 REST.

---

### Task 1: Drive Folder Service

**Files:**
- Create: `next-redesign/src/services/googleDrivePhotoService.ts`
- Create: `next-redesign/src/__tests__/google-drive-photo-service.test.ts`
- Modify: `next-redesign/src/types/photos.ts`

- [ ] Write tests for root folder ID extraction, required album folder matching, missing folder detection, Drive `files.list` request construction, and `files.create` folder creation.
- [ ] Run `npm.cmd test -- src/__tests__/google-drive-photo-service.test.ts` and verify RED because the service does not exist.
- [ ] Implement Drive folder types and service functions.
- [ ] Run the same test and verify GREEN.

### Task 2: `/photos` Drive Binding UI

**Files:**
- Modify: `next-redesign/src/components/photos/PhotoJournal.tsx`
- Modify: `next-redesign/src/data/photo-album.ts`
- Modify: `next-redesign/src/__tests__/photos-page.test.tsx`

- [ ] Add a root folder ID input, Drive sign-in button, scan button, missing folder summary, and day folder map preview.
- [ ] Keep Drive token in React state only.
- [ ] Save scan result to localStorage so users do not rescan on every reload.
- [ ] Add UI tests for root folder ID visibility, missing `98_待整理照片`, and local scan result persistence.

### Task 3: Environment and Docs

**Files:**
- Modify: `next-redesign/.env.example`
- Add or update ignored local file: `next-redesign/.env.local`
- Modify: `next-redesign/README.md`

- [ ] Document `NEXT_PUBLIC_GOOGLE_CLIENT_ID` and `NEXT_PUBLIC_GOOGLE_DRIVE_ALBUM_FOLDER_ID`.
- [ ] Add the discovered album root folder ID to local `.env.local`.
- [ ] Document that `drive.file` is the intended scope and access tokens are not stored.

### Task 4: Verification

**Files:**
- No new files.

- [ ] Run `npm.cmd run typecheck`.
- [ ] Run `npm.cmd run lint`.
- [ ] Run `npm.cmd test`.
- [ ] Run `npm.cmd run build`.
- [ ] Browser smoke `/photos` after Travel Pass: verify Drive panel, root folder ID, missing folder warning, and no console errors.

### Self-Review

- Phase 4 covers Google sign-in, root folder ID, folder scanning, `dayFolderMap`, and missing folder UI.
- Photo upload to Drive stays in Phase 5.
- Memoir export stays in Phase 6.
