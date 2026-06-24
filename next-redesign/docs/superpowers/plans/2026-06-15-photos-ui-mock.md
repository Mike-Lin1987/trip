# Photos UI Mock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Phase 1 of the Hokuriku trip photo album: a protected `/photos` UI mock with diary-style tabs, mock photo records, upload-result preview, lightbox, and editable photo metadata fields.

**Architecture:** Keep the first phase local and deterministic. Store mock records in `src/data/photo-album.ts`, define UI-facing photo types in `src/types/photos.ts`, and keep React interaction in `src/components/photos/PhotoJournal.tsx` so Phase 2 can replace mock classification with EXIF-derived records without rewriting the page.

**Tech Stack:** Next.js App Router, React client components, Vitest and Testing Library, lucide-react icons, existing shadcn-style UI primitives.

---

## File Structure

- Modify `src/__tests__/photos-page.test.tsx`: replace the old manual-upload expectations with Phase 1 UI mock expectations.
- Modify `src/data/navigation.ts`: rename the nav entry to `回憶相簿` and homepage card copy to the requested text.
- Create `src/types/photos.ts`: define `PhotoRecord`, tab/filter ids, confidence/status unions, and day summary types.
- Create `src/data/photo-album.ts`: provide Day 1-8 summaries, place filters, mock photo records, and mock Drive connection status.
- Modify `src/app/photos/page.tsx`: render the required hero and pass mock data to the photo journal.
- Replace `src/components/photos/PhotoJournal.tsx`: implement tabs, chips, upload panel, auto-organize result list, photo cards, editable fields, and lightbox.

## Tasks

### Task 1: Tests

**Files:**
- Modify: `src/__tests__/photos-page.test.tsx`

- [ ] **Step 1: Write failing tests**

Add assertions that `/photos` shows the title `回憶相簿`, required upload copy, buttons `手機拍照上傳`, `從相簿選取`, `多張上傳`, tabs `依日期`, `依地點`, `精選照片`, `待整理`, `回憶錄素材`, and lightbox content after clicking a mock photo action.

- [ ] **Step 2: Run the test and confirm RED**

Run: `npm.cmd test -- src/__tests__/photos-page.test.tsx`

Expected before implementation: FAIL because the current page title is `旅行照片` and the new tabs/lightbox do not exist.

### Task 2: Data And Types

**Files:**
- Create: `src/types/photos.ts`
- Create: `src/data/photo-album.ts`
- Modify: `src/data/navigation.ts`

- [ ] **Step 1: Define photo record types**

Create a UI-ready `PhotoRecord` type with the fields needed by Phase 1: final date/day/place values, auto-detected values, confidence, status, caption, memory note, tags, favorite flag, cover flag, memoir inclusion, and thumbnail source.

- [ ] **Step 2: Add mock album data**

Create four to six mock photo records covering Kyoto, Kanazawa, Yamanaka Onsen, favorites, low-confidence items, and memoir items. Use existing local image assets for thumbnail sources.

- [ ] **Step 3: Update navigation copy**

Change `/photos` desktop label to `回憶相簿`, title to `回憶相簿`, and description to `自動整理旅途照片，依日期與地點分類，日後可製作旅行回憶錄。`. Keep mobile label compact as `照片`.

### Task 3: UI Mock

**Files:**
- Modify: `src/app/photos/page.tsx`
- Replace: `src/components/photos/PhotoJournal.tsx`

- [ ] **Step 1: Build the hero**

Render title `回憶相簿`, subtitle `京都・金澤・山中溫泉的家族紅葉照片，系統自動依日期與地點整理成回憶錄素材。`, stats for total, favorites, organized, unsorted, and recent upload, plus primary action buttons.

- [ ] **Step 2: Build the upload panel**

Show the required copy and three upload actions. Do not render Day/date/place/tag inputs before upload.

- [ ] **Step 3: Build tabs and chips**

Implement tab buttons with local state and horizontal scrolling on mobile. Implement filter chips from the spec.

- [ ] **Step 4: Build date/place/favorite/unsorted/memoir views**

Render Day sections for date view, grouped place sections for place view, and filtered grids for the other tabs.

- [ ] **Step 5: Build photo cards and editable fields**

Each card shows thumbnail, Day, date, city, place, caption, tags, favorite badge, confidence, status, and action buttons. Card editing supports caption, memory note, tags, favorite, and memoir inclusion in local state.

- [ ] **Step 6: Build lightbox**

Clicking `查看大圖` opens a modal-like preview with previous/next controls, swipe handlers, photo metadata, confidence source, favorite and memoir toggles, and a close button.

### Task 4: Verification

**Files:**
- No production files

- [ ] **Step 1: Run focused tests**

Run: `npm.cmd test -- src/__tests__/photos-page.test.tsx`

Expected: PASS.

- [ ] **Step 2: Run project checks**

Run: `npm.cmd run typecheck`, `npm.cmd run lint`, and `npm.cmd test`.

Expected: all commands exit 0.

- [ ] **Step 3: Build and browser-check**

Run: `npm.cmd run build`, then open `/photos` in the browser and confirm the mobile-width layout still exposes upload actions, tabs, chips, cards, and lightbox without overlap.
