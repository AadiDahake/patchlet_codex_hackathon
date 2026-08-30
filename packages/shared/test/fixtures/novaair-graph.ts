/**
 * NovaAir as the explorer records it: four pages on the seat-change route, the controls that
 * matter on each, and the transitions between them. The "Seats" tab is a reveal: it does not
 * navigate, it shows the panel that holds "Change seats". Used by the planner tests and by the
 * widget's development API, so both plan over the same product.
 */
import { controlKey, type SiteControl, type SiteGraph, type SitePage, type SiteTransition } from "../../src/site";

const HOME = "/";
const MY_BOOKING = "/my-booking";
const TRIP = "/trips/:id";
const SEATS = "/trips/:id/seats";
const HELP = "/help";
const HELP_ARTICLE = "/help/how-do-i-change-my-seat";

const pages: SitePage[] = [
  { route: HOME, url: "http://localhost:4150/", title: "NovaAir" },
  { route: MY_BOOKING, url: "http://localhost:4150/my-booking", title: "My Booking | NovaAir" },
  { route: TRIP, url: "http://localhost:4150/trips/NVA7K2", title: "Manage Trip | NovaAir" },
  { route: SEATS, url: "http://localhost:4150/trips/NVA7K2/seats", title: "Choose Seats | NovaAir" },
  { route: HELP, url: "http://localhost:4150/help", title: "Help center | NovaAir" },
  { route: HELP_ARTICLE, url: "http://localhost:4150/help/how-do-i-change-my-seat", title: "How do I change my seat? | NovaAir" },
];

type Draft = Omit<SiteControl, "key">;

function control(draft: Draft): SiteControl {
  return { ...draft, key: controlKey(draft) };
}

const nav = (route: string): SiteControl[] => [
  control({ route, role: "link", name: "NovaAir home", landmark: "sidebar", href: HOME, visible: true }),
  control({ route, role: "link", name: "Flights", landmark: "sidebar", href: "/flights", visible: true }),
  control({ route, role: "link", name: "My Booking", landmark: "sidebar", href: MY_BOOKING, visible: true }),
];

export const CONTROLS = {
  homeMyBooking: control({ route: HOME, role: "link", name: "My Booking", landmark: "main", href: MY_BOOKING, visible: true }),
  homeFindFlight: control({ route: HOME, role: "link", name: "Find a flight", landmark: "main", href: "/flights", visible: true }),
  code: control({ route: MY_BOOKING, role: "textbox", name: "Confirmation code", landmark: "form", visible: true }),
  lastName: control({ route: MY_BOOKING, role: "textbox", name: "Last name", landmark: "form", visible: true }),
  findBooking: control({ route: MY_BOOKING, role: "button", name: "Find my booking", landmark: "form", visible: true }),
  breadcrumbTrip: control({ route: TRIP, role: "link", name: "Manage Trip", landmark: "sidebar", href: TRIP, visible: true }),
  seatsTab: control({ route: TRIP, role: "tab", name: "Seats", landmark: "main", visible: true }),
  bagsTab: control({ route: TRIP, role: "tab", name: "Bags", landmark: "main", visible: true }),
  checkinTab: control({ route: TRIP, role: "tab", name: "Check-in", landmark: "main", visible: true }),
  changeSeats: control({ route: TRIP, role: "link", name: "Change seats", landmark: "main", href: SEATS, visible: true }),
  baggageRules: control({ route: TRIP, role: "link", name: "Read the baggage rules", landmark: "main", href: "/help/baggage-allowance", visible: false }),
  helpChangeSeat: control({ route: TRIP, role: "link", name: "How do I change my seat?", landmark: "main", href: HELP_ARTICLE, visible: true }),
  seatBreadcrumb: control({ route: SEATS, role: "link", name: "Manage Trip", landmark: "sidebar", href: TRIP, visible: true }),
  confirmSeats: control({ route: SEATS, role: "button", name: "Confirm seats", landmark: "main", visible: true }),
  seat21A: control({ route: SEATS, role: "button", name: "Seat 21A, available, no extra cost", landmark: "main", visible: true }),
  helpArticle: control({ route: HELP, role: "link", name: "How do I change my seat?", landmark: "main", href: HELP_ARTICLE, visible: true }),
};

const transitions: SiteTransition[] = [
  { from: HOME, key: CONTROLS.homeMyBooking.key, to: MY_BOOKING, kind: "navigation" },
  { from: HOME, key: nav(HOME)[2]!.key, to: MY_BOOKING, kind: "navigation" },
  { from: MY_BOOKING, key: CONTROLS.findBooking.key, to: TRIP, kind: "navigation" },
  { from: TRIP, key: CONTROLS.seatsTab.key, to: TRIP, kind: "reveal", reveals: CONTROLS.changeSeats.key },
  { from: TRIP, key: CONTROLS.bagsTab.key, to: TRIP, kind: "reveal", reveals: CONTROLS.baggageRules.key },
  { from: TRIP, key: CONTROLS.changeSeats.key, to: SEATS, kind: "navigation" },
  { from: TRIP, key: CONTROLS.helpChangeSeat.key, to: HELP_ARTICLE, kind: "navigation" },
  { from: SEATS, key: CONTROLS.seatBreadcrumb.key, to: TRIP, kind: "navigation" },
  { from: HELP, key: CONTROLS.helpArticle.key, to: HELP_ARTICLE, kind: "navigation" },
  ...[HOME, MY_BOOKING, TRIP, SEATS, HELP, HELP_ARTICLE].flatMap((route): SiteTransition[] => [
    { from: route, key: nav(route)[0]!.key, to: HOME, kind: "navigation" },
    { from: route, key: nav(route)[2]!.key, to: MY_BOOKING, kind: "navigation" },
  ]),
];

export const NOVAAIR_GRAPH: SiteGraph = {
  pages,
  controls: [
    ...[HOME, MY_BOOKING, TRIP, SEATS, HELP, HELP_ARTICLE].flatMap(nav),
    ...Object.values(CONTROLS),
  ],
  transitions,
};

export const ROUTES = { HOME, MY_BOOKING, TRIP, SEATS, HELP, HELP_ARTICLE };
