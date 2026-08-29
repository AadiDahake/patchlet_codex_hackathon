import { describe, expect, it } from "vitest";
import { concepts, keywordScore, tokenize } from "../src/text";

describe("tokenize", () => {
  it("lowercases, drops stopwords and stems", () => {
    expect(tokenize("How do I change my settings?")).toEqual(["change", "setting"]);
  });

  it("splits on punctuation and ignores single characters", () => {
    expect(tokenize("api-keys / v2")).toEqual(["api", "key", "v2"]);
  });
});

describe("concepts", () => {
  it("collapses a synonym group onto one concept", () => {
    expect([...concepts("dark mode")]).toEqual(["theme"]);
  });
});

describe("keywordScore", () => {
  it("matches a control through the synonym list", () => {
    expect(keywordScore("dark mode", "Appearance")).toBe(1);
  });

  it("scores a partial concept match", () => {
    expect(keywordScore("change username", "Profile")).toBe(0.5);
  });

  it("scores an unrelated control at zero", () => {
    expect(keywordScore("dark mode", "Billing")).toBe(0);
  });

  it("returns zero for empty input on either side", () => {
    expect(keywordScore("", "Profile")).toBe(0);
    expect(keywordScore("dark mode", "")).toBe(0);
  });
});
