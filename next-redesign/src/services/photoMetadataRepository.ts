import type {
  PhotoDetectionConfidence,
  PhotoDetectionSource,
  PhotoRecord,
  PhotoUploadStatus,
} from "@/types/photos";

export const PHOTO_METADATA_SCHEMA_VERSION = 1;
export const PHOTO_METADATA_STORAGE_KEY = "hokuriku-2026-photo-metadata-index";

type TripId = PhotoRecord["tripId"];

export type PhotoMetadataPatch = Partial<
  Omit<PhotoRecord, "id" | "tripId" | "uploadedAt">
>;

export type PhotoMetadataRepository = {
  listPhotos(tripId: TripId): Promise<PhotoRecord[]>;
  savePhotoMetadata(photo: PhotoRecord): Promise<PhotoRecord>;
  updatePhotoMetadata(
    photoId: string,
    patch: PhotoMetadataPatch,
  ): Promise<PhotoRecord | null>;
  deletePhotoMetadata(photoId: string): Promise<boolean>;
};

type PhotoMetadataEnvelope = {
  version: typeof PHOTO_METADATA_SCHEMA_VERSION;
  tripId: TripId;
  photos: PhotoRecord[];
};

const uploadStatuses: PhotoUploadStatus[] = [
  "uploaded",
  "needs-review",
  "pending",
  "failed",
];

const detectionSources: PhotoDetectionSource[] = [
  "exif-gps",
  "exif-date",
  "itinerary-inference",
  "file-last-modified",
  "manual",
  "unknown",
];

const detectionConfidences: PhotoDetectionConfidence[] = [
  "high",
  "medium",
  "low",
  "unknown",
];

const bundledPhotoSrcMigration: Record<string, string> = {
  "/images/yamanaka-onsen.jpg": "/images/yamanaka-onsen.webp",
  "/images/yamanaka-onsen-kisshotei.jpg":
    "/images/yamanaka-onsen-kisshotei.webp",
};

export function createMemoryPhotoMetadataRepository(
  initialPhotos: PhotoRecord[] = [],
): PhotoMetadataRepository {
  let photos = initialPhotos.map(normalizePhotoRecordForStorage);

  return {
    async listPhotos(tripId) {
      return cloneRecords(sortPhotos(photos.filter((photo) => photo.tripId === tripId)));
    },
    async savePhotoMetadata(photo) {
      const normalized = normalizePhotoRecordForStorage(photo);
      const existingIndex = photos.findIndex((item) => item.id === normalized.id);

      if (existingIndex >= 0) {
        photos = photos.map((item, index) =>
          index === existingIndex ? normalized : item,
        );
      } else {
        photos = [...photos, normalized];
      }

      return cloneRecord(normalized);
    },
    async updatePhotoMetadata(photoId, patch) {
      const existing = photos.find((photo) => photo.id === photoId);

      if (!existing) {
        return null;
      }

      const updated = normalizePhotoRecordForStorage({
        ...existing,
        ...patch,
        updatedAt: new Date().toISOString(),
      });
      photos = photos.map((photo) => (photo.id === photoId ? updated : photo));

      return cloneRecord(updated);
    },
    async deletePhotoMetadata(photoId) {
      const nextPhotos = photos.filter((photo) => photo.id !== photoId);
      const deleted = nextPhotos.length !== photos.length;
      photos = nextPhotos;

      return deleted;
    },
  };
}

export function createLocalStoragePhotoMetadataRepository(
  storage: Storage | null | undefined = globalThis.localStorage,
): PhotoMetadataRepository {
  return {
    async listPhotos(tripId) {
      if (!storage) {
        return [];
      }

      const envelope = readEnvelope(storage);

      if (!envelope || envelope.tripId !== tripId) {
        return [];
      }

      return cloneRecords(sortPhotos(envelope.photos));
    },
    async savePhotoMetadata(photo) {
      if (!storage) {
        return normalizePhotoRecordForStorage(photo);
      }

      const normalized = normalizePhotoRecordForStorage(photo);
      const photos = readPhotosForTrip(storage, normalized.tripId);
      const existingIndex = photos.findIndex((item) => item.id === normalized.id);
      const nextPhotos =
        existingIndex >= 0
          ? photos.map((item, index) => (index === existingIndex ? normalized : item))
          : [...photos, normalized];

      writeEnvelope(storage, normalized.tripId, nextPhotos);

      return cloneRecord(normalized);
    },
    async updatePhotoMetadata(photoId, patch) {
      if (!storage) {
        return null;
      }

      const envelope = readEnvelope(storage);

      if (!envelope) {
        return null;
      }

      const existing = envelope.photos.find((photo) => photo.id === photoId);

      if (!existing) {
        return null;
      }

      const updated = normalizePhotoRecordForStorage({
        ...existing,
        ...patch,
        updatedAt: new Date().toISOString(),
      });
      writeEnvelope(
        storage,
        envelope.tripId,
        envelope.photos.map((photo) => (photo.id === photoId ? updated : photo)),
      );

      return cloneRecord(updated);
    },
    async deletePhotoMetadata(photoId) {
      if (!storage) {
        return false;
      }

      const envelope = readEnvelope(storage);

      if (!envelope) {
        return false;
      }

      const nextPhotos = envelope.photos.filter((photo) => photo.id !== photoId);
      const deleted = nextPhotos.length !== envelope.photos.length;
      writeEnvelope(storage, envelope.tripId, nextPhotos);

      return deleted;
    },
  };
}

export function createFirestorePhotoMetadataRepository(): PhotoMetadataRepository {
  const rejectReserved = () =>
    Promise.reject(
      new Error("Firestore photo metadata adapter is reserved for Phase 4/5."),
    );

  return {
    listPhotos: rejectReserved,
    savePhotoMetadata: rejectReserved,
    updatePhotoMetadata: rejectReserved,
    deletePhotoMetadata: rejectReserved,
  };
}

export function normalizePhotoRecordForStorage(
  photo: Partial<PhotoRecord>,
): PhotoRecord {
  const uploadedAt = stringOrDefault(photo.uploadedAt, new Date().toISOString());
  const tags = stringArray(photo.tags);
  const peopleTags = stringArray(photo.peopleTags);
  const autoDetectedTags = stringArray(photo.autoDetectedTags);

  return {
    id: stringOrDefault(photo.id, ""),
    tripId: "hokuriku-2026",
    thumbnailSrc: migrateBundledPhotoSrc(
      stringOrDefault(
        photo.thumbnailSrc,
        stringOrDefault(photo.thumbnailLink, "/images/yamanaka-onsen.webp"),
      ),
    ),
    originalFileName: stringOrDefault(photo.originalFileName, ""),
    storedFileName: stringOrDefault(photo.storedFileName, ""),
    driveFileId: stringOrNull(photo.driveFileId),
    driveFolderId: stringOrNull(photo.driveFolderId),
    driveWebViewLink: stringOrNull(photo.driveWebViewLink),
    driveWebContentLink: stringOrNull(photo.driveWebContentLink),
    thumbnailLink: stringOrNull(photo.thumbnailLink),
    mimeType: stringOrDefault(photo.mimeType, "image/jpeg"),
    sizeBytes: numberOrDefault(photo.sizeBytes, 0),
    width: numberOrNull(photo.width),
    height: numberOrNull(photo.height),
    exifTakenAt: stringOrNull(photo.exifTakenAt),
    exifLatitude: numberOrNull(photo.exifLatitude),
    exifLongitude: numberOrNull(photo.exifLongitude),
    exifCameraModel: stringOrNull(photo.exifCameraModel),
    exifOrientation: stringOrNull(photo.exifOrientation),
    fileLastModifiedAt: stringOrNull(photo.fileLastModifiedAt),
    normalizedTakenAtJST: stringOrNull(photo.normalizedTakenAtJST),
    uploadedBy: stringOrDefault(photo.uploadedBy, "family"),
    day: numberOrNull(photo.day),
    tripDate: stringOrNull(photo.tripDate),
    city: stringOrNull(photo.city),
    placeName: stringOrNull(photo.placeName),
    placeId: stringOrNull(photo.placeId),
    itineraryTitle: stringOrNull(photo.itineraryTitle),
    caption: stringOrDefault(photo.caption, photo.originalFileName ?? ""),
    memoryNote: stringOrDefault(photo.memoryNote, ""),
    tags,
    peopleTags,
    isFavorite: Boolean(photo.isFavorite),
    isCoverCandidate: Boolean(photo.isCoverCandidate),
    autoDetectedDay: numberOrNull(photo.autoDetectedDay),
    autoDetectedDate: stringOrNull(photo.autoDetectedDate),
    autoDetectedCity: stringOrNull(photo.autoDetectedCity),
    autoDetectedPlaceName: stringOrNull(photo.autoDetectedPlaceName),
    autoDetectedPlaceId: stringOrNull(photo.autoDetectedPlaceId),
    autoDetectedTags,
    autoDetectionSource: oneOf(
      photo.autoDetectionSource,
      detectionSources,
      "unknown",
    ),
    autoDetectionConfidence: oneOf(
      photo.autoDetectionConfidence,
      detectionConfidences,
      "unknown",
    ),
    autoDetectionNote: stringOrDefault(photo.autoDetectionNote, ""),
    uploadStatus: oneOf(photo.uploadStatus, uploadStatuses, "needs-review"),
    uploadProgress: numberOrDefault(photo.uploadProgress, 0),
    uploadError: stringOrNull(photo.uploadError),
    uploadedAt,
    updatedAt: stringOrDefault(photo.updatedAt, uploadedAt),
    sortOrder: numberOrDefault(photo.sortOrder, 0),
    memoir: {
      includeInMemoir: Boolean(photo.memoir?.includeInMemoir),
      chapterTitle: stringOrDefault(photo.memoir?.chapterTitle, ""),
      paragraphNote: stringOrDefault(photo.memoir?.paragraphNote, ""),
      quote: stringOrDefault(photo.memoir?.quote, ""),
      pagePriority: oneOf(
        photo.memoir?.pagePriority,
        ["cover", "large", "normal", "small"] as const,
        "normal",
      ),
    },
  };
}

export function isPhotoRecord(value: unknown): value is PhotoRecord {
  if (!isObject(value)) {
    return false;
  }

  const record = value as Partial<PhotoRecord>;

  return (
    typeof record.id === "string" &&
    record.id.length > 0 &&
    record.tripId === "hokuriku-2026" &&
    typeof record.thumbnailSrc === "string" &&
    typeof record.originalFileName === "string" &&
    typeof record.storedFileName === "string" &&
    typeof record.mimeType === "string" &&
    typeof record.sizeBytes === "number" &&
    typeof record.uploadedBy === "string" &&
    Array.isArray(record.tags) &&
    Array.isArray(record.peopleTags) &&
    Array.isArray(record.autoDetectedTags) &&
    typeof record.isFavorite === "boolean" &&
    typeof record.isCoverCandidate === "boolean" &&
    uploadStatuses.includes(record.uploadStatus as PhotoUploadStatus) &&
    detectionSources.includes(record.autoDetectionSource as PhotoDetectionSource) &&
    detectionConfidences.includes(
      record.autoDetectionConfidence as PhotoDetectionConfidence,
    ) &&
    typeof record.uploadedAt === "string" &&
    typeof record.updatedAt === "string" &&
    typeof record.sortOrder === "number" &&
    isObject(record.memoir) &&
    typeof record.memoir.includeInMemoir === "boolean" &&
    typeof record.memoir.chapterTitle === "string" &&
    typeof record.memoir.paragraphNote === "string" &&
    typeof record.memoir.quote === "string" &&
    ["cover", "large", "normal", "small"].includes(record.memoir.pagePriority)
  );
}

function readPhotosForTrip(storage: Storage, tripId: TripId): PhotoRecord[] {
  const envelope = readEnvelope(storage);

  if (!envelope || envelope.tripId !== tripId) {
    return [];
  }

  return envelope.photos;
}

function readEnvelope(storage: Storage): PhotoMetadataEnvelope | null {
  const rawEnvelope = storage.getItem(PHOTO_METADATA_STORAGE_KEY);

  if (!rawEnvelope) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawEnvelope);

    if (
      !isObject(parsed) ||
      parsed.version !== PHOTO_METADATA_SCHEMA_VERSION ||
      parsed.tripId !== "hokuriku-2026" ||
      !Array.isArray(parsed.photos)
    ) {
      return null;
    }

    return {
      version: PHOTO_METADATA_SCHEMA_VERSION,
      tripId: parsed.tripId,
      photos: parsed.photos
        .map((photo) => normalizePhotoRecordForStorage(photo))
        .filter(isPhotoRecord),
    };
  } catch {
    return null;
  }
}

function writeEnvelope(
  storage: Storage,
  tripId: TripId,
  photos: PhotoRecord[],
) {
  const envelope: PhotoMetadataEnvelope = {
    version: PHOTO_METADATA_SCHEMA_VERSION,
    tripId,
    photos: sortPhotos(photos.map(normalizePhotoRecordForStorage)),
  };

  storage.setItem(PHOTO_METADATA_STORAGE_KEY, JSON.stringify(envelope));
}

function sortPhotos(photos: PhotoRecord[]): PhotoRecord[] {
  return [...photos].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }

    return a.uploadedAt.localeCompare(b.uploadedAt);
  });
}

function cloneRecords(photos: PhotoRecord[]): PhotoRecord[] {
  return photos.map(cloneRecord);
}

function cloneRecord(photo: PhotoRecord): PhotoRecord {
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(photo);
  }

  return JSON.parse(JSON.stringify(photo)) as PhotoRecord;
}

function stringOrDefault(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function migrateBundledPhotoSrc(src: string): string {
  return bundledPhotoSrcMigration[src] ?? src;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function numberOrDefault(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function oneOf<const T extends readonly string[]>(
  value: unknown,
  allowed: T,
  fallback: T[number],
): T[number] {
  return typeof value === "string" && allowed.includes(value)
    ? value
    : fallback;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
