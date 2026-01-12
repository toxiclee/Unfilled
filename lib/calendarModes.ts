export type CalendarModeId =
  | "poster"
  | "grid"
  | "film"
  | "instant"
  | "japanese";

export const CALENDAR_MODES: {
  id: CalendarModeId;
  label: string;
  conceptualLabel: string;
  nuance: string;
}[] = [
  { id: "poster", label: "Poster", conceptualLabel: "Not Yet", nuance: "full-bleed, open composition" },
  { id: "grid", label: "Grid", conceptualLabel: "Still", nuance: "stable, structured layout" },
  { id: "film", label: "Film", conceptualLabel: "Warm", nuance: "softer contrast, visible texture" },
  { id: "instant", label: "Instant", conceptualLabel: "Quiet", nuance: "reduced elements, calm spacing" },
  { id: "japanese", label: "Japanese", conceptualLabel: "Lingering", nuance: "generous whitespace, slower transitions" },
];

// Map mode IDs to conceptual labels
export const MODE_CONCEPTUAL_LABELS: Record<CalendarModeId, string> = {
  poster: "Not Yet",
  grid: "Still",
  film: "Warm",
  instant: "Quiet",
  japanese: "Lingering",
};

// Ordered modes for cycling
export const ORDERED_MODES: CalendarModeId[] = ["poster", "grid", "film", "instant", "japanese"];
