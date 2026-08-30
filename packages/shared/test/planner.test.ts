import { describe, expect, it } from "vitest";
import { planRoute, searchControls, validateRoute, graphSize } from "../src/planner";
import { controlKey } from "../src/site";
import { CONTROLS, NOVAAIR_GRAPH, ROUTES } from "./fixtures/novaair-graph";

const target = { route: CONTROLS.changeSeats.route, key: CONTROLS.changeSeats.key };

describe("planRoute", () => {
  it("computes the three-step route from the home page to Change seats", () => {
    const plan = planRoute(NOVAAIR_GRAPH, { route: ROUTES.HOME }, target);
    expect(plan).not.toBeNull();
    expect(plan!.steps.map((step) => step.control.name)).toEqual([
      "My Booking",
      "Find my booking",
      "Change seats",
    ]);
    expect(plan!.steps.map((step) => step.control.route)).toEqual([ROUTES.HOME, ROUTES.MY_BOOKING, ROUTES.TRIP]);
    expect(plan!.steps.map((step) => step.advanceOn)).toEqual(["navigation", "navigation", "navigation"]);
    expect(plan!.steps.map((step) => step.caption)).toEqual([
      "Open My Booking",
      "Fill in the form, then select Find my booking",
      "Open Change seats",
    ]);
    // Nothing on a later page has a live id yet.
    expect(plan!.steps.every((step) => step.target === null)).toBe(true);
  });

  it("is one step from Manage Trip when the Seats panel is already open", () => {
    const plan = planRoute(
      NOVAAIR_GRAPH,
      { route: ROUTES.TRIP, visibleKeys: new Set([CONTROLS.seatsTab.key, CONTROLS.bagsTab.key, CONTROLS.changeSeats.key]) },
      target,
    );
    expect(plan!.steps.map((step) => step.control.name)).toEqual(["Change seats"]);
  });

  it("adds the Seats tab when the user is looking at the Bags panel", () => {
    const plan = planRoute(
      NOVAAIR_GRAPH,
      {
        route: ROUTES.TRIP,
        visibleKeys: new Set([CONTROLS.seatsTab.key, CONTROLS.bagsTab.key, CONTROLS.baggageRules.key]),
        activeKeys: new Set([CONTROLS.bagsTab.key]),
      },
      target,
    );
    expect(plan!.steps.map((step) => step.control.name)).toEqual(["Seats", "Change seats"]);
    expect(plan!.steps[0]!.caption).toBe("Select the Seats tab");
    expect(plan!.steps[0]!.advanceOn).toBe("click");
  });

  it("walks back to Manage Trip from the seat map through the breadcrumb", () => {
    const plan = planRoute(NOVAAIR_GRAPH, { route: ROUTES.SEATS }, target);
    expect(plan!.steps.map((step) => step.control.name)).toEqual(["Manage Trip", "Change seats"]);
  });

  it("returns null when the graph does not connect the pages", () => {
    const orphan = { route: "/nowhere", key: "button|nothing||" };
    expect(planRoute(NOVAAIR_GRAPH, { route: ROUTES.HOME }, orphan)).toBeNull();
    const graph = { ...NOVAAIR_GRAPH, transitions: [] };
    expect(planRoute(graph, { route: ROUTES.HOME }, target)).toBeNull();
  });

  it("takes the model's captions only when there is one per step", () => {
    const captions = ["Go to My Booking", "Enter your code and name, then find the booking", "Select Change seats"];
    const plan = planRoute(NOVAAIR_GRAPH, { route: ROUTES.HOME }, target, captions);
    expect(plan!.steps.map((step) => step.caption)).toEqual(captions);
    const short = planRoute(NOVAAIR_GRAPH, { route: ROUTES.HOME }, target, ["Only one"]);
    expect(short!.steps[0]!.caption).toBe("Open My Booking");
  });

  it("produces a plan the graph validates, and rejects a plan that skips a page", () => {
    const plan = planRoute(NOVAAIR_GRAPH, { route: ROUTES.HOME }, target)!;
    expect(validateRoute(plan.steps, NOVAAIR_GRAPH)).toBe(true);
    const skipped = [plan.steps[0]!, plan.steps[2]!];
    expect(validateRoute(skipped, NOVAAIR_GRAPH)).toBe(false);
    const renamed = [{ ...plan.steps[0]!, control: { ...plan.steps[0]!.control, name: "My Bookings" } }, ...plan.steps.slice(1)];
    expect(validateRoute(renamed, NOVAAIR_GRAPH)).toBe(false);
  });
});

describe("searchControls", () => {
  it("finds Change seats anywhere on the site for a seat question", () => {
    const matches = searchControls(NOVAAIR_GRAPH, "change seat");
    expect(matches[0]!.control.name).toBe("Change seats");
    expect(matches[0]!.page.title).toBe("Manage Trip | NovaAir");
    expect(matches[0]!.score).toBe(1);
  });

  it("finds no control worth pointing at for a capability the site does not have", () => {
    const matches = searchControls(NOVAAIR_GRAPH, "family seating together");
    expect(matches.every((match) => match.score < 0.5)).toBe(true);
    expect(searchControls(NOVAAIR_GRAPH, "family seating together", 12, 0.5)).toEqual([]);
  });

  it("reports how much it searched", () => {
    const size = graphSize(NOVAAIR_GRAPH);
    expect(size.pages).toBe(6);
    expect(size.controls).toBe(NOVAAIR_GRAPH.controls.length);
  });
});

describe("fixture identity", () => {
  it("keys every control by role, name, landmark and link target", () => {
    expect(CONTROLS.changeSeats.key).toBe("link|change seats|main|/trips/:id/seats");
    expect(controlKey({ role: "link", name: "  Change   Seats ", landmark: "main", href: "/trips/:id/seats" })).toBe(
      CONTROLS.changeSeats.key,
    );
  });
});
