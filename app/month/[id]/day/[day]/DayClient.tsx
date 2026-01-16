"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import type { DayEntry, Task, Note, TaskStatus, NoteType } from "../../../../../types/day";
import { 
  createEmptyDayEntry, 
  createTask, 
  createNote, 
  cycleTaskStatus, 
  getTaskStatusGlyph 
} from "../../../../../types/day";
import { loadDayEntry, debouncedSave } from "../../../../../lib/dayStorage";
import DayStickyNote from "./DayStickyNote";
import DayExportModal from "./DayExportModal";

// Add stroke animation keyframe
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes drawStroke {
      to {
        stroke-dashoffset: 0;
      }
    }
  `;
  if (!document.head.querySelector('style[data-gesture-anim]')) {
    style.setAttribute('data-gesture-anim', 'true');
    document.head.appendChild(style);
  }
}

export default function DayClient({ monthId, day }: { monthId: string; day: string }) {
  // Validate params
  if (!monthId || !day) {
    console.error('Invalid params:', { monthId, day });
    return <div>Invalid day parameters</div>;
  }
  
  const dayId = `${monthId}-${String(day).padStart(2, "0")}`;
  const [dayEntry, setDayEntry] = useState<DayEntry>(() => createEmptyDayEntry(dayId));
  const [template, setTemplate] = useState<"studio" | "paper">("studio");
  const [taskDraft, setTaskDraft] = useState<string>("");
  const [noteDraft, setNoteDraft] = useState<string>("");
  const [showGesture, setShowGesture] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFont, setSelectedFont] = useState<string>("serif");
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImageAdjust, setShowImageAdjust] = useState(false);
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isStudio = template === "studio";

  // Load on mount
  useEffect(() => {
    const loaded = loadDayEntry(dayId);
    setDayEntry(loaded);
    
    // Initialize note draft with existing free notes
    const freeNotes = loaded.notes.filter(n => n.type === "free");
    if (freeNotes.length > 0) {
      setNoteDraft(freeNotes.map(n => n.text).join("\n\n"));
    }
    
    // Load saved image adjustments
    if (loaded.media?.adjust) {
      setImageScale(loaded.media.adjust.scale);
      setImagePosition({ x: loaded.media.adjust.positionX, y: loaded.media.adjust.positionY });
    }
  }, [dayId]);

  // Auto-save on changes
  useEffect(() => {
    if (dayEntry.id) {
      debouncedSave(dayEntry);
    }
  }, [dayEntry]);

  // Update day entry helper
  const updateEntry = useCallback((updates: Partial<DayEntry>) => {
    setDayEntry(prev => ({ ...prev, ...updates }));
  }, []);

  // Media handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    updateEntry({
      media: { 
        url, 
        type: "image",
        adjust: {
          scale: imageScale,
          positionX: imagePosition.x,
          positionY: imagePosition.y
        }
      }
    });
  };
  
  // Save image adjustments
  const saveImageAdjustments = useCallback(() => {
    if (dayEntry.media) {
      updateEntry({
        media: {
          ...dayEntry.media,
          adjust: {
            scale: imageScale,
            positionX: imagePosition.x,
            positionY: imagePosition.y
          }
        }
      });
    }
  }, [dayEntry.media, imageScale, imagePosition, updateEntry]);

  // Task handlers
  const addTask = useCallback(() => {
    if (!taskDraft.trim()) return;
    
    const newTask = createTask(taskDraft);
    updateEntry({
      tasks: [newTask, ...dayEntry.tasks]
    });
    setTaskDraft("");
  }, [taskDraft, dayEntry.tasks, updateEntry]);

  const toggleTaskStatus = useCallback((taskId: string) => {
    updateEntry({
      tasks: dayEntry.tasks.map(t =>
        t.id === taskId ? { ...t, status: cycleTaskStatus(t.status) } : t
      )
    });
  }, [dayEntry.tasks, updateEntry]);

  const removeTask = useCallback((taskId: string) => {
    updateEntry({
      tasks: dayEntry.tasks.filter(t => t.id !== taskId)
    });
  }, [dayEntry.tasks, updateEntry]);

  // Note handlers
  const saveNoteAs = useCallback((type: NoteType) => {
    if (!noteDraft.trim()) return;

    // Remove existing notes of this type
    const filteredNotes = dayEntry.notes.filter(n => n.type !== type);
    const newNote = createNote(noteDraft, type);
    
    updateEntry({
      notes: [...filteredNotes, newNote]
    });
  }, [noteDraft, dayEntry.notes, updateEntry]);

  const saveNoteFree = useCallback(() => {
    // Replace all free notes with current draft
    const nonFreeNotes = dayEntry.notes.filter(n => n.type !== "free");
    
    if (noteDraft.trim()) {
      // Split by double newlines for multiple free notes
      const paragraphs = noteDraft.split(/\n\n+/).filter(p => p.trim());
      const newFreeNotes = paragraphs.map(text => createNote(text, "free"));
      
      updateEntry({
        notes: [...nonFreeNotes, ...newFreeNotes]
      });
    } else {
      updateEntry({
        notes: nonFreeNotes
      });
    }
  }, [noteDraft, dayEntry.notes, updateEntry]);

  // Auto-save notes on blur
  const handleNoteBlur = useCallback(() => {
    saveNoteFree();
  }, [saveNoteFree]);

  // Generate wallpaper canvas
  async function generateWallpaperCanvas(): Promise<HTMLCanvasElement | null> {
    const width = 1920;
    const height = 1080;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = isStudio ? "#0a0a0a" : "#ffffff";
    ctx.fillRect(0, 0, width, height);

    if (dayEntry.media?.url) {
      const ok = await new Promise<boolean>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          try {
            const imgRatio = img.width / img.height;
            const canvasRatio = width / height;
            let dw = width, dh = height, dx = 0, dy = 0;
            if (imgRatio > canvasRatio) {
              dh = height;
              dw = img.width * (height / img.height);
              dx = -(dw - width) / 2;
            } else {
              dw = width;
              dh = img.height * (width / img.width);
              dy = -(dh - height) / 2;
            }
            ctx.drawImage(img, dx, dy, dw, dh);
            resolve(true);
          } catch {
            resolve(false);
          }
        };
        img.onerror = () => resolve(false);
        img.src = dayEntry.media!.url;
      });

      if (!ok) {
        alert("Unable to include the image in export due to cross-origin restrictions. Try uploading a local file instead.");
      }
    }

    // Don't draw background panel - keep wallpaper clean

    ctx.fillStyle = isStudio ? "#fff" : "#111";
    ctx.font = `bold 48px ${selectedFont}`;
    ctx.fillText(`Day ${day}`, 120, height - 420 - 30 + 60);

    // Render notes
    ctx.font = `24px ${selectedFont}`;
    const noteX = 120;
    let noteY = height - 420 - 30 + 120;
    const maxWidth = width - 240;
    
    const allNoteText = dayEntry.notes.map(n => n.text).join(" ");
    const lines = wrapText(ctx, allNoteText, maxWidth);
    for (const line of lines.slice(0, 8)) {
      ctx.fillText(line, noteX, noteY);
      noteY += 34;
    }

    // Render tasks
    ctx.font = `22px ${selectedFont}`;
    let todoY = noteY + 10;
    for (const t of dayEntry.tasks.slice(0, 8)) {
      const mark = getTaskStatusGlyph(t.status);
      ctx.fillText(`${mark} ${t.text}`, noteX, todoY);
      todoY += 30;
    }

    return canvas;
  }

  // Preview wallpaper
  async function previewWallpaper() {
    const canvas = await generateWallpaperCanvas();
    if (!canvas) {
      alert("Failed to generate preview.");
      return;
    }
    
    const url = canvas.toDataURL("image/jpeg", 0.92);
    setPreviewUrl(url);
  }

  // Export wallpaper
  async function exportWallpaper() {
    const canvas = await generateWallpaperCanvas();
    if (!canvas) {
      alert("Failed to generate wallpaper.");
      return;
    }

    try {
      await new Promise<void>((resolve) =>
        canvas.toBlob((blob) => {
          if (!blob) return resolve();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `unfilled-${dayId}.jpg`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          resolve();
        }, "image/jpeg", 0.92)
      );
    } catch (err) {
      console.error("exportWallpaper failed", err);
      alert("Failed to export wallpaper.");
    }
  }

  function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const test = cur ? cur + " " + w : w;
      if (ctx.measureText(test).width > maxWidth) {
        if (cur) lines.push(cur);
        cur = w;
      } else {
        cur = test;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  }

  function resetDay() {
    const empty = createEmptyDayEntry(dayId);
    setDayEntry(empty);
    setNoteDraft("");
    setTaskDraft("");
  }

  // Trigger gesture animation on mode switch
  const handleModeSwitch = (newMode: "studio" | "paper") => {
    if (newMode !== template) {
      setTemplate(newMode);
      setShowGesture(false);
      setTimeout(() => setShowGesture(true), 300);
    }
  };

  // Get lifecycle label
  const lifecycleLabel = dayEntry.lifecycle.charAt(0).toUpperCase() + dayEntry.lifecycle.slice(1);

  // Get caption and reflection notes for Paper mode
  const captionNote = dayEntry.notes.find(n => n.type === "caption");
  const reflectionNote = dayEntry.notes.find(n => n.type === "reflection");
  const freeNotes = dayEntry.notes.filter(n => n.type === "free");

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: isStudio ? '#1a1a1a' : '#f4f4f4',
      color: isStudio ? '#fff' : '#333',
      transition: 'all 0.5s ease' 
    }}>
      {/* Top nav + template switcher */}
      <nav style={{ 
        padding: '20px 40px', 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: isStudio ? '1px solid #333' : '1px solid #ddd' 
      }}>
        <Link 
          href={`/month/${monthId}`} 
          style={{ 
            color: isStudio ? '#666' : '#999', 
            textDecoration: 'none', 
            fontSize: '11px',
            letterSpacing: '1px',
            textTransform: 'uppercase'
          }}
        >
          ← Month
        </Link>
        
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          background: isStudio ? '#2a2a2a' : '#e0e0e0', 
          padding: '4px', 
          borderRadius: '8px' 
        }}>
          <button 
            onClick={() => handleModeSwitch("studio")} 
            style={{ 
              padding: '6px 12px', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              fontSize: '11px', 
              background: isStudio ? '#444' : 'transparent', 
              color: isStudio ? '#fff' : '#666' 
            }}
          >
            STUDIO MODE
          </button>
          <button 
            onClick={() => handleModeSwitch("paper")} 
            style={{ 
              padding: '6px 12px', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              fontSize: '11px', 
              background: !isStudio ? '#fff' : 'transparent', 
              color: !isStudio ? '#000' : '#666', 
              boxShadow: !isStudio ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' 
            }}
          >
            PAPER MODE
          </button>
        </div>
      </nav>

      <main style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        padding: '60px 20px' 
      }}>
        {/* Image container wrapper */}
        <div style={{ 
          display: 'flex', 
          gap: 24, 
          width: '100%', 
          maxWidth: showImageAdjust ? '1200px' : '900px',
          justifyContent: 'center',
          transition: 'max-width 0.3s ease'
        }}>
          {/* Image container */}
          <div 
            onClick={() => !dayEntry.media?.url && fileInputRef.current?.click()}
            style={{ 
              width: showImageAdjust ? 'calc(100% - 280px)' : '100%', 
              maxWidth: '900px', 
              aspectRatio: '16/9',
              backgroundColor: isStudio ? '#222' : '#fff',
              padding: isStudio ? '0' : '20px',
              boxShadow: isStudio ? 'none' : '0 20px 40px rgba(0,0,0,0.05)',
              border: isStudio ? `1px dashed #444` : '1px solid #eee',
              cursor: dayEntry.media?.url ? 'default' : 'pointer',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              overflow: 'hidden',
              position: 'relative',
              transition: 'width 0.3s ease'
            }}
          >
          {dayEntry.media?.url ? (
            <>
              <img 
                src={dayEntry.media.url} 
                alt="Day media"
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain',
                  objectPosition: showImageAdjust ? `${imagePosition.x}% ${imagePosition.y}%` : 'center',
                  transform: showImageAdjust ? `scale(${imageScale})` : 'none',
                  transformOrigin: `${imagePosition.x}% ${imagePosition.y}%`,
                  transition: showImageAdjust ? 'none' : 'all 0.3s ease'
                }} 
              />
              
              {/* Adjust button */}
              {isStudio && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (showImageAdjust) {
                      // Save adjustments when done
                      saveImageAdjustments();
                    }
                    setShowImageAdjust(!showImageAdjust);
                  }}
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    padding: '8px 14px',
                    fontSize: 11,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    background: showImageAdjust ? '#444' : 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    border: showImageAdjust ? '1px solid #666' : '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 4,
                    cursor: 'pointer',
                    backdropFilter: 'blur(8px)',
                    zIndex: 10,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {showImageAdjust ? '✓ Save' : 'Adjust'}
                </button>
              )}
              
              {!isStudio && captionNote && (
                <div style={{
                  position: 'absolute',
                  bottom: 20,
                  left: 20,
                  right: 20,
                  background: 'rgba(255,255,255,0.9)',
                  padding: '12px 16px',
                  borderRadius: 8,
                  fontSize: 13,
                  color: '#333',
                  lineHeight: 1.5
                }}>
                  {captionNote.text}
                </div>
              )}
            </>
          ) : (
            <span style={{ 
              fontSize: '12px', 
              letterSpacing: '2px', 
              opacity: 0.3 
            }}>
              {isStudio ? '+ LOAD RAW' : '+ CHOOSE PHOTO'}
            </span>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            hidden 
            accept="image/*"
            onChange={handleImageUpload} 
          />
        </div>

        {/* Adjustment controls - vertical sidebar */}
        {showImageAdjust && isStudio && dayEntry.media?.url && (
          <div style={{
            width: 160,
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(10px)',
            padding: '16px 12px',
            borderRadius: 6,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 2px 16px rgba(0,0,0,0.4)'
          }}>
            <div>
              <div style={{ fontSize: 9, color: '#888', marginBottom: 4, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                Scale
              </div>
              <div style={{ fontSize: 16, color: '#fff', marginBottom: 8, fontWeight: 500, fontFeatureSettings: '"tnum"' }}>
                {imageScale.toFixed(2)}×
              </div>
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.05}
                value={imageScale}
                onChange={(e) => setImageScale(parseFloat(e.target.value))}
                style={{ width: '100%', cursor: 'pointer', accentColor: '#666' }}
              />
            </div>
            
            <div>
              <div style={{ fontSize: 9, color: '#888', marginBottom: 4, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                Position X
              </div>
              <div style={{ fontSize: 16, color: '#fff', marginBottom: 8, fontWeight: 500, fontFeatureSettings: '"tnum"' }}>
                {imagePosition.x}%
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={imagePosition.x}
                onChange={(e) => setImagePosition(prev => ({ ...prev, x: parseInt(e.target.value) }))}
                style={{ width: '100%', cursor: 'pointer', accentColor: '#666' }}
              />
            </div>
            
            <div>
              <div style={{ fontSize: 9, color: '#888', marginBottom: 4, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                Position Y
              </div>
              <div style={{ fontSize: 16, color: '#fff', marginBottom: 8, fontWeight: 500, fontFeatureSettings: '"tnum"' }}>
                {imagePosition.y}%
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={imagePosition.y}
                onChange={(e) => setImagePosition(prev => ({ ...prev, y: parseInt(e.target.value) }))}
                style={{ width: '100%', cursor: 'pointer', accentColor: '#666' }}
              />
            </div>
            
            <button
              onClick={() => {
                setImageScale(1);
                setImagePosition({ x: 50, y: 50 });
              }}
              style={{
                marginTop: 4,
                padding: '8px 12px',
                fontSize: 11,
                letterSpacing: 0.5,
                background: '#222',
                color: '#999',
                border: '1px solid #444',
                borderRadius: 4,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#333';
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.borderColor = '#555';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#222';
                e.currentTarget.style.color = '#999';
                e.currentTarget.style.borderColor = '#444';
              }}
            >
              Reset
            </button>
          </div>
        )}
        </div>

        {/* Day info + content */}
        <div style={{ 
          marginTop: '40px', 
          textAlign: 'center', 
          width: '100%', 
          maxWidth: 900 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, position: 'relative' }}>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: 700, 
              margin: 0 
            }}>
              DAY · {new Date(dayId).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </h2>
            {isStudio && (
              <span style={{
                fontSize: 11,
                color: isStudio ? '#666' : '#999',
                letterSpacing: 1,
                textTransform: 'uppercase'
              }}>
                · {lifecycleLabel}
              </span>
            )}
            
            {/* Gesture sketch signature */}
            {showGesture && (
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                style={{
                  position: 'absolute',
                  right: -40,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  opacity: 0.4
                }}
              >
                <path
                  d={isStudio 
                    ? "M8,16 Q12,8 16,12 T24,16 Q20,24 16,20 T8,16" 
                    : "M6,10 L12,22 M12,22 L18,10 M18,10 L24,22"
                  }
                  fill="none"
                  stroke={isStudio ? '#666' : '#333'}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    strokeDasharray: 100,
                    strokeDashoffset: 100,
                    animation: 'drawStroke 900ms ease-out forwards'
                  }}
                />
              </svg>
            )}
          </div>
          <p style={{ 
            fontSize: 11, 
            color: isStudio ? '#666' : '#999', 
            marginTop: 4 
          }}>
            PROJECT UNFILLED / 2026
          </p>

          <div style={{ 
            marginTop: 28, 
            display: 'grid', 
            gridTemplateColumns: '1fr 320px', 
            gap: 24, 
            alignItems: 'start',
            textAlign: 'left'
          }}>
            {/* Notes area */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: 8, 
                fontSize: 12, 
                color: isStudio ? '#ccc' : '#666' 
              }}>
                Notes
              </label>
              
              {isStudio ? (
                <>
                  <textarea
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    onBlur={handleNoteBlur}
                    placeholder="Write a note or caption for this day..."
                    style={{ 
                      width: '100%', 
                      minHeight: 180, 
                      padding: 12, 
                      borderRadius: 6, 
                      border: '1px solid #333',
                      background: '#111',
                      color: '#fff',
                      resize: 'vertical', 
                      fontSize: 14,
                      fontFamily: 'inherit'
                    }}
                  />
                  <div style={{ 
                    marginTop: 8, 
                    display: 'flex', 
                    gap: 8, 
                    fontSize: 11 
                  }}>
                    <button
                      onClick={() => saveNoteAs("caption")}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 4,
                        border: '1px solid #333',
                        background: 'transparent',
                        color: '#999',
                        cursor: 'pointer',
                        fontSize: 11
                      }}
                    >
                      Save as Caption
                    </button>
                    <button
                      onClick={() => saveNoteAs("reflection")}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 4,
                        border: '1px solid #333',
                        background: 'transparent',
                        color: '#999',
                        cursor: 'pointer',
                        fontSize: 11
                      }}
                    >
                      Save as Reflection
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ 
                  minHeight: 180, 
                  padding: 12, 
                  borderRadius: 6, 
                  border: '1px solid #e6e6e6',
                  background: '#fff',
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: '#333'
                }}>
                  {freeNotes.length > 0 ? (
                    freeNotes.map(note => (
                      <p key={note.id} style={{ margin: '0 0 12px 0' }}>
                        {note.text}
                      </p>
                    ))
                  ) : (
                    <span style={{ color: '#999', fontSize: 13 }}>
                      No notes yet
                    </span>
                  )}
                </div>
              )}

              {/* Reflection in Paper mode */}
              {!isStudio && reflectionNote && (
                <div style={{
                  marginTop: 16,
                  padding: 16,
                  borderLeft: '3px solid #ddd',
                  background: '#fafafa',
                  fontSize: 13,
                  lineHeight: 1.6,
                  fontStyle: 'italic',
                  color: '#666'
                }}>
                  {reflectionNote.text}
                </div>
              )}
            </div>

            {/* Tasks + Export column */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: 8, 
                fontSize: 12, 
                color: isStudio ? '#ccc' : '#666' 
              }}>
                To‑do
              </label>
              
              {isStudio && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    value={taskDraft}
                    onChange={(e) => setTaskDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addTask();
                    }}
                    placeholder="Add a task and press Enter"
                    style={{ 
                      flex: 1, 
                      padding: '8px 10px', 
                      borderRadius: 6, 
                      border: '1px solid #333',
                      background: '#111',
                      color: '#fff'
                    }}
                  />
                  <button 
                    onClick={addTask} 
                    style={{ 
                      padding: '8px 10px', 
                      borderRadius: 6,
                      border: '1px solid #333',
                      background: '#222',
                      color: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    Add
                  </button>
                </div>
              )}

              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 8, 
                maxHeight: 260, 
                overflow: 'auto', 
                paddingRight: 8 
              }}>
                {dayEntry.tasks.length === 0 ? (
                  <div style={{ 
                    fontSize: 13, 
                    color: '#999' 
                  }}>
                    No tasks yet
                  </div>
                ) : (
                  dayEntry.tasks.map((t) => (
                    <div 
                      key={t.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8 
                      }}
                    >
                      {isStudio ? (
                        <button
                          onClick={() => toggleTaskStatus(t.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            fontSize: 16,
                            cursor: 'pointer',
                            color: t.status === 'done' ? '#4a4' : t.status === 'skipped' ? '#999' : '#fff',
                            padding: 0,
                            width: 24,
                            height: 24,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title={`Status: ${t.status}`}
                        >
                          {getTaskStatusGlyph(t.status)}
                        </button>
                      ) : (
                        <span style={{ 
                          fontSize: 16, 
                          color: t.status === 'done' ? '#4a4' : t.status === 'skipped' ? '#999' : '#333',
                          width: 24,
                          display: 'inline-block',
                          textAlign: 'center'
                        }}>
                          {getTaskStatusGlyph(t.status)}
                        </span>
                      )}
                      <div 
                        style={{ 
                          flex: 1, 
                          textDecoration: t.status === 'done' ? 'line-through' : 
                                         t.status === 'skipped' ? 'line-through' : 'none',
                          opacity: t.status === 'skipped' ? 0.5 : 1,
                          fontSize: 14,
                          color: isStudio ? '#fff' : '#333'
                        }}
                      >
                        {t.text}
                      </div>
                      {isStudio && (
                        <button 
                          onClick={() => removeTask(t.id)} 
                          style={{ 
                            background: 'transparent', 
                            border: 'none', 
                            color: '#c00', 
                            cursor: 'pointer',
                            fontSize: 18,
                            padding: 0,
                            width: 24,
                            height: 24
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Font selection */}
              <div style={{ 
                marginTop: 18,
                marginBottom: 12
              }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 8, 
                  fontSize: 11, 
                  color: isStudio ? '#999' : '#666',
                  letterSpacing: 0.5,
                  textTransform: 'uppercase'
                }}>
                  Wallpaper Font
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['serif', 'sans-serif', 'monospace', 'Georgia', 'Courier New'].map(font => (
                    <button
                      key={font}
                      onClick={() => setSelectedFont(font)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 4,
                        border: selectedFont === font 
                          ? (isStudio ? '1px solid #555' : '1px solid #333')
                          : (isStudio ? '1px solid #333' : '1px solid #ddd'),
                        background: selectedFont === font
                          ? (isStudio ? '#2a2a2a' : '#f0f0f0')
                          : 'transparent',
                        color: isStudio ? '#ccc' : '#666',
                        cursor: 'pointer',
                        fontSize: 11,
                        fontFamily: font,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {font === 'sans-serif' ? 'Sans' : 
                       font === 'serif' ? 'Serif' : 
                       font === 'monospace' ? 'Mono' :
                       font}
                    </button>
                  ))}
                </div>
              </div>

              {isStudio && (
                <button 
                  onClick={resetDay} 
                  style={{ 
                    marginTop: 18,
                    padding: '10px 14px', 
                    borderRadius: 6,
                    background: '#2a2a2a',
                    border: '1px solid #444',
                    color: '#999',
                    cursor: 'pointer',
                    fontSize: 12,
                    width: '100%'
                  }}
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Export buttons - fixed bottom right */}
      <div style={{
        position: 'fixed',
        bottom: 32,
        right: 32,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        zIndex: 100
      }}>
        <button 
          onClick={previewWallpaper} 
          style={{ 
            padding: '12px 20px', 
            borderRadius: 8,
            border: isStudio ? '1px solid #444' : '1px solid #ddd',
            background: isStudio ? '#2a2a2a' : '#fff',
            color: isStudio ? '#ddd' : '#666',
            cursor: 'pointer',
            fontSize: 11,
            letterSpacing: 1,
            textTransform: 'uppercase',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          }}
        >
          Preview
        </button>
        <button 
          onClick={() => setShowExportModal(true)} 
          style={{ 
            padding: '12px 20px', 
            borderRadius: 8,
            border: isStudio ? '1px solid #555' : '1px solid #333',
            background: isStudio ? '#444' : '#333',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 11,
            letterSpacing: 1,
            textTransform: 'uppercase',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
          }}
        >
          Export
        </button>
      </div>

      {/* Preview modal */}
      {previewUrl && (
        <div
          onClick={() => setPreviewUrl(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#fafafa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            cursor: 'pointer',
            padding: 0
          }}
        >
          <img 
            src={previewUrl} 
            alt="Wallpaper preview" 
            style={{ 
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain'
            }} 
          />
          <div style={{
            position: 'absolute',
            top: 20,
            right: 20,
            fontSize: 11,
            color: '#999',
            letterSpacing: 1,
            background: 'rgba(255,255,255,0.9)',
            padding: '8px 12px',
            borderRadius: 4
          }}>
            CLICK TO CLOSE
          </div>
        </div>
      )}

      {/* Sticky note for tasks */}
      <DayStickyNote
        tasks={dayEntry.tasks}
        onToggleTask={toggleTaskStatus}
        isStudio={isStudio}
      />

      {/* Export modal */}
      {showExportModal && (
        <DayExportModal
          dayId={dayId}
          onClose={() => setShowExportModal(false)}
          onGenerateCanvas={generateWallpaperCanvas}
        />
      )}
    </div>
  );
}
