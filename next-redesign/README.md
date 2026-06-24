This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Hokuriku Photo Album Google Drive Setup

The `/photos` page supports Phase 4 Google Drive folder binding for the 2026 Hokuriku family trip.

Current album root folder:

```text
2026_北陸孝親紅葉慢旅_照片
1p33mX1C8xLeB7P8RvRgMWlFKPqdFeQww
```

Configure browser-safe public settings when building a version with a bundled
OAuth Client ID:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-oauth-web-client-id.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_DRIVE_ALBUM_FOLDER_ID=1p33mX1C8xLeB7P8RvRgMWlFKPqdFeQww
```

Google Cloud Console checklist:

1. Enable Google Drive API.
2. Create an OAuth Web Client ID for the site origin.
3. Add Authorized JavaScript origins:
   - `https://hokuriku-family-trip.web.app`
   - `http://localhost:3100` for local testing, if needed.
4. Put only the OAuth Client ID in `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, or paste it into the live `/photos` page when the deployed build has no env value.
5. Do not add a client secret to this static frontend.
6. Use the narrow Drive scope `https://www.googleapis.com/auth/drive.file`.

## Using the Live Site Abroad

1. Open `https://hokuriku-family-trip.web.app/photos`.
2. Enter the travel password.
3. Paste the Google OAuth Client ID in `Google OAuth Client ID` if the field is empty.
4. Confirm the Drive root folder ID is `1p33mX1C8xLeB7P8RvRgMWlFKPqdFeQww`.
5. Click `連接 Google Drive`, sign in with the Google account that owns or can edit the album folder, then upload photos.

The OAuth Client ID is browser-safe and can be saved in `localStorage` on the device.
Google access tokens are short-lived and kept only in browser memory. Never paste or
ship a client secret in this static frontend.

The Drive setup builds `dayFolderMap` for all 11 folders:

```text
00_封面與精選
Day01_2026-11-14_關西機場會合
Day02_2026-11-15_京都東寺伏見稻荷
Day03_2026-11-16_嵐山小火車常寂光寺
Day04_2026-11-17_京都到金澤
Day05_2026-11-18_兼六園近江町山中溫泉
Day06_2026-11-19_山中溫泉鶴仙溪
Day07_2026-11-20_山中溫泉到新大阪
Day08_2026-11-21_新大阪關西機場返台
98_待整理照片
99_回憶錄輸出素材
```

Phase 5 uploads selected photos to the mapped Drive folder after Google Drive is connected. The app chooses the target folder from the EXIF/date classification result and `dayFolderMap`, then stores the returned Drive file id and links in the local photo metadata index. Access tokens are short-lived and kept only in browser memory; the app does not store them in `localStorage`.

## Getting Started

First, run the development server:

```bash
npm.cmd run dev
# or
yarn.cmd dev
# or
pnpm.cmd dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
