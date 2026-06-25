import type {
  DayFolderMap,
  PhotoDriveFolder,
  PhotoDriveFolderKey,
  PhotoDriveFolderRequirement,
  PhotoDriveScanResult,
  PhotoDriveUploadResult,
} from "@/types/photos";

const GOOGLE_DRIVE_PHOTO_SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
];
export const GOOGLE_DRIVE_PHOTO_SCOPE = GOOGLE_DRIVE_PHOTO_SCOPES.join(" ");
export const DRIVE_FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";
export const GOOGLE_DRIVE_ALBUM_STORAGE_KEY =
  "hokuriku-2026-google-drive-album";
export const GOOGLE_DRIVE_CLIENT_ID_STORAGE_KEY =
  "hokuriku-2026-google-client-id";

export const REQUIRED_PHOTO_DRIVE_FOLDERS: PhotoDriveFolderRequirement[] = [
  { key: "cover", label: "封面與精選", name: "00_封面與精選" },
  { key: "day1", label: "Day 1", name: "Day01_2026-11-14_關西機場會合" },
  { key: "day2", label: "Day 2", name: "Day02_2026-11-15_京都東寺伏見稻荷" },
  { key: "day3", label: "Day 3", name: "Day03_2026-11-16_嵐山小火車常寂光寺" },
  { key: "day4", label: "Day 4", name: "Day04_2026-11-17_京都到金澤" },
  {
    key: "day5",
    label: "Day 5",
    name: "Day05_2026-11-18_兼六園近江町山中溫泉",
  },
  { key: "day6", label: "Day 6", name: "Day06_2026-11-19_山中溫泉鶴仙溪" },
  { key: "day7", label: "Day 7", name: "Day07_2026-11-20_山中溫泉到新大阪" },
  { key: "day8", label: "Day 8", name: "Day08_2026-11-21_新大阪關西機場返台" },
  { key: "unsorted", label: "待整理照片", name: "98_待整理照片" },
  { key: "memoir", label: "回憶錄輸出素材", name: "99_回憶錄輸出素材" },
];

type FetchLike = (
  input: string | URL,
  init: {
    method?: string;
    headers: Record<string, string>;
    body?: BodyInit;
  },
) => Promise<{
  ok: boolean;
  status?: number;
  statusText?: string;
  json(): Promise<unknown>;
}>;

type GoogleDrivePhotoServiceOptions = {
  accessToken: string;
  fetchImpl?: FetchLike;
};

type DriveFilesListResponse = {
  files?: Array<Partial<PhotoDriveFolder>>;
};

type DriveFileUploadResponse = Partial<PhotoDriveUploadResult>;

type PhotoDriveUploadInput = {
  file: File;
  fileName: string;
  folderId: string;
};

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleTokenClient = {
  requestAccessToken(options?: { prompt?: string }): void;
};

type GoogleIdentityNamespace = {
  accounts?: {
    oauth2?: {
      initTokenClient(config: {
        client_id: string;
        scope: string;
        callback: (response: GoogleTokenResponse) => void;
      }): GoogleTokenClient;
      revoke?(accessToken: string, done: () => void): void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentityNamespace;
  }
}

export function normalizeDriveFolderId(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";

  if (!trimmed) {
    return "";
  }

  const folderMatch = trimmed.match(/\/folders\/([^/?#]+)/);

  if (folderMatch?.[1]) {
    return folderMatch[1];
  }

  return trimmed;
}

export function buildDriveOpenUrl(folderId: string) {
  return `https://drive.google.com/drive/folders/${encodeURIComponent(folderId)}`;
}

export function classifyPhotoDriveFolder(
  folderName: string,
): PhotoDriveFolderKey | null {
  const normalized = folderName.trim();

  if (normalized.startsWith("00_")) {
    return "cover";
  }

  if (normalized.startsWith("98_")) {
    return "unsorted";
  }

  if (normalized.startsWith("99_")) {
    return "memoir";
  }

  const dayMatch = normalized.match(/^Day0?([1-8])_/);

  if (dayMatch?.[1]) {
    return `day${dayMatch[1]}` as PhotoDriveFolderKey;
  }

  return null;
}

export function buildDayFolderMap(folders: PhotoDriveFolder[]): DayFolderMap {
  return folders.reduce<DayFolderMap>((folderMap, folder) => {
    const key = classifyPhotoDriveFolder(folder.name);

    if (!key) {
      return folderMap;
    }

    return {
      ...folderMap,
      [key]: folder.id,
    };
  }, {});
}

export function validateRequiredFolders(
  dayFolderMap: DayFolderMap,
): PhotoDriveFolderRequirement[] {
  return REQUIRED_PHOTO_DRIVE_FOLDERS.filter(
    (folder) => !dayFolderMap[folder.key],
  );
}

export function createGoogleDrivePhotoService({
  accessToken,
  fetchImpl = globalThis.fetch.bind(globalThis) as FetchLike,
}: GoogleDrivePhotoServiceOptions) {
  async function requestDrive<T>(
    url: URL,
    init: {
      method?: string;
      body?: string;
    } = {},
  ): Promise<T> {
    const response = await fetchImpl(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Google Drive request failed: ${response.status ?? ""} ${
          response.statusText ?? ""
        }`.trim(),
      );
    }

    return response.json() as Promise<T>;
  }

  return {
    async scanAlbumRootFolder(rootFolderId: string): Promise<PhotoDriveScanResult> {
      const normalizedRootFolderId = normalizeDriveFolderId(rootFolderId);
      const url = new URL("https://www.googleapis.com/drive/v3/files");
      url.searchParams.set(
        "q",
        `'${escapeDriveQuery(normalizedRootFolderId)}' in parents and trashed = false and mimeType = '${DRIVE_FOLDER_MIME_TYPE}'`,
      );
      url.searchParams.set(
        "fields",
        "files(id,name,mimeType,webViewLink),nextPageToken",
      );
      url.searchParams.set("pageSize", "100");
      url.searchParams.set("spaces", "drive");
      url.searchParams.set("supportsAllDrives", "true");
      url.searchParams.set("includeItemsFromAllDrives", "true");

      const result = await requestDrive<DriveFilesListResponse>(url);
      const folders = normalizeDriveFolders(result.files ?? []);
      const dayFolderMap = buildDayFolderMap(folders);

      return {
        rootFolderId: normalizedRootFolderId,
        folders,
        dayFolderMap,
        missingFolders: validateRequiredFolders(dayFolderMap),
        scannedFolderCount: folders.length,
        scannedAt: new Date().toISOString(),
      };
    },
    async getOrCreateMissingFolders(
      rootFolderId: string,
      missingFolders: PhotoDriveFolderRequirement[],
    ): Promise<PhotoDriveFolder[]> {
      const normalizedRootFolderId = normalizeDriveFolderId(rootFolderId);

      return Promise.all(
        missingFolders.map(async (folder) => {
          const existingFolder = await findExistingRequiredFolder(
            normalizedRootFolderId,
            folder.name,
          );

          if (existingFolder) {
            return existingFolder;
          }

          const url = new URL("https://www.googleapis.com/drive/v3/files");
          url.searchParams.set("fields", "id,name,mimeType,webViewLink");

          return requestDrive<PhotoDriveFolder>(url, {
            method: "POST",
            body: JSON.stringify({
              name: folder.name,
              mimeType: DRIVE_FOLDER_MIME_TYPE,
              parents: [normalizedRootFolderId],
            }),
          });
        }),
      );
    },
    async uploadPhotoFile({
      file,
      fileName,
      folderId,
    }: PhotoDriveUploadInput): Promise<PhotoDriveUploadResult> {
      const normalizedFolderId = normalizeDriveFolderId(folderId);

      if (!normalizedFolderId) {
        throw new Error("Google Drive target folder is missing.");
      }

      const url = new URL("https://www.googleapis.com/upload/drive/v3/files");
      url.searchParams.set("uploadType", "multipart");
      url.searchParams.set(
        "fields",
        "id,name,mimeType,webViewLink,webContentLink,thumbnailLink",
      );
      url.searchParams.set("supportsAllDrives", "true");

      const boundary = createMultipartBoundary();
      const body = buildMultipartUploadBody({
        boundary,
        file,
        fileName,
        folderId: normalizedFolderId,
      });
      const response = await fetchImpl(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body,
      });

      if (!response.ok) {
        throw new Error(
          `Google Drive upload failed: ${response.status ?? ""} ${
            response.statusText ?? ""
          }`.trim(),
        );
      }

      return normalizeUploadedDriveFile(await response.json());
    },
  };

  async function findExistingRequiredFolder(
    rootFolderId: string,
    folderName: string,
  ): Promise<PhotoDriveFolder | null> {
    const url = new URL("https://www.googleapis.com/drive/v3/files");
    url.searchParams.set(
      "q",
      `'${escapeDriveQuery(rootFolderId)}' in parents and trashed = false and mimeType = '${DRIVE_FOLDER_MIME_TYPE}' and name = '${escapeDriveQuery(folderName)}'`,
    );
    url.searchParams.set("fields", "files(id,name,mimeType,webViewLink)");
    url.searchParams.set("pageSize", "1");
    url.searchParams.set("spaces", "drive");
    url.searchParams.set("supportsAllDrives", "true");
    url.searchParams.set("includeItemsFromAllDrives", "true");

    const result = await requestDrive<DriveFilesListResponse>(url);
    const [existingFolder] = normalizeDriveFolders(result.files ?? []);

    return existingFolder ?? null;
  }
}

export async function requestGoogleDriveAccessToken({
  clientId,
  scope = GOOGLE_DRIVE_PHOTO_SCOPE,
}: {
  clientId: string;
  scope?: string;
}): Promise<string> {
  await loadGoogleIdentityScript();
  const googleIdentity = window.google?.accounts?.oauth2;

  if (!googleIdentity) {
    throw new Error("Google Identity Services is not available.");
  }

  return new Promise((resolve, reject) => {
    const tokenClient = googleIdentity.initTokenClient({
      client_id: clientId,
      scope,
      callback: (response) => {
        if (response.error) {
          reject(
            new Error(
              response.error_description ??
                `Google authorization failed: ${response.error}`,
            ),
          );
          return;
        }

        if (!response.access_token) {
          reject(new Error("Google authorization did not return an access token."));
          return;
        }

        resolve(response.access_token);
      },
    });

    tokenClient.requestAccessToken({ prompt: "" });
  });
}

export function readStoredDriveScanResult(
  storage: Storage,
): PhotoDriveScanResult | null {
  const raw = storage.getItem(GOOGLE_DRIVE_ALBUM_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);

    if (!isPhotoDriveScanResult(parsed)) {
      return null;
    }

    return normalizeStoredDriveScanResult(parsed);
  } catch {
    return null;
  }
}

export function writeStoredDriveScanResult(
  storage: Storage,
  scanResult: PhotoDriveScanResult,
) {
  storage.setItem(GOOGLE_DRIVE_ALBUM_STORAGE_KEY, JSON.stringify(scanResult));
}

export function readStoredGoogleClientId(storage: Storage) {
  return storage.getItem(GOOGLE_DRIVE_CLIENT_ID_STORAGE_KEY)?.trim() ?? "";
}

export function writeStoredGoogleClientId(storage: Storage, clientId: string) {
  const normalizedClientId = clientId.trim();

  if (!normalizedClientId) {
    storage.removeItem(GOOGLE_DRIVE_CLIENT_ID_STORAGE_KEY);
    return;
  }

  storage.setItem(GOOGLE_DRIVE_CLIENT_ID_STORAGE_KEY, normalizedClientId);
}

function loadGoogleIdentityScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("Google Identity Services can only run in the browser."),
    );
  }

  if (window.google?.accounts?.oauth2) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Failed to load Google Identity Services.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Google Identity Services."));
    document.head.appendChild(script);
  });
}

function normalizeDriveFolders(
  folders: Array<Partial<PhotoDriveFolder>>,
): PhotoDriveFolder[] {
  return folders
    .filter(
      (folder): folder is PhotoDriveFolder =>
        typeof folder.id === "string" &&
        typeof folder.name === "string" &&
        folder.mimeType === DRIVE_FOLDER_MIME_TYPE,
    )
    .map((folder) => ({
      id: folder.id,
      name: folder.name,
      mimeType: folder.mimeType,
      webViewLink: folder.webViewLink,
    }));
}

function escapeDriveQuery(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function createMultipartBoundary() {
  const randomPart =
    globalThis.crypto?.randomUUID?.().replace(/-/g, "") ?? String(Date.now());

  return `hokuriku_photo_${randomPart}`;
}

function buildMultipartUploadBody({
  boundary,
  file,
  fileName,
  folderId,
}: {
  boundary: string;
  file: File;
  fileName: string;
  folderId: string;
}) {
  const mimeType = file.type || "application/octet-stream";
  const metadata = JSON.stringify({
    name: fileName,
    mimeType,
    parents: [folderId],
  });

  return new Blob([
    `--${boundary}\r\n`,
    "Content-Type: application/json; charset=UTF-8\r\n\r\n",
    metadata,
    "\r\n",
    `--${boundary}\r\n`,
    `Content-Type: ${mimeType}\r\n\r\n`,
    file,
    "\r\n",
    `--${boundary}--`,
  ]);
}

function normalizeUploadedDriveFile(
  file: unknown,
): PhotoDriveUploadResult {
  if (typeof file !== "object" || file === null) {
    throw new Error("Google Drive upload response is invalid.");
  }

  const uploadedFile = file as DriveFileUploadResponse;

  if (
    typeof uploadedFile.id !== "string" ||
    typeof uploadedFile.name !== "string" ||
    typeof uploadedFile.mimeType !== "string"
  ) {
    throw new Error("Google Drive upload response is missing file metadata.");
  }

  return {
    id: uploadedFile.id,
    name: uploadedFile.name,
    mimeType: uploadedFile.mimeType,
    webViewLink:
      typeof uploadedFile.webViewLink === "string"
        ? uploadedFile.webViewLink
        : undefined,
    webContentLink:
      typeof uploadedFile.webContentLink === "string"
        ? uploadedFile.webContentLink
        : undefined,
    thumbnailLink:
      typeof uploadedFile.thumbnailLink === "string"
        ? uploadedFile.thumbnailLink
        : undefined,
  };
}

function isPhotoDriveScanResult(value: unknown): value is PhotoDriveScanResult {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const result = value as PhotoDriveScanResult;

  return (
    typeof result.rootFolderId === "string" &&
    Array.isArray(result.folders) &&
    typeof result.dayFolderMap === "object" &&
    result.dayFolderMap !== null &&
    Array.isArray(result.missingFolders) &&
    typeof result.scannedFolderCount === "number" &&
    typeof result.scannedAt === "string"
  );
}

function normalizeStoredDriveScanResult(
  result: PhotoDriveScanResult,
): PhotoDriveScanResult {
  const folders = normalizeDriveFolders(result.folders);
  const dayFolderMap = {
    ...filterDayFolderMap(result.dayFolderMap),
    ...buildDayFolderMap(folders),
  };

  return {
    rootFolderId: normalizeDriveFolderId(result.rootFolderId),
    folders,
    dayFolderMap,
    missingFolders: validateRequiredFolders(dayFolderMap),
    scannedFolderCount: folders.length || result.scannedFolderCount,
    scannedAt: result.scannedAt,
  };
}

function filterDayFolderMap(dayFolderMap: DayFolderMap): DayFolderMap {
  return Object.entries(dayFolderMap).reduce<DayFolderMap>(
    (filteredMap, [key, folderId]) => {
      if (!isPhotoDriveFolderKey(key) || typeof folderId !== "string") {
        return filteredMap;
      }

      return {
        ...filteredMap,
        [key]: folderId,
      };
    },
    {},
  );
}

function isPhotoDriveFolderKey(key: string): key is PhotoDriveFolderKey {
  return REQUIRED_PHOTO_DRIVE_FOLDERS.some((folder) => folder.key === key);
}
