// Day Entry Storage Utilities

import type { DayEntry } from "../types/day";
import { createEmptyDayEntry, computeLifecycle } from "../types/day";

const STORAGE_PREFIX = "unfilled:day:";

// Load day entry from localStorage
export function loadDayEntry(dayId: string, mode: string = "poster"): DayEntry {
  if (typeof window === "undefined") {
    return createEmptyDayEntry(dayId, mode);
  }

  try {
    const key = `${STORAGE_PREFIX}${dayId}`;
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      return createEmptyDayEntry(dayId, mode);
    }

    const parsed: DayEntry = JSON.parse(stored);
    
    // Ensure arrays exist (for backward compatibility)
    if (!parsed.notes) parsed.notes = [];
    if (!parsed.tasks) parsed.tasks = [];
    
    // Recompute lifecycle in case logic changed
    parsed.lifecycle = computeLifecycle(parsed);
    
    return parsed;
  } catch (error) {
    console.error("Failed to load day entry:", error);
    return createEmptyDayEntry(dayId, mode);
  }
}

// Save day entry to localStorage
export function saveDayEntry(entry: DayEntry): void {
  if (typeof window === "undefined") return;
  
  // Validate entry.id
  if (!entry.id || entry.id === "undefined-undefined") {
    console.error("Invalid entry.id:", entry.id);
    return;
  }

  // Update lastEditedAt
  entry.lastEditedAt = new Date().toISOString();
  
  // Recompute lifecycle before saving
  entry.lifecycle = computeLifecycle(entry);
  
  // Create a copy with limited content to avoid quota issues
  const entryToSave = {
    ...entry,
    media: entry.media ? {
      ...entry.media,
      url: "" // Don't store the actual URL/blob in localStorage
    } : null,
    // Limit notes and tasks to prevent quota issues
    notes: entry.notes.slice(0, 50).map(n => ({
      ...n,
      text: n.text.slice(0, 500) // Max 500 chars per note
    })),
    tasks: entry.tasks.slice(0, 100).map(t => ({
      ...t,
      text: t.text.slice(0, 200) // Max 200 chars per task
    }))
  };
  
  const key = `${STORAGE_PREFIX}${entry.id}`;
  const serialized = JSON.stringify(entryToSave);
  
  // Check size before saving
  const sizeKB = new Blob([serialized]).size / 1024;
  if (sizeKB > 50) {
    console.warn(`Entry ${entry.id} is large (${sizeKB.toFixed(1)}KB).`);
  }

  try {
    localStorage.setItem(key, serialized);
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.error("localStorage quota exceeded. Attempting cleanup...");
      
      // Try to free up space by removing old entries
      try {
        
        const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX));
        const entries = keys.map(k => {
          try {
            const data = JSON.parse(localStorage.getItem(k) || '{}');
            return { key: k, lastEditedAt: data.lastEditedAt || '2000-01-01' };
          } catch {
            return { key: k, lastEditedAt: '2000-01-01' };
          }
        });
        
        // Sort by lastEditedAt, oldest first
        entries.sort((a, b) => a.lastEditedAt.localeCompare(b.lastEditedAt));
        
        // Remove oldest 50% of entries to free up more space
        const toRemove = Math.max(1, Math.ceil(entries.length * 0.5));
        for (let i = 0; i < toRemove; i++) {
          localStorage.removeItem(entries[i].key);
        }
        
        // Try saving again
        localStorage.setItem(key, serialized);
      } catch (cleanupError) {
        console.error("Failed to cleanup and save:", cleanupError);
        alert("Storage is full. Please export important days and clear old data.");
      }
    } else {
      console.error("Failed to save day entry:", error);
    }
  }
}

// Debounced save utility
let saveTimeout: NodeJS.Timeout | null = null;

export function debouncedSave(entry: DayEntry, delay: number = 500): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  saveTimeout = setTimeout(() => {
    saveDayEntry(entry);
    saveTimeout = null;
  }, delay);
}

// Delete day entry
export function deleteDayEntry(dayId: string): void {
  if (typeof window === "undefined") return;

  try {
    const key = `${STORAGE_PREFIX}${dayId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Failed to delete day entry:", error);
  }
}

// List all day entries (for potential future use)
export function listDayEntries(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        keys.push(key.replace(STORAGE_PREFIX, ""));
      }
    }
    return keys.sort();
  } catch (error) {
    console.error("Failed to list day entries:", error);
    return [];
  }
}

// Clear all day entries from localStorage
export function clearAllDayEntries(): number {
  if (typeof window === "undefined") return 0;

  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        keys.push(key);
      }
    }
    
    keys.forEach(key => localStorage.removeItem(key));
    return keys.length;
  } catch (error) {
    console.error("Failed to clear day entries:", error);
    return 0;
  }
}

// Get localStorage usage stats
export function getStorageStats(): { count: number; totalKB: number; entries: Array<{ id: string; sizeKB: number }> } {
  if (typeof window === "undefined") return { count: 0, totalKB: 0, entries: [] };

  try {
    const entries: Array<{ id: string; sizeKB: number }> = [];
    let totalSize = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        const value = localStorage.getItem(key) || "";
        const sizeKB = new Blob([value]).size / 1024;
        totalSize += sizeKB;
        entries.push({
          id: key.replace(STORAGE_PREFIX, ""),
          sizeKB: parseFloat(sizeKB.toFixed(2))
        });
      }
    }

    return {
      count: entries.length,
      totalKB: parseFloat(totalSize.toFixed(2)),
      entries: entries.sort((a, b) => b.sizeKB - a.sizeKB)
    };
  } catch (error) {
    console.error("Failed to get storage stats:", error);
    return { count: 0, totalKB: 0, entries: [] };
  }
}
