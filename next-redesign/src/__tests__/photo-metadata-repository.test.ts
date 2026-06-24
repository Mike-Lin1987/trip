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

  it("migrates bundled demo photo thumbnails to compressed WebP assets", () => {
    const normalized = normalizePhotoRecordForStorage({
      ...mockPhotoRecords[0],
      thumbnailSrc: "/images/yamanaka-onsen.jpg",
    });
    const external = normalizePhotoRecordForStorage({
      ...mockPhotoRecords[0],
      thumbnailSrc: "https://drive.google.com/thumbnail?id=abc",
    });

    expect(normalized.thumbnailSrc).toBe("/images/yamanaka-onsen.webp");
    expect(external.thumbnailSrc).toBe("https://drive.google.com/thumbnail?id=abc");
  });

  it("keeps Firestore reserved until the Drive-backed phase", async () => {
    const repository = createFirestorePhotoMetadataRepository();

    await expect(repository.listPhotos("hokuriku-2026")).rejects.toThrow(
      "Firestore photo metadata adapter is reserved for Phase 4/5.",
    );
  });
});
