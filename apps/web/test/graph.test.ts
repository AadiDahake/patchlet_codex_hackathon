import { describe, expect, it } from "vitest";
import { controlKey } from "@patchlet/shared";
import type { PageContext } from "@patchlet/shared";
import { intentKey } from "@/lib/graph/intent";
import { belongsToSite } from "@/lib/graph/origin";
import { controlRows } from "@/lib/graph/store";

const page: PageContext = {
  url: "http://localhost:4150/trips/NVA7K2",
  title: "Manage Trip | NovaAir",
  affordances: [
    { id: "a1", role: "link", name: "Change seats", landmark: "main", href: "/trips/NVA7K2/seats", visible: true },
    { id: "a2", role: "tab", name: "Seats", landmark: "main", visible: true, state: "selected" },
    { id: "a3", role: "link", name: "Change seats", landmark: "main", href: "/trips/NVA7K2/seats", visible: false },
    { id: "a4", role: "button", name: "", visible: true },
    { id: "a5", role: "button", name: "Disabled thing", visible: true, disabled: true },
  ],
};

describe("controlRows", () => {
  it("keys controls by identity with the link target normalised, once each", () => {
    const rows = controlRows(page);
    expect(rows.map((row) => row.key)).toEqual([
      "link|change seats|main|/trips/:id/seats",
      "tab|seats|main|",
    ]);
    expect(rows[0]).toMatchObject({ role: "link", name: "Change seats", landmark: "main", href: "/trips/:id/seats" });
  });

  it("keeps a control visible if any copy of it was visible, and drops nameless or disabled ones", () => {
    const rows = controlRows(page);
    expect(rows[0]?.visible).toBe(true);
    expect(rows.some((row) => row.name === "" || row.name === "Disabled thing")).toBe(false);
  });

  it("agrees with the shared key of the same identity", () => {
    const [row] = controlRows(page);
    expect(row?.key).toBe(controlKey({ role: "link", name: "Change seats", landmark: "main", href: "/trips/:id/seats" }));
  });
});

describe("intentKey", () => {
  it("is the same for two wordings with the same concepts", () => {
    expect(intentKey("Where do I change my seat?")).toBe(intentKey("how can I change seats"));
    expect(intentKey("Where do I change my seat?")).not.toBe(intentKey("Where do I add a bag?"));
  });
});

/**
 * A preview deployment of an unmerged branch serves the same product on another origin. One visit
 * to it used to teach the project's product map a control the live site has not got, and the next
 * visitor on the live site was walked to a button that was not there.
 */
describe("belongsToSite", () => {
  const SITE = "https://novaair.vercel.app";
  const PREVIEW = "https://novaair-4vs9gj5jt-dahakeaadi-2078s-projects.vercel.app/trips/NVA7K2/seats";

  it("refuses a Vercel preview deployment of the same product", () => {
    expect(belongsToSite(SITE, PREVIEW)).toBe(false);
  });

  it("takes any page of the site the project names, whatever the path or the query", () => {
    expect(belongsToSite(SITE, `${SITE}/trips/NVA7K2/seats?passenger=2`)).toBe(true);
    expect(belongsToSite(`${SITE}/help/index.html`, `${SITE}/`)).toBe(true);
  });

  it("separates the scheme, the host and the port, because each is a different deployment", () => {
    expect(belongsToSite("https://novaair.vercel.app", "http://novaair.vercel.app/")).toBe(false);
    expect(belongsToSite("http://localhost:4150", "http://localhost:4151/")).toBe(false);
    expect(belongsToSite("http://localhost:4150", "http://localhost:4150/trips")).toBe(true);
  });

  it("takes everything while the project has not said where it lives", () => {
    expect(belongsToSite(null, PREVIEW)).toBe(true);
    expect(belongsToSite("", PREVIEW)).toBe(true);
    expect(belongsToSite("not a url", PREVIEW)).toBe(true);
  });

  it("refuses a page whose own address cannot be read", () => {
    expect(belongsToSite(SITE, "about:blank")).toBe(false);
  });
});
