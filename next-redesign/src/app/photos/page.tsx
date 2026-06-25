import { PhotoAlbumClient } from "@/components/photos/PhotoAlbumClient";
import {
  defaultPhotoDriveScanResult,
  mockPhotoDriveStatus,
  mockPhotoRecords,
  photoDaySummaries,
  photoFilterChips,
  photoTabs,
} from "@/data/photo-album";

export default function PhotosPage() {
  return (
    <PhotoAlbumClient
      initialPhotos={mockPhotoRecords}
      daySummaries={photoDaySummaries}
      filters={photoFilterChips}
      tabs={photoTabs}
      driveStatus={mockPhotoDriveStatus}
      initialDriveScanResult={defaultPhotoDriveScanResult}
    />
  );
}
