"use client";

import { useEffect } from "react";
import { clearAllDayEntries, getStorageStats } from "../../lib/dayStorage";

export default function StorageDebugger() {
  useEffect(() => {
    // Expose storage utilities to window for debugging
    const unfilled = {
      clearAllData: () => {
        if (confirm('⚠️ This will delete ALL day entries. Continue?')) {
          const count = clearAllDayEntries();
          alert(`Cleared ${count} entries from localStorage`);
          window.location.reload();
          return count;
        }
        return 0;
      },
      getStats: () => {
        const stats = getStorageStats();
        return stats;
      },
      clearAll: () => {
        if (confirm('⚠️ This will delete EVERYTHING in localStorage. Continue?')) {
          localStorage.clear();
          alert('Cleared all localStorage');
          window.location.reload();
        }
      }
    };
    
    (window as any).unfilled = unfilled;
  }, []);

  return null;
}
