import type { PhotoRecord } from "@/types/photos";

type MemoirPhotoExport = {
  id: string;
  day: number | null;
  tripDate: string | null;
  city: string | null;
  placeName: string | null;
  caption: string;
  memoryNote: string;
  chapterTitle: string;
  paragraphNote: string;
  quote: string;
  pagePriority: PhotoRecord["memoir"]["pagePriority"];
  tags: string[];
  peopleTags: string[];
  driveFileId: string | null;
  driveWebViewLink: string | null;
  thumbnailLink: string | null;
  storedFileName: string;
};

type MemoirDayExport = {
  day: number | null;
  tripDate: string | null;
  city: string | null;
  chapterTitle: string;
  dayMemoryNote: string;
  photos: MemoirPhotoExport[];
};

export type MemoirJsonExport = {
  tripId: "hokuriku-2026";
  title: string;
  generatedAt: string;
  photoCount: number;
  days: MemoirDayExport[];
};

const memoirTitle = "2026 北陸孝親紅葉慢旅回憶錄";

export function buildMemoirJson(
  photos: PhotoRecord[],
  generatedAt = new Date().toISOString(),
): MemoirJsonExport {
  const includedPhotos = getMemoirPhotos(photos);
  const days = includedPhotos.reduce<MemoirDayExport[]>((sections, photo) => {
    const existingSection = sections.find(
      (section) => section.day === photo.day && section.tripDate === photo.tripDate,
    );
    const exportedPhoto = toMemoirPhoto(photo);

    if (existingSection) {
      existingSection.photos.push(exportedPhoto);
      if (!existingSection.dayMemoryNote && photo.memoir.paragraphNote) {
        existingSection.dayMemoryNote = photo.memoir.paragraphNote;
      }
      return sections;
    }

    return [
      ...sections,
      {
        day: photo.day,
        tripDate: photo.tripDate,
        city: photo.city,
        chapterTitle: photo.memoir.chapterTitle || buildDayTitle(photo),
        dayMemoryNote: photo.memoir.paragraphNote || photo.memoryNote,
        photos: [exportedPhoto],
      },
    ];
  }, []);

  return {
    tripId: "hokuriku-2026",
    title: memoirTitle,
    generatedAt,
    photoCount: includedPhotos.length,
    days,
  };
}

export function buildMemoirMarkdown(photos: PhotoRecord[]): string {
  const memoir = buildMemoirJson(photos);
  const sections = memoir.days.map((day) => {
    const heading = [
      "##",
      day.day ? `Day ${day.day}` : "未分類照片",
      day.tripDate ? `｜${day.tripDate}` : "",
      day.city ? `｜${day.city}` : "",
    ].join(" ");
    const photoLines = day.photos.map((photo) => {
      const location = [photo.city, photo.placeName].filter(Boolean).join(" / ");
      const quote = photo.quote ? `\n  - 引言：${photo.quote}` : "";

      return [
        `- ${photo.caption}`,
        `  - 地點：${location || "未分類"}`,
        `  - 版面：${photo.pagePriority}`,
        `  - 備註：${photo.paragraphNote || photo.memoryNote || "待補"}`,
        `  - Drive：${photo.driveFileId ?? "未上傳"}`,
        quote,
      ]
        .filter(Boolean)
        .join("\n");
    });

    return [
      heading,
      "",
      day.chapterTitle ? `章節：${day.chapterTitle}` : "",
      day.dayMemoryNote ? `回憶草稿：${day.dayMemoryNote}` : "",
      "",
      ...photoLines,
    ]
      .filter((line) => line !== "")
      .join("\n");
  });

  return [`# ${memoir.title}`, "", ...sections].join("\n\n");
}

export function buildPhotosIndexCsv(photos: PhotoRecord[]): string {
  const header = [
    "id",
    "day",
    "tripDate",
    "city",
    "placeName",
    "caption",
    "tags",
    "peopleTags",
    "pagePriority",
    "driveFileId",
    "driveWebViewLink",
  ];
  const rows = getMemoirPhotos(photos).map((photo) =>
    [
      photo.id,
      photo.day ?? "",
      photo.tripDate ?? "",
      photo.city ?? "",
      photo.placeName ?? "",
      photo.caption,
      photo.tags.join("|"),
      photo.peopleTags.join("|"),
      photo.memoir.pagePriority,
      photo.driveFileId ?? "",
      photo.driveWebViewLink ?? "",
    ].map(csvCell),
  );

  return [header.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

export function downloadTextFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function getMemoirPhotos(photos: PhotoRecord[]): PhotoRecord[] {
  return photos
    .filter((photo) => photo.memoir.includeInMemoir)
    .sort((a, b) => {
      const dayA = a.day ?? Number.MAX_SAFE_INTEGER;
      const dayB = b.day ?? Number.MAX_SAFE_INTEGER;

      if (dayA !== dayB) {
        return dayA - dayB;
      }

      return a.sortOrder - b.sortOrder;
    });
}

function toMemoirPhoto(photo: PhotoRecord): MemoirPhotoExport {
  return {
    id: photo.id,
    day: photo.day,
    tripDate: photo.tripDate,
    city: photo.city,
    placeName: photo.placeName,
    caption: photo.caption,
    memoryNote: photo.memoryNote,
    chapterTitle: photo.memoir.chapterTitle,
    paragraphNote: photo.memoir.paragraphNote,
    quote: photo.memoir.quote,
    pagePriority: photo.memoir.pagePriority,
    tags: photo.tags,
    peopleTags: photo.peopleTags,
    driveFileId: photo.driveFileId,
    driveWebViewLink: photo.driveWebViewLink,
    thumbnailLink: photo.thumbnailLink,
    storedFileName: photo.storedFileName,
  };
}

function buildDayTitle(photo: PhotoRecord): string {
  if (photo.day) {
    return `Day ${photo.day} ${photo.city ?? ""}`.trim();
  }

  return "未分類回憶素材";
}

function csvCell(value: string | number): string {
  if (typeof value === "number") {
    return String(value);
  }

  const cell = String(value);

  return `"${cell.replaceAll('"', '""')}"`;
}
