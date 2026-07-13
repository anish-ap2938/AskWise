import { test, expect } from "@playwright/test";

test.describe("widget on fixtures", () => {
  test("pill appears at 8-char threshold on chatgpt fixture", async ({ page }) => {
    await page.goto("/tests/fixtures/chatgpt-composer.html");
    await page.waitForTimeout(800);

    const textarea = page.locator("#prompt-textarea");
    await textarea.fill("short");
    await page.waitForTimeout(700);
    const pillShort = await page.evaluate(() => {
      const host = document.querySelector("askwise-root");
      return !!host?.shadowRoot?.querySelector("button.aw-pill");
    });
    expect(pillShort).toBe(false);

    await textarea.fill("explain binary search");
    await page.waitForTimeout(700);

    const pillLong = await page.evaluate(() => {
      const host = document.querySelector("askwise-root");
      return !!host?.shadowRoot?.querySelector("button.aw-pill");
    });
    expect(pillLong).toBe(true);
  });

  test("replace round-trips on chatgpt fixture", async ({ page }) => {
    await page.goto("/tests/fixtures/chatgpt-composer.html");
    const textarea = page.locator("#prompt-textarea");
    await textarea.fill("build me a job tracker app");
    await page.waitForTimeout(700);

    await page.evaluate(() => {
      const host = document.querySelector("askwise-root");
      if (!host?.shadowRoot) return;
      const btn = host.shadowRoot.querySelector("button.aw-pill") as HTMLButtonElement | null;
      btn?.click();
    });
    await page.waitForTimeout(200);

    await page.evaluate(() => {
      const host = document.querySelector("askwise-root");
      if (!host?.shadowRoot) return;
      const replace = [...host.shadowRoot.querySelectorAll("button")].find(
        (b) => b.textContent === "Replace"
      ) as HTMLButtonElement | undefined;
      replace?.click();
    });
    await page.waitForTimeout(300);

    const value = await textarea.inputValue();
    expect(value.length).toBeGreaterThan(20);
    expect(value).not.toBe("build me a job tracker app");
  });
});
