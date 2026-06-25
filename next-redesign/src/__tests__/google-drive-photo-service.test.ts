import { describe, expect, it, vi } from "vitest";
import {
  DRIVE_FOLDER_MIME_TYPE,
  GOOGLE_DRIVE_ALBUM_STORAGE_KEY,
  GOOGLE_DRIVE_PHOTO_SCOPE,
  REQUIRED_PHOTO_DRIVE_FOLDERS,
  buildDayFolderMap,
  buildDriveOpenUrl,
  classifyPhotoDriveFolder,
  createGoogleDrivePhotoService,
  normalizeDriveFolderId,
  readStoredDriveScanResult,
  validateRequiredFolders,
} from "@/services/googleDrivePhotoService";

const albumFolders = [
  { id: "folder-cover", name: "00_封面與精選", mimeType: DRIVE_FOLDER_MIME_TYPE },
  {
    id: "folder-day01",
    name: "Day01_2026-11-14_關西機場會合",
    mimeType: DRIVE_FOLDER_MIME_TYPE,
  },
  {
    id: "folder-day08",
    name: "Day08_2026-11-21_新大阪關西機場返台",
    mimeType: DRIVE_FOLDER_MIME_TYPE,
  },
  {
    id: "folder-memoir",
    name: "99_回憶錄輸出素材",
    mimeType: DRIVE_FOLDER_MIME_TYPE,
  },
];

describe("googleDrivePhotoService", () => {
  it("normalizes Drive folder IDs from raw IDs and folder URLs", () => {
    expect(normalizeDriveFolderId(" 1p33mX1C8xLeB7P8RvRgMWlFKPqdFeQww ")).toBe(
      "1p33mX1C8xLeB7P8RvRgMWlFKPqdFeQww",
    );
    expect(
      normalizeDriveFolderId(
        "https://drive.google.com/drive/folders/1p33mX1C8xLeB7P8RvRgMWlFKPqdFeQww?usp=sharing",
      ),
    ).toBe("1p33mX1C8xLeB7P8RvRgMWlFKPqdFeQww");
  });

  it("classifies required album folders and reports missing folders", () => {
    expect(classifyPhotoDriveFolder("00_封面與精選")).toBe("cover");
    expect(classifyPhotoDriveFolder("Day08_2026-11-21_新大阪關西機場返台")).toBe(
      "day8",
    );
    expect(classifyPhotoDriveFolder("98_待整理照片")).toBe("unsorted");
    expect(classifyPhotoDriveFolder("99_回憶錄輸出素材")).toBe("memoir");
    expect(classifyPhotoDriveFolder("random")).toBeNull();

    const dayFolderMap = buildDayFolderMap(albumFolders);
    expect(dayFolderMap.cover).toBe("folder-cover");
    expect(dayFolderMap.day1).toBe("folder-day01");
    expect(dayFolderMap.day8).toBe("folder-day08");
    expect(dayFolderMap.memoir).toBe("folder-memoir");

    const missing = validateRequiredFolders(dayFolderMap);
    expect(missing.map((folder) => folder.key)).toEqual([
      "day2",
      "day3",
      "day4",
      "day5",
      "day6",
      "day7",
      "unsorted",
    ]);
    expect(
      REQUIRED_PHOTO_DRIVE_FOLDERS.find((folder) => folder.key === "unsorted")
        ?.name,
    ).toBe("98_待整理照片");
  });

  it("scans the album root folder with Drive files.list and builds a dayFolderMap", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        files: albumFolders,
      }),
    });
    const service = createGoogleDrivePhotoService({
      accessToken: "token-123",
      fetchImpl: fetchMock,
    });

    const result = await service.scanAlbumRootFolder("root-folder");

    expect(result.rootFolderId).toBe("root-folder");
    expect(result.scannedFolderCount).toBe(4);
    expect(result.dayFolderMap.day1).toBe("folder-day01");
    expect(result.missingFolders.some((folder) => folder.key === "unsorted")).toBe(
      true,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [requestUrl, init] = fetchMock.mock.calls[0];
    expect(requestUrl.toString()).toContain("https://www.googleapis.com/drive/v3/files");
    const query = new URL(requestUrl.toString()).searchParams.get("q");
    expect(query).toContain("'root-folder' in parents");
    expect(query).toContain(`mimeType = '${DRIVE_FOLDER_MIME_TYPE}'`);
    expect(init.headers.Authorization).toBe("Bearer token-123");
  });

  it("creates missing Drive folders only after checking for an existing folder", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          files: [],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "folder-unsorted",
          name: "98_待整理照片",
          mimeType: DRIVE_FOLDER_MIME_TYPE,
        }),
      });
    const service = createGoogleDrivePhotoService({
      accessToken: "token-123",
      fetchImpl: fetchMock,
    });

    const [createdFolder] = await service.getOrCreateMissingFolders(
      "root-folder",
      [{ key: "unsorted", label: "待整理照片", name: "98_待整理照片" }],
    );

    expect(createdFolder.id).toBe("folder-unsorted");
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [lookupUrl, lookupInit] = fetchMock.mock.calls[0];
    expect(lookupUrl.toString()).toContain("https://www.googleapis.com/drive/v3/files");
    expect(new URL(lookupUrl.toString()).searchParams.get("q")).toContain(
      "name = '98_待整理照片'",
    );
    expect(lookupInit.headers.Authorization).toBe("Bearer token-123");

    const [createUrl, createInit] = fetchMock.mock.calls[1];
    expect(createUrl.toString()).toContain("https://www.googleapis.com/drive/v3/files");
    expect(createInit.method).toBe("POST");
    expect(createInit.headers.Authorization).toBe("Bearer token-123");
    expect(JSON.parse(createInit.body)).toEqual({
      name: "98_待整理照片",
      mimeType: DRIVE_FOLDER_MIME_TYPE,
      parents: ["root-folder"],
    });
  });

  it("reuses an existing Drive folder instead of creating a duplicate", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        files: [
          {
            id: "existing-day02",
            name: "Day02_2026-11-15_京都東寺伏見稻荷",
            mimeType: DRIVE_FOLDER_MIME_TYPE,
            webViewLink: "https://drive.google.com/drive/folders/existing-day02",
          },
        ],
      }),
    });
    const service = createGoogleDrivePhotoService({
      accessToken: "token-123",
      fetchImpl: fetchMock,
    });

    const [folder] = await service.getOrCreateMissingFolders("root-folder", [
      {
        key: "day2",
        label: "Day 2",
        name: "Day02_2026-11-15_京都東寺伏見稻荷",
      },
    ]);

    expect(folder).toEqual({
      id: "existing-day02",
      name: "Day02_2026-11-15_京都東寺伏見稻荷",
      mimeType: DRIVE_FOLDER_MIME_TYPE,
      webViewLink: "https://drive.google.com/drive/folders/existing-day02",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1].method).toBeUndefined();
  });

  it("uploads a photo file to the selected Drive folder with multipart metadata", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "drive-photo-1",
        name: "HOKURIKU2026_Day05_photo.jpg",
        mimeType: "image/jpeg",
        webViewLink: "https://drive.google.com/file/d/drive-photo-1/view",
        webContentLink:
          "https://drive.google.com/uc?id=drive-photo-1&export=download",
        thumbnailLink: "https://drive.google.com/thumb?id=drive-photo-1",
      }),
    });
    const service = createGoogleDrivePhotoService({
      accessToken: "token-123",
      fetchImpl: fetchMock,
    });
    const file = new File(["photo-bytes"], "kenrokuen.jpg", {
      type: "image/jpeg",
    });

    const uploaded = await service.uploadPhotoFile({
      file,
      fileName: "HOKURIKU2026_Day05_photo.jpg",
      folderId: "folder-day05",
    });

    expect(uploaded).toEqual({
      id: "drive-photo-1",
      name: "HOKURIKU2026_Day05_photo.jpg",
      mimeType: "image/jpeg",
      webViewLink: "https://drive.google.com/file/d/drive-photo-1/view",
      webContentLink:
        "https://drive.google.com/uc?id=drive-photo-1&export=download",
      thumbnailLink: "https://drive.google.com/thumb?id=drive-photo-1",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [requestUrl, init] = fetchMock.mock.calls[0];
    const url = new URL(requestUrl.toString());
    expect(url.origin + url.pathname).toBe(
      "https://www.googleapis.com/upload/drive/v3/files",
    );
    expect(url.searchParams.get("uploadType")).toBe("multipart");
    expect(url.searchParams.get("fields")).toContain("webViewLink");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer token-123");
    expect(init.headers["Content-Type"]).toContain("multipart/related");
    const bodyText =
      init.body instanceof Blob ? await init.body.text() : String(init.body);
    expect(bodyText).toContain('"parents":["folder-day05"]');
    expect(bodyText).toContain("HOKURIKU2026_Day05_photo.jpg");
    expect(bodyText).toContain("photo-bytes");
  });

  it("uses Drive scopes that can upload photos and inspect existing folder metadata", () => {
    expect(GOOGLE_DRIVE_PHOTO_SCOPE.split(/\s+/)).toEqual([
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/drive.metadata.readonly",
    ]);
    expect(buildDriveOpenUrl("folder-id")).toBe(
      "https://drive.google.com/drive/folders/folder-id",
    );
  });

  it("repairs stale stored scan results from the saved folder list", () => {
    window.localStorage.setItem(
      GOOGLE_DRIVE_ALBUM_STORAGE_KEY,
      JSON.stringify({
        rootFolderId: "root-folder",
        folders: albumFolders,
        dayFolderMap: {},
        missingFolders: REQUIRED_PHOTO_DRIVE_FOLDERS,
        scannedFolderCount: 0,
        scannedAt: "2026-06-25T00:00:00.000Z",
      }),
    );

    const result = readStoredDriveScanResult(window.localStorage);

    expect(result?.scannedFolderCount).toBe(4);
    expect(result?.dayFolderMap.cover).toBe("folder-cover");
    expect(result?.dayFolderMap.day1).toBe("folder-day01");
    expect(result?.dayFolderMap.day8).toBe("folder-day08");
    expect(result?.dayFolderMap.memoir).toBe("folder-memoir");
    expect(result?.missingFolders.map((folder) => folder.key)).toEqual([
      "day2",
      "day3",
      "day4",
      "day5",
      "day6",
      "day7",
      "unsorted",
    ]);
  });
});
