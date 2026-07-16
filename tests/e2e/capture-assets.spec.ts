import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

// Only when explicitly capturing for the store listing:
//   CAPTURE=1 npm run capture:assets
test.skip(!process.env.CAPTURE, "Set CAPTURE=1 to write store-assets/");

const OUT = join(process.cwd(), "store-assets");
mkdirSync(OUT, { recursive: true });

async function openPopover(page: import("@playwright/test").Page, prompt: string) {
  await page.goto("/tests/fixtures/chatgpt-composer.html");
  const textarea = page.locator("#prompt-textarea");
  await textarea.fill(prompt);
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    const host = document.querySelector("askwise-root");
    const btn = host?.shadowRoot?.querySelector("button.aw-pill") as HTMLButtonElement | null;
    btn?.click();
  });
  await page.waitForTimeout(400);
  const open = await page.evaluate(() => {
    const host = document.querySelector("askwise-root");
    return !!host?.shadowRoot?.querySelector(".aw-popover");
  });
  expect(open).toBe(true);
}

async function clickShadowButton(page: import("@playwright/test").Page, label: string) {
  await page.evaluate((text) => {
    const host = document.querySelector("askwise-root");
    if (!host?.shadowRoot) return;
    const btn = [...host.shadowRoot.querySelectorAll("button")].find(
      (b) => b.textContent?.trim() === text
    ) as HTMLButtonElement | undefined;
    btn?.click();
  }, label);
}

test.describe("store asset capture", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("01 hero popover", async ({ page }) => {
    await openPopover(page, "i want to build and app for fitness");
    await page.screenshot({ path: join(OUT, "01-hero.png"), fullPage: false });
  });

  test("02 changes tab", async ({ page }) => {
    await openPopover(page, "i want to build and app for fitness");
    await clickShadowButton(page, "Changes");
    await page.waitForTimeout(200);
    await page.screenshot({ path: join(OUT, "02-diff.png"), fullPage: false });
  });

  test("03 ATS sub-recipe", async ({ page }) => {
    await openPopover(page, "how do i make my resume pass ats screening");
    await page.waitForTimeout(200);
    await page.screenshot({ path: join(OUT, "03-ats.png"), fullPage: false });
  });

  test("04 placeholders", async ({ page }) => {
    await openPopover(page, "tailor my resume for this job");
    await page.waitForTimeout(200);
    await page.screenshot({ path: join(OUT, "04-placeholder.png"), fullPage: false });
  });

  test("05 options page", async ({ page }) => {
    await page.addInitScript(() => {
      const storage: Record<string, unknown> = {
        askwise: {
          schemaVersion: 1,
          settings: {
            enabledSites: {
              chatgpt: true,
              claude: true,
              gemini: true,
              perplexity: true,
              deepseek: true,
              copilot: true,
            },
            defaultVariant: "structured",
            targetModelOverride: "auto",
            tier2ForStructured: false,
            redactionEnabled: true,
            shortcutEnabled: true,
          },
          providers: {
            ondevice: {
              enabled: true,
              model: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
            },
            local: {
              enabled: true,
              baseUrl: "http://localhost:11434",
              model: "qwen3:8b",
              lastDetected: Date.now(),
            },
            ladder: ["ondevice", "local", "anthropic", "openai"],
          },
          templates: [],
        },
        askwise_ondevice_progress: {
          status: "ready",
          model: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
          progress: 1,
          text: "Model ready",
          updatedAt: Date.now(),
        },
      };

      // Minimal chrome.* mock so options/onboarding render outside the extension.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).chrome = {
        storage: {
          local: {
            get: (keys: string[] | string, cb: (result: Record<string, unknown>) => void) => {
              const list = Array.isArray(keys) ? keys : [keys];
              const out: Record<string, unknown> = {};
              for (const k of list) out[k] = storage[k];
              cb(out);
            },
            set: (_data: Record<string, unknown>, cb?: () => void) => cb?.(),
            remove: (_keys: string[], cb?: () => void) => cb?.(),
          },
          onChanged: { addListener: () => undefined, removeListener: () => undefined },
        },
        runtime: {
          sendMessage: (
            msg: { kind?: string },
            cb?: (response: unknown) => void
          ) => {
            if (msg?.kind === "GET_ONDEVICE_STATUS" || msg?.kind === "ENSURE_ONDEVICE") {
              cb?.({ kind: "ONDEVICE_STATUS", payload: storage.askwise_ondevice_progress });
              return;
            }
            cb?.({});
          },
          openOptionsPage: () => undefined,
          lastError: undefined,
        },
      };
    });
    await page.goto("/src/options/index.html");
    await page.waitForTimeout(600);
    await page.screenshot({ path: join(OUT, "05-options.png"), fullPage: false });
  });

  test("06 onboarding page", async ({ page }) => {
    await page.addInitScript(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).chrome = {
        storage: {
          local: {
            get: (_keys: string[], cb: (result: Record<string, unknown>) => void) => cb({}),
            set: (_data: unknown, cb?: () => void) => cb?.(),
          },
          onChanged: { addListener: () => undefined, removeListener: () => undefined },
        },
        runtime: {
          sendMessage: (
            msg: { kind?: string },
            cb?: (response: unknown) => void
          ) => {
            if (msg?.kind === "GET_ONDEVICE_STATUS" || msg?.kind === "ENSURE_ONDEVICE") {
              cb?.({
                kind: "ONDEVICE_STATUS",
                payload: {
                  status: "downloading",
                  model: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
                  progress: 0.62,
                  text: "Fetching model weights…",
                  updatedAt: Date.now(),
                },
              });
              return;
            }
            cb?.({});
          },
          openOptionsPage: () => undefined,
          lastError: undefined,
        },
      };
    });
    await page.goto("/src/onboarding/index.html");
    await page.waitForTimeout(800);
    await page.screenshot({ path: join(OUT, "06-onboarding.png"), fullPage: false });
  });
});
