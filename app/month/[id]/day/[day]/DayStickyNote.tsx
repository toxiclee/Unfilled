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
            fontSize: 11,
            color: isStudio ? "#666" : "#999",
            letterSpacing: 1,
            textTransform: "uppercase",
            writingMode: "vertical-rl",
            textOrientation: "mixed",
          }}
        >
          Tasks
        </div>
      </div>

      {/* Sticky note panel */}
      <div
        onMouseLeave={() => setIsVisible(false)}
        style={{
          position: "fixed",
          right: isVisible ? 0 : -280,
          top: "50%",
          transform: "translateY(-50%)",
          width: 280,
          background: isStudio ? "#2a2a2a" : "#fffbcc",
          boxShadow: isVisible ? "-4px 0 12px rgba(0,0,0,0.15)" : "none",
          transition: "right 0.3s ease",
          zIndex: 999,
          padding: 24,
          borderTopLeftRadius: 8,
          borderBottomLeftRadius: 8,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 16,
            color: isStudio ? "#fff" : "#333",
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}
        >
          Quick Tasks
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {displayTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => onToggleTask(task.id)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                cursor: "pointer",
                padding: 8,
                borderRadius: 4,
                background: isStudio ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
                transition: "background 0.2s",
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  minWidth: 18,
                  textAlign: "center",
                  marginTop: 2,
                }}
              >
                {getTaskStatusGlyph(task.status)}
              </span>
              <span
                style={{
                  fontSize: 13,
                  lineHeight: 1.4,
                  color: isStudio ? "#ccc" : "#444",
                  textDecoration: task.status === "done" ? "line-through" : "none",
                  opacity: task.status === "done" ? 0.6 : 1,
                }}
              >
                {task.text}
              </span>
            </div>
          ))}
        </div>

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
