import { describe, expect, it } from "vitest";
import {
  cleanRequest,
  normalizePromptProse,
} from "../../src/shared/extract";

describe("cleanRequest", () => {
  it("strips filler and capitalizes", () => {
    expect(cleanRequest("i want to build an app for fitness")).toMatch(/^Build an app/i);
  });

  it("fixes 'and app' → 'an app'", () => {
    expect(cleanRequest("i want to build and app for fitness")).toBe(
      "Build an app for fitness"
    );
  });

  it("fixes a few common typos without rewriting meaning", () => {
    expect(cleanRequest("explain teh binary search")).toBe("Explain the binary search");
    expect(cleanRequest("a app for tracking habits")).toBe("An app for tracking habits");
  });

  it("fixes backery → bakery in the user's exact bakery-app prompt", () => {
    expect(cleanRequest("i want to build an app for backery")).toBe(
      "Build an app for bakery"
    );
    expect(
      normalizePromptProse(
        "You are a senior product engineer. Here's what I want: Build an app for backery"
      )
    ).toContain("bakery");
    expect(
      normalizePromptProse(
        "You are a senior product engineer. Here's what I want: Build an app for backery"
      )
    ).not.toMatch(/backery/i);
  });

  it("normalizes prose without changing fenced or inline code", () => {
    expect(
      normalizePromptProse(
        "Bild a wep app for fitnes using `const bild = true`.\n```ts\nconst wep = 1;\n```"
      )
    ).toBe(
      "Build a web app for fitness using `const bild = true`.\n```ts\nconst wep = 1;\n```"
    );
  });
});
