import { expect, test, type Locator, type Page } from "@playwright/test";

const tripId = "hokuriku-2026";
const travelTestPassword =
  process.env.TRAVEL_TEST_PASSWORD ?? "playwright-trip-password";

test.describe("accounting trip flows", () => {
  test("adds an OCR-backed expense, edits it, and soft deletes it", async ({
    page,
  }) => {
    await gotoUnlocked(page, `/trip/${tripId}/expenses`);

    await expect(page.getByRole("heading", { name: "消費記帳" })).toBeVisible();
    await expect(page.getByText("目前沒有公開記帳資料。")).toBeVisible();
    await expect(page.getByRole("link", { name: "管理每日匯率" })).toHaveCount(0);
    await expect(page.getByRole("status", { name: "當日參考匯率" })).toHaveText(
      "100 JPY = 21.50 TWD",
    );
    await expect(page.getByLabel("匯率來源")).toHaveValue("reference");
    await expect(page.getByLabel("本筆匯率（每 1 JPY）")).toHaveCount(0);

    await page.getByLabel("收據上傳").setInputFiles({
      name: "arashiyama-receipt.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from("receipt"),
    });
    await activateButton(
      page,
      page.getByRole("button", { name: "辨識收據 arashiyama-receipt.jpg" }),
    );

    await expect(page.getByText("請確認收據辨識結果")).toBeVisible();
    await activateButton(page, page.getByRole("button", { name: "套用 OCR 結果" }));
    await expect(page.getByLabel("店家")).toHaveValue("嵐山茶屋");
    await expect(page.getByLabel("消費日期")).toHaveValue("2026-11-16");
    await expect(page.getByLabel("原始金額 JPY")).toHaveValue("1500");

    await page.getByLabel("購買項目").fill("收據咖啡");
    await page.getByLabel("原始金額 JPY").fill("1600");
    await page.getByLabel("匯率來源").selectOption("expense_custom");
    await page.getByLabel("本筆匯率（每 1 JPY）").fill("0.22");
    await expect(page.getByText("NT$ 352.00").first()).toBeVisible();
    await page.getByLabel("付款人").selectOption({ label: "林俊成" });
    await page.getByLabel("分帳方式").selectOption("percentage");
    await page.getByLabel("林彥旭 百分比").fill("50");
    await page.getByLabel("林俊榕 百分比").fill("20");
    await page.getByLabel("林俊成 百分比").fill("10");
    await page.getByLabel("林仙化 百分比").fill("10");
    await page.getByLabel("方錦屏 百分比").fill("10");
    await expect(page.getByText("NT$ 176.00").first()).toBeVisible();
    await activateButton(page, page.getByRole("button", { name: "儲存消費" }));

    await expect(page.getByText("收據咖啡", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "編輯 收據咖啡" }),
    ).toBeVisible();
    await expect(page.getByText("1 張收據", { exact: true })).toBeVisible();
    await expect(page.getByText("NT$ 352.00").first()).toBeVisible();
    await expect(page.getByText("百分比", { exact: true }).last()).toBeVisible();

    await activateButton(page, page.getByRole("button", { name: "編輯 收據咖啡" }));
    await page.getByLabel("購買項目").fill("收據咖啡修正");
    await activateButton(page, page.getByRole("button", { name: "更新消費" }));

    await expect(
      page.getByText("收據咖啡修正", { exact: true }),
    ).toBeVisible();

    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toContain("收據咖啡修正");
      await dialog.accept();
    });
    await activateButton(page, page.getByRole("button", { name: "刪除 收據咖啡修正" }));

    await expect(
      page.getByText("收據咖啡修正", { exact: true }),
    ).toHaveCount(0);
  });

  test("shows daily statistics and final settlement", async ({ page }) => {
    await gotoUnlocked(page, `/trip/${tripId}/expenses`);
    await expect(page.getByText("目前沒有公開記帳資料。")).toBeVisible();

    await page.getByRole("link", { name: "查看每日記帳" }).click();
    await expect(page).toHaveURL(
      new RegExp(`/trip/${tripId}/expenses/daily/2026-11-16$`),
    );
    await expect(page.getByRole("heading", { name: "每日記帳" })).toBeVisible();
    await expect(page.getByText("當日匯率")).toBeVisible();
    await expect(page.getByText("當日 TWD")).toBeVisible();
    await expect(page.getByText("這一天還沒有記帳資料。")).toBeVisible();

    await page.getByRole("link", { name: "前往最終結算" }).click();
    await expect(page).toHaveURL(new RegExp(`/trip/${tripId}/settlement$`));
    await expect(page.getByRole("heading", { name: "最終結算" })).toBeVisible();
    await expect(page.getByText("net balance 合計：NT$ 0.00")).toBeVisible();
    await expect(page.getByText("林彥旭", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("目前沒有公開結算資料。")).toBeVisible();
    await expect(page.getByText("林俊成 → 林彥旭")).toHaveCount(0);
  });
});

async function gotoUnlocked(page: Page, path: string) {
  await page.goto(path);
  await expect(page).toHaveURL(/\/login\?next=/);
  await page.getByLabel("旅行密碼").fill(travelTestPassword);
  const sessionResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/travel-session") &&
      response.request().method() === "POST",
  );
  await activateButton(page, page.getByRole("button", { name: "進入旅程" }));
  expect((await sessionResponse).status()).toBe(200);
  await expect(page).toHaveURL(new RegExp(`${escapeRegExp(path)}$`));
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function activateButton(page: Page, button: Locator) {
  await button.scrollIntoViewIfNeeded();
  await button.focus();
  await page.keyboard.press("Enter");
}
