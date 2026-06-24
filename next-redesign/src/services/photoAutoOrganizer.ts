import { PHOTO_PLACE_CANDIDATES } from "@/data/photo-place-candidates";
import { photoDaySummaries } from "@/data/photo-album";
import type {
  BuildInitialPhotoRecordOptions,
  DayFolderMap,
  PhotoAutoDetectionResult,
  PhotoDetectionConfidence,
  PhotoDriveFolderKey,
  PhotoFileMetadata,
  PhotoGpsMatch,
  PhotoNormalizedTakenAt,
  PhotoPlaceCandidate,
  PhotoRecord,
} from "@/types/photos";

type DetectionConfidenceInput = {
  day: number | null;
  place: PhotoPlaceCandidate | null | undefined;
  hasGps: boolean;
  hasTakenAt: boolean;
};

type StoredFileNameInput = {
  day: number | null;
  tripDate: string | null;
  city: string | null;
  placeName: string | null;
  sequence: number;
  originalFileName: string;
};

const citySlugMap: Record<string, string> = {
  京都: "Kyoto",
  金澤: "Kanazawa",
  山中溫泉: "Yamanaka",
  新大阪: "ShinOsaka",
  關西機場: "KIX",
  加賀: "Kaga",
};

const placeSlugMap: Record<string, string> = {
  關西機場: "KIX",
  京都車站: "KyotoStation",
  東寺: "Toji",
  伏見稻荷大社: "FushimiInari",
  嵐山: "Arashiyama",
  嵐山小火車: "SaganoRomanticTrain",
  常寂光寺: "Jojakkoji",
  金澤車站: "KanazawaStation",
  兼六園: "Kenrokuen",
  近江町市場: "OmichoMarket",
  加賀溫泉站: "KagaonsenStation",
  山中溫泉: "YamanakaOnsen",
  鶴仙溪: "Kakusenkei",
  新大阪車站: "ShinOsakaStation",
};

export async function readPhotoMetadata(file: File): Promise<PhotoFileMetadata> {
  const baseMetadata: PhotoFileMetadata = {
    originalFileName: file.name,
    mimeType: file.type || "application/octet-stream",
    sizeBytes: file.size,
    width: null,
    height: null,
    exifTakenAt: null,
    exifLatitude: null,
    exifLongitude: null,
    exifCameraModel: null,
    exifOrientation: null,
    fileLastModifiedAt: file.lastModified
      ? new Date(file.lastModified).toISOString()
      : null,
    normalizedTakenAtJST: null,
  };

  const [exifMetadata, dimensions] = await Promise.all([
    readExifMetadata(file),
    readImageDimensions(file),
  ]);
  const normalized = normalizeTakenAt(
    exifMetadata.exifTakenAt,
    baseMetadata.fileLastModifiedAt,
  );

  return {
    ...baseMetadata,
    ...exifMetadata,
    ...dimensions,
    normalizedTakenAtJST: normalized.normalizedTakenAtJST,
  };
}

export function normalizeTakenAt(
  exifTakenAt: Date | string | number | null | undefined,
  fileLastModified: Date | string | number | null | undefined,
): PhotoNormalizedTakenAt {
  const exifDate = toDate(exifTakenAt);
  const fileDate = toDate(fileLastModified);
  const takenAt = exifDate ?? fileDate;

  if (!takenAt) {
    return {
      originalTakenAt: null,
      normalizedTakenAtJST: null,
      tripDate: null,
      source: "unknown",
    };
  }

  return {
    originalTakenAt:
      typeof exifTakenAt === "string"
        ? exifTakenAt
        : typeof fileLastModified === "string" && !exifDate
          ? fileLastModified
          : takenAt.toISOString(),
    normalizedTakenAtJST: formatDateTimeInTokyo(takenAt),
    tripDate: formatDateInTokyo(takenAt),
    source: exifDate ? "exif-date" : "file-last-modified",
  };
}

export function detectTripDay(takenAt: Date | string | null | undefined) {
  const date = toDate(takenAt);

  if (!date) {
    return null;
  }

  const tripDate = formatDateInTokyo(date);

  return photoDaySummaries.find((day) => day.date === tripDate) ?? null;
}

export function detectPlaceByGps(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
  candidates: PhotoPlaceCandidate[] = PHOTO_PLACE_CANDIDATES,
): PhotoGpsMatch | null {
  if (!isFiniteNumber(latitude) || !isFiniteNumber(longitude)) {
    return null;
  }

  const matches = candidates
    .map((candidate) => ({
      candidate,
      distanceMeters: calculateHaversineDistanceMeters(
        latitude,
        longitude,
        candidate.latitude,
        candidate.longitude,
      ),
    }))
    .filter((match) => match.distanceMeters <= match.candidate.matchRadiusMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  return matches[0] ?? null;
}

export function inferPlaceByItinerary(
  day: number | null | undefined,
  _takenAt: Date | string | null | undefined,
  candidates: PhotoPlaceCandidate[] = PHOTO_PLACE_CANDIDATES,
): PhotoPlaceCandidate | null {
  if (!day) {
    return null;
  }

  return candidates.find((candidate) => candidate.defaultDay === day) ?? null;
}

export function generateAutoTags(
  day: number | null,
  city: string | null,
  placeName: string | null,
  itineraryTitle: string | null,
): string[] {
  const candidate = PHOTO_PLACE_CANDIDATES.find(
    (item) => item.name === placeName || item.id === placeName,
  );
  const tags = [
    day ? `Day${day}` : null,
    city,
    placeName,
    ...(candidate?.tags ?? []),
    ...(itineraryTitle?.includes("小火車") ? ["小火車"] : []),
    ...(itineraryTitle?.includes("紅葉") ? ["紅葉"] : []),
  ];

  return uniqueStrings(tags.filter(Boolean) as string[]);
}

export function calculateDetectionConfidence({
  day,
  place,
  hasGps,
  hasTakenAt,
}: DetectionConfidenceInput): PhotoDetectionConfidence {
  if (hasGps && place && hasTakenAt && day !== null) {
    return Math.abs(place.defaultDay - day) <= 1 ? "high" : "medium";
  }

  if (hasGps && place) {
    return "medium";
  }

  if (hasTakenAt && day !== null) {
    return "low";
  }

  return "unknown";
}

export function buildAutoDetectionResult(
  metadata: PhotoFileMetadata,
  candidates: PhotoPlaceCandidate[] = PHOTO_PLACE_CANDIDATES,
): PhotoAutoDetectionResult {
  const normalized = normalizeTakenAt(
    metadata.exifTakenAt,
    metadata.fileLastModifiedAt,
  );
  const daySummary = detectTripDay(normalized.normalizedTakenAtJST);
  const gpsMatch = detectPlaceByGps(
    metadata.exifLatitude,
    metadata.exifLongitude,
    candidates,
  );
  const inferredPlace = gpsMatch
    ? gpsMatch.candidate
    : inferPlaceByItinerary(
        daySummary?.day ?? null,
        normalized.normalizedTakenAtJST,
        candidates,
      );
  const hasGps = gpsMatch !== null;
  const hasTakenAt = normalized.normalizedTakenAtJST !== null;
  const confidence = calculateDetectionConfidence({
    day: daySummary?.day ?? null,
    place: inferredPlace,
    hasGps,
    hasTakenAt,
  });
  const source = getDetectionSource(hasGps, normalized.source, daySummary !== null);
  const city = inferredPlace?.city ?? daySummary?.city ?? null;
  const placeName =
    confidence === "unknown" ? null : (inferredPlace?.name ?? null);
  const placeId = confidence === "unknown" ? null : (inferredPlace?.id ?? null);
  const tags =
    confidence === "unknown"
      ? ["需要確認"]
      : generateAutoTags(
          daySummary?.day ?? null,
          city,
          placeName,
          daySummary?.title ?? null,
        );

  return {
    day: daySummary?.day ?? null,
    tripDate: normalized.tripDate,
    city,
    placeName,
    placeId,
    itineraryTitle: daySummary?.title ?? null,
    tags,
    source,
    confidence,
    note: buildDetectionNote(confidence, gpsMatch, daySummary !== null),
    normalizedTakenAtJST: normalized.normalizedTakenAtJST,
    exifTakenAt: metadata.exifTakenAt,
    exifLatitude: metadata.exifLatitude,
    exifLongitude: metadata.exifLongitude,
  };
}

export function buildStoredFileName({
  day,
  tripDate,
  city,
  placeName,
  sequence,
  originalFileName,
}: StoredFileNameInput): string {
  const extension = getSafeExtension(originalFileName);
  const paddedSequence = String(sequence).padStart(3, "0");

  if (!day || !tripDate || !city || !placeName) {
    return `HOKURIKU2026_Unsorted_${paddedSequence}.${extension}`;
  }

  const daySegment = String(day).padStart(2, "0");

  return [
    "HOKURIKU2026",
    `Day${daySegment}`,
    tripDate,
    toSafeSegment(city, citySlugMap),
    toSafeSegment(placeName, placeSlugMap),
    paddedSequence,
  ].join("_") + `.${extension}`;
}

export function chooseTargetDriveFolder(
  detection: Pick<PhotoAutoDetectionResult, "day" | "confidence">,
  dayFolderMap: DayFolderMap,
): string | null {
  const dayKey = getPhotoDriveDayKey(detection.day);

  if (
    dayKey &&
    detection.confidence !== "unknown" &&
    dayFolderMap[dayKey]
  ) {
    return dayFolderMap[dayKey] ?? null;
  }

  return dayFolderMap.unsorted ?? null;
}

function getPhotoDriveDayKey(day: number | null | undefined): PhotoDriveFolderKey | null {
  if (!day || day < 1 || day > 8) {
    return null;
  }

  return `day${day}` as PhotoDriveFolderKey;
}

export function buildInitialPhotoRecord(
  file: File,
  autoDetectionResult: PhotoAutoDetectionResult,
  options: BuildInitialPhotoRecordOptions = {},
): PhotoRecord {
  const sequence = options.sequence ?? 1;
  const uploadedAt = options.uploadedAt ?? new Date().toISOString();
  const fileMetadata = options.fileMetadata;
  const isNeedsReview =
    autoDetectionResult.confidence === "unknown" ||
    autoDetectionResult.confidence === "low" ||
    autoDetectionResult.day === null;

  return {
    id: options.id ?? createPhotoId(),
    tripId: "hokuriku-2026",
    thumbnailSrc: options.thumbnailSrc ?? "/images/yamanaka-onsen.webp",
    originalFileName: file.name,
    storedFileName: buildStoredFileName({
      day: autoDetectionResult.day,
      tripDate: autoDetectionResult.tripDate,
      city: autoDetectionResult.city,
      placeName: autoDetectionResult.placeName,
      sequence,
      originalFileName: file.name,
    }),
    driveFileId: null,
    driveFolderId: null,
    driveWebViewLink: null,
    driveWebContentLink: null,
    thumbnailLink: null,
    mimeType: fileMetadata?.mimeType ?? file.type ?? "application/octet-stream",
    sizeBytes: fileMetadata?.sizeBytes ?? file.size,
    width: fileMetadata?.width ?? null,
    height: fileMetadata?.height ?? null,
    exifTakenAt: fileMetadata?.exifTakenAt ?? autoDetectionResult.exifTakenAt,
    exifLatitude:
      fileMetadata?.exifLatitude ?? autoDetectionResult.exifLatitude,
    exifLongitude:
      fileMetadata?.exifLongitude ?? autoDetectionResult.exifLongitude,
    exifCameraModel: fileMetadata?.exifCameraModel ?? null,
    exifOrientation: fileMetadata?.exifOrientation ?? null,
    fileLastModifiedAt:
      fileMetadata?.fileLastModifiedAt ??
      (file.lastModified ? new Date(file.lastModified).toISOString() : null),
    normalizedTakenAtJST:
      fileMetadata?.normalizedTakenAtJST ??
      autoDetectionResult.normalizedTakenAtJST,
    uploadedBy: options.uploadedBy ?? "family",
    day: autoDetectionResult.day,
    tripDate: autoDetectionResult.day ? autoDetectionResult.tripDate : null,
    city: autoDetectionResult.day ? autoDetectionResult.city : null,
    placeName: autoDetectionResult.day ? autoDetectionResult.placeName : null,
    placeId: autoDetectionResult.day ? autoDetectionResult.placeId : null,
    itineraryTitle: autoDetectionResult.day
      ? autoDetectionResult.itineraryTitle
      : null,
    caption: autoDetectionResult.placeName
      ? `${autoDetectionResult.placeName} 照片`
      : file.name,
    memoryNote: autoDetectionResult.note,
    tags: autoDetectionResult.tags,
    peopleTags: [],
    isFavorite: false,
    isCoverCandidate: false,
    autoDetectedDay: autoDetectionResult.day,
    autoDetectedDate: autoDetectionResult.tripDate,
    autoDetectedCity: autoDetectionResult.city,
    autoDetectedPlaceName: autoDetectionResult.placeName,
    autoDetectedPlaceId: autoDetectionResult.placeId,
    autoDetectedTags: autoDetectionResult.tags,
    autoDetectionSource: autoDetectionResult.source,
    autoDetectionConfidence: autoDetectionResult.confidence,
    autoDetectionNote: autoDetectionResult.note,
    uploadStatus: isNeedsReview ? "needs-review" : "uploaded",
    uploadProgress: isNeedsReview ? 0 : 100,
    uploadError: null,
    uploadedAt,
    updatedAt: uploadedAt,
    sortOrder: options.sortOrder ?? sequence,
    memoir: {
      includeInMemoir: false,
      chapterTitle: autoDetectionResult.day
        ? `回憶錄 Day ${autoDetectionResult.day}`
        : "",
      paragraphNote: "",
      quote: "",
      pagePriority: "normal",
    },
  };
}

async function readExifMetadata(
  file: File,
): Promise<Partial<PhotoFileMetadata>> {
  try {
    const exifr = await import("exifr");
    const exif = await exifr.parse(file, {
      gps: true,
      tiff: true,
      exif: true,
    });

    return {
      exifTakenAt: parseExifDateValue(
        exif?.DateTimeOriginal ?? exif?.CreateDate ?? exif?.ModifyDate,
      ),
      exifLatitude: parseNumber(exif?.latitude ?? exif?.GPSLatitude),
      exifLongitude: parseNumber(exif?.longitude ?? exif?.GPSLongitude),
      exifCameraModel:
        typeof exif?.Model === "string"
          ? [exif.Make, exif.Model].filter(Boolean).join(" ")
          : null,
      exifOrientation:
        exif?.Orientation === undefined || exif?.Orientation === null
          ? null
          : String(exif.Orientation),
    };
  } catch {
    return {};
  }
}

async function readImageDimensions(
  file: File,
): Promise<Pick<PhotoFileMetadata, "width" | "height">> {
  if (typeof createImageBitmap !== "function") {
    return { width: null, height: null };
  }

  try {
    const bitmap = await createImageBitmap(file);
    const dimensions = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return dimensions;
  } catch {
    return { width: null, height: null };
  }
}

function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const earthRadiusMeters = 6371000;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(deltaLon / 2) ** 2;

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function formatDateInTokyo(date: Date): string {
  const parts = getTokyoParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function formatDateTimeInTokyo(date: Date): string {
  const parts = getTokyoParts(date);
  const milliseconds = String(date.getUTCMilliseconds()).padStart(3, "0");
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}.${milliseconds}+09:00`;
}

function getTokyoParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const lookup = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return {
    year: lookup.year,
    month: lookup.month,
    day: lookup.day,
    hour: lookup.hour,
    minute: lookup.minute,
    second: lookup.second,
  };
}

function toDate(value: Date | string | number | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parsedExifString = parseExifDateString(value);
  const date = new Date(parsedExifString);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseExifDateValue(value: unknown): string | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    return parseExifDateString(value);
  }

  return null;
}

function parseExifDateString(value: string): string {
  const trimmed = value.trim();
  const exifMatch = trimmed.match(
    /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/,
  );

  if (exifMatch) {
    const [, year, month, day, hour, minute, second] = exifMatch;
    return `${year}-${month}-${day}T${hour}:${minute}:${second}+09:00`;
  }

  return trimmed;
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}

function getDetectionSource(
  hasGps: boolean,
  normalizedSource: PhotoAutoDetectionResult["source"],
  hasTripDay: boolean,
): PhotoAutoDetectionResult["source"] {
  if (hasGps) {
    return "exif-gps";
  }

  if (normalizedSource === "exif-date") {
    return "exif-date";
  }

  if (normalizedSource === "file-last-modified" && hasTripDay) {
    return "file-last-modified";
  }

  return "unknown";
}

function buildDetectionNote(
  confidence: PhotoDetectionConfidence,
  gpsMatch: PhotoGpsMatch | null,
  hasTripDay: boolean,
): string {
  if (confidence === "high" && gpsMatch) {
    return `GPS 落在${gpsMatch.candidate.name}半徑內，日期符合或鄰近日程。`;
  }

  if (confidence === "medium" && gpsMatch) {
    return `GPS 可判斷為${gpsMatch.candidate.name}，但日期與預設行程不完全一致。`;
  }

  if (confidence === "low" && hasTripDay) {
    return "沒有 GPS，先依拍攝日期與當日行程推定。";
  }

  return "沒有拍攝時間與 GPS，先放入待整理照片。";
}

function getSafeExtension(originalFileName: string): string {
  const extension = originalFileName.split(".").pop()?.toLowerCase();

  if (!extension || extension === originalFileName.toLowerCase()) {
    return "jpg";
  }

  return extension.replace(/[^a-z0-9]/g, "") || "jpg";
}

function toSafeSegment(value: string, lookup: Record<string, string>): string {
  const mapped = lookup[value] ?? value;
  const safe = mapped
    .normalize("NFKD")
    .replace(/[^\w]+/g, "")
    .replace(/^_+|_+$/g, "");

  return safe || "Unknown";
}

function createPhotoId(): string {
  if (globalThis.crypto?.randomUUID) {
    return `photo-${globalThis.crypto.randomUUID()}`;
  }

  return `photo-${Date.now()}`;
}
