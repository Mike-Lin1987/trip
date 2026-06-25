import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PhotosPage from "@/app/photos/page";
import { siteNavItems } from "@/data/navigation";
import { GOOGLE_DRIVE_ALBUM_STORAGE_KEY } from "@/services/googleDrivePhotoService";
import { PHOTO_METADATA_STORAGE_KEY } from "@/services/photoMetadataRepository";

describe("travel photo journal", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function getPhotoStatValue(label: string) {
    const labelElement = screen.getByText(label);
    const card = labelElement.closest("div");

    return card?.querySelector("p")?.textContent;
  }

  it("adds the memoir album entry to travel navigation and homepage cards", () => {
    const photoEntry = siteNavItems.find((item) => item.href === "/photos");

    expect(photoEntry?.label).toBe("回憶相簿");
    expect(photoEntry?.title).toBe("回憶相簿");
    expect(photoEntry?.description).toBe(
      "自動整理旅途照片，依日期與地點分類，日後可製作旅行回憶錄。",
    );
  });

  it("renders the Phase 1 photo album mock without asking for manual classification before upload", () => {
    render(<PhotosPage />);

    expect(screen.getByRole("heading", { name: "回憶相簿" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "京都・金澤・山中溫泉的家族紅葉照片，系統自動依日期與地點整理成回憶錄素材。",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("照片總數")).toBeInTheDocument();
    expect(screen.getByText("精選照片數")).toBeInTheDocument();
    expect(screen.getByText("已整理照片數")).toBeInTheDocument();
    expect(screen.getByText("待整理照片數")).toBeInTheDocument();
    expect(screen.getByText("最近上傳時間")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "上傳照片" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "回憶錄素材整理" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "連接 Google Drive" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "掃描 Drive 資料夾" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "開啟 Drive 資料夾" })).not.toBeInTheDocument();

    expect(screen.getByText("上傳照片，系統自動整理")).toBeInTheDocument();
    expect(screen.getByText("手機拍照上傳")).toBeInTheDocument();
    expect(screen.getByText("從相簿選取")).toBeInTheDocument();
    expect(screen.getByText("多張上傳")).toBeInTheDocument();
    expect(screen.queryByLabelText("照片日期")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("景點標籤")).not.toBeInTheDocument();

    ["依日期", "依地點", "精選照片", "待整理", "回憶錄素材"].forEach((tab) => {
      expect(screen.getByRole("tab", { name: tab })).toBeInTheDocument();
    });
    ["全部", "京都", "金澤", "山中溫泉", "紅葉", "精選", "需要確認"].forEach(
      (chip) => {
        expect(screen.getByRole("button", { name: chip })).toBeInTheDocument();
      },
    );

    expect(
      screen.getByRole("heading", {
        name: "Day 3｜2026-11-16｜嵐山小火車與常寂光寺",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("東寺紅葉與五重塔")).toBeInTheDocument();
    expect(screen.getAllByText("高信心").length).toBeGreaterThan(0);
    expect(screen.getAllByText("需要確認").length).toBeGreaterThan(0);
  });

  it("shows the complete default Google Drive folder binding", async () => {
    render(<PhotosPage />);

    expect(await screen.findByText("Drive 已設定")).toBeInTheDocument();
    expect(screen.getByText("11 個資料夾對應已完成。")).toBeInTheDocument();
    expect(screen.queryByLabelText("Google Drive 根資料夾 ID")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Google OAuth Client ID")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "開啟 Drive 根資料夾" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "連接 Google Drive" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "掃描 Drive 資料夾" })).not.toBeInTheDocument();
    expect(screen.queryByText("缺漏資料夾")).not.toBeInTheDocument();
  });

  it("supports mock upload results, editable album fields, tab switching, and lightbox preview", async () => {
    render(<PhotosPage />);

    await waitFor(() => {
      expect(window.localStorage.getItem(PHOTO_METADATA_STORAGE_KEY)).not.toBeNull();
    });

    const photo = new File(["photo"], "kenrokuen-maple.jpg", {
      type: "image/jpeg",
    });

    fireEvent.change(screen.getByLabelText("多張上傳"), {
      target: { files: [photo] },
    });

    expect(screen.getByText("自動整理結果")).toBeInTheDocument();
    expect(screen.getByText("kenrokuen-maple.jpg")).toBeInTheDocument();
    expect(screen.getAllByText(/待整理照片/).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("tab", { name: "依地點" }));
    expect(screen.getByRole("heading", { name: "京都" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "精選照片" }));
    expect(screen.getByText("嵐山小火車窗景")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "待整理" }));
    expect(screen.getByText("老照片待確認")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "回憶錄素材" }));
    expect(screen.getByText("回憶錄 Day 3")).toBeInTheDocument();

    fireEvent.change(screen.getAllByLabelText("編輯照片標題")[0], {
      target: { value: "新的回憶標題" },
    });
    expect(screen.getByDisplayValue("新的回憶標題")).toBeInTheDocument();

    await waitFor(() => {
      const envelope = JSON.parse(
        window.localStorage.getItem(PHOTO_METADATA_STORAGE_KEY) ?? "{}",
      );
      const savedPhoto = envelope.photos.find(
        (item: { caption: string }) => item.caption === "新的回憶標題",
      );

      expect(savedPhoto).toBeDefined();
    });

    fireEvent.click(screen.getAllByRole("button", { name: /查看大圖/ })[0]);
    expect(screen.getByRole("dialog", { name: "照片大圖預覽" })).toBeInTheDocument();
    expect(screen.getByText("自動判斷來源")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "下一張照片" })).toBeInTheDocument();
  });

  it("removes a photo from the album and persisted metadata after confirmation", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<PhotosPage />);

    await waitFor(() => {
      expect(window.localStorage.getItem(PHOTO_METADATA_STORAGE_KEY)).not.toBeNull();
    });

    expect(screen.getByText("東寺紅葉與五重塔")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "從相簿移除" })[0]);

    await waitFor(() => {
      expect(screen.queryByText("東寺紅葉與五重塔")).not.toBeInTheDocument();
    });

    const envelope = JSON.parse(
      window.localStorage.getItem(PHOTO_METADATA_STORAGE_KEY) ?? "{}",
    );

    expect(confirmSpy).toHaveBeenCalledWith(
      "要從相簿移除「東寺紅葉與五重塔」嗎？Google Drive 原始檔會保留。",
    );
    expect(
      envelope.photos.some(
        (photo: { caption: string }) => photo.caption === "東寺紅葉與五重塔",
      ),
    ).toBe(false);

  });

  it("updates the top photo statistics after removing a photo", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<PhotosPage />);

    await waitFor(() => {
      expect(window.localStorage.getItem(PHOTO_METADATA_STORAGE_KEY)).not.toBeNull();
    });

    expect(getPhotoStatValue("照片總數")).toBe("6");
    expect(getPhotoStatValue("已整理照片數")).toBe("4");

    fireEvent.click(screen.getAllByRole("button", { name: "從相簿移除" })[0]);

    await waitFor(() => {
      expect(screen.queryByText("東寺紅葉與五重塔")).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(getPhotoStatValue("照片總數")).toBe("5");
      expect(getPhotoStatValue("已整理照片數")).toBe("3");
    });

    expect(confirmSpy).toHaveBeenCalledWith(
      "要從相簿移除「東寺紅葉與五重塔」嗎？Google Drive 原始檔會保留。",
    );
  });

  it("shows Google Drive folder binding status from the saved scan result", async () => {
    window.localStorage.setItem(
      GOOGLE_DRIVE_ALBUM_STORAGE_KEY,
      JSON.stringify({
        rootFolderId: "1p33mX1C8xLeB7P8RvRgMWlFKPqdFeQww",
        folders: [],
        dayFolderMap: {
          cover: "folder-cover",
          day1: "folder-day01",
          day8: "folder-day08",
          memoir: "folder-memoir",
        },
        missingFolders: [
          {
            key: "unsorted",
            label: "待整理照片",
            name: "98_待整理照片",
          },
        ],
        scannedFolderCount: 10,
        scannedAt: "2026-06-15T13:57:48.499Z",
      }),
    );

    render(<PhotosPage />);

    expect(await screen.findByText("Drive 已設定")).toBeInTheDocument();
    expect(screen.getByText("已建立 4 個資料夾對應，缺少 1 個資料夾。")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("1p33mX1C8xLeB7P8RvRgMWlFKPqdFeQww")).not.toBeInTheDocument();
    expect(screen.queryByText("98_待整理照片")).not.toBeInTheDocument();
    expect(screen.getByText("缺少 1 個資料夾")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "開啟 Drive 根資料夾" }),
    ).not.toBeInTheDocument();
  });
});
