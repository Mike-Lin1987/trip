# PWA 準備狀態

## 目前已啟用

- `app/manifest.ts` 產生 `/manifest.webmanifest`，維持靜態輸出可用。
- `display: "standalone"`、`start_url: "/"`、`scope: "/"`、`theme_color` 與 `background_color` 已設定。
- 已提供 SVG、192 PNG、512 PNG、512 maskable PNG、Apple touch icon。
- Root metadata 已宣告 manifest、favicon、PNG icons、Apple Web App 與 mobile viewport。

## 本階段完成定義

- Android Chrome 與 iOS Safari 可以使用瀏覽器原生的「安裝」或「加入主畫面」流程。
- 從主畫面開啟時使用 standalone 顯示模式，保留現有旅行密碼保護。
- 線上 `/manifest.webmanifest` 與所有 icon 檔案可直接取得。
- 不新增 `sw.js`、`service-worker.js`、`next-pwa` 或 Workbox 依賴。
- 手機首頁、照片頁、交通頁、飯店頁與記帳頁需維持無橫向溢出。

## 暫不啟用 service worker

目前網站含旅行密碼、Google Drive 上傳、localStorage 記帳與照片 metadata。這些資料狀態容易受快取策略影響，因此本階段不加入 service worker 或離線快取邏輯。

## 未來離線策略建議

1. App shell 採 stale-while-revalidate：HTML、CSS、JS 可快取，但必須用 build 版本號清 cache。
2. 行程、飯店、交通等靜態頁可 cache-first，適合國外網路不穩時查閱。
3. Google Drive API、OAuth token、照片上傳、收據與記帳資料不進 service worker cache。
4. 上傳流程維持 network-only，失敗時只保留本機 metadata 與明確待上傳狀態。
5. 啟用前需增加「清除離線資料」入口，讓家人在旅途中可手動排除快取問題。

## 啟用前驗證清單

- Android Chrome 可出現安裝提示，安裝後從主畫面開啟為 standalone。
- iOS Safari 加到主畫面後 icon 與標題正確。
- 新部署版本能在重新開啟 app 後更新，不被舊 service worker 卡住。
- `/photos` 在未連 Drive 時不誤導使用者以為照片已上傳。
- 記帳與收據流程在離線/恢復網路後不產生重複資料。
