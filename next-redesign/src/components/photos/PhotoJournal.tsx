"use client";

import {
  type ChangeEvent,
  type ReactNode,
  type TouchEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  Download,
  ExternalLink,
  FolderOpen,
  FolderPlus,
  Heart,
  ImagePlus,
  MapPinned,
  NotebookPen,
  RefreshCw,
  Sparkles,
  Tag,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  buildAutoDetectionResult,
  buildInitialPhotoRecord,
  chooseTargetDriveFolder,
  readPhotoMetadata,
} from "@/services/photoAutoOrganizer";
import {
  buildDayFolderMap,
  buildDriveOpenUrl,
  createGoogleDrivePhotoService,
  readStoredDriveScanResult,
  readStoredGoogleClientId,
  requestGoogleDriveAccessToken,
  validateRequiredFolders,
  writeStoredDriveScanResult,
  writeStoredGoogleClientId,
} from "@/services/googleDrivePhotoService";
import {
  createLocalStoragePhotoMetadataRepository,
  PHOTO_METADATA_STORAGE_KEY,
  type PhotoMetadataRepository,
} from "@/services/photoMetadataRepository";
import {
  buildMemoirJson,
  buildMemoirMarkdown,
  buildPhotosIndexCsv,
  downloadTextFile,
} from "@/services/memoirExportService";
import type {
  PhotoDriveScanResult,
  PhotoDaySummary,
  PhotoDetectionConfidence,
  PhotoDriveConnectionStatus,
  PhotoRecord,
  PhotoTabId,
  PhotoUploadStatus,
} from "@/types/photos";

type PhotoJournalProps = {
  initialPhotos: PhotoRecord[];
  daySummaries: PhotoDaySummary[];
  filters: string[];
  tabs: Array<{ id: PhotoTabId; label: string }>;
  driveStatus: PhotoDriveConnectionStatus;
  initialDriveScanResult?: PhotoDriveScanResult;
  onPhotosChange?: (photos: PhotoRecord[]) => void;
};

type UploadPreview = {
  id: string;
  sortOrder: number;
  filename: string;
  detectedDate: string;
  detectedDay: string;
  detectedCity: string;
  detectedPlace: string;
  confidence: PhotoDetectionConfidence;
  status: string;
  progress: number;
};

const confidenceLabels: Record<PhotoDetectionConfidence, string> = {
  high: "高信心",
  medium: "中信心",
  low: "低信心",
  unknown: "未知",
};

const confidenceClassNames: Record<PhotoDetectionConfidence, string> = {
  high: "border-[#607348] bg-[#eef3e8] text-[#445433]",
  medium: "border-[#c8a24a] bg-[#fff8df] text-[#7d5b16]",
  low: "border-[#d59a62] bg-[#fff1e6] text-[#8a4b1f]",
  unknown: "border-[#d8c3a3] bg-[#f8f4ec] text-[#5f5549]",
};

const statusLabels: Record<PhotoUploadStatus, string> = {
  uploaded: "已整理",
  "needs-review": "需要確認",
  pending: "待整理",
  failed: "上傳失敗",
};

const statusClassNames: Record<PhotoUploadStatus, string> = {
  uploaded: "border-[#607348] bg-[#eef3e8] text-[#445433]",
  "needs-review": "border-[#c8a24a] bg-[#fff8df] text-[#7d5b16]",
  pending: "border-[#d8c3a3] bg-[#f8f4ec] text-[#5f5549]",
  failed: "border-[#c76d5c] bg-[#fff4f0] text-[#a33a2b]",
};

const sourceLabels: Record<PhotoRecord["autoDetectionSource"], string> = {
  "exif-gps": "EXIF GPS",
  "exif-date": "EXIF 拍攝時間",
  "file-last-modified": "檔案時間",
  "itinerary-inference": "行程推定",
  manual: "手動修正",
  unknown: "尚未判斷",
};

export function PhotoJournal({
  initialPhotos,
  daySummaries,
  filters,
  tabs,
  driveStatus,
  initialDriveScanResult,
  onPhotosChange,
}: PhotoJournalProps) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [activeTab, setActiveTab] = useState<PhotoTabId>("date");
  const [activeFilter, setActiveFilter] = useState("全部");
  const [uploadPreviews, setUploadPreviews] = useState<UploadPreview[]>([]);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const touchStartX = useRef<number | null>(null);
  const uploadSequenceRef = useRef(0);
  const metadataRepositoryRef = useRef<PhotoMetadataRepository | null>(null);
  const deletedPhotoIdsRef = useRef<Set<string>>(new Set());
  const [metadataRepositoryReady, setMetadataRepositoryReady] = useState(false);
  const configuredRootFolderId =
    process.env.NEXT_PUBLIC_GOOGLE_DRIVE_ALBUM_FOLDER_ID ??
    driveStatus.rootFolderId;
  const [driveScanResult, setDriveScanResult] =
    useState<PhotoDriveScanResult | null>(
      () => readInitialDriveScanResult() ?? initialDriveScanResult ?? null,
    );
  const [driveRootFolderId, setDriveRootFolderId] = useState(
    () =>
      readInitialDriveScanResult()?.rootFolderId ??
      initialDriveScanResult?.rootFolderId ??
      configuredRootFolderId,
  );
  const [driveAccessToken, setDriveAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const repository = createLocalStoragePhotoMetadataRepository(
      window.localStorage,
    );
    let isActive = true;
    const hasStoredPhotoMetadata =
      window.localStorage.getItem(PHOTO_METADATA_STORAGE_KEY) !== null;

    metadataRepositoryRef.current = repository;

    void repository
      .listPhotos("hokuriku-2026")
      .then(async (storedPhotos) => {
        if (!isActive) {
          return;
        }

        const visibleStoredPhotos = storedPhotos.filter(
          (photo) => !deletedPhotoIdsRef.current.has(photo.id),
        );
        const visibleInitialPhotos = initialPhotos.filter(
          (photo) => !deletedPhotoIdsRef.current.has(photo.id),
        );

        if (hasStoredPhotoMetadata) {
          setPhotos(visibleStoredPhotos);
        } else {
          await Promise.all(
            visibleInitialPhotos.map((photo) =>
              repository.savePhotoMetadata(photo),
            ),
          );
        }

        if (isActive) {
          setMetadataRepositoryReady(true);
        }
      })
      .catch(() => {
        if (isActive) {
          setMetadataRepositoryReady(true);
        }
      });

    return () => {
      isActive = false;
    };
  }, [initialPhotos]);

  useEffect(() => {
    onPhotosChange?.(photos);
  }, [onPhotosChange, photos]);

  useEffect(() => {
    if (!metadataRepositoryReady || !metadataRepositoryRef.current) {
      return;
    }

    const repository = metadataRepositoryRef.current;
    const visiblePhotos = photos.filter(
      (photo) => !deletedPhotoIdsRef.current.has(photo.id),
    );
    const deletedPhotoIds = Array.from(deletedPhotoIdsRef.current);

    void Promise.all(
      [
        ...visiblePhotos.map((photo) => repository.savePhotoMetadata(photo)),
        ...deletedPhotoIds.map((photoId) =>
          repository.deletePhotoMetadata(photoId),
        ),
      ],
    );
  }, [metadataRepositoryReady, photos]);

  const selectedPhotoIndex = photos.findIndex(
    (photo) => photo.id === selectedPhotoId,
  );
  const selectedPhoto =
    selectedPhotoIndex >= 0 ? photos[selectedPhotoIndex] : null;

  const filteredPhotos = useMemo(() => {
    const tabPhotos = photos.filter((photo) => {
      if (activeTab === "favorites") {
        return photo.isFavorite;
      }

      if (activeTab === "unsorted") {
        return (
          photo.day === null ||
          photo.uploadStatus === "needs-review" ||
          photo.autoDetectionConfidence === "low" ||
          photo.autoDetectionConfidence === "unknown"
        );
      }

      if (activeTab === "memoir") {
        return photo.memoir.includeInMemoir;
      }

      return true;
    });

    if (activeFilter === "全部") {
      return tabPhotos;
    }

    if (activeFilter === "精選") {
      return tabPhotos.filter((photo) => photo.isFavorite);
    }

    if (activeFilter === "需要確認") {
      return tabPhotos.filter(
        (photo) =>
          photo.uploadStatus === "needs-review" ||
          photo.autoDetectionConfidence === "low" ||
          photo.autoDetectionConfidence === "unknown",
      );
    }

    return tabPhotos.filter((photo) =>
      [
        photo.city,
        photo.placeName,
        photo.itineraryTitle,
        ...photo.tags,
        ...photo.peopleTags,
      ]
        .filter(Boolean)
        .includes(activeFilter),
    );
  }, [activeFilter, activeTab, photos]);

  const daySections = useMemo(() => {
    return daySummaries
      .map((day) => {
        const dayPhotos = filteredPhotos
          .filter((photo) => photo.day === day.day)
          .sort((a, b) => a.sortOrder - b.sortOrder);

        return {
          ...day,
          photos: dayPhotos,
          favoriteCount: dayPhotos.filter((photo) => photo.isFavorite).length,
          reviewCount: dayPhotos.filter(
            (photo) =>
              photo.uploadStatus === "needs-review" ||
              photo.autoDetectionConfidence === "low" ||
              photo.autoDetectionConfidence === "unknown",
          ).length,
        };
      })
      .filter((day) => day.photos.length > 0);
  }, [daySummaries, filteredPhotos]);

  const placeSections = useMemo(() => {
    return filteredPhotos.reduce<Array<{ place: string; photos: PhotoRecord[] }>>(
      (sections, photo) => {
        const place = photo.city ?? "待整理照片";
        const current = sections.find((section) => section.place === place);

        if (current) {
          current.photos.push(photo);
          return sections;
        }

        return [...sections, { place, photos: [photo] }];
      },
      [],
    );
  }, [filteredPhotos]);

  const memoirPhotos = useMemo(
    () =>
      photos
        .filter((photo) => photo.memoir.includeInMemoir)
        .sort((a, b) => {
          const dayA = a.day ?? Number.MAX_SAFE_INTEGER;
          const dayB = b.day ?? Number.MAX_SAFE_INTEGER;

          if (dayA !== dayB) {
            return dayA - dayB;
          }

          return a.sortOrder - b.sortOrder;
        }),
    [photos],
  );

  function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const previews = files.map((file) => {
      uploadSequenceRef.current += 1;

      return {
        id: `upload-${uploadSequenceRef.current}`,
        sortOrder: uploadSequenceRef.current,
        filename: file.name,
        detectedDate: "讀取 metadata",
        detectedDay: "待整理照片",
        detectedCity: "待整理",
        detectedPlace: "待整理照片",
        confidence: "unknown" as const,
        status: "讀取 metadata",
        progress: 15,
      };
    });

    setUploadPreviews((current) => [...previews, ...current]);
    event.target.value = "";

    previews.forEach((preview, index) => {
      const file = files[index];

      if (!file) {
        return;
      }

      void processUploadedFile(file, preview.id, preview.sortOrder);
    });
  }

  async function processUploadedFile(
    file: File,
    previewId: string,
    sortOrder: number,
  ) {
    try {
      const metadata = await readPhotoMetadata(file);
      const detection = buildAutoDetectionResult(metadata);
      const record = buildInitialPhotoRecord(file, detection, {
        id: previewId.replace("upload", "photo"),
        sequence: photos.length + uploadPreviews.length + 1,
        sortOrder,
        thumbnailSrc: createPhotoPreviewUrl(file),
        fileMetadata: metadata,
      });
      const hasDriveUploadTarget = Boolean(driveAccessToken && driveScanResult);

      setUploadPreviews((current) =>
        current.map((preview) =>
          preview.id === previewId
            ? {
                ...preview,
                detectedDate: detection.tripDate ?? "日期待確認",
                detectedDay: detection.day ? `Day ${detection.day}` : "待整理照片",
                detectedCity: detection.city ?? "待整理",
                detectedPlace: detection.placeName ?? "待整理照片",
                confidence: detection.confidence,
                status: hasDriveUploadTarget ? "上傳 Drive 中" : "待連接 Drive",
                progress: hasDriveUploadTarget ? 70 : record.uploadProgress,
              }
            : preview,
        ),
      );
      const uploadResult = await uploadPhotoRecordToDrive(file, record, detection);

      setUploadPreviews((current) =>
        current.map((preview) =>
          preview.id === previewId
            ? {
                ...preview,
                status: uploadResult.previewStatus,
                progress: uploadResult.progress,
              }
            : preview,
        ),
      );
      setPhotos((current) => [uploadResult.record, ...current]);
    } catch {
      setUploadPreviews((current) =>
        current.map((preview) =>
          preview.id === previewId
            ? {
                ...preview,
                status: "讀取失敗",
                progress: 0,
              }
            : preview,
        ),
      );
    }
  }

  async function uploadPhotoRecordToDrive(
    file: File,
    record: PhotoRecord,
    detection: Parameters<typeof chooseTargetDriveFolder>[0],
  ): Promise<{ record: PhotoRecord; previewStatus: string; progress: number }> {
    if (!driveAccessToken || !driveScanResult) {
      return {
        record,
        previewStatus: "待連接 Drive",
        progress: record.uploadProgress,
      };
    }

    const targetFolderId = chooseTargetDriveFolder(
      detection,
      driveScanResult.dayFolderMap,
    );

    if (!targetFolderId) {
      return {
        record: {
          ...record,
          uploadStatus: "failed",
          uploadProgress: 0,
          uploadError: "找不到對應的 Google Drive 目標資料夾。",
        },
        previewStatus: "缺少 Drive 資料夾",
        progress: 0,
      };
    }

    try {
      const service = createGoogleDrivePhotoService({
        accessToken: driveAccessToken,
      });
      const uploadedFile = await service.uploadPhotoFile({
        file,
        fileName: record.storedFileName,
        folderId: targetFolderId,
      });

      return {
        record: {
          ...record,
          driveFileId: uploadedFile.id,
          driveFolderId: targetFolderId,
          driveWebViewLink: uploadedFile.webViewLink ?? null,
          driveWebContentLink: uploadedFile.webContentLink ?? null,
          thumbnailLink: uploadedFile.thumbnailLink ?? record.thumbnailLink,
          uploadProgress: 100,
          uploadError: null,
        },
        previewStatus: "已上傳 Drive",
        progress: 100,
      };
    } catch (error) {
      return {
        record: {
          ...record,
          driveFolderId: targetFolderId,
          uploadStatus: "failed",
          uploadProgress: 0,
          uploadError:
            error instanceof Error ? error.message : "Google Drive 上傳失敗。",
        },
        previewStatus: "Drive 上傳失敗",
        progress: 0,
      };
    }
  }

  function updatePhoto(photoId: string, patch: Partial<PhotoRecord>) {
    setPhotos((current) =>
      current.map((photo) =>
        photo.id === photoId
          ? {
              ...photo,
              ...patch,
              updatedAt: new Date().toISOString(),
            }
          : photo,
      ),
    );
  }

  function updateMemoir(
    photoId: string,
    patch: Partial<PhotoRecord["memoir"]>,
  ) {
    setPhotos((current) =>
      current.map((photo) =>
        photo.id === photoId
          ? {
              ...photo,
              memoir: {
                ...photo.memoir,
                ...patch,
              },
              updatedAt: new Date().toISOString(),
            }
          : photo,
      ),
    );
  }

  function deletePhoto(photoId: string) {
    const targetPhoto = photos.find((photo) => photo.id === photoId);

    if (!targetPhoto) {
      return;
    }

    const confirmed = window.confirm(
      `要從相簿移除「${targetPhoto.caption}」嗎？Google Drive 原始檔會保留。`,
    );

    if (!confirmed) {
      return;
    }

    deletedPhotoIdsRef.current.add(photoId);
    setPhotos((current) => current.filter((photo) => photo.id !== photoId));
    setSelectedPhotoId((current) => (current === photoId ? null : current));

    const repository =
      metadataRepositoryRef.current ??
      createLocalStoragePhotoMetadataRepository(window.localStorage);

    void repository.deletePhotoMetadata(photoId);
  }

  function openPhoto(photoId: string) {
    setSelectedPhotoId(photoId);
  }

  function moveLightbox(direction: "previous" | "next") {
    if (!selectedPhoto) {
      return;
    }

    const nextIndex =
      direction === "next"
        ? (selectedPhotoIndex + 1) % photos.length
        : (selectedPhotoIndex - 1 + photos.length) % photos.length;

    setSelectedPhotoId(photos[nextIndex]?.id ?? null);
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (touchStartX.current === null) {
      return;
    }

    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(delta) < 40) {
      return;
    }

    moveLightbox(delta < 0 ? "next" : "previous");
  }

  return (
    <section className="mx-auto max-w-7xl space-y-5 px-4 pb-12 sm:space-y-6 sm:px-8 lg:px-10">
      <DriveStatusPanel
        driveStatus={driveStatus}
        scanResult={driveScanResult}
        rootFolderId={driveRootFolderId}
        accessToken={driveAccessToken}
        onAccessTokenChange={setDriveAccessToken}
        onRootFolderIdChange={setDriveRootFolderId}
        onScanResultChange={setDriveScanResult}
      />

      <UploadPanel onUpload={handleUpload} uploadPreviews={uploadPreviews} />

      <div className="sticky top-[4.25rem] z-30 space-y-3 rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8]/96 p-3 shadow-sm backdrop-blur-md sm:static sm:space-y-4 sm:p-5">
        <div
          className="scrollbar-none flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]"
          role="tablist"
          aria-label="照片檢視方式"
        >
          {tabs.map((tab) => (
            <button
              className={`min-h-10 shrink-0 rounded-[8px] border px-3 text-[14px] font-semibold leading-tight transition sm:min-h-11 sm:px-4 sm:text-[15px] ${
                activeTab === tab.id
                  ? "border-[#a33a2b] bg-[#a33a2b] text-white"
                  : "border-[#e6d8c3] bg-[#f8f4ec] text-[#5f5549] hover:border-[#c8a24a]"
              }`}
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
          {filters.map((filter) => (
            <button
              className={`min-h-9 shrink-0 rounded-full border px-3 text-[13px] font-semibold leading-tight transition sm:min-h-10 sm:px-4 sm:text-[14px] ${
                activeFilter === filter
                  ? "border-[#607348] bg-[#eef3e8] text-[#445433]"
                  : "border-[#e6d8c3] bg-[#fffaf1] text-[#6b4a2f] hover:border-[#c8a24a]"
              }`}
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "date" ? (
        <DatePhotoSections
          sections={daySections}
          onOpen={openPhoto}
          onPhotoChange={updatePhoto}
          onMemoirChange={updateMemoir}
          onPhotoDelete={deletePhoto}
        />
      ) : null}

      {activeTab === "place" ? (
        <PlacePhotoSections
          sections={placeSections}
          onOpen={openPhoto}
          onPhotoChange={updatePhoto}
          onMemoirChange={updateMemoir}
          onPhotoDelete={deletePhoto}
        />
      ) : null}

      {activeTab === "memoir" ? (
        <MemoirWorkspace
          photos={memoirPhotos}
          onMemoirChange={updateMemoir}
        />
      ) : null}

      {["favorites", "unsorted", "memoir"].includes(activeTab) ? (
        <PhotoGrid
          photos={filteredPhotos}
          onOpen={openPhoto}
          onPhotoChange={updatePhoto}
          onMemoirChange={updateMemoir}
          onPhotoDelete={deletePhoto}
          emptyText="此分類目前沒有照片。"
        />
      ) : null}

      {selectedPhoto ? (
        <PhotoLightbox
          photo={selectedPhoto}
          onClose={() => setSelectedPhotoId(null)}
          onNext={() => moveLightbox("next")}
          onPrevious={() => moveLightbox("previous")}
          onPhotoChange={updatePhoto}
          onMemoirChange={updateMemoir}
          onPhotoDelete={deletePhoto}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        />
      ) : null}
    </section>
  );
}

function DriveStatusPanel({
  driveStatus,
  scanResult,
  rootFolderId,
  accessToken,
  onAccessTokenChange,
  onRootFolderIdChange,
  onScanResultChange,
}: {
  driveStatus: PhotoDriveConnectionStatus;
  scanResult: PhotoDriveScanResult | null;
  rootFolderId: string;
  accessToken: string | null;
  onAccessTokenChange: (accessToken: string | null) => void;
  onRootFolderIdChange: (rootFolderId: string) => void;
  onScanResultChange: (scanResult: PhotoDriveScanResult | null) => void;
}) {
  const configuredGoogleClientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "";
  const [browserGoogleClientId, setBrowserGoogleClientId] = useState(
    readInitialGoogleClientId,
  );
  const [driveStatusMessage, setDriveStatusMessage] = useState(
    "Google Drive access token 只保留在目前瀏覽器記憶體。",
  );
  const [driveError, setDriveError] = useState("");
  const [isDriveBusy, setIsDriveBusy] = useState(false);
  const [isDriveSettingsOpen, setIsDriveSettingsOpen] = useState(false);

  const folderMapCount = scanResult
    ? Object.keys(scanResult.dayFolderMap).length
    : 0;
  const missingFolderCount = scanResult?.missingFolders.length ?? 0;
  const driveOpenUrl = rootFolderId ? buildDriveOpenUrl(rootFolderId) : "";
  const effectiveGoogleClientId =
    configuredGoogleClientId || browserGoogleClientId.trim();
  const hasConfiguredGoogleClientId = Boolean(configuredGoogleClientId);
  const driveSummary = missingFolderCount
    ? `已建立 ${folderMapCount} 個資料夾對應，缺少 ${missingFolderCount} 個資料夾。`
    : `${folderMapCount} 個資料夾對應已完成。`;

  function updateBrowserGoogleClientId(clientId: string) {
    setBrowserGoogleClientId(clientId);

    if (typeof window === "undefined") {
      return;
    }

    writeStoredGoogleClientId(window.localStorage, clientId);
  }

  async function connectGoogleDrive() {
    if (!effectiveGoogleClientId) {
      setDriveError(
        "請先貼上 Google OAuth Client ID，並確認此 Client ID 已允許正式網站網域。",
      );
      return null;
    }

    setIsDriveBusy(true);
    setDriveError("");

    try {
      const token = await requestGoogleDriveAccessToken({
        clientId: effectiveGoogleClientId,
      });
      onAccessTokenChange(token);
      setDriveStatusMessage("Google Drive 已連接，可掃描旅行相簿資料夾。");
      return token;
    } catch (error) {
      setDriveError(error instanceof Error ? error.message : "Google Drive 連接失敗。");
      return null;
    } finally {
      setIsDriveBusy(false);
    }
  }

  async function scanDriveFolders() {
    if (!rootFolderId.trim()) {
      setDriveError("請先輸入 Google Drive 根資料夾 ID。");
      return;
    }

    const token = accessToken ?? (await connectGoogleDrive());

    if (!token) {
      return;
    }

    setIsDriveBusy(true);
    setDriveError("");

    try {
      const service = createGoogleDrivePhotoService({ accessToken: token });
      const result = await service.scanAlbumRootFolder(rootFolderId);
      onScanResultChange(result);
      writeStoredDriveScanResult(window.localStorage, result);
      onRootFolderIdChange(result.rootFolderId);
      setDriveStatusMessage(
        `已掃描 ${result.scannedFolderCount} 個 Google Drive 子資料夾。`,
      );
    } catch (error) {
      setDriveError(error instanceof Error ? error.message : "掃描 Drive 資料夾失敗。");
    } finally {
      setIsDriveBusy(false);
    }
  }

  async function createMissingFolders() {
    if (!scanResult || scanResult.missingFolders.length === 0) {
      return;
    }

    const token = accessToken ?? (await connectGoogleDrive());

    if (!token) {
      return;
    }

    setIsDriveBusy(true);
    setDriveError("");

    try {
      const service = createGoogleDrivePhotoService({ accessToken: token });
      const createdFolders = await service.getOrCreateMissingFolders(
        scanResult.rootFolderId,
        scanResult.missingFolders,
      );
      const folders = [...scanResult.folders, ...createdFolders];
      const dayFolderMap = buildDayFolderMap(folders);
      const nextResult: PhotoDriveScanResult = {
        ...scanResult,
        folders,
        dayFolderMap,
        missingFolders: validateRequiredFolders(dayFolderMap),
        scannedFolderCount: folders.length,
        scannedAt: new Date().toISOString(),
      };
      onScanResultChange(nextResult);
      writeStoredDriveScanResult(window.localStorage, nextResult);
      setDriveStatusMessage(`已建立 ${createdFolders.length} 個缺漏資料夾。`);
    } catch (error) {
      setDriveError(error instanceof Error ? error.message : "建立缺漏資料夾失敗。");
    } finally {
      setIsDriveBusy(false);
    }
  }

  return (
    <section className="grid gap-4 rounded-[8px] border border-[#d8c3a3] bg-[#fffaf1] p-4 shadow-sm sm:p-5 lg:grid-cols-[1fr_auto] lg:items-start">
      <div className="space-y-2">
        <p className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-[#a33a2b] sm:text-[15px]">
          <FolderOpen className="size-4" />
          Google Drive
        </p>
        <h2 className="font-serif text-[24px] leading-tight text-[#2f2a24] sm:text-[28px]">
          既有相簿資料夾
        </h2>
        <p className="text-[15px] leading-7 text-[#5f5549] sm:text-[16px]">
          {driveStatus.rootFolderName}・已掃描 {driveStatus.scannedFolderCount} 個子資料夾
        </p>
      </div>
      <div className="grid min-w-0 gap-2 sm:grid-cols-2 lg:min-w-[360px]">
        <div className="space-y-4 sm:col-span-2">
          <div className="rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] p-3 text-[14px] leading-7 text-[#5f5549] sm:text-[15px]">
            <p className="flex items-center gap-2 font-semibold text-[#445433]">
              <CheckCircle2 className="size-4" />
              Drive 已設定
            </p>
            <p className="mt-1 text-[14px] font-semibold text-[#5f5549]">
              {driveSummary}
            </p>
            {scanResult ? (
              <p className="flex items-center gap-2 font-semibold text-[#8a5a3b]">
                <AlertTriangle className="size-4" />
                {missingFolderCount
                  ? `缺少 ${missingFolderCount} 個資料夾`
                  : "必要資料夾已齊全"}
              </p>
            ) : null}
            <p className="mt-2 text-[14px] font-semibold text-[#5f5549]">
              {driveStatusMessage}
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-3 min-h-10 rounded-[8px] text-[14px]"
              aria-expanded={isDriveSettingsOpen}
              onClick={() => setIsDriveSettingsOpen((isOpen) => !isOpen)}
            >
              Drive 進階設定
            </Button>
          </div>
          {driveError ? (
            <p className="rounded-[8px] border border-[#c76d5c] bg-[#fff4f0] px-3 py-2 text-[15px] font-semibold text-[#a33a2b]">
              {driveError}
            </p>
          ) : null}
          {isDriveSettingsOpen ? (
            <div className="space-y-4 rounded-[8px] border border-[#d8c3a3] bg-[#fffdf8] p-3 sm:p-4">
              <label className="grid gap-2 text-[14px] font-semibold text-[#5f5549]">
                <span>Google OAuth Client ID</span>
                <input
                  aria-label="Google OAuth Client ID"
                  autoComplete="off"
                  className="min-h-11 rounded-[8px] border border-[#e6d8c3] bg-white px-3 text-[15px] text-[#2f2a24] disabled:bg-[#f3eadb] disabled:text-[#8a7c6d]"
                  disabled={hasConfiguredGoogleClientId}
                  spellCheck={false}
                  value={
                    hasConfiguredGoogleClientId
                      ? configuredGoogleClientId
                      : browserGoogleClientId
                  }
                  onChange={(event) =>
                    updateBrowserGoogleClientId(event.target.value)
                  }
                  placeholder="貼上 ...apps.googleusercontent.com"
                />
                <span className="text-[13px] font-medium leading-6 text-[#8a5a3b]">
                  {hasConfiguredGoogleClientId
                    ? "此版本已內建 OAuth Client ID；client secret 不可放在前端。"
                    : "正式站上傳需要此 ID。它可存在這台裝置；不要填 client secret。"}
                </span>
              </label>
              <label className="grid gap-2 text-[14px] font-semibold text-[#5f5549]">
                <span>Google Drive 根資料夾 ID</span>
                <input
                  aria-label="Google Drive 根資料夾 ID"
                  className="min-h-11 rounded-[8px] border border-[#e6d8c3] bg-white px-3 text-[15px] text-[#2f2a24]"
                  value={rootFolderId}
                  onChange={(event) => onRootFolderIdChange(event.target.value)}
                  placeholder="貼上 Drive folder ID 或資料夾網址"
                />
              </label>
              <div className="grid gap-2 sm:grid-cols-3">
                <Button
                  type="button"
                  className="min-h-11 rounded-[8px] bg-[#a33a2b]"
                  disabled={isDriveBusy}
                  onClick={() => {
                    void connectGoogleDrive();
                  }}
                >
                  連接 Google Drive
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 rounded-[8px]"
                  disabled={isDriveBusy}
                  onClick={() => {
                    void scanDriveFolders();
                  }}
                >
                  <RefreshCw className="size-4" />
                  掃描 Drive 資料夾
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 rounded-[8px]"
                  disabled={isDriveBusy || missingFolderCount === 0}
                  onClick={() => {
                    void createMissingFolders();
                  }}
                >
                  <FolderPlus className="size-4" />
                  建立缺漏資料夾
                </Button>
              </div>
              {driveOpenUrl ? (
                <a
                  className="inline-flex min-h-10 items-center gap-2 rounded-[8px] border border-[#e6d8c3] bg-[#fffaf1] px-3 text-[14px] font-semibold text-[#6b4a2f]"
                  href={driveOpenUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="size-4" />
                  開啟 Drive 根資料夾
                </a>
              ) : null}
              {scanResult?.missingFolders.length ? (
                <div className="rounded-[8px] border border-[#d8c3a3] bg-[#fffaf1] p-3">
                  <p className="mb-2 text-[15px] font-semibold text-[#a33a2b]">
                    缺漏資料夾
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {scanResult.missingFolders.map((folder) => (
                      <span
                        className="rounded-full border border-[#e6d8c3] bg-[#fffdf8] px-3 py-1 text-[14px] font-semibold text-[#6b4a2f]"
                        key={folder.key}
                      >
                        {folder.name}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {scanResult ? (
                <div className="grid gap-2 rounded-[8px] border border-[#e6d8c3] bg-[#fffaf1] p-3 sm:grid-cols-2">
                  {Object.entries(scanResult.dayFolderMap).map(([key, folderId]) => (
                    <p
                      className="truncate text-[14px] font-semibold text-[#5f5549]"
                      key={key}
                    >
                      <span className="text-[#2f2a24]">{key}</span>：{folderId}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function UploadPanel({
  onUpload,
  uploadPreviews,
}: {
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  uploadPreviews: UploadPreview[];
}) {
  return (
    <section className="rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] p-4 shadow-sm sm:p-6">
      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr] lg:gap-5">
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-[#a33a2b] sm:text-[15px]">
            <ImagePlus className="size-4" />
            Upload
          </p>
          <h2 className="font-serif text-[26px] leading-tight text-[#2f2a24] sm:text-[32px]">
            上傳照片，系統自動整理
          </h2>
          <p className="text-[15px] leading-7 text-[#5f5549] sm:text-[17px] sm:leading-8">
            系統會自動讀取照片拍攝時間與位置，判斷 Day、城市與景點。若部分照片沒有 GPS 或拍攝時間，也可以先上傳，之後再整理。
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
          <UploadAction
            id="camera-upload"
            label="手機拍照上傳"
            icon={<Camera className="size-5" />}
            onUpload={onUpload}
            capture
          />
          <UploadAction
            id="album-upload"
            label="從相簿選取"
            icon={<ImagePlus className="size-5" />}
            onUpload={onUpload}
          />
          <UploadAction
            id="multi-upload"
            label="多張上傳"
            icon={<UploadCloud className="size-5" />}
            onUpload={onUpload}
            multiple
          />
        </div>
      </div>

      {uploadPreviews.length ? (
        <div className="mt-4 rounded-[8px] border border-[#d8c3a3] bg-[#fffaf1] p-3 sm:mt-5 sm:p-4">
          <h3 className="mb-3 flex items-center gap-2 text-[19px] font-semibold text-[#2f2a24] sm:text-[21px]">
            <Sparkles className="size-5 text-[#a33a2b]" />
            自動整理結果
          </h3>
          <div className="grid gap-3">
            {uploadPreviews.map((preview) => (
              <article
                  className="grid gap-3 rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] p-3 text-[14px] sm:grid-cols-[1fr_auto] sm:text-[15px]"
                key={preview.id}
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[#2f2a24]">
                    {preview.filename}
                  </p>
                  <p className="mt-1 text-[#5f5549]">
                    {preview.detectedDate}・{preview.detectedDay}・
                    {preview.detectedCity}・{preview.detectedPlace}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <Badge className={confidenceClassNames[preview.confidence]}>
                    {confidenceLabels[preview.confidence]}
                  </Badge>
                  <Badge className="border-[#c8a24a] bg-[#fff8df] text-[#7d5b16]">
                    {preview.status}
                  </Badge>
                  <Button type="button" variant="outline" className="min-h-9 text-[13px]">
                    <RefreshCw className="size-4" />
                    失敗重試
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function UploadAction({
  id,
  label,
  icon,
  onUpload,
  capture,
  multiple = true,
}: {
  id: string;
  label: string;
  icon: ReactNode;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  capture?: boolean;
  multiple?: boolean;
}) {
  return (
    <label
      className="flex min-h-[4.75rem] cursor-pointer flex-row items-center justify-between gap-3 rounded-[8px] border border-dashed border-[#d6c3a6] bg-[#fffaf1] p-3 text-[15px] font-semibold text-[#2f2a24] transition hover:border-[#a33a2b] hover:bg-[#fff6e6] sm:min-h-24 sm:flex-col sm:items-start sm:p-4 sm:text-[16px]"
      htmlFor={id}
    >
      <span className="shrink-0 text-[#a33a2b]">{icon}</span>
      <span className="min-w-0 leading-snug">{label}</span>
      <input
        id={id}
        aria-label={label}
        className="sr-only"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        multiple={multiple}
        capture={capture ? "environment" : undefined}
        onChange={onUpload}
      />
    </label>
  );
}

function MemoirWorkspace({
  photos,
  onMemoirChange,
}: {
  photos: PhotoRecord[];
  onMemoirChange: (
    photoId: string,
    patch: Partial<PhotoRecord["memoir"]>,
  ) => void;
}) {
  const coverCount = photos.filter(
    (photo) => photo.memoir.pagePriority === "cover",
  ).length;
  const largeCount = photos.filter(
    (photo) => photo.memoir.pagePriority === "large",
  ).length;
  const daySections = photos.reduce<
    Array<{ key: string; title: string; photos: PhotoRecord[] }>
  >((sections, photo) => {
    const key = `${photo.day ?? "unsorted"}-${photo.tripDate ?? "no-date"}`;
    const existingSection = sections.find((section) => section.key === key);
    const title = photo.day
      ? `Day ${photo.day}｜${photo.tripDate ?? "日期待補"}｜${photo.city ?? "地點待補"}`
      : "未分類回憶素材";

    if (existingSection) {
      existingSection.photos.push(photo);
      return sections;
    }

    return [...sections, { key, title, photos: [photo] }];
  }, []);

  function exportMemoirJson() {
    downloadTextFile(
      "memoir.json",
      JSON.stringify(buildMemoirJson(photos), null, 2),
      "application/json;charset=utf-8",
    );
  }

  function exportMemoirMarkdown() {
    downloadTextFile(
      "memoir.md",
      buildMemoirMarkdown(photos),
      "text/markdown;charset=utf-8",
    );
  }

  function exportPhotosIndexCsv() {
    downloadTextFile(
      "photos-index.csv",
      buildPhotosIndexCsv(photos),
      "text/csv;charset=utf-8",
    );
  }

  if (!photos.length) {
    return (
      <section className="rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] p-4 shadow-sm sm:p-5">
        <h2 className="font-serif text-[26px] leading-tight text-[#2f2a24] sm:text-[30px]">
          回憶錄素材工作台
        </h2>
        <p className="mt-3 text-[15px] leading-7 text-[#5f5549] sm:text-[16px] sm:leading-8">
          先在照片卡片點選加入回憶錄，這裡會集中整理每日故事、版面優先度與匯出素材。
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] p-4 shadow-sm sm:space-y-5 sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.14em] text-[#a33a2b] sm:text-[14px]">
            Memoir Materials
          </p>
          <h2 className="font-serif text-[26px] leading-tight text-[#2f2a24] sm:text-[30px]">
            回憶錄素材工作台
          </h2>
          <p className="mt-2 max-w-3xl text-[15px] leading-7 text-[#5f5549] sm:text-[16px] sm:leading-8">
            把已選照片整理成每日章節、照片旁白與版面優先度，之後可直接交給回憶錄或相簿排版使用。
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[480px]">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 rounded-[8px] text-[14px]"
            onClick={exportMemoirJson}
          >
            <Download className="size-4" />
            匯出 memoir.json
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 rounded-[8px] text-[14px]"
            onClick={exportMemoirMarkdown}
          >
            <Download className="size-4" />
            匯出 memoir.md
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 rounded-[8px] text-[14px]"
            onClick={exportPhotosIndexCsv}
          >
            <Download className="size-4" />
            匯出 photos-index.csv
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <DayMetric label="已選照片" value={photos.length} />
        <DayMetric label="封面候選" value={coverCount} />
        <DayMetric label="大圖版面" value={largeCount} />
        <DayMetric label="每日草稿" value={daySections.length} />
      </div>

      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-[21px] font-semibold text-[#2f2a24]">
          <NotebookPen className="size-5 text-[#a33a2b]" />
          每日回憶草稿
        </h3>
        {daySections.map((section) => (
          <article
            className="space-y-3 rounded-[8px] border border-[#e6d8c3] bg-[#fffaf1] p-3 sm:p-4"
            key={section.key}
          >
            <h4 className="font-serif text-[21px] leading-tight text-[#2f2a24] sm:text-[24px]">
              {section.title}
            </h4>
            <div className="grid gap-3">
              {section.photos.map((photo) => (
                <div
                  className="grid gap-3 rounded-[8px] border border-[#eadcc8] bg-[#fffdf8] p-3 md:grid-cols-[128px_1fr] lg:grid-cols-[140px_1fr]"
                  key={photo.id}
                >
                  <div className="overflow-hidden rounded-[8px] bg-[#f8f4ec]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={`${photo.caption} 回憶錄素材`}
                      className="aspect-[4/3] h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                      width={640}
                      height={480}
                      src={photo.thumbnailSrc}
                    />
                  </div>
                  <div className="grid gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="border-[#607348] bg-[#eef3e8] text-[#445433]">
                        {photo.caption}
                      </Badge>
                      <Badge className="border-[#d8c3a3] bg-[#f8f4ec] text-[#5f5549]">
                        {photo.placeName ?? "地點待補"}
                      </Badge>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="grid gap-1 text-[14px] font-semibold text-[#5f5549]">
                        <span>章節標題</span>
                        <input
                          aria-label="回憶錄章節標題"
                          className="min-h-11 rounded-[8px] border border-[#e6d8c3] bg-white px-3 text-[15px] text-[#2f2a24]"
                          value={photo.memoir.chapterTitle}
                          onChange={(event) =>
                            onMemoirChange(photo.id, {
                              chapterTitle: event.target.value,
                            })
                          }
                        />
                      </label>
                      <label className="grid gap-1 text-[14px] font-semibold text-[#5f5549]">
                        <span>版面優先度</span>
                        <select
                          aria-label="回憶錄版面優先度"
                          className="min-h-11 rounded-[8px] border border-[#e6d8c3] bg-white px-3 text-[15px] text-[#2f2a24]"
                          value={photo.memoir.pagePriority}
                          onChange={(event) =>
                            onMemoirChange(photo.id, {
                              pagePriority: event.target
                                .value as PhotoRecord["memoir"]["pagePriority"],
                            })
                          }
                        >
                          <option value="cover">封面</option>
                          <option value="large">大圖</option>
                          <option value="normal">一般</option>
                          <option value="small">小圖</option>
                        </select>
                      </label>
                    </div>
                    <label className="grid gap-1 text-[14px] font-semibold text-[#5f5549]">
                      <span>照片旁白</span>
                      <textarea
                        aria-label="回憶錄照片旁白"
                        className="min-h-20 rounded-[8px] border border-[#e6d8c3] bg-white px-3 py-2 text-[15px] text-[#2f2a24]"
                        value={photo.memoir.paragraphNote}
                        onChange={(event) =>
                          onMemoirChange(photo.id, {
                            paragraphNote: event.target.value,
                          })
                        }
                      />
                    </label>
                    <label className="grid gap-1 text-[14px] font-semibold text-[#5f5549]">
                      <span>一句話引言</span>
                      <input
                        aria-label="回憶錄一句話引言"
                        className="min-h-11 rounded-[8px] border border-[#e6d8c3] bg-white px-3 text-[15px] text-[#2f2a24]"
                        value={photo.memoir.quote}
                        onChange={(event) =>
                          onMemoirChange(photo.id, {
                            quote: event.target.value,
                          })
                        }
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function DatePhotoSections({
  sections,
  onOpen,
  onPhotoChange,
  onMemoirChange,
  onPhotoDelete,
}: {
  sections: Array<PhotoDaySummary & {
    photos: PhotoRecord[];
    favoriteCount: number;
    reviewCount: number;
  }>;
  onOpen: (photoId: string) => void;
  onPhotoChange: (photoId: string, patch: Partial<PhotoRecord>) => void;
  onMemoirChange: (
    photoId: string,
    patch: Partial<PhotoRecord["memoir"]>,
  ) => void;
  onPhotoDelete: (photoId: string) => void;
}) {
  return (
    <div className="space-y-5 sm:space-y-6">
      {sections.map((section) => (
        <section
          className="space-y-4 rounded-[8px] border border-[#e6d8c3] bg-[#fffaf1] p-3 shadow-sm sm:p-5"
          key={section.day}
        >
          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="mb-2 text-[15px] font-semibold uppercase tracking-[0.12em] text-[#a33a2b]">
                Travel Day
              </p>
              <h2 className="font-serif text-[24px] leading-tight text-[#2f2a24] sm:text-[30px]">
                Day {section.day}｜{section.date}｜{section.title}
              </h2>
              <p className="mt-2 text-[16px] font-semibold text-[#5f5549]">
                {section.city}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center lg:min-w-[260px]">
              <DayMetric label="照片" value={section.photos.length} />
              <DayMetric label="精選" value={section.favoriteCount} />
              <DayMetric label="確認" value={section.reviewCount} />
            </div>
          </div>

          <PhotoGrid
            photos={section.photos}
            onOpen={onOpen}
            onPhotoChange={onPhotoChange}
            onMemoirChange={onMemoirChange}
            onPhotoDelete={onPhotoDelete}
            emptyText="這一天還沒有照片。"
          />
        </section>
      ))}
    </div>
  );
}

function PlacePhotoSections({
  sections,
  onOpen,
  onPhotoChange,
  onMemoirChange,
  onPhotoDelete,
}: {
  sections: Array<{ place: string; photos: PhotoRecord[] }>;
  onOpen: (photoId: string) => void;
  onPhotoChange: (photoId: string, patch: Partial<PhotoRecord>) => void;
  onMemoirChange: (
    photoId: string,
    patch: Partial<PhotoRecord["memoir"]>,
  ) => void;
  onPhotoDelete: (photoId: string) => void;
}) {
  return (
    <div className="space-y-5 sm:space-y-6">
      {sections.map((section) => (
        <section className="space-y-4" key={section.place}>
          <h2 className="flex items-center gap-2 font-serif text-[24px] leading-tight text-[#2f2a24] sm:text-[30px]">
            <MapPinned className="size-6 text-[#a33a2b]" />
            {section.place}
          </h2>
          <PhotoGrid
            photos={section.photos}
            onOpen={onOpen}
            onPhotoChange={onPhotoChange}
            onMemoirChange={onMemoirChange}
            onPhotoDelete={onPhotoDelete}
            emptyText="這個地點目前沒有照片。"
          />
        </section>
      ))}
    </div>
  );
}

function PhotoGrid({
  photos,
  onOpen,
  onPhotoChange,
  onMemoirChange,
  onPhotoDelete,
  emptyText,
}: {
  photos: PhotoRecord[];
  onOpen: (photoId: string) => void;
  onPhotoChange: (photoId: string, patch: Partial<PhotoRecord>) => void;
  onMemoirChange: (
    photoId: string,
    patch: Partial<PhotoRecord["memoir"]>,
  ) => void;
  onPhotoDelete: (photoId: string) => void;
  emptyText: string;
}) {
  if (!photos.length) {
    return (
      <div className="rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] p-5 text-[16px] font-semibold text-[#5f5549]">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
      {photos.map((photo) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          onOpen={onOpen}
          onPhotoChange={onPhotoChange}
          onMemoirChange={onMemoirChange}
          onPhotoDelete={onPhotoDelete}
        />
      ))}
    </div>
  );
}

function PhotoCard({
  photo,
  onOpen,
  onPhotoChange,
  onMemoirChange,
  onPhotoDelete,
}: {
  photo: PhotoRecord;
  onOpen: (photoId: string) => void;
  onPhotoChange: (photoId: string, patch: Partial<PhotoRecord>) => void;
  onMemoirChange: (
    photoId: string,
    patch: Partial<PhotoRecord["memoir"]>,
  ) => void;
  onPhotoDelete: (photoId: string) => void;
}) {
  const tagsValue = photo.tags.join("、");

  return (
    <article className="overflow-hidden rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] shadow-sm transition [contain-intrinsic-size:520px] [content-visibility:auto] hover:-translate-y-0.5 hover:border-[#c8a24a]">
      <div className="relative aspect-[4/3] bg-[#f8f4ec]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={`${photo.caption} 預覽`}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          width={800}
          height={600}
          src={photo.thumbnailSrc}
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {photo.isFavorite ? (
            <Badge className="border-[#a33a2b] bg-[#a33a2b] text-white">
              精選
            </Badge>
          ) : null}
          <Badge className={confidenceClassNames[photo.autoDetectionConfidence]}>
            {confidenceLabels[photo.autoDetectionConfidence]}
          </Badge>
        </div>
      </div>

      <div className="space-y-3 p-3 sm:space-y-4 sm:p-4">
        <div>
          <p className="text-[14px] font-semibold text-[#a33a2b]">
            {photo.day ? `Day ${photo.day}` : "待整理照片"}・
            {photo.tripDate ?? "日期待確認"}
          </p>
          <h3 className="mt-1 text-[20px] font-semibold leading-snug text-[#2f2a24] sm:text-[22px]">
            {photo.caption}
          </h3>
          <p className="mt-2 text-[15px] leading-7 text-[#5f5549] sm:text-[16px]">
            {photo.city ?? "待整理"}・{photo.placeName ?? "待整理照片"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge className={statusClassNames[photo.uploadStatus]}>
            {statusLabels[photo.uploadStatus]}
          </Badge>
          {photo.tags.map((tag) => (
            <span
              className="rounded-full border border-[#e6d8c3] bg-[#fffaf1] px-2 py-1 text-[13px] font-semibold text-[#6b4a2f]"
              key={tag}
            >
              {tag}
            </span>
          ))}
        </div>

        {photo.memoir.includeInMemoir && photo.memoir.chapterTitle ? (
          <p className="rounded-[8px] border border-[#d8c3a3] bg-[#fffaf1] px-3 py-2 text-[15px] font-semibold text-[#8a5a3b]">
            {photo.memoir.chapterTitle}
          </p>
        ) : null}

        <div className="grid gap-3">
          <label className="grid gap-1 text-[14px] font-semibold text-[#5f5549]">
            <span>標題</span>
            <input
              aria-label="編輯照片標題"
              className="min-h-11 rounded-[8px] border border-[#e6d8c3] bg-white px-3 text-[15px] text-[#2f2a24]"
              value={photo.caption}
              onChange={(event) =>
                onPhotoChange(photo.id, { caption: event.target.value })
              }
            />
          </label>
          <label className="grid gap-1 text-[14px] font-semibold text-[#5f5549]">
            <span>回憶備註</span>
            <textarea
              aria-label="編輯回憶備註"
              className="min-h-20 rounded-[8px] border border-[#e6d8c3] bg-white px-3 py-2 text-[15px] text-[#2f2a24]"
              value={photo.memoryNote}
              onChange={(event) =>
                onPhotoChange(photo.id, { memoryNote: event.target.value })
              }
            />
          </label>
          <label className="grid gap-1 text-[14px] font-semibold text-[#5f5549]">
            <span>標籤</span>
            <input
              aria-label="編輯照片標籤"
              className="min-h-11 rounded-[8px] border border-[#e6d8c3] bg-white px-3 text-[15px] text-[#2f2a24]"
              value={tagsValue}
              onChange={(event) =>
                onPhotoChange(photo.id, {
                  tags: event.target.value
                    .split(/[、,]/)
                    .map((tag) => tag.trim())
                    .filter(Boolean),
                })
              }
            />
          </label>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <ToggleButton
            active={photo.isFavorite}
            label={photo.isFavorite ? "取消精選" : "設為精選"}
            icon={<Heart className="size-4" />}
            onClick={() => onPhotoChange(photo.id, { isFavorite: !photo.isFavorite })}
          />
          <ToggleButton
            active={photo.memoir.includeInMemoir}
            label={
              photo.memoir.includeInMemoir ? "移出回憶錄" : "加入回憶錄"
            }
            icon={<NotebookPen className="size-4" />}
            onClick={() =>
              onMemoirChange(photo.id, {
                includeInMemoir: !photo.memoir.includeInMemoir,
              })
            }
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            type="button"
            className="min-h-11 rounded-[8px] bg-[#a33a2b] text-white"
            onClick={() => onOpen(photo.id)}
          >
            查看大圖
          </Button>
          <Button type="button" variant="outline" className="min-h-11">
            <Download className="size-4" />
            下載原圖
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="min-h-11"
            onClick={() => onPhotoDelete(photo.id)}
          >
            <Trash2 className="size-4" />
            從相簿移除
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            disabled
            title="Google Drive 原始檔需到 Drive 內刪除。"
          >
            <Trash2 className="size-4" />
            原始檔保留
          </Button>
        </div>
      </div>
    </article>
  );
}

function PhotoLightbox({
  photo,
  onClose,
  onNext,
  onPrevious,
  onPhotoChange,
  onMemoirChange,
  onPhotoDelete,
  onTouchStart,
  onTouchEnd,
}: {
  photo: PhotoRecord;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onPhotoChange: (photoId: string, patch: Partial<PhotoRecord>) => void;
  onMemoirChange: (
    photoId: string,
    patch: Partial<PhotoRecord["memoir"]>,
  ) => void;
  onPhotoDelete: (photoId: string) => void;
  onTouchStart: (event: TouchEvent<HTMLDivElement>) => void;
  onTouchEnd: (event: TouchEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-end bg-[#2f2a24]/72 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="照片大圖預覽"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="grid max-h-[94svh] w-full overflow-hidden rounded-t-[8px] bg-[#fffdf8] shadow-2xl sm:mx-auto sm:max-w-5xl sm:rounded-[8px] lg:grid-cols-[1.2fr_0.8fr]">
        <div className="relative min-h-[280px] bg-[#2f2a24] sm:min-h-[320px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={`${photo.caption} 大圖`}
            className="h-full max-h-[58svh] w-full object-cover sm:max-h-[70svh]"
            loading="eager"
            decoding="async"
            width={1200}
            height={900}
            src={photo.thumbnailSrc}
          />
          <button
            className="absolute left-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-[#fffdf8]/92 text-[#2f2a24] shadow"
            type="button"
            aria-label="上一張照片"
            onClick={onPrevious}
          >
            <ArrowLeft className="size-5" />
          </button>
          <button
            className="absolute right-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-[#fffdf8]/92 text-[#2f2a24] shadow"
            type="button"
            aria-label="下一張照片"
            onClick={onNext}
          >
            <ArrowRight className="size-5" />
          </button>
        </div>

        <aside className="max-h-[48svh] space-y-4 overflow-y-auto p-4 sm:max-h-[92svh] sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[14px] font-semibold text-[#a33a2b]">
                {photo.day ? `Day ${photo.day}` : "待整理照片"}・
                {photo.tripDate ?? "日期待確認"}
              </p>
              <h2 className="mt-1 font-serif text-[24px] leading-tight text-[#2f2a24] sm:text-[30px]">
                {photo.caption}
              </h2>
            </div>
            <button
              className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#e6d8c3] bg-[#f8f4ec]"
              type="button"
              aria-label="關閉照片預覽"
              onClick={onClose}
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="grid gap-2 text-[14px] leading-7 text-[#5f5549] sm:gap-3 sm:text-[15px]">
            <LightboxFact label="城市" value={photo.city ?? "待整理"} />
            <LightboxFact label="景點" value={photo.placeName ?? "待整理照片"} />
            <LightboxFact
              label="自動判斷來源"
              value={sourceLabels[photo.autoDetectionSource]}
            />
            <LightboxFact
              label="信心程度"
              value={confidenceLabels[photo.autoDetectionConfidence]}
            />
          </div>

          <p className="rounded-[8px] bg-[#f8f4ec] p-3 text-[15px] leading-7 text-[#5f5549] sm:text-[16px]">
            {photo.memoryNote}
          </p>

          <div className="flex flex-wrap gap-2">
            {photo.tags.map((tag) => (
              <span
                className="inline-flex items-center gap-1 rounded-full border border-[#e6d8c3] bg-[#fffaf1] px-3 py-1 text-[14px] font-semibold text-[#6b4a2f]"
                key={tag}
              >
                <Tag className="size-3" />
                {tag}
              </span>
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <ToggleButton
              active={photo.isFavorite}
              label={photo.isFavorite ? "取消精選" : "設為精選"}
              icon={<Heart className="size-4" />}
              onClick={() => onPhotoChange(photo.id, { isFavorite: !photo.isFavorite })}
            />
            <ToggleButton
              active={photo.memoir.includeInMemoir}
              label={
                photo.memoir.includeInMemoir ? "移出回憶錄" : "加入回憶錄"
              }
              icon={<NotebookPen className="size-4" />}
              onClick={() =>
                onMemoirChange(photo.id, {
                  includeInMemoir: !photo.memoir.includeInMemoir,
                })
              }
            />
            <Button type="button" variant="outline" className="min-h-11">
              <Download className="size-4" />
              下載
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="min-h-11"
              onClick={() => onPhotoDelete(photo.id)}
            >
              <Trash2 className="size-4" />
              從相簿移除
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function DayMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] px-3 py-2">
      <p className="font-serif text-[24px] leading-none text-[#2f2a24]">
        {value}
      </p>
      <p className="mt-1 text-[13px] font-semibold text-[#6b4a2f]">{label}</p>
    </div>
  );
}

function ToggleButton({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      className={`min-h-11 rounded-[8px] ${
        active ? "bg-[#607348] text-white hover:bg-[#4d5d3a]" : ""
      }`}
      onClick={onClick}
    >
      {icon}
      {label}
    </Button>
  );
}

function LightboxFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-[#e6d8c3] bg-[#fffaf1] px-3 py-2">
      <p className="text-[13px] font-semibold text-[#8a5a3b]">{label}</p>
      <p className="font-semibold text-[#2f2a24]">{value}</p>
    </div>
  );
}

function createPhotoPreviewUrl(file: File): string {
  if (typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
    return URL.createObjectURL(file);
  }

  return "/images/yamanaka-onsen.webp";
}

function readInitialDriveScanResult(): PhotoDriveScanResult | null {
  if (typeof window === "undefined") {
    return null;
  }

  return readStoredDriveScanResult(window.localStorage);
}

function readInitialGoogleClientId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return readStoredGoogleClientId(window.localStorage);
}
