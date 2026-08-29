import { afterEach, describe, expect, it } from "vitest";
import { appUrl, escalationEngine, openaiApiKey, targetVercelProject } from "@/lib/env";

const original = { ...process.env };

afterEach(() => {
  process.env = { ...original };
});

describe("env", () => {
  it("names the variable when a required one is missing", () => {
    delete process.env.OPENAI_API_KEY;
    expect(() => openaiApiKey()).toThrow(/OPENAI_API_KEY/);
  });

  it("treats an empty value as missing", () => {
    process.env.OPENAI_API_KEY = "";
    expect(() => openaiApiKey()).toThrow(/OPENAI_API_KEY/);
  });

  it("falls back to the documented default for optional variables", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(appUrl()).toBe("http://localhost:3000");
    delete process.env.TARGET_VERCEL_PROJECT;
    expect(targetVercelProject()).toBe("novaair");
  });

  it("only accepts the two known escalation engines", () => {
    process.env.ESCALATION_ENGINE = "forge";
    expect(escalationEngine()).toBe("forge");
    process.env.ESCALATION_ENGINE = "nonsense";
    expect(escalationEngine()).toBe("local");
    delete process.env.ESCALATION_ENGINE;
    expect(escalationEngine()).toBe("local");
  });
});
