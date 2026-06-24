import type {
  PhotoDaySummary,
  PhotoDriveConnectionStatus,
  PhotoDriveScanResult,
  PhotoRecord,
  PhotoTabId,
} from "@/types/photos";

export const photoTabs: Array<{ id: PhotoTabId; label: string }> = [
  { id: "date", label: "依日期" },
  { id: "place", label: "依地點" },
  { id: "favorites", label: "精選照片" },
  { id: "unsorted", label: "待整理" },
  { id: "memoir", label: "回憶錄素材" },
];

export const photoFilterChips = [
  "全部",
  "京都",
  "金澤",
  "山中溫泉",
  "新大阪",
  "關西機場",
  "家族合照",
  "紅葉",
  "溫泉",
  "美食",
  "交通",
  "飯店",
  "精選",
  "需要確認",
];

export const photoDaySummaries: PhotoDaySummary[] = [
  {
    day: 1,
    date: "2026-11-14",
    title: "關西機場會合",
    city: "關西機場",
  },
  {
    day: 2,
    date: "2026-11-15",
    title: "京都東寺與伏見稻荷",
    city: "京都",
  },
  {
    day: 3,
    date: "2026-11-16",
    title: "嵐山小火車與常寂光寺",
    city: "京都",
  },
  {
    day: 4,
    date: "2026-11-17",
    title: "京都到金澤",
    city: "金澤",
  },
  {
    day: 5,
    date: "2026-11-18",
    title: "兼六園近江町山中溫泉",
    city: "金澤",
  },
  {
    day: 6,
    date: "2026-11-19",
    title: "山中溫泉鶴仙溪",
    city: "山中溫泉",
  },
  {
    day: 7,
    date: "2026-11-20",
    title: "山中溫泉到新大阪",
    city: "新大阪",
  },
  {
    day: 8,
    date: "2026-11-21",
    title: "新大阪關西機場返台",
    city: "關西機場",
  },
];

const albumImage = "/images/yamanaka-onsen.webp";
const onsenImage = "/images/yamanaka-onsen-kisshotei.webp";

type MockPhotoRecordInput = Omit<
  PhotoRecord,
  | "driveWebContentLink"
  | "thumbnailLink"
  | "mimeType"
  | "sizeBytes"
  | "width"
  | "height"
  | "exifTakenAt"
  | "exifLatitude"
  | "exifLongitude"
  | "exifCameraModel"
  | "exifOrientation"
  | "fileLastModifiedAt"
  | "normalizedTakenAtJST"
  | "uploadedBy"
> &
  Partial<
    Pick<
      PhotoRecord,
      | "driveWebContentLink"
      | "thumbnailLink"
      | "mimeType"
      | "sizeBytes"
      | "width"
      | "height"
      | "exifTakenAt"
      | "exifLatitude"
      | "exifLongitude"
      | "exifCameraModel"
      | "exifOrientation"
      | "fileLastModifiedAt"
      | "normalizedTakenAtJST"
      | "uploadedBy"
    >
  >;

function createMockPhotoRecord(photo: MockPhotoRecordInput): PhotoRecord {
  const mockTakenAt = photo.autoDetectedDate
    ? `${photo.autoDetectedDate}T12:00:00.000+09:00`
    : null;

  return {
    driveWebContentLink: null,
    thumbnailLink: photo.thumbnailSrc,
    mimeType: "image/jpeg",
    sizeBytes: 2_400_000,
    width: 1600,
    height: 1200,
    exifTakenAt: mockTakenAt,
    exifLatitude: null,
    exifLongitude: null,
    exifCameraModel: null,
    exifOrientation: null,
    fileLastModifiedAt: mockTakenAt,
    normalizedTakenAtJST: mockTakenAt,
    uploadedBy: "family",
    ...photo,
  };
}

export const mockPhotoDriveStatus: PhotoDriveConnectionStatus = {
  state: "ready-to-scan",
  rootFolderName: "2026_北陸孝親紅葉慢旅_照片",
  rootFolderId: "1p33mX1C8xLeB7P8RvRgMWlFKPqdFeQww",
  scannedFolderCount: 11,
};

export const defaultPhotoDriveScanResult: PhotoDriveScanResult = {
  rootFolderId: "1p33mX1C8xLeB7P8RvRgMWlFKPqdFeQww",
  folders: [
    {
      id: "16fjJjq97w4UAAjaENiPKbuw4T9lS8fTs",
      name: "00_封面與精選",
      mimeType: "application/vnd.google-apps.folder",
      webViewLink:
        "https://drive.google.com/drive/folders/16fjJjq97w4UAAjaENiPKbuw4T9lS8fTs",
    },
    {
      id: "1lxQ0qzU_LTVbDO9nYALS5iWR7kBr04PZ",
      name: "Day01_2026-11-14_關西機場會合",
      mimeType: "application/vnd.google-apps.folder",
      webViewLink:
        "https://drive.google.com/drive/folders/1lxQ0qzU_LTVbDO9nYALS5iWR7kBr04PZ",
    },
    {
      id: "1Vl9Gze1IIfnHOT68BFDdM-Y7iyQ8M4nU",
      name: "Day02_2026-11-15_京都東寺伏見稻荷",
      mimeType: "application/vnd.google-apps.folder",
      webViewLink:
        "https://drive.google.com/drive/folders/1Vl9Gze1IIfnHOT68BFDdM-Y7iyQ8M4nU",
    },
    {
      id: "1MSSiYnYKkwuvm3_x-3mAyYXj3zOU5VXE",
      name: "Day03_2026-11-16_嵐山小火車常寂光寺",
      mimeType: "application/vnd.google-apps.folder",
      webViewLink:
        "https://drive.google.com/drive/folders/1MSSiYnYKkwuvm3_x-3mAyYXj3zOU5VXE",
    },
    {
      id: "1Bnu0WSs5amhNZwajdjjhWmFhNmIReXjA",
      name: "Day04_2026-11-17_京都到金澤",
      mimeType: "application/vnd.google-apps.folder",
      webViewLink:
        "https://drive.google.com/drive/folders/1Bnu0WSs5amhNZwajdjjhWmFhNmIReXjA",
    },
    {
      id: "1qUgC3cfzqqEPUi1BhtmSNVzKJgAir_jV",
      name: "Day05_2026-11-18_兼六園近江町山中溫泉",
      mimeType: "application/vnd.google-apps.folder",
      webViewLink:
        "https://drive.google.com/drive/folders/1qUgC3cfzqqEPUi1BhtmSNVzKJgAir_jV",
    },
    {
      id: "1yf2iy6dsGx-WH64GhcE4HGqKIcrDRXIf",
      name: "Day06_2026-11-19_山中溫泉鶴仙溪",
      mimeType: "application/vnd.google-apps.folder",
      webViewLink:
        "https://drive.google.com/drive/folders/1yf2iy6dsGx-WH64GhcE4HGqKIcrDRXIf",
    },
    {
      id: "1utLUDXHiyuhzNAvnuU3Mp6ICMei6Mle2",
      name: "Day07_2026-11-20_山中溫泉到新大阪",
      mimeType: "application/vnd.google-apps.folder",
      webViewLink:
        "https://drive.google.com/drive/folders/1utLUDXHiyuhzNAvnuU3Mp6ICMei6Mle2",
    },
    {
      id: "1-R0VK0FRSGZrZGi2GekF9Hvr8JUxhPCb",
      name: "Day08_2026-11-21_新大阪關西機場返台",
      mimeType: "application/vnd.google-apps.folder",
      webViewLink:
        "https://drive.google.com/drive/folders/1-R0VK0FRSGZrZGi2GekF9Hvr8JUxhPCb",
    },
    {
      id: "1xlY9y-DgJvfQPYwiO9ENNrBhzhlFY1XG",
      name: "98_待整理照片",
      mimeType: "application/vnd.google-apps.folder",
      webViewLink:
        "https://drive.google.com/drive/folders/1xlY9y-DgJvfQPYwiO9ENNrBhzhlFY1XG",
    },
    {
      id: "1Sm9f52R9YigGNrKTZnO3sJHcC54TaDeZ",
      name: "99_回憶錄輸出素材",
      mimeType: "application/vnd.google-apps.folder",
      webViewLink:
        "https://drive.google.com/drive/folders/1Sm9f52R9YigGNrKTZnO3sJHcC54TaDeZ",
    },
  ],
  dayFolderMap: {
    cover: "16fjJjq97w4UAAjaENiPKbuw4T9lS8fTs",
    day1: "1lxQ0qzU_LTVbDO9nYALS5iWR7kBr04PZ",
    day2: "1Vl9Gze1IIfnHOT68BFDdM-Y7iyQ8M4nU",
    day3: "1MSSiYnYKkwuvm3_x-3mAyYXj3zOU5VXE",
    day4: "1Bnu0WSs5amhNZwajdjjhWmFhNmIReXjA",
    day5: "1qUgC3cfzqqEPUi1BhtmSNVzKJgAir_jV",
    day6: "1yf2iy6dsGx-WH64GhcE4HGqKIcrDRXIf",
    day7: "1utLUDXHiyuhzNAvnuU3Mp6ICMei6Mle2",
    day8: "1-R0VK0FRSGZrZGi2GekF9Hvr8JUxhPCb",
    unsorted: "1xlY9y-DgJvfQPYwiO9ENNrBhzhlFY1XG",
    memoir: "1Sm9f52R9YigGNrKTZnO3sJHcC54TaDeZ",
  },
  missingFolders: [],
  scannedFolderCount: 11,
  scannedAt: "2026-06-15T16:05:25.174Z",
};

const mockPhotoRecordInputs: MockPhotoRecordInput[] = [
  {
    id: "photo-toji-maple",
    tripId: "hokuriku-2026",
    thumbnailSrc: albumImage,
    originalFileName: "IMG_20261115_1542.jpg",
    storedFileName: "HOKURIKU2026_Day02_2026-11-15_Kyoto_Toji_001.jpg",
    driveFileId: "mock-drive-toji",
    driveFolderId: "mock-folder-day02",
    driveWebViewLink: null,
    day: 2,
    tripDate: "2026-11-15",
    city: "京都",
    placeName: "東寺",
    placeId: "toji",
    itineraryTitle: "京都東寺與伏見稻荷",
    caption: "東寺紅葉與五重塔",
    memoryNote: "下午光線剛好，適合放在京都章節開頭。",
    tags: ["京都", "寺院", "紅葉", "Day2"],
    peopleTags: ["家族合照"],
    isFavorite: false,
    isCoverCandidate: false,
    autoDetectedDay: 2,
    autoDetectedDate: "2026-11-15",
    autoDetectedCity: "京都",
    autoDetectedPlaceName: "東寺",
    autoDetectedPlaceId: "toji",
    autoDetectedTags: ["京都", "寺院", "紅葉", "Day2"],
    autoDetectionSource: "exif-gps",
    autoDetectionConfidence: "high",
    autoDetectionNote: "GPS 落在東寺半徑內，日期符合 Day 2。",
    uploadStatus: "uploaded",
    uploadProgress: 100,
    uploadError: null,
    uploadedAt: "2026-11-15T16:05:00+09:00",
    updatedAt: "2026-11-15T16:05:00+09:00",
    sortOrder: 10,
    memoir: {
      includeInMemoir: true,
      chapterTitle: "京都紅葉第一章",
      paragraphNote: "東寺的五重塔讓第一個京都下午很有記憶點。",
      quote: "",
      pagePriority: "large",
    },
  },
  {
    id: "photo-arashiyama-train",
    tripId: "hokuriku-2026",
    thumbnailSrc: albumImage,
    originalFileName: "IMG_20261116_1018.jpg",
    storedFileName: "HOKURIKU2026_Day03_2026-11-16_Kyoto_Arashiyama_001.jpg",
    driveFileId: "mock-drive-arashiyama",
    driveFolderId: "mock-folder-day03",
    driveWebViewLink: null,
    day: 3,
    tripDate: "2026-11-16",
    city: "京都",
    placeName: "嵐山小火車",
    placeId: "sagano-romantic-train",
    itineraryTitle: "嵐山小火車與常寂光寺",
    caption: "嵐山小火車窗景",
    memoryNote: "適合做回憶錄中橫幅照片。",
    tags: ["京都", "嵐山", "小火車", "紅葉", "Day3"],
    peopleTags: [],
    isFavorite: true,
    isCoverCandidate: true,
    autoDetectedDay: 3,
    autoDetectedDate: "2026-11-16",
    autoDetectedCity: "京都",
    autoDetectedPlaceName: "嵐山小火車",
    autoDetectedPlaceId: "sagano-romantic-train",
    autoDetectedTags: ["京都", "嵐山", "小火車", "紅葉", "Day3"],
    autoDetectionSource: "exif-gps",
    autoDetectionConfidence: "high",
    autoDetectionNote: "GPS 靠近嵐山小火車路線，日期符合 Day 3。",
    uploadStatus: "uploaded",
    uploadProgress: 100,
    uploadError: null,
    uploadedAt: "2026-11-16T10:28:00+09:00",
    updatedAt: "2026-11-16T10:28:00+09:00",
    sortOrder: 20,
    memoir: {
      includeInMemoir: true,
      chapterTitle: "回憶錄 Day 3",
      paragraphNote: "車窗外的紅葉是這天最適合放大跨頁的畫面。",
      quote: "",
      pagePriority: "cover",
    },
  },
  {
    id: "photo-jojakkoji",
    tripId: "hokuriku-2026",
    thumbnailSrc: albumImage,
    originalFileName: "IMG_20261116_1320.jpg",
    storedFileName: "HOKURIKU2026_Day03_2026-11-16_Kyoto_Jojakkoji_002.jpg",
    driveFileId: "mock-drive-jojakkoji",
    driveFolderId: "mock-folder-day03",
    driveWebViewLink: null,
    day: 3,
    tripDate: "2026-11-16",
    city: "京都",
    placeName: "常寂光寺",
    placeId: "jojakkoji",
    itineraryTitle: "嵐山小火車與常寂光寺",
    caption: "常寂光寺石階紅葉",
    memoryNote: "可補充爸媽慢慢走石階的片段。",
    tags: ["京都", "寺院", "紅葉", "Day3"],
    peopleTags: [],
    isFavorite: false,
    isCoverCandidate: false,
    autoDetectedDay: 3,
    autoDetectedDate: "2026-11-16",
    autoDetectedCity: "京都",
    autoDetectedPlaceName: "常寂光寺",
    autoDetectedPlaceId: "jojakkoji",
    autoDetectedTags: ["京都", "寺院", "紅葉", "Day3"],
    autoDetectionSource: "exif-gps",
    autoDetectionConfidence: "high",
    autoDetectionNote: "GPS 落在常寂光寺半徑內。",
    uploadStatus: "uploaded",
    uploadProgress: 100,
    uploadError: null,
    uploadedAt: "2026-11-16T13:30:00+09:00",
    updatedAt: "2026-11-16T13:30:00+09:00",
    sortOrder: 30,
    memoir: {
      includeInMemoir: false,
      chapterTitle: "",
      paragraphNote: "",
      quote: "",
      pagePriority: "normal",
    },
  },
  {
    id: "photo-kenrokuen",
    tripId: "hokuriku-2026",
    thumbnailSrc: onsenImage,
    originalFileName: "IMG_20261118_0940.jpg",
    storedFileName: "HOKURIKU2026_Day05_2026-11-18_Kanazawa_Kenrokuen_014.jpg",
    driveFileId: "mock-drive-kenrokuen",
    driveFolderId: "mock-folder-day05",
    driveWebViewLink: null,
    day: 5,
    tripDate: "2026-11-18",
    city: "金澤",
    placeName: "兼六園",
    placeId: "kenrokuen",
    itineraryTitle: "兼六園近江町山中溫泉",
    caption: "兼六園雪吊與紅葉",
    memoryNote: "庭園照片可以放在金澤章節封面後。",
    tags: ["金澤", "庭園", "紅葉", "Day5"],
    peopleTags: [],
    isFavorite: true,
    isCoverCandidate: false,
    autoDetectedDay: 5,
    autoDetectedDate: "2026-11-18",
    autoDetectedCity: "金澤",
    autoDetectedPlaceName: "兼六園",
    autoDetectedPlaceId: "kenrokuen",
    autoDetectedTags: ["金澤", "庭園", "紅葉", "Day5"],
    autoDetectionSource: "exif-gps",
    autoDetectionConfidence: "high",
    autoDetectionNote: "GPS 落在兼六園半徑內，日期符合 Day 5。",
    uploadStatus: "uploaded",
    uploadProgress: 100,
    uploadError: null,
    uploadedAt: "2026-11-18T10:00:00+09:00",
    updatedAt: "2026-11-18T10:00:00+09:00",
    sortOrder: 40,
    memoir: {
      includeInMemoir: true,
      chapterTitle: "金澤庭園",
      paragraphNote: "兼六園是金澤段最有代表性的照片。",
      quote: "",
      pagePriority: "large",
    },
  },
  {
    id: "photo-yamanaka-onsen",
    tripId: "hokuriku-2026",
    thumbnailSrc: onsenImage,
    originalFileName: "IMG_20261119_1628.jpg",
    storedFileName: "HOKURIKU2026_Day06_2026-11-19_Yamanaka_Kakusenkei_004.jpg",
    driveFileId: "mock-drive-kakusenkei",
    driveFolderId: "mock-folder-day06",
    driveWebViewLink: null,
    day: 6,
    tripDate: "2026-11-19",
    city: "山中溫泉",
    placeName: "鶴仙溪",
    placeId: "kakusenkei",
    itineraryTitle: "山中溫泉鶴仙溪",
    caption: "鶴仙溪散步橋邊",
    memoryNote: "溫泉段節奏放慢，適合寫一段休息感。",
    tags: ["山中溫泉", "溪谷", "紅葉", "散步", "Day6"],
    peopleTags: [],
    isFavorite: false,
    isCoverCandidate: false,
    autoDetectedDay: 6,
    autoDetectedDate: "2026-11-19",
    autoDetectedCity: "山中溫泉",
    autoDetectedPlaceName: "鶴仙溪",
    autoDetectedPlaceId: "kakusenkei",
    autoDetectedTags: ["山中溫泉", "溪谷", "紅葉", "散步", "Day6"],
    autoDetectionSource: "exif-date",
    autoDetectionConfidence: "medium",
    autoDetectionNote: "日期符合 Day 6，GPS 缺少時先依行程推定。",
    uploadStatus: "needs-review",
    uploadProgress: 100,
    uploadError: null,
    uploadedAt: "2026-11-19T16:40:00+09:00",
    updatedAt: "2026-11-19T16:40:00+09:00",
    sortOrder: 50,
    memoir: {
      includeInMemoir: false,
      chapterTitle: "",
      paragraphNote: "",
      quote: "",
      pagePriority: "normal",
    },
  },
  {
    id: "photo-unsorted",
    tripId: "hokuriku-2026",
    thumbnailSrc: albumImage,
    originalFileName: "LINE_OLD_PHOTO.jpg",
    storedFileName: "HOKURIKU2026_Unsorted_001.jpg",
    driveFileId: null,
    driveFolderId: null,
    driveWebViewLink: null,
    day: null,
    tripDate: null,
    city: null,
    placeName: null,
    placeId: null,
    itineraryTitle: null,
    caption: "老照片待確認",
    memoryNote: "缺少 EXIF 與 GPS，Phase 2 會放入待整理流程。",
    tags: ["需要確認"],
    peopleTags: [],
    isFavorite: false,
    isCoverCandidate: false,
    autoDetectedDay: null,
    autoDetectedDate: null,
    autoDetectedCity: null,
    autoDetectedPlaceName: null,
    autoDetectedPlaceId: null,
    autoDetectedTags: ["需要確認"],
    autoDetectionSource: "unknown",
    autoDetectionConfidence: "unknown",
    autoDetectionNote: "沒有拍攝時間與 GPS，先放入待整理照片。",
    uploadStatus: "needs-review",
    uploadProgress: 0,
    uploadError: null,
    uploadedAt: "2026-11-21T22:00:00+09:00",
    updatedAt: "2026-11-21T22:00:00+09:00",
    sortOrder: 90,
    memoir: {
      includeInMemoir: false,
      chapterTitle: "",
      paragraphNote: "",
      quote: "",
      pagePriority: "small",
    },
  },
];

export const mockPhotoRecords: PhotoRecord[] = mockPhotoRecordInputs.map(
  createMockPhotoRecord,
);
