# Photos Phase 5 Drive Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upload selected travel photos from `/photos` into the existing Google Drive day folders and persist the returned Drive file metadata.

**Architecture:** Extend the existing Phase 4 Drive service with a browser multipart upload method using `files.create?uploadType=multipart`. Lift the Drive token and scan result state into `PhotoJournal` so upload processing can choose a target folder from `dayFolderMap`, upload the file, and save `driveFileId`, `driveFolderId`, and Drive links in the local metadata index.

**Tech Stack:** Next.js App Router, React client component, Vitest, Testing Library, Google Drive REST API, Google Identity Services.

---

### Task 1: Drive Upload Service

**Files:**
- Modify: `src/services/googleDrivePhotoService.ts`
- Modify: `src/types/photos.ts`
- Test: `src/__tests__/google-drive-photo-service.test.ts`

- [ ] **Step 1: Write failing service test**

Add a test that creates a fake image `File`, calls `service.uploadPhotoFile({ file, fileName, folderId })`, and asserts:

```ts
expect(requestUrl.toString()).toContain(
  "https://www.googleapis.com/upload/drive/v3/files",
);
expect(new URL(requestUrl.toString()).searchParams.get("uploadType")).toBe(
  "multipart",
);
expect(new URL(requestUrl.toString()).searchParams.get("fields")).toContain("id");
expect(init.method).toBe("POST");
expect(init.headers.Authorization).toBe("Bearer token-123");
expect(init.headers["Content-Type"]).toContain("multipart/related");
expect(String(init.body)).toContain('"parents":["folder-day05"]');
expect(String(init.body)).toContain("HOKURIKU2026_Day05_photo.jpg");
expect(uploaded.id).toBe("drive-photo-1");
```

- [ ] **Step 2: Verify RED**

Run:

```bash
npm.cmd test -- src/__tests__/google-drive-photo-service.test.ts
```

Expected: FAIL because `uploadPhotoFile` is not implemented.

- [ ] **Step 3: Implement multipart upload**

Add `PhotoDriveUploadResult`, accept a `File`, target filename, and parent folder ID, build a `multipart/related` body with JSON metadata plus media content, POST to `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink,thumbnailLink,parents`, and normalize the response.

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npm.cmd test -- src/__tests__/google-drive-photo-service.test.ts
```

Expected: PASS.

### Task 2: PhotoJournal Upload Integration

**Files:**
- Modify: `src/components/photos/PhotoJournal.tsx`
- Test: `src/__tests__/photos-page.test.tsx`

- [ ] **Step 1: Write failing UI test**

Mock `requestGoogleDriveAccessToken` and `createGoogleDrivePhotoService`, upload one file, and assert the page shows the Drive upload status and persists:

```ts
expect(screen.getByText("已上傳 Drive")).toBeInTheDocument();
expect(savedPhoto.driveFileId).toBe("drive-photo-1");
expect(savedPhoto.driveFolderId).toBe("folder-day05");
expect(savedPhoto.driveWebViewLink).toBe(
  "https://drive.google.com/file/d/drive-photo-1/view",
);
```

- [ ] **Step 2: Verify RED**

Run:

```bash
npm.cmd test -- src/__tests__/photos-page.test.tsx
```

Expected: FAIL because uploads remain local-only.

- [ ] **Step 3: Lift Drive session state**

Move `scanResult`, `rootFolderId`, `accessToken`, `driveStatusMessage`, `driveError`, and busy state from `DriveStatusPanel` into `PhotoJournal`. Pass the state and callbacks into `DriveStatusPanel`.

- [ ] **Step 4: Upload after auto classification**

In `processUploadedFile`, after building the initial photo record, use `chooseTargetDriveFolder(detection, scanResult.dayFolderMap)`. If a token and target folder exist, call `service.uploadPhotoFile`; merge returned Drive metadata into the record. If no token exists, keep local metadata and show `待連接 Drive`.

- [ ] **Step 5: Verify GREEN**

Run:

```bash
npm.cmd test -- src/__tests__/photos-page.test.tsx
```

Expected: PASS.

### Task 3: Verification And Docs

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Document Phase 5 behavior**

Update the photo album section to state that Phase 5 uploads images to Drive folders after Google Drive is connected, while tokens remain in browser memory.

- [ ] **Step 2: Run verification**

Run:

```bash
npm.cmd test -- src/__tests__/google-drive-photo-service.test.ts src/__tests__/photos-page.test.tsx
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

Expected: all pass.

- [ ] **Step 3: Browser smoke**

Open `http://localhost:3100/photos` and verify the Drive panel still shows 11 folder mappings and the upload panel still renders.
