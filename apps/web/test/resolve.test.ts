import { describe, expect, it } from "vitest";
import type { PageContext } from "@patchlet/shared";
import { CONTROLS, NOVAAIR_GRAPH, ROUTES } from "../../../packages/shared/test/fixtures/novaair-graph";
import { bindFirstStep, candidatesFor } from "@/lib/agent/resolve";
import type { DocsEvidence } from "@/lib/agent/probes";

const home: PageContext = {
  url: "http://localhost:4150/",
  title: "NovaAir",
  affordances: [
    { id: "a1", role: "link", name: "Flights", landmark: "sidebar", href: "/flights", visible: true },
    { id: "a2", role: "link", name: "My Booking", landmark: "sidebar", href: "/my-booking", visible: true },
    { id: "a3", role: "link", name: "My Booking", landmark: "main", href: "/my-booking", visible: true },
  ],
};

const article: DocsEvidence = {
  documentTitle: "How do I change my seat?",
  url: "http://localhost:4150/help/how-do-i-change-my-seat",
  heading: "Change a seat online",
  snippet: "On the Manage Trip page, go to the Seats section and select Change seats.",
  similarity: 0.8,
};

describe("candidatesFor", () => {
  it("ranks the control the documentation names first, with its route from the current page", () => {
    const candidates = candidatesFor(NOVAAIR_GRAPH, "changing a seat", home, [article]);
    expect(candidates[0]?.control.name).toBe("Change seats");
    expect(candidates[0]?.pageTitle).toBe("Manage Trip | NovaAir");
    expect(candidates[0]?.route?.steps.map((step) => step.control.name)).toEqual([
      "My Booking",
      "Find my booking",
      "Change seats",
    ]);
  });

  it("lists each identity once and gives every candidate an id the model can name", () => {
    const candidates = candidatesFor(NOVAAIR_GRAPH, "my booking", home, []);
    const keys = candidates.map((candidate) => candidate.control.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(candidates.every((candidate, index) => candidate.id === `c${index + 1}`)).toBe(true);
  });
});

describe("bindFirstStep", () => {
  it("gives the first step the live id of the matching control and clears the rest", () => {
    const [candidate] = candidatesFor(NOVAAIR_GRAPH, "change seat", home, []);
    const bound = bindFirstStep(candidate!.route!.steps, home);
    expect(bound?.map((step) => step.target)).toEqual([expect.stringMatching(/^a[23]$/), null, null]);
    expect(bound?.[0]?.control?.name).toBe("My Booking");
  });

  it("returns null when the route starts with a control the page does not show", () => {
    const [candidate] = candidatesFor(NOVAAIR_GRAPH, "change seat", home, []);
    const elsewhere = { ...home, affordances: home.affordances.filter((a) => a.name !== "My Booking") };
    expect(bindFirstStep(candidate!.route!.steps, elsewhere)).toBeNull();
    expect(bindFirstStep([], home)).toBeNull();
  });

  it("does not care which page the target lives on, only that the route starts here", () => {
    const trip: PageContext = {
      url: "http://localhost:4150/trips/NVA7K2",
      title: "Manage Trip | NovaAir",
      affordances: [
        { id: "a9", role: "link", name: "Change seats", landmark: "main", href: "/trips/NVA7K2/seats", visible: true },
      ],
    };
    const [candidate] = candidatesFor(NOVAAIR_GRAPH, "change seat", trip, []);
    expect(candidate?.control.route).toBe(ROUTES.TRIP);
    expect(candidate?.control.key).toBe(CONTROLS.changeSeats.key);
    expect(bindFirstStep(candidate!.route!.steps, trip)?.[0]?.target).toBe("a9");
  });
});

describe("bindFirstStep with a twin of the control", () => {
  it("takes a visible copy of the same link over the one the widget could not see", () => {
    const [candidate] = candidatesFor(NOVAAIR_GRAPH, "change seat", home, []);
    const first = candidate!.route!.steps[0]!.control;
    const page: PageContext = {
      ...home,
      affordances: [
        { id: "n1", role: "link", name: "My Booking", landmark: first.landmark, href: "/my-booking", visible: false },
        { id: "h1", role: "link", name: "My Booking", landmark: first.landmark === "main" ? "sidebar" : "main", href: "/my-booking", visible: true },
      ],
    };
    const bound = bindFirstStep(candidate!.route!.steps, page);
    expect(bound?.[0]?.target).toBe("h1");
    expect(bound?.[0]?.control?.landmark).toBe(page.affordances[1]!.landmark);
  });

  it("still binds an off-screen copy when nothing visible matches, and leaves the rest to the widget", () => {
    const [candidate] = candidatesFor(NOVAAIR_GRAPH, "change seat", home, []);
    const page: PageContext = {
      ...home,
      affordances: [{ id: "n1", role: "link", name: "My Booking", landmark: "sidebar", href: "/my-booking", visible: false }],
    };
    expect(bindFirstStep(candidate!.route!.steps, page)?.[0]?.target).toBe("n1");
  });
});
