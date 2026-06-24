import { describe, expect, it, vi } from "vitest";
import {
  DRIVE_FOLDER_MIME_TYPE,
  GOOGLE_DRIVE_PHOTO_SCOPE,
  REQUIRED_PHOTO_DRIVE_FOLDERS,
  buildDayFolderMap,
  buildDriveOpenUrl,
  classifyPhotoDriveFolder,
  createGoogleDrivePhotoService,
  normalizeDriveFolderId,
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

  it("creates missing Drive folders under the album root", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
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
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [requestUrl, init] = fetchMock.mock.calls[0];
    expect(requestUrl.toString()).toContain("https://www.googleapis.com/drive/v3/files");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer token-123");
    expect(JSON.parse(init.body)).toEqual({
      name: "98_待整理照片",
      mimeType: DRIVE_FOLDER_MIME_TYPE,
      parents: ["root-folder"],
    });
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

  it("uses the least broad Drive scope and builds folder open URLs", () => {
    expect(GOOGLE_DRIVE_PHOTO_SCOPE).toBe(
      "https://www.googleapis.com/auth/drive.file",
    );
    expect(buildDriveOpenUrl("folder-id")).toBe(
      "https://drive.google.com/drive/folders/folder-id",
    );
  });
});
