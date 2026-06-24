import {
  Camera,
  Cloud,
  FolderOpen,
  ImagePlus,
  NotebookPen,
  Sparkles,
} from "lucide-react";
import { PhotoJournal } from "@/components/photos/PhotoJournal";
import { Button } from "@/components/ui/button";
import {
  defaultPhotoDriveScanResult,
  mockPhotoDriveStatus,
  mockPhotoRecords,
  photoDaySummaries,
  photoFilterChips,
  photoTabs,
} from "@/data/photo-album";

const organizedCount = mockPhotoRecords.filter(
  (photo) => photo.day !== null && photo.uploadStatus === "uploaded",
).length;
const favoriteCount = mockPhotoRecords.filter((photo) => photo.isFavorite).length;
const unsortedCount = mockPhotoRecords.filter(
  (photo) =>
    photo.day === null ||
    photo.uploadStatus === "needs-review" ||
    photo.autoDetectionConfidence === "unknown",
).length;

const photoStats = [
  {
    label: "照片總數",
    value: `${mockPhotoRecords.length}`,
    icon: Camera,
  },
  {
    label: "精選照片數",
    value: `${favoriteCount}`,
    icon: Sparkles,
  },
  {
    label: "已整理照片數",
    value: `${organizedCount}`,
    icon: FolderOpen,
  },
  {
    label: "待整理照片數",
    value: `${unsortedCount}`,
    icon: ImagePlus,
  },
  {
    label: "最近上傳時間",
    value: "11/21",
    icon: Cloud,
  },
];

export default function PhotosPage() {
  return (
    <main className="travel-paper min-h-screen bg-[#f8f4ec] pb-20 md:pb-0">
      <section className="mx-auto max-w-7xl px-4 pb-6 pt-24 sm:px-8 sm:pb-8 sm:pt-28 lg:px-10">
        <div className="grid gap-5 border-b border-[#d8c3a3] pb-6 sm:gap-7 sm:pb-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div className="max-w-3xl space-y-4">
            <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#a33a2b] sm:text-[15px]">
              Memory Album
            </p>
            <h1 className="font-serif text-[clamp(2.35rem,10vw,3.625rem)] leading-tight text-[#2f2a24]">
              回憶相簿
            </h1>
            <p className="max-w-2xl text-[16px] leading-8 text-[#5f5549] sm:text-[18px] sm:leading-9">
              京都・金澤・山中溫泉的家族紅葉照片，系統自動依日期與地點整理成回憶錄素材。
            </p>
            <div className="grid gap-2 pt-2 sm:flex sm:flex-wrap sm:gap-3">
              <Button className="min-h-11 rounded-[8px] bg-[#a33a2b] text-white hover:bg-[#8b2f24]">
                <ImagePlus className="size-4" />
                上傳照片
              </Button>
              <Button variant="outline" className="min-h-11 rounded-[8px]">
                <NotebookPen className="size-4" />
                回憶錄素材整理
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-5">
            {photoStats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  className="rounded-[8px] border border-[#e6d8c3] bg-[#fffdf8] p-3 shadow-sm sm:p-4"
                  key={stat.label}
                >
                  <Icon className="mb-3 size-5 text-[#a33a2b]" />
                  <p className="font-serif text-[24px] leading-tight text-[#2f2a24] sm:text-[26px]">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-[13px] font-semibold leading-5 text-[#6b4a2f] sm:text-[14px] sm:leading-6">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <PhotoJournal
        initialPhotos={mockPhotoRecords}
        daySummaries={photoDaySummaries}
        filters={photoFilterChips}
        tabs={photoTabs}
        driveStatus={mockPhotoDriveStatus}
        initialDriveScanResult={defaultPhotoDriveScanResult}
      />
    </main>
  );
}
