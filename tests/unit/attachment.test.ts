import { describe, expect, it } from "vitest";
import {
  MAX_ATTACHMENT_CHARS,
  formatAttachmentsBlock,
  prepareAttachment,
  withAttachments,
} from "../../src/shared/attachment";

describe("prepareAttachment", () => {
  it("keeps short text intact and counts words", () => {
    const a = prepareAttachment("1", "notes.txt", "text", "hello world\n\nfoo bar");
    expect(a.text).toBe("hello world\n\nfoo bar");
    expect(a.truncated).toBe(false);
    expect(a.words).toBe(4);
    expect(a.redactedCount).toBe(0);
  });

  it("trims long content at a sentence boundary", () => {
    const sentence = "This is a fairly normal sentence about fitness plans. ";
    const long = sentence.repeat(300); // ~16k chars
    const a = prepareAttachment("1", "big.txt", "text", long);
    expect(a.truncated).toBe(true);
    expect(a.text.length).toBeLessThanOrEqual(MAX_ATTACHMENT_CHARS);
    expect(a.text.endsWith(".")).toBe(true);
  });

  it("redacts secrets found in file content", () => {
    const a = prepareAttachment(
      "1",
      "env.txt",
      "text",
      "config here\nsk-abcdefghijklmnopqrstuvwxyz123456\nend"
    );
    expect(a.redactedCount).toBeGreaterThan(0);
    expect(a.text).not.toContain("sk-abcdefghijklmnopqrstuvwxyz123456");
  });

  it("collapses excessive blank lines and CRLF", () => {
    const a = prepareAttachment("1", "f.txt", "text", "a\r\n\r\n\r\n\r\nb");
    expect(a.text).toBe("a\n\nb");
  });
});

describe("withAttachments", () => {
  it("is a no-op with no attachments", () => {
    expect(withAttachments("prompt", [])).toBe("prompt");
    expect(formatAttachmentsBlock([])).toBe("");
  });

  it("appends a labeled reference section", () => {
    const a = prepareAttachment("1", "plan.pdf", "pdf", "week 1: run 5k");
    const out = withAttachments("Improved prompt", [a]);
    expect(out.startsWith("Improved prompt")).toBe(true);
    expect(out).toContain("### plan.pdf");
    expect(out).toContain("week 1: run 5k");
    expect(out).toContain("Reference material from my files");
  });

  it("notes truncation in the block", () => {
    const a = prepareAttachment("1", "big.md", "text", "word ".repeat(5000));
    const out = formatAttachmentsBlock([a]);
    expect(out).toContain("excerpt");
  });
});
