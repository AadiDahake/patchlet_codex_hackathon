import { describe, expect, it } from "vitest";
import { concepts, keywordScore, stem, tokenize } from "../src/text";

describe("tokenize", () => {
  it("lowercases, drops stopwords and stems", () => {
    expect(tokenize("How do I change my settings?")).toEqual(["chang", "setting"]);
  });

  it("splits on punctuation and ignores single characters", () => {
    expect(tokenize("api-keys / v2")).toEqual(["api", "key", "v2"]);
  });
});

describe("concepts", () => {
  it("collapses a synonym group onto one concept", () => {
    expect([...concepts("dark mode")]).toEqual([stem("theme")]);
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

describe("stem inflections", () => {
  it("brings a verb and its inflections to one form", () => {
    const forms = ["change", "changes", "changed", "changing"].map((word) => stem(word));
    expect(new Set(forms).size).toBe(1);
    expect(stem("seats")).toBe(stem("seat"));
    expect(stem("booking")).toBe(stem("book"));
  });

  it("keeps short words whole", () => {
    expect(stem("bag")).toBe("bag");
    expect(stem("seat")).toBe("seat");
    expect(stem("name")).toBe("name");
  });
});
