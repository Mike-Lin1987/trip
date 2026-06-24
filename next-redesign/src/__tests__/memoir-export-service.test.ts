import { describe, expect, it } from "vitest";
import {
  buildMemoirJson,
  buildMemoirMarkdown,
  buildPhotosIndexCsv,
} from "@/services/memoirExportService";
import type { PhotoRecord } from "@/types/photos";

function createPhoto(
  patch: Partial<PhotoRecord> & Pick<PhotoRecord, "id" | "caption">,
): PhotoRecord {
  const { id, caption, ...rest } = patch;

  return {
    id,
    tripId: "hokuriku-2026",
    thumbnailSrc: "/images/sample.jpg",
    originalFileName: `${id}.jpg`,
    storedFileName: `HOKURIKU2026_${id}.jpg`,
    driveFileId: `drive-${id}`,
    driveFolderId: "folder-day03",
    driveWebViewLink: `https://drive.google.com/file/d/${id}/view`,
    driveWebContentLink: null,
    thumbnailLink: null,
    mimeType: "image/jpeg",
    sizeBytes: 1200,
    width: 1600,
    height: 1200,
    exifTakenAt: null,
    exifLatitude: null,
    exifLongitude: null,
    exifCameraModel: null,
    exifOrientation: null,
    fileLastModifiedAt: null,
    normalizedTakenAtJST: null,
    uploadedBy: "family",
    day: 3,
    tripDate: "2026-11-16",
    city: "Kyoto",
    placeName: "Arashiyama",
    placeId: "arashiyama",
    itineraryTitle: "Arashiyama slow day",
    caption,
    memoryNote: "Slow maple walk with family.",
    tags: ["maple", "family"],
    peopleTags: ["Dad", "Mom"],
    isFavorite: true,
    isCoverCandidate: false,
    autoDetectedDay: 3,
    autoDetectedDate: "2026-11-16",
    autoDetectedCity: "Kyoto",
    autoDetectedPlaceName: "Arashiyama",
    autoDetectedPlaceId: "arashiyama",
    autoDetectedTags: ["maple"],
    autoDetectionSource: "manual",
    autoDetectionConfidence: "high",
    autoDetectionNote: "Manual test record.",
    uploadStatus: "uploaded",
    uploadProgress: 100,
    uploadError: null,
    uploadedAt: "2026-11-16T10:00:00.000+09:00",
    updatedAt: "2026-11-16T10:00:00.000+09:00",
    sortOrder: 1,
    memoir: {
      includeInMemoir: true,
      chapterTitle: "Day 3 Kyoto leaves",
      paragraphNote: "A calm family memory under red leaves.",
      quote: "Walk slowly.",
      pagePriority: "cover",
    },
    ...rest,
  };
}

describe("memoir export service", () => {
  it("builds memoir JSON, Markdown, and CSV from included photos only", () => {
    const included = createPhoto({ id: "photo-1", caption: "Train window leaves" });
    const excluded = createPhoto({
      id: "photo-2",
      caption: "Draft only",
      memoir: {
        includeInMemoir: false,
        chapterTitle: "",
        paragraphNote: "",
        quote: "",
        pagePriority: "normal",
      },
    });

    const memoirJson = buildMemoirJson([excluded, included]);
    const memoirMarkdown = buildMemoirMarkdown([excluded, included]);
    const photosIndexCsv = buildPhotosIndexCsv([excluded, included]);

    expect(memoirJson.photoCount).toBe(1);
    expect(memoirJson.days).toHaveLength(1);
    expect(memoirJson.days[0]?.photos[0]?.caption).toBe("Train window leaves");
    expect(memoirJson.days[0]?.photos[0]?.pagePriority).toBe("cover");
    expect(JSON.stringify(memoirJson)).not.toContain("Draft only");

    expect(memoirMarkdown).toContain("# 2026 北陸孝親紅葉慢旅回憶錄");
    expect(memoirMarkdown).toContain("## Day 3");
    expect(memoirMarkdown).toContain("A calm family memory under red leaves.");
    expect(memoirMarkdown).not.toContain("Draft only");

    expect(photosIndexCsv).toContain(
      "id,day,tripDate,city,placeName,caption,tags,peopleTags,pagePriority,driveFileId,driveWebViewLink",
    );
    expect(photosIndexCsv).toContain(
      '"photo-1",3,"2026-11-16","Kyoto","Arashiyama","Train window leaves"',
    );
    expect(photosIndexCsv).not.toContain("Draft only");
  });
});
