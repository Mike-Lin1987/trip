# Photos Phase 3 Metadata Index Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a photo metadata index that preserves EXIF-derived fields, user edits, upload state, memoir fields, and future Drive/Firestore identifiers.

**Architecture:** Keep Phase 3 local-first with a repository interface, in-memory adapter for tests, localStorage adapter for the current static app, and a reserved Firestore adapter that fails explicitly until Phase 4/5. The `/photos` UI keeps its current mock look but reads and writes photo records through the repository once the page is mounted in the browser.

**Tech Stack:** Next.js App Router, React client component, TypeScript, Vitest, localStorage.

---

### Task 1: Repository API and Tests

**Files:**
- Create: `next-redesign/src/__tests__/photo-metadata-repository.test.ts`
- Create: `next-redesign/src/services/photoMetadataRepository.ts`
- Modify: `next-redesign/src/types/photos.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { mockPhotoRecords } from "@/data/photo-album";
import {
  PHOTO_METADATA_SCHEMA_VERSION,
  PHOTO_METADATA_STORAGE_KEY,
  createFirestorePhotoMetadataRepository,
  createLocalStoragePhotoMetadataRepository,
  createMemoryPhotoMetadataRepository,
  isPhotoRecord,
  normalizePhotoRecordForStorage,
} from "@/services/photoMetadataRepository";

describe("photo metadata repository", () => {
  it("upserts, patches, deletes, and sorts records in memory", async () => {
    const repository = createMemoryPhotoMetadataRepository([
      { ...mockPhotoRecords[0], sortOrder: 20 },
      { ...mockPhotoRecords[1], sortOrder: 10 },
    ]);

    const listed = await repository.listPhotos("hokuriku-2026");
    expect(listed.map((photo) => photo.id)).toEqual([
      mockPhotoRecords[1].id,
      mockPhotoRecords[0].id,
    ]);

    const saved = await repository.savePhotoMetadata({
      ...mockPhotoRecords[2],
      id: "photo-new",
      sortOrder: 5,
    });
    expect(saved.id).toBe("photo-new");
    expect((await repository.listPhotos("hokuriku-2026"))[0]?.id).toBe(
      "photo-new",
    );

    const updated = await repository.updatePhotoMetadata("photo-new", {
      caption: "Updated caption",
      tags: ["Day3", "coffee"],
      isFavorite: true,
    });
    expect(updated?.caption).toBe("Updated caption");
    expect(updated?.tags).toEqual(["Day3", "coffee"]);
    expect(updated?.isFavorite).toBe(true);

    expect(await repository.deletePhotoMetadata("photo-new")).toBe(true);
    expect(await repository.deletePhotoMetadata("photo-missing")).toBe(false);
  });

  it("persists a versioned trip envelope to localStorage", async () => {
    const storage = window.localStorage;
    storage.clear();
    const repository = createLocalStoragePhotoMetadataRepository(storage);

    await repository.savePhotoMetadata(mockPhotoRecords[0]);

    const rawEnvelope = storage.getItem(PHOTO_METADATA_STORAGE_KEY);
    expect(rawEnvelope).not.toBeNull();
    expect(JSON.parse(rawEnvelope ?? "{}")).toMatchObject({
      version: PHOTO_METADATA_SCHEMA_VERSION,
      tripId: "hokuriku-2026",
    });

    const reloaded = createLocalStoragePhotoMetadataRepository(storage);
    expect(await reloaded.listPhotos("hokuriku-2026")).toHaveLength(1);

    storage.setItem(
      PHOTO_METADATA_STORAGE_KEY,
      JSON.stringify({
        version: PHOTO_METADATA_SCHEMA_VERSION,
        tripId: "other-trip",
        photos: [mockPhotoRecords[0]],
      }),
    );
    expect(await reloaded.listPhotos("hokuriku-2026")).toEqual([]);

    storage.setItem(PHOTO_METADATA_STORAGE_KEY, "{bad json");
    expect(await reloaded.listPhotos("hokuriku-2026")).toEqual([]);
  });

  it("returns cloned records so callers cannot mutate repository state", async () => {
    const repository = createMemoryPhotoMetadataRepository([mockPhotoRecords[0]]);
    const [firstRead] = await repository.listPhotos("hokuriku-2026");
    firstRead.caption = "mutated outside repository";

    const [secondRead] = await repository.listPhotos("hokuriku-2026");
    expect(secondRead.caption).toBe(mockPhotoRecords[0].caption);
  });

  it("validates and normalizes the full metadata schema", () => {
    const normalized = normalizePhotoRecordForStorage({
      ...mockPhotoRecords[0],
      driveWebContentLink: undefined,
      thumbnailLink: undefined,
    });

    expect(isPhotoRecord(normalized)).toBe(true);
    expect(normalized.driveWebContentLink).toBeNull();
    expect(normalized.thumbnailLink).toBeNull();
    expect(normalized.mimeType).toBe("image/jpeg");
    expect(normalized.uploadedBy).toBe("family");
    expect(isPhotoRecord({ id: "missing-fields" })).toBe(false);
  });

  it("keeps Firestore reserved until the Drive-backed phase", async () => {
    const repository = createFirestorePhotoMetadataRepository();

    await expect(repository.listPhotos("hokuriku-2026")).rejects.toThrow(
      "Firestore photo metadata adapter is reserved for Phase 4/5.",
    );
  });
});
```

- [ ] **Step 2: Run the test to verify RED**

Run: `npm.cmd test -- src/__tests__/photo-metadata-repository.test.ts`

Expected: FAIL because `photoMetadataRepository` does not exist.

- [ ] **Step 3: Implement repository API**

Create `photoMetadataRepository.ts` with:
- `PHOTO_METADATA_SCHEMA_VERSION = 1`
- `PHOTO_METADATA_STORAGE_KEY = "hokuriku-2026-photo-metadata-index"`
- `PhotoMetadataRepository` interface
- memory adapter
- localStorage adapter using a `{ version, tripId, photos }` envelope
- Firestore placeholder adapter whose methods reject clearly
- `isPhotoRecord` and `normalizePhotoRecordForStorage`

- [ ] **Step 4: Run the test to verify GREEN**

Run: `npm.cmd test -- src/__tests__/photo-metadata-repository.test.ts`

Expected: PASS.

### Task 2: Full PhotoRecord Schema

**Files:**
- Modify: `next-redesign/src/types/photos.ts`
- Modify: `next-redesign/src/data/photo-album.ts`
- Modify: `next-redesign/src/services/photoAutoOrganizer.ts`
- Test: `next-redesign/src/__tests__/photo-auto-organizer.test.ts`

- [ ] Add Drive, file, EXIF, and editor metadata fields to `PhotoRecord`.
- [ ] Update mock records through a helper so all records satisfy the full schema without changing visible copy.
- [ ] Pass `PhotoFileMetadata` into `buildInitialPhotoRecord` so uploaded photos lock file size, MIME type, dimensions, EXIF timestamp/GPS, camera model, orientation, last modified time, and normalized Japan time.
- [ ] Run `npm.cmd test -- src/__tests__/photo-auto-organizer.test.ts src/__tests__/photo-metadata-repository.test.ts`.

### Task 3: Wire UI Persistence

**Files:**
- Modify: `next-redesign/src/components/photos/PhotoJournal.tsx`
- Modify: `next-redesign/src/__tests__/photos-page.test.tsx`

- [ ] Load saved metadata from localStorage after mount; seed localStorage with mock records on first visit.
- [ ] Save uploaded records, caption edits, tag edits, favorite flags, and memoir changes through the repository.
- [ ] Keep receipt photos separate; do not add accounting receipt handling to `/photos`.
- [ ] Clear localStorage in UI tests so tests remain deterministic.
- [ ] Run `npm.cmd test -- src/__tests__/photos-page.test.tsx`.

### Task 4: Verification

**Files:**
- No new files.

- [ ] Run `npm.cmd run typecheck`.
- [ ] Run `npm.cmd run lint`.
- [ ] Run `npm.cmd test`.
- [ ] Run `npm.cmd run build`.
- [ ] Use the in-app browser or Playwright smoke to verify `/photos` still renders and uploads a mock photo without console errors.

### Self-Review

- Phase 3 covers metadata index, local persistence, schema normalization, and adapter boundaries.
- Google Drive OAuth/folder scan/upload remains intentionally out of scope for Phase 4/5.
- No placeholders remain in the tasks; each task has concrete files and commands.
