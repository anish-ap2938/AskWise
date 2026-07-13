import { describe, expect, it } from "vitest";
import { cleanRequest } from "../../src/shared/extract";

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
});
