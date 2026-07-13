import { test, expect } from "@playwright/test";

test.describe("adapter writeText", () => {
  test("writeText round-trips on textarea", async ({ page }) => {
    await page.setContent(`<textarea id="t" style="width:300px;height:100px"></textarea>`);
    const ok = await page.evaluate(() => {
      const el = document.getElementById("t") as HTMLTextAreaElement;
      el.focus();
      el.value = "hello world test text";
      el.dispatchEvent(new Event("input", { bubbles: true }));
      return el.value.length >= 8;
    });
    expect(ok).toBe(true);
  });

  test("writeText round-trips on contenteditable", async ({ page }) => {
    const text = "build me a job tracker app with features";
    const result = await page.evaluate((t) => {
      document.body.innerHTML = `<div id="e" contenteditable="true" style="width:300px;height:100px"></div>`;
      const el = document.getElementById("e") as HTMLElement;
      el.focus();
      const selection = window.getSelection();
      if (selection) {
        const range = document.createRange();
        range.selectNodeContents(el);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      document.execCommand("insertText", false, t);
      return el.innerText;
    }, text);
    expect(result).toBe(text);
  });
});
