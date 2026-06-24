import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PhotosPage from "@/app/photos/page";
import { PHOTO_METADATA_STORAGE_KEY } from "@/services/photoMetadataRepository";

const uploadPhotoFileMock = vi.hoisted(() => vi.fn());
const requestGoogleDriveAccessTokenMock = vi.hoisted(() => vi.fn());
const createGoogleDrivePhotoServiceMock = vi.hoisted(() => vi.fn());

vi.mock("@/services/googleDrivePhotoService", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/services/googleDrivePhotoService")>();

  return {
    ...actual,
    createGoogleDrivePhotoService: createGoogleDrivePhotoServiceMock,
    requestGoogleDriveAccessToken: requestGoogleDriveAccessTokenMock,
  };
});

describe("photo Google Drive upload integration", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "client-id.apps.googleusercontent.com");
    uploadPhotoFileMock.mockReset();
    requestGoogleDriveAccessTokenMock.mockReset();
    createGoogleDrivePhotoServiceMock.mockReset();

    requestGoogleDriveAccessTokenMock.mockResolvedValue("token-123");
    uploadPhotoFileMock.mockResolvedValue({
      id: "drive-photo-1",
      name: "HOKURIKU2026_Day05_2026-11-18_Kanazawa_Kenrokuen_007.jpg",
      mimeType: "image/jpeg",
      webViewLink: "https://drive.google.com/file/d/drive-photo-1/view",
      webContentLink:
        "https://drive.google.com/uc?id=drive-photo-1&export=download",
      thumbnailLink: "https://drive.google.com/thumb?id=drive-photo-1",
    });
    createGoogleDrivePhotoServiceMock.mockReturnValue({
      scanAlbumRootFolder: vi.fn(),
      getOrCreateMissingFolders: vi.fn(),
      uploadPhotoFile: uploadPhotoFileMock,
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uploads a classified photo into the mapped Drive day folder and persists Drive metadata", async () => {
    render(<PhotosPage />);

    await waitFor(() => {
      expect(window.localStorage.getItem(PHOTO_METADATA_STORAGE_KEY)).not.toBeNull();
    });

    const driveSection = screen
      .getByRole("heading", { name: "既有相簿資料夾" })
      .closest("section");

    expect(driveSection).not.toBeNull();

    fireEvent.click(
      within(driveSection as HTMLElement).getByRole("button", {
        name: "Drive 進階設定",
      }),
    );

    fireEvent.click(
      within(driveSection as HTMLElement).getAllByRole("button", {
        name: "連接 Google Drive",
      })[0],
    );

    expect(
      await screen.findByText("Google Drive 已連接，可掃描旅行相簿資料夾。"),
    ).toBeInTheDocument();

    const photo = new File(["photo-bytes"], "kenrokuen-maple.jpg", {
      type: "image/jpeg",
      lastModified: Date.parse("2026-11-18T09:30:00+09:00"),
    });

    fireEvent.change(screen.getByLabelText("多張上傳"), {
      target: { files: [photo] },
    });

    await waitFor(() => {
      expect(uploadPhotoFileMock).toHaveBeenCalledWith({
        file: photo,
        fileName: expect.stringContaining("HOKURIKU2026_Day05_2026-11-18"),
        folderId: "1qUgC3cfzqqEPUi1BhtmSNVzKJgAir_jV",
      });
    });

    expect(await screen.findByText("已上傳 Drive")).toBeInTheDocument();

    await waitFor(() => {
      const envelope = JSON.parse(
        window.localStorage.getItem(PHOTO_METADATA_STORAGE_KEY) ?? "{}",
      );
      const savedPhoto = envelope.photos.find(
        (item: { originalFileName: string }) =>
          item.originalFileName === "kenrokuen-maple.jpg",
      );

      expect(savedPhoto).toMatchObject({
        driveFileId: "drive-photo-1",
        driveFolderId: "1qUgC3cfzqqEPUi1BhtmSNVzKJgAir_jV",
        driveWebViewLink: "https://drive.google.com/file/d/drive-photo-1/view",
        driveWebContentLink:
          "https://drive.google.com/uc?id=drive-photo-1&export=download",
        thumbnailLink: "https://drive.google.com/thumb?id=drive-photo-1",
      });
    });
  });

  it("uses a saved browser OAuth Client ID when the deployed build has no env client id", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "");

    render(<PhotosPage />);

    const driveSection = screen
      .getByRole("heading", { name: "既有相簿資料夾" })
      .closest("section");

    expect(driveSection).not.toBeNull();

    fireEvent.click(
      within(driveSection as HTMLElement).getByRole("button", {
        name: "Drive 進階設定",
      }),
    );

    fireEvent.change(
      within(driveSection as HTMLElement).getByLabelText("Google OAuth Client ID"),
      {
        target: { value: "runtime-client-id.apps.googleusercontent.com" },
      },
    );

    fireEvent.click(
      within(driveSection as HTMLElement).getAllByRole("button", {
        name: "連接 Google Drive",
      })[0],
    );

    expect(
      await screen.findByText("Google Drive 已連接，可掃描旅行相簿資料夾。"),
    ).toBeInTheDocument();
    expect(requestGoogleDriveAccessTokenMock).toHaveBeenCalledWith({
      clientId: "runtime-client-id.apps.googleusercontent.com",
    });
    expect(
      window.localStorage.getItem("hokuriku-2026-google-client-id"),
    ).toBe("runtime-client-id.apps.googleusercontent.com");
  });
});
