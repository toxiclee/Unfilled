"use client";

import React, { useState, useEffect } from "react";
import { loadDayEntry, saveDayEntry } from "../../lib/dayStorage";
import type { DayEntry, Task } from "../../types/day";
import { getTaskStatusGlyph, cycleTaskStatus } from "../../types/day";

export default function GlobalStickyNote() {
  const [isVisible, setIsVisible] = useState(false);
  const [todayEntry, setTodayEntry] = useState<DayEntry | null>(null);

  // Load today's entry
  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const dayId = `${yyyy}-${mm}-${dd}`;
    
    const entry = loadDayEntry(dayId);
    setTodayEntry(entry);
  }, []);

  const toggleTask = (taskId: string) => {
    if (!todayEntry) return;
    
    const updatedTasks = todayEntry.tasks.map(t =>
      t.id === taskId ? { ...t, status: cycleTaskStatus(t.status) } : t
    );
    
    const updatedEntry = { ...todayEntry, tasks: updatedTasks };
    setTodayEntry(updatedEntry);
    saveDayEntry(updatedEntry);
  };

  // Always show trigger, even if no tasks
  const hasTasks = todayEntry && todayEntry.tasks.length > 0;
  const displayTasks = todayEntry?.tasks.slice(0, 7) || [];

  return (
    <>
      {/* Trigger dot on right edge - always visible */}
      <div
        onMouseEnter={() => setIsVisible(true)}
        style={{
          position: "fixed",
          right: 0,
          top: "50%",
          transform: "translateY(-50%)",
          width: 40,
          height: 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000,
          cursor: "pointer",
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: hasTasks ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.1)",
            transition: "all 0.2s ease",
            transform: isVisible ? "scale(1.5)" : "scale(1)",
            boxShadow: isVisible ? "0 2px 8px rgba(0,0,0,0.15)" : "none"
          }}
        />
      </div>

      {/* Sticky note */}
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        style={{
          position: "fixed",
          right: isVisible ? 20 : -300,
          top: "50%",
          transform: "translateY(-50%)",
          width: 260,
          maxHeight: 320,
          background: "#fefef5",
          boxShadow: "0 4px 20px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)",
          padding: "20px 18px",
          zIndex: 9999,
          transition: "right 0.25s ease-out",
          fontFamily: "inherit",
          borderRadius: 2,
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            fontSize: 11,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            color: "#999",
            marginBottom: 14,
            fontWeight: 500,
          }}
        >
          Today
        </div>

        {/* Task list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {displayTasks.length === 0 ? (
            <div
              style={{
                fontSize: 13,
                color: "#999",
                textAlign: "center",
                padding: "20px 0",
                fontStyle: "italic",
              }}
            >
              No tasks for today
            </div>
          ) : (
            displayTasks.map((task) => {
              const isDone = task.status === "done";
              const isSkipped = task.status === "skipped";
            
              return (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    cursor: "pointer",
                    opacity: isDone || isSkipped ? 0.4 : 1,
                    transition: "opacity 0.2s ease",
                    paddingBottom: 10,
                    borderBottom: "1px solid rgba(0,0,0,0.05)",
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      lineHeight: 1.2,
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    {getTaskStatusGlyph(task.status)}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      lineHeight: 1.4,
                      color: "#333",
                      textDecoration: isDone ? "line-through" : "none",
                      wordBreak: "break-word",
                    }}
                  >
                    {task.text}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer hint */}
        {todayEntry && todayEntry.tasks && todayEntry.tasks.length > 7 && (
          <div
            style={{
              fontSize: 10,
              color: "#bbb",
              marginTop: 12,
              textAlign: "center",
            }}
          >
            +{todayEntry.tasks.length - 7} more
          </div>
        )}
      </div>
    </>
  );
}
