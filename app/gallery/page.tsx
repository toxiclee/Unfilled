"use client";

import React, { useEffect, useState, useRef } from "react";
import { isSupabaseConfigured, getSupabaseClient } from "../../lib/supabase/client";
import { uploadImageToSupabase, deleteImageFromSupabase } from "../../lib/gallery/uploadToSupabase";
import {
  getOrCreateDefaultGalleryShare,
  updateGalleryShareSlug,
  buildGalleryShareUrl,
  type GalleryShare,
} from "../../lib/gallery/galleryShareUtils";
import { validateSlug } from "../../lib/gallery/gallerySlugGenerator";

interface GalleryPost {
  id: string;
  image_url: string;
  caption: string | null;
  visibility: string;
  created_at: string;
}

export default function GalleryPage() {
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [galleryShare, setGalleryShare] = useState<GalleryShare | null>(null);
  const [loadingShare, setLoadingShare] = useState(false);
  const [editingSlug, setEditingSlug] = useState(false);
  const [newSlug, setNewSlug] = useState("");
  const [slugError, setSlugError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load posts on mount
  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    setLoading(true);
    try {
      if (!isSupabaseConfigured()) {
        console.error("Supabase not configured");
        return;
      }

      const supabase = getSupabaseClient();
      if (!supabase) {
        console.error("Failed to get Supabase client");
        return;
      }

      const { data, error } = await supabase
        .from("gallery_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading posts:", error);
        return;
      }

      setPosts(data || []);
    } catch (err) {
      console.error("Failed to load posts:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploads = Array.from(files).filter((f) => f.type.startsWith("image/"));

      for (const file of uploads) {
        const result = await uploadImageToSupabase(file);
        if (!result.success) {
          console.error("Upload failed:", result.error);
          alert(`Failed to upload ${file.name}: ${result.error}`);
        }
      }

      // Reload gallery
      await loadPosts();
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed. Check console for details.");
    } finally {
      setUploading(false);
    }
  }

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }

  function handleCopyGalleryLink() {
    if (!galleryShare) return;
    const url = buildGalleryShareUrl(galleryShare.slug, window.location.origin);
    navigator.clipboard.writeText(url).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  }

  function handleOpenGalleryPreview() {
    if (!galleryShare) return;
    const url = buildGalleryShareUrl(galleryShare.slug, window.location.origin);
    window.open(url, "_blank");
  }

  async function loadGalleryShare() {
    if (!isSupabaseConfigured()) return;

    setLoadingShare(true);
    try {
      const share = await getOrCreateDefaultGalleryShare();
      setGalleryShare(share);
      if (share) {
        setNewSlug(share.slug);
      }
    } catch (err) {
      console.error("Failed to load gallery share:", err);
    } finally {
      setLoadingShare(false);
    }
  }

  async function handleSaveSlug() {
    if (!galleryShare || !newSlug.trim()) return;

    // Validate
    const validation = validateSlug(newSlug.trim());
    if (validation.ok === false) {
      setSlugError(validation.error);
      return;
    }

    setLoadingShare(true);
    setSlugError("");

    try {
      const result = await updateGalleryShareSlug(galleryShare.id, validation.normalized);
      if (result.success && result.share) {
        setGalleryShare(result.share);
        setEditingSlug(false);
      } else {
        setSlugError(result.error || "Failed to update slug");
      }
    } catch (err) {
      console.error("Failed to update slug:", err);
      setSlugError("An error occurred");
    } finally {
      setLoadingShare(false);
    }
  }

  function handleExportClick() {
    setShowExportModal(true);
    loadGalleryShare();
  }

  async function handleDelete(postId: string, imageUrl: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Delete this image?")) return;

    try {
      const result = await deleteImageFromSupabase(postId, imageUrl);
      if (!result.success) {
        console.error("Delete failed:", result.error);
        alert(`Failed to delete: ${result.error}`);
        return;
      }

      await loadPosts();
    } catch (err) {
      console.error("Failed to delete:", err);
      alert("Failed to delete image");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#fafafa",
        padding: "40px 20px",
      }}
    >
      {/* Header */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <a
          href="/"
          style={{
            fontSize: 11,
            letterSpacing: 1,
            textDecoration: "none",
            color: "#999",
          }}
        >
          ← HOME
        </a>
        <h1
          style={{
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "#333",
            margin: 0,
          }}
        >
          Gallery
        </h1>
        <button
          onClick={handleExportClick}
          style={{
            fontSize: 11,
            letterSpacing: 1,
            textTransform: "uppercase",
            background: "transparent",
            border: "none",
            color: "#666",
            cursor: "pointer",
            padding: "4px 8px",
            fontWeight: 500,
          }}
        >
          Export
        </button>
      </div>

      {/* Upload area */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto 60px",
        }}
      >
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: dragActive ? "2px dashed #333" : "2px dashed #ddd",
            borderRadius: 8,
            padding: "60px 20px",
            textAlign: "center",
            cursor: "pointer",
            transition: "all 0.2s ease",
            backgroundColor: dragActive ? "#f0f0f0" : "#fff",
          }}
        >
          <div
            style={{
              fontSize: 12,
              letterSpacing: 1,
              color: uploading ? "#999" : "#666",
              textTransform: "uppercase",
            }}
          >
            {uploading ? "Uploading..." : dragActive ? "Drop images here" : "+ Upload Images"}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "#999",
              marginTop: 8,
            }}
          >
            Click or drag and drop
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      </div>

      {/* Gallery grid */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        {loading ? (
          <div
            style={{
              textAlign: "center",
              fontSize: 12,
              color: "#999",
              padding: "60px 0",
            }}
          >
            Loading...
          </div>
        ) : posts.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              fontSize: 12,
              color: "#ccc",
              marginTop: 60,
              letterSpacing: 1,
            }}
          >
            Your gallery begins here.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 20,
            }}
          >
            {posts.map((post) => (
              <div
                key={post.id}
                style={{
                  position: "relative",
                }}
                className="gallery-item"
              >
                <div
                  style={{
                    aspectRatio: "1/1",
                    backgroundColor: "#f0f0f0",
                    borderRadius: 4,
                    overflow: "hidden",
                    cursor: "pointer",
                  }}
                >
                  <img
                    src={post.image_url}
                    alt={post.caption || "Gallery image"}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "transform 0.2s ease",
                    }}
                  />
                </div>
                {post.caption && (
                  <p
                    style={{
                      fontSize: 12,
                      color: "#666",
                      marginTop: 8,
                      lineHeight: 1.4,
                    }}
                  >
                    {post.caption}
                  </p>
                )}
                <button
                  onClick={(e) => handleDelete(post.id, post.image_url, e)}
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    background: "rgba(0, 0, 0, 0.6)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 3,
                    width: 20,
                    height: 20,
                    cursor: "pointer",
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "opacity 0.2s ease",
                  }}
                  className="delete-button"
                  title="Delete"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export modal */}
      {showExportModal && (
        <div
          onClick={() => {
            setShowExportModal(false);
            setCopySuccess(false);
          }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 8,
              padding: "40px",
              maxWidth: 400,
              width: "90%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              position: "relative",
            }}
          >
            <button
              onClick={() => {
                setShowExportModal(false);
                setCopySuccess(false);
              }}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "transparent",
                border: "none",
                fontSize: 20,
                color: "#999",
                cursor: "pointer",
                padding: 0,
                lineHeight: 1,
              }}
            >
              &times;
            </button>

            <h3
              style={{
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: 1,
                textTransform: "uppercase",
                margin: "0 0 16px 0",
                color: "#333",
              }}
            >
              Share Gallery
            </h3>

            {!isSupabaseConfigured() ? (
              <div>
                <p
                  style={{
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: "#666",
                    margin: "0 0 16px 0",
                  }}
                >
                  Gallery sharing is not configured yet.
                </p>
                <p
                  style={{
                    fontSize: 12,
                    lineHeight: 1.6,
                    color: "#999",
                    margin: 0,
                  }}
                >
                  Configure Supabase environment variables to enable sharing.
                </p>
              </div>
            ) : loadingShare ? (
              <p style={{ fontSize: 13, color: "#666", textAlign: "center" }}>Loading...</p>
            ) : !galleryShare ? (
              <p style={{ fontSize: 13, color: "#999", textAlign: "center" }}>
                Failed to load gallery share link.
              </p>
            ) : (
              <div>
                <p
                  style={{
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: "#666",
                    margin: "0 0 24px 0",
                  }}
                >
                  Share your entire gallery ({posts.length} {posts.length === 1 ? "image" : "images"}) with a beautiful
                  link.
                </p>

                {/* Share URL display */}
                <div
                  style={{
                    padding: "12px 16px",
                    backgroundColor: "#f5f5f5",
                    borderRadius: 4,
                    marginBottom: 16,
                    fontSize: 12,
                    fontFamily: "monospace",
                    color: "#666",
                    wordBreak: "break-all",
                  }}
                >
                  {buildGalleryShareUrl(
                    galleryShare.slug,
                    typeof window !== "undefined" ? window.location.origin : ""
                  )}
                </div>

                {/* Slug editor */}
                {editingSlug ? (
                  <div style={{ marginBottom: 16 }}>
                    <input
                      type="text"
                      value={newSlug}
                      onChange={(e) => {
                        setNewSlug(e.target.value);
                        setSlugError("");
                      }}
                      placeholder="Enter custom slug"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        fontSize: 13,
                        border: slugError ? "1px solid #d44" : "1px solid #ddd",
                        borderRadius: 4,
                        marginBottom: 8,
                        fontFamily: "monospace",
                      }}
                    />
                    {slugError && (
                      <p style={{ fontSize: 11, color: "#d44", margin: "0 0 8px 0" }}>{slugError}</p>
                    )}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={handleSaveSlug}
                        disabled={loadingShare}
                        style={{
                          flex: 1,
                          padding: "10px 16px",
                          fontSize: 11,
                          letterSpacing: 0.5,
                          border: "1px solid #333",
                          borderRadius: 4,
                          background: "#333",
                          color: "#fff",
                          cursor: loadingShare ? "not-allowed" : "pointer",
                          opacity: loadingShare ? 0.6 : 1,
                        }}
                      >
                        {loadingShare ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => {
                          setEditingSlug(false);
                          setNewSlug(galleryShare.slug);
                          setSlugError("");
                        }}
                        disabled={loadingShare}
                        style={{
                          flex: 1,
                          padding: "10px 16px",
                          fontSize: 11,
                          letterSpacing: 0.5,
                          border: "1px solid #ddd",
                          borderRadius: 4,
                          background: "#fff",
                          color: "#333",
                          cursor: loadingShare ? "not-allowed" : "pointer",
                          opacity: loadingShare ? 0.6 : 1,
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingSlug(true)}
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      fontSize: 11,
                      letterSpacing: 0.5,
                      border: "1px solid #ddd",
                      borderRadius: 4,
                      background: "#fff",
                      color: "#666",
                      cursor: "pointer",
                      marginBottom: 16,
                    }}
                  >
                    Edit ID
                  </button>
                )}

                {/* Action buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <button
                    onClick={handleCopyGalleryLink}
                    style={{
                      padding: "12px 20px",
                      fontSize: 12,
                      letterSpacing: 0.5,
                      border: "1px solid #ddd",
                      borderRadius: 4,
                      background: copySuccess ? "#4a4" : "#fff",
                      color: copySuccess ? "#fff" : "#333",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {copySuccess ? "Copied!" : "Copy Share Link"}
                  </button>
                  <button
                    onClick={handleOpenGalleryPreview}
                    style={{
                      padding: "12px 20px",
                      fontSize: 12,
                      letterSpacing: 0.5,
                      border: "1px solid #333",
                      borderRadius: 4,
                      background: "#333",
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    Open Gallery
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
