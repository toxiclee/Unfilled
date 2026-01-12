// Day Entry Data Model

export type DayLifecycle = "empty" | "draft" | "active" | "archived";

export type TaskStatus = "planned" | "done" | "skipped";

export type NoteType = "caption" | "reflection" | "free";

export interface Task {
  id: string;
  text: string;
  status: TaskStatus;
  createdAt: string;
}

export interface Note {
  id: string;
  text: string;
  type: NoteType;
  createdAt: string;
}

export interface DayEntry {
  id: string; // YYYY-MM-DD format
  dateISO: string;
  lifecycle: DayLifecycle;
  mode: string; // references the 5 view modes from parent
  media: {
    url: string;
    type: "image" | "video";
  } | null;
  notes: Note[];
  tasks: Task[];
  lastEditedAt: string;
  manualLifecycle?: DayLifecycle; // Optional override
}

// Compute lifecycle based on content
export function computeLifecycle(entry: DayEntry): DayLifecycle {
  // Manual override takes precedence
  if (entry.manualLifecycle) {
    return entry.manualLifecycle;
  }

  const hasMedia = !!entry.media;
  const hasNotes = entry.notes.length > 0;
  const hasTasks = entry.tasks.length > 0;
  const hasActiveTasks = entry.tasks.some((t) => t.status === "planned" || t.status === "done");

  // Empty: no content at all
  if (!hasMedia && !hasNotes && !hasTasks) {
    return "empty";
  }

  // Active: has tasks in progress or completed
  if (hasActiveTasks) {
    return "active";
  }

  // Draft: has some content but not actively worked on
  return "draft";
}

// Create empty day entry
export function createEmptyDayEntry(dayId: string, mode: string = "poster"): DayEntry {
  return {
    id: dayId,
    dateISO: dayId, // assumes format YYYY-MM-DD
    lifecycle: "empty",
    mode,
    media: null,
    notes: [],
    tasks: [],
    lastEditedAt: new Date().toISOString(),
  };
}

// Helper to create a new task
export function createTask(text: string): Task {
  return {
    id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    text: text.trim(),
    status: "planned",
    createdAt: new Date().toISOString(),
  };
}

// Helper to create a new note
export function createNote(text: string, type: NoteType = "free"): Note {
  return {
    id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    text: text.trim(),
    type,
    createdAt: new Date().toISOString(),
  };
}

// Cycle task status
export function cycleTaskStatus(current: TaskStatus): TaskStatus {
  switch (current) {
    case "planned":
      return "done";
    case "done":
      return "skipped";
    case "skipped":
      return "planned";
  }
}

// Get status glyph
export function getTaskStatusGlyph(status: TaskStatus): string {
  switch (status) {
    case "planned":
      return "○";
    case "done":
      return "✓";
    case "skipped":
      return "—";
  }
}
