import { describe, expect, it } from "vitest";
import { PHOTO_PLACE_CANDIDATES } from "@/data/photo-place-candidates";
import {
  buildInitialPhotoRecord,
  buildStoredFileName,
  calculateDetectionConfidence,
  chooseTargetDriveFolder,
  detectPlaceByGps,
  detectTripDay,
  generateAutoTags,
  normalizeTakenAt,
} from "@/services/photoAutoOrganizer";

describe("photo auto organizer", () => {
  it("detects trip day by Japan local date", () => {
    const normalized = normalizeTakenAt("2026-11-15T23:30:00+08:00", null);

    expect(normalized.tripDate).toBe("2026-11-16");
    expect(detectTripDay(normalized.normalizedTakenAtJST)).toEqual({
      day: 3,
      date: "2026-11-16",
      title: "嵐山小火車與常寂光寺",
      city: "京都",
    });
    expect(detectTripDay("2026-11-22T09:00:00+09:00")).toBeNull();
  });

  it("matches GPS coordinates to the nearest place candidate", () => {
    const match = detectPlaceByGps(34.9806, 135.7477, PHOTO_PLACE_CANDIDATES);

    expect(match?.candidate.id).toBe("toji");
    expect(match?.candidate.name).toBe("東寺");
    expect(match?.distanceMeters).toBeLessThan(50);

    const farAway = detectPlaceByGps(25.033, 121.5654, PHOTO_PLACE_CANDIDATES);

    expect(farAway).toBeNull();
  });

  it("calculates confidence from GPS and date quality", () => {
    const toji = PHOTO_PLACE_CANDIDATES.find((candidate) => candidate.id === "toji");

    expect(
      calculateDetectionConfidence({
        day: 2,
        place: toji,
        hasGps: true,
        hasTakenAt: true,
      }),
    ).toBe("high");
    expect(
      calculateDetectionConfidence({
        day: 8,
        place: toji,
        hasGps: true,
        hasTakenAt: true,
      }),
    ).toBe("medium");
    expect(
      calculateDetectionConfidence({
        day: 5,
        place: null,
        hasGps: false,
        hasTakenAt: true,
      }),
    ).toBe("low");
    expect(
      calculateDetectionConfidence({
        day: null,
        place: null,
        hasGps: false,
        hasTakenAt: false,
      }),
    ).toBe("unknown");
  });

  it("generates tags and safe stored filenames", () => {
    expect(
      generateAutoTags(3, "京都", "嵐山小火車", "嵐山小火車與常寂光寺"),
    ).toEqual(["Day3", "京都", "嵐山小火車", "嵐山", "小火車", "紅葉"]);

    expect(
      buildStoredFileName({
        day: 3,
        tripDate: "2026-11-16",
        city: "京都",
        placeName: "嵐山",
        sequence: 1,
        originalFileName: "IMG 0001.JPG",
      }),
    ).toBe("HOKURIKU2026_Day03_2026-11-16_Kyoto_Arashiyama_001.jpg");

    expect(
      buildStoredFileName({
        day: null,
        tripDate: null,
        city: null,
        placeName: null,
        sequence: 1,
        originalFileName: "LINE_OLD_PHOTO",
      }),
    ).toBe("HOKURIKU2026_Unsorted_001.jpg");
  });

  it("builds initial photo records for organized and unsorted files", () => {
    const organizedFile = new File(["photo"], "kenrokuen-maple.jpg", {
      type: "image/jpeg",
      lastModified: Date.parse("2026-11-18T09:30:00+09:00"),
    });
    const organized = buildInitialPhotoRecord(
      organizedFile,
      {
        day: 5,
        tripDate: "2026-11-18",
        city: "金澤",
        placeName: "兼六園",
        placeId: "kenrokuen",
        itineraryTitle: "兼六園近江町山中溫泉",
        tags: ["Day5", "金澤", "兼六園", "庭園", "紅葉"],
        source: "exif-gps",
        confidence: "high",
        note: "GPS 落在兼六園半徑內，日期符合 Day 5。",
        normalizedTakenAtJST: "2026-11-18T09:30:00.000+09:00",
        exifTakenAt: "2026-11-18T09:30:00+09:00",
        exifLatitude: 36.5621,
        exifLongitude: 136.6625,
      },
      {
        id: "photo-kenrokuen-test",
        sequence: 14,
        sortOrder: 14,
        uploadedAt: "2026-11-18T10:00:00+09:00",
        thumbnailSrc: "/images/yamanaka-onsen.webp",
      },
    );

    expect(organized.day).toBe(5);
    expect(organized.city).toBe("金澤");
    expect(organized.placeName).toBe("兼六園");
    expect(organized.autoDetectionConfidence).toBe("high");
    expect(organized.uploadStatus).toBe("uploaded");
    expect(organized.storedFileName).toBe(
      "HOKURIKU2026_Day05_2026-11-18_Kanazawa_Kenrokuen_014.jpg",
    );

    const unsortedFile = new File(["photo"], "line-old-photo.jpg", {
      type: "image/jpeg",
    });
    const unsorted = buildInitialPhotoRecord(
      unsortedFile,
      {
        day: null,
        tripDate: null,
        city: null,
        placeName: null,
        placeId: null,
        itineraryTitle: null,
        tags: ["需要確認"],
        source: "unknown",
        confidence: "unknown",
        note: "沒有拍攝時間與 GPS，先放入待整理照片。",
        normalizedTakenAtJST: null,
        exifTakenAt: null,
        exifLatitude: null,
        exifLongitude: null,
      },
      {
        id: "photo-unsorted-test",
        sequence: 1,
        sortOrder: 90,
        uploadedAt: "2026-11-21T22:00:00+09:00",
        thumbnailSrc: "/images/yamanaka-onsen.webp",
      },
    );

    expect(unsorted.day).toBeNull();
    expect(unsorted.uploadStatus).toBe("needs-review");
    expect(unsorted.storedFileName).toBe("HOKURIKU2026_Unsorted_001.jpg");
  });

  it("chooses target Drive folders from detection results", () => {
    expect(
      chooseTargetDriveFolder(
        { day: 3, confidence: "high" },
        { day3: "folder-day03", unsorted: "folder-unsorted" },
      ),
    ).toBe("folder-day03");

    expect(
      chooseTargetDriveFolder(
        { day: null, confidence: "unknown" },
        { day3: "folder-day03", unsorted: "folder-unsorted" },
      ),
    ).toBe("folder-unsorted");
  });
});
