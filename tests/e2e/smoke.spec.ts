import { test, expect } from "@playwright/test";

async function pillVisible(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const host = document.querySelector("askwise-root");
    return !!host?.shadowRoot?.querySelector("button.aw-pill");
  });
}

async function openPill(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    const host = document.querySelector("askwise-root");
    const btn = host?.shadowRoot?.querySelector("button.aw-pill") as HTMLButtonElement | null;
    btn?.click();
  });
}

async function popoverBox(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const host = document.querySelector("askwise-root");
    const pop = host?.shadowRoot?.querySelector(".aw-popover") as HTMLElement | null;
    if (!pop) return null;
    const r = pop.getBoundingClientRect();
    return { top: r.top, left: r.left, right: r.right, bottom: r.bottom };
  });
}

test.describe("pre-ship smoke", () => {
  test("chatgpt fixture: pill, popover, tabs, esc close", async ({ page }) => {
    await page.goto("/tests/fixtures/chatgpt-composer.html");
    const textarea = page.locator("#prompt-textarea");
    await textarea.fill("explain binary search in plain english please");
    await page.waitForTimeout(800);
    expect(await pillVisible(page)).toBe(true);

    await openPill(page);
    await page.waitForTimeout(300);
    let box = await popoverBox(page);
    expect(box).not.toBeNull();
    expect(box!.top).toBeGreaterThanOrEqual(0);
    expect(box!.left).toBeGreaterThanOrEqual(0);
    expect(box!.right).toBeLessThanOrEqual(1280 + 1);
    expect(box!.bottom).toBeLessThanOrEqual(800 + 1);

    await page.evaluate(() => {
      const host = document.querySelector("askwise-root");
      const tabs = [...(host?.shadowRoot?.querySelectorAll("button") ?? [])];
      const simple = tabs.find((b) => b.textContent?.trim() === "Simple");
      (simple as HTMLButtonElement | undefined)?.click();
    });
    await page.waitForTimeout(100);

    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    expect(await popoverBox(page)).toBeNull();
  });

  test("popover stays in viewport when composer is near the top", async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 500 });
    await page.goto("/tests/fixtures/chatgpt-composer.html");
    await page.addStyleTag({
      content: `body { padding: 8px !important; } .composer-wrap { margin-top: 0 !important; }`,
    });
    const textarea = page.locator("#prompt-textarea");
    await textarea.fill("write an email to my boss asking for a raise");
    await page.waitForTimeout(800);
    await openPill(page);
    await page.waitForTimeout(500);

    const info = await page.evaluate(() => {
      const host = document.querySelector("askwise-root");
      const pop = host?.shadowRoot?.querySelector(".aw-popover") as HTMLElement | null;
      if (!pop) return null;
      const r = pop.getBoundingClientRect();
      return {
        top: r.top,
        left: r.left,
        right: r.right,
        bottom: r.bottom,
        position: getComputedStyle(pop).position,
        maxHeight: getComputedStyle(pop).maxHeight,
        overflowY: getComputedStyle(pop).overflowY,
        vh: window.innerHeight,
      };
    });
    expect(info).not.toBeNull();
    expect(info!.position).toBe("fixed");
    expect(info!.top).toBeGreaterThanOrEqual(-1);
    expect(info!.bottom).toBeLessThanOrEqual(info!.vh + 2);
    expect(info!.left).toBeGreaterThanOrEqual(-1);
    expect(info!.right).toBeLessThanOrEqual(1100 + 2);
  });

  test("ATS prompt surfaces a sub-recipe chip", async ({ page }) => {
    await page.goto("/tests/fixtures/chatgpt-composer.html");
    await page.locator("#prompt-textarea").fill("how do i make my resume pass ats screening");
    await page.waitForTimeout(800);
    await openPill(page);
    await page.waitForTimeout(300);

    const chip = await page.evaluate(() => {
      const host = document.querySelector("askwise-root");
      const text = host?.shadowRoot?.textContent ?? "";
      return /ATS|Resume|Job/i.test(text);
    });
    expect(chip).toBe(true);
  });

  test("claude fixture: pill + replace", async ({ page }) => {
    await page.goto("/tests/fixtures/claude-composer.html");
    const composer = page.locator("[contenteditable='true'], textarea, [role='textbox']").first();
    await composer.click();
    await page.keyboard.type("build me a job tracker app with reminders");
    await page.waitForTimeout(900);
    expect(await pillVisible(page)).toBe(true);

    await openPill(page);
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      const host = document.querySelector("askwise-root");
      const replace = [...(host?.shadowRoot?.querySelectorAll("button") ?? [])].find(
        (b) => b.textContent?.trim() === "Replace"
      ) as HTMLButtonElement | undefined;
      replace?.click();
    });
    await page.waitForTimeout(400);

    const value = await page.evaluate(() => {
      const el =
        document.querySelector("[contenteditable='true']") ||
        document.querySelector("textarea");
      if (!el) return "";
      return (el as HTMLTextAreaElement).value || (el as HTMLElement).innerText || "";
    });
    expect(value.length).toBeGreaterThan(30);
    expect(value).not.toBe("build me a job tracker app with reminders");
  });

  test("attached file context appears in the prompt preview", async ({ page }) => {
    await page.goto("/tests/fixtures/chatgpt-composer.html");
    await page.locator("#prompt-textarea").fill("summarize this for my team meeting notes");
    await page.waitForTimeout(800);
    await openPill(page);
    await page.waitForTimeout(300);

    await page.evaluate(async () => {
      const host = document.querySelector("askwise-root");
      const root = host?.shadowRoot;
      if (!root) return;
      const input = root.querySelector('input[type="file"]') as HTMLInputElement | null;
      if (!input) return;
      const file = new File(
        ["Q1 revenue grew 12%.\nHiring plan: 3 engineers."],
        "notes.txt",
        { type: "text/plain" }
      );
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.waitForTimeout(600);

    const preview = await page.evaluate(() => {
      const host = document.querySelector("askwise-root");
      return host?.shadowRoot?.textContent ?? "";
    });
    expect(preview).toMatch(/notes\.txt|Reference material|Q1 revenue/i);
  });

  test("secret-looking text is redacted in Tier 1 result", async ({ page }) => {
    await page.goto("/tests/fixtures/chatgpt-composer.html");
    await page
      .locator("#prompt-textarea")
      .fill("debug this api call using sk-abcdefghijklmnopqrstuvwxyz1234567890");
    await page.waitForTimeout(800);
    await openPill(page);
    await page.waitForTimeout(300);

    const hasSecretUi = await page.evaluate(() => {
      const host = document.querySelector("askwise-root");
      const text = host?.shadowRoot?.textContent ?? "";
      return /secret/i.test(text) && /redacted/i.test(text);
    });
    expect(hasSecretUi).toBe(true);
  });
});
