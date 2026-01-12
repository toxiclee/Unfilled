"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { listPostsWithAssets, uploadImage, deletePost, deleteAsset } from "../../lib/gallery/db";
import type { PostWithAsset } from "../../lib/gallery/types";

export default function GalleryPage() {
  const [posts, setPosts] = useState<PostWithAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectURLs = useRef<string[]>([]);

  // Load posts on mount
  useEffect(() => {
    loadPosts();
  }, []);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      objectURLs.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  async function loadPosts() {
    setLoading(true);
    try {
      const loaded = await listPostsWithAssets(100);
      setPosts(loaded);
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
      const uploads = Array.from(files).filter((f) =>
        f.type.startsWith("image/")
      );

      for (const file of uploads) {
        await uploadImage(file);
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

  function getObjectURL(blob: Blob): string {
    const url = URL.createObjectURL(blob);
    objectURLs.current.push(url);
    return url;
  }

  function handleCopyGalleryLink() {
    const url = `${window.location.origin}/gallery`;
    navigator.clipboard.writeText(url).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  }

  function handleOpenGalleryPreview() {
    window.open('/preview/gallery', '_blank');
  }

  async function handleDelete(postId: string, assetId: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('Delete this image?')) return;
    
    try {
      await deletePost(postId);
      await deleteAsset(assetId);
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
        <Link
          href="/"
          style={{
            fontSize: 11,
            letterSpacing: 1,
            textDecoration: "none",
            color: "#999",
          }}
        >
          ← HOME
        </Link>
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
          onClick={() => setShowExportModal(true)}
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
            border: dragActive
              ? "2px dashed #333"
              : "2px dashed #ddd",
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
            {uploading
              ? "Uploading..."
              : dragActive
              ? "Drop images here"
              : "+ Upload Images"}
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
              >
                <Link
                  href={`/p/${post.id}`}
                  style={{
                    textDecoration: "none",
                    display: "block",
                  }}
                >
                  <div
                    style={{
                      aspectRatio: "1/1",
                      backgroundColor: "#f0f0f0",
                      borderRadius: 4,
                      overflow: "hidden",
                      cursor: "pointer",
                      transition: "transform 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(0.98)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    <img
                      src={getObjectURL(post.asset.blob)}
                      alt={post.caption || "Gallery image"}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
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
                </Link>
                <button
                  onClick={(e) => handleDelete(post.id, post.assetId, e)}
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
                    opacity: 0.7,
                    transition: "opacity 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "0.7";
                  }}
                  title="Delete"
                >
                  ×
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
              ×
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
              Export Gallery
            </h3>

            <p
              style={{
                fontSize: 13,
                lineHeight: 1.6,
                color: "#666",
                margin: "0 0 24px 0",
              }}
            >
              Share your entire gallery ({posts.length} {posts.length === 1 ? 'image' : 'images'}).
              <br />
              Public links will be available later.
            </p>

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
                {copySuccess ? "Copied!" : "Copy Gallery Link"}
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
        </div>
      )}
    </div>
  );
}