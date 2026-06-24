export type PhotoTabId =
  | "date"
  | "place"
  | "favorites"
  | "unsorted"
  | "memoir";

export type PhotoDetectionConfidence = "high" | "medium" | "low" | "unknown";

export type PhotoUploadStatus =
  | "uploaded"
  | "needs-review"
  | "pending"
  | "failed";

export type PhotoDetectionSource =
  | "exif-gps"
  | "exif-date"
  | "itinerary-inference"
  | "file-last-modified"
  | "manual"
  | "unknown";

export type PhotoRecord = {
  id: string;
  tripId: "hokuriku-2026";
  thumbnailSrc: string;
  originalFileName: string;
  storedFileName: string;
  driveFileId: string | null;
  driveFolderId: string | null;
  driveWebViewLink: string | null;
  driveWebContentLink: string | null;
  thumbnailLink: string | null;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  exifTakenAt: string | null;
  exifLatitude: number | null;
  exifLongitude: number | null;
  exifCameraModel: string | null;
  exifOrientation: string | null;
  fileLastModifiedAt: string | null;
  normalizedTakenAtJST: string | null;
  uploadedBy: string;
  day: number | null;
  tripDate: string | null;
  city: string | null;
  placeName: string | null;
  placeId: string | null;
  itineraryTitle: string | null;
  caption: string;
  memoryNote: string;
  tags: string[];
  peopleTags: string[];
  isFavorite: boolean;
  isCoverCandidate: boolean;
  autoDetectedDay: number | null;
  autoDetectedDate: string | null;
  autoDetectedCity: string | null;
  autoDetectedPlaceName: string | null;
  autoDetectedPlaceId: string | null;
  autoDetectedTags: string[];
  autoDetectionSource: PhotoDetectionSource;
  autoDetectionConfidence: PhotoDetectionConfidence;
  autoDetectionNote: string;
  uploadStatus: PhotoUploadStatus;
  uploadProgress: number;
  uploadError: string | null;
  uploadedAt: string;
  updatedAt: string;
  sortOrder: number;
  memoir: {
    includeInMemoir: boolean;
    chapterTitle: string;
    paragraphNote: string;
    quote: string;
    pagePriority: "cover" | "large" | "normal" | "small";
  };
};

export type PhotoDaySummary = {
  day: number;
  date: string;
  title: string;
  city: string;
};

export type PhotoDriveConnectionStatus = {
  state:
    | "not-connected"
    | "missing-root-folder"
    | "ready-to-scan"
    | "scanned";
  rootFolderName: string;
  rootFolderId: string;
  scannedFolderCount: number;
};

export type PhotoDriveDayFolderKey =
  | "day1"
  | "day2"
  | "day3"
  | "day4"
  | "day5"
  | "day6"
  | "day7"
  | "day8";

export type PhotoDriveFolderKey =
  | "cover"
  | PhotoDriveDayFolderKey
  | "unsorted"
  | "memoir";

export type PhotoDriveFolderRequirement = {
  key: PhotoDriveFolderKey;
  label: string;
  name: string;
};

export type PhotoDriveFolder = {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
};

export type PhotoDriveUploadResult = {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
};

export type PhotoDriveScanResult = {
  rootFolderId: string;
  folders: PhotoDriveFolder[];
  dayFolderMap: DayFolderMap;
  missingFolders: PhotoDriveFolderRequirement[];
  scannedFolderCount: number;
  scannedAt: string;
};

export type PhotoPlaceCandidate = {
  id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  defaultDay: number;
  matchRadiusMeters: number;
  tags: string[];
};

export type PhotoGpsMatch = {
  candidate: PhotoPlaceCandidate;
  distanceMeters: number;
};

export type PhotoNormalizedTakenAt = {
  originalTakenAt: string | null;
  normalizedTakenAtJST: string | null;
  tripDate: string | null;
  source: Extract<PhotoDetectionSource, "exif-date" | "file-last-modified" | "unknown">;
};

export type PhotoFileMetadata = {
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  exifTakenAt: string | null;
  exifLatitude: number | null;
  exifLongitude: number | null;
  exifCameraModel: string | null;
  exifOrientation: string | null;
  fileLastModifiedAt: string | null;
  normalizedTakenAtJST: string | null;
};

export type PhotoAutoDetectionResult = {
  day: number | null;
  tripDate: string | null;
  city: string | null;
  placeName: string | null;
  placeId: string | null;
  itineraryTitle: string | null;
  tags: string[];
  source: PhotoDetectionSource;
  confidence: PhotoDetectionConfidence;
  note: string;
  normalizedTakenAtJST: string | null;
  exifTakenAt: string | null;
  exifLatitude: number | null;
  exifLongitude: number | null;
};

export type BuildInitialPhotoRecordOptions = {
  id?: string;
  sequence?: number;
  sortOrder?: number;
  uploadedAt?: string;
  thumbnailSrc?: string;
  fileMetadata?: PhotoFileMetadata;
  uploadedBy?: string;
};

export type DayFolderMap = Partial<Record<PhotoDriveFolderKey, string>>;
