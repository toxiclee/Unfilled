"use client";

import React, { useState } from "react";
import type { Task } from "../../../../../types/day";
import { getTaskStatusGlyph } from "../../../../../types/day";

interface DayStickyNoteProps {
  tasks: Task[];
  onToggleTask: (taskId: string) => void;
  isStudio: boolean;
}

export default function DayStickyNote({ tasks, onToggleTask, isStudio }: DayStickyNoteProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Show only first 7 tasks
  const displayTasks = tasks.slice(0, 7);

  if (displayTasks.length === 0) return null;

  return (
    <>
      {/* Trigger area on right edge */}
      <div
        onMouseEnter={() => setIsVisible(true)}
        style={{
          position: "fixed",
          right: 0,
          top: "50%",
          transform: "translateY(-50%)",
          width: 48,
          height: 120,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          cursor: "pointer",
        }}
      >
        <div
          style={{
            width: 2,
            height: 32,
            background: isVisible 
              ? (isStudio ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)")
              : (isStudio ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)"),
            transition: "all 0.3s ease",
          }}
        />
      </div>

      {/* Sticky note */}
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        style={{
          position: "fixed",
          right: isVisible ? 32 : -320,
          top: "50%",
          transform: "translateY(-50%)",
          width: 280,
          maxHeight: 400,
          background: isStudio ? "#0a0a0a" : "#ffffff",
          border: isStudio ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.06)",
          boxShadow: isStudio 
            ? "0 8px 32px rgba(0,0,0,0.6)" 
            : "0 8px 32px rgba(0,0,0,0.08)",
          padding: "32px 28px",
          zIndex: 999,
          transition: "right 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          fontFamily: "inherit",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            fontSize: 10,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            color: isStudio ? "#666" : "#999",
            marginBottom: 24,
            fontWeight: 400,
          }}
        >
          Today
        </div>

        {/* Task list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {displayTasks.map((task) => {
            const isDone = task.status === "done";
            const isSkipped = task.status === "skipped";
            
            return (
              <div
                key={task.id}
                onClick={() => onToggleTask(task.id)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  cursor: "pointer",
                  opacity: isDone || isSkipped ? 0.3 : 1,
                  transition: "opacity 0.2s ease",
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    lineHeight: 1.5,
                    flexShrink: 0,
                    marginTop: 2,
                    color: isStudio ? "#666" : "#bbb",
                  }}
                >
                  {getTaskStatusGlyph(task.status)}
                </span>
                <span
                  style={{
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: isStudio ? "#ddd" : "#333",
                    textDecoration: isDone ? "line-through" : "none",
                    wordBreak: "break-word",
                    fontWeight: 300,
                  }}
                >
                  {task.text}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        {tasks.length > 7 && (
          <div
            style={{
              fontSize: 9,
              color: isStudio ? "#444" : "#ccc",
              marginTop: 20,
              textAlign: "center",
              letterSpacing: 1,
            }}
          >
            +{tasks.length - 7}
          </div>
        )}
      </div>
    </>
  );
}
