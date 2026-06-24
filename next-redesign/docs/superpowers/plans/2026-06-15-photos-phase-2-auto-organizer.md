# Photos Phase 2 Auto Organizer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add EXIF-aware automatic photo classification for the Hokuriku 2026 album without connecting Google Drive yet.

**Architecture:** Put pure classification logic in `src/services/photoAutoOrganizer.ts`, place coordinate candidates in `src/data/photo-place-candidates.ts`, and keep React upload UI as a thin caller. The service returns deterministic metadata and detection results that Phase 3 can persist and Phase 4/5 can send to Google Drive.

**Tech Stack:** Next.js, TypeScript, Vitest, browser `File` API, optional `exifr` for EXIF parsing, native Haversine distance calculation.

---

## File Structure

- Create `src/__tests__/photo-auto-organizer.test.ts`: covers Day detection, GPS place matching, confidence, stored filename generation, and initial record building.
- Create `src/data/photo-place-candidates.ts`: exports the prompt-provided candidate coordinates.
- Create `src/services/photoAutoOrganizer.ts`: exports `readPhotoMetadata`, `normalizeTakenAt`, `detectTripDay`, `detectPlaceByGps`, `inferPlaceByItinerary`, `generateAutoTags`, `calculateDetectionConfidence`, `buildStoredFileName`, `chooseTargetDriveFolder`, and `buildInitialPhotoRecord`.
- Modify `src/types/photos.ts`: add service input/output types and `PhotoPlaceCandidate`.
- Modify `src/components/photos/PhotoJournal.tsx`: use the service in the mock upload handler and show real auto-detection preview values when file metadata is available.
- Modify `package.json` / lockfile: add `exifr` dependency.

## Tasks

### Task 1: RED Tests

- [ ] Write tests importing `PHOTO_PLACE_CANDIDATES` and `photoAutoOrganizer`.
- [ ] Verify `detectTripDay("2026-11-15T23:30:00+08:00")` returns Day 3 because the Japan local date is 2026-11-16.
- [ ] Verify GPS near 東寺 returns `toji` and distance within radius.
- [ ] Verify GPS + matching Day returns high confidence, date-only inference returns low confidence, and no time/GPS returns unknown.
- [ ] Verify `buildStoredFileName` returns `HOKURIKU2026_Day03_2026-11-16_Kyoto_Arashiyama_001.jpg` and unsorted fallback returns `HOKURIKU2026_Unsorted_001.jpg`.
- [ ] Verify `buildInitialPhotoRecord` maps an EXIF/GPS detection into a `PhotoRecord` with Day/date/place/tags and maps no EXIF into `needs-review`.
- [ ] Run `npm.cmd test -- src/__tests__/photo-auto-organizer.test.ts` and confirm RED because the service does not exist.

### Task 2: Service Implementation

- [ ] Add `exifr` dependency.
- [ ] Create candidate data file.
- [ ] Create service types.
- [ ] Implement date normalization using Japan local calendar date via `Intl.DateTimeFormat`.
- [ ] Implement Haversine distance in meters.
- [ ] Implement place, Day, tag, confidence, filename, target folder, and initial record functions.
- [ ] Implement `readPhotoMetadata` with `exifr.parse(file, { gps: true, tiff: true, ifd0: true, exif: true })`, falling back to file metadata when EXIF is unavailable.

### Task 3: UI Integration

- [ ] Update `PhotoJournal.handleUpload` to call `readPhotoMetadata` and `buildInitialPhotoRecord` for each selected file.
- [ ] Keep upload non-blocking by setting a `reading-metadata` preview first, then replacing it with detection results.
- [ ] Keep uploaded photos local only; Drive folder selection remains mock until Phase 4/5.

### Task 4: Verification

- [ ] Run `npm.cmd test -- src/__tests__/photo-auto-organizer.test.ts src/__tests__/photos-page.test.tsx`.
- [ ] Run `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd test`, and `npm.cmd run build`.
- [ ] Browser-smoke `/photos` upload mock and confirm no Day/date/place fields are required before upload.
