export type CalendarModeId =
  | "poster"
  | "grid"
  | "film"
  | "dark"
  | "minimal";

export const CALENDAR_MODES: {
  id: CalendarModeId;
  label: string;
  description: string;
}[] = [
  { id: "poster", label: "Poster", description: "Cover photo + compact calendar" },
  { id: "grid", label: "Grid", description: "Classic monthly grid" },
  { id: "film", label: "Film", description: "Photography-first layout" },
  { id: "dark", label: "Dark", description: "Dark gallery style" },
  { id: "minimal", label: "Minimal", description: "Typography-focused" },
];
