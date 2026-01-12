"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getPostWithAsset, updatePostCaption } from "../../../lib/gallery/db";
import type { PostWithAsset } from "../../../lib/gallery/types";

export default function PostPage() {
  const params = useParams();
  const postId = params.id as string;
  
  const [post, setPost] = useState<PostWithAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [caption, setCaption] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const imageURL = useRef<string | null>(null);

  useEffect(() => {
    loadPost();
    
    return () => {
      if (imageURL.current) {
        URL.revokeObjectURL(imageURL.current);
      }
    };
  }, [postId]);

  async function loadPost() {
    setLoading(true);
    try {
      const loaded = await getPostWithAsset(postId);
      if (loaded) {
        setPost(loaded);
        setCaption(loaded.caption);
        imageURL.current = URL.createObjectURL(loaded.asset.blob);
      }
    } catch (err) {
      console.error("Failed to load post:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveCaption() {
    if (!post) return;
    
    try {
      await updatePostCaption(postId, caption);
      setPost({ ...post, caption, updatedAt: new Date().toISOString() });
      setEditing(false);
    } catch (err) {
      console.error("Failed to save caption:", err);
      alert("Failed to save caption");
    }
  }

  function handleCopyLink() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  }

  function handleOpenPreview() {
    window.open(`/preview/p/${postId}`, '_blank');
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fafafa",
        }}
      >
        <div style={{ fontSize: 12, color: "#999" }}>Loading...</div>
      </div>
    );
  }

  if (!post || !imageURL.current) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fafafa",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div style={{ fontSize: 12, color: "#999" }}>Post not found</div>
        <Link
          href="/gallery"
          style={{
            fontSize: 11,
            letterSpacing: 1,
            textDecoration: "none",
            color: "#666",
          }}
        >
          ← Back to Gallery
        </Link>
      </div>
    );
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
          paddingTop: 20,
        }}
      >
        <Link
          href="/gallery"
          style={{
            fontSize: 11,
            letterSpacing: 1,
            textDecoration: "none",
            color: "#999",
          }}
        >
          ← Gallery
        </Link>
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

      {/* Image */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          backgroundColor: "#fff",
          borderRadius: 8,
          overflow: "hidden",
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        }}
      >
        <img
          src={imageURL.current}
          alt={post.caption || "Gallery image"}
          style={{
            width: "100%",
            height: "auto",
            display: "block",
          }}
        />
      </div>

      {/* Caption area */}
      <div
        style={{
          maxWidth: 1200,
          margin: "40px auto 0",
        }}
      >
        {editing ? (
          <div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption..."
              style={{
                width: "100%",
                minHeight: 100,
                padding: 12,
                fontSize: 14,
                fontFamily: "inherit",
                border: "1px solid #ddd",
                borderRadius: 4,
                resize: "vertical",
                lineHeight: 1.6,
              }}
            />
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <button
                onClick={handleSaveCaption}
                style={{
                  padding: "8px 16px",
                  fontSize: 12,
                  border: "1px solid #333",
                  borderRadius: 4,
                  background: "#333",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Save
              </button>
              <button
                onClick={() => {
                  setCaption(post.caption);
                  setEditing(false);
                }}
                style={{
                  padding: "8px 16px",
                  fontSize: 12,
                  border: "1px solid #ddd",
                  borderRadius: 4,
                  background: "transparent",
                  color: "#666",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            {post.caption ? (
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: "#333",
                  marginBottom: 12,
                }}
              >
                {post.caption}
              </p>
            ) : (
              <p
                style={{
                  fontSize: 13,
                  color: "#999",
                  fontStyle: "italic",
                  marginBottom: 12,
                }}
              >
                No caption
              </p>
            )}
            <button
              onClick={() => setEditing(true)}
              style={{
                fontSize: 11,
                letterSpacing: 1,
                textTransform: "uppercase",
                border: "none",
                background: "transparent",
                color: "#999",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Edit Caption
            </button>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div
        style={{
          maxWidth: 1200,
          margin: "40px auto 0",
          fontSize: 11,
          color: "#999",
          display: "flex",
          gap: 20,
        }}
      >
        <div>
          Uploaded: {new Date(post.createdAt).toLocaleDateString()}
        </div>
        {post.asset.width && post.asset.height && (
          <div>
            {post.asset.width} × {post.asset.height}
          </div>
        )}
      </div>
      {/* Export modal */}
      {showExportModal && (
        <div
          onClick={() => setShowExportModal(false)}
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
              onClick={() => setShowExportModal(false)}
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
              Export
            </h3>

            <p
              style={{
                fontSize: 13,
                lineHeight: 1.6,
                color: "#666",
                margin: "0 0 24px 0",
              }}
            >
              This is a local preview.
              <br />
              Public links will be available later.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button
                onClick={handleCopyLink}
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
                {copySuccess ? "Copied!" : "Copy Link"}
              </button>
              <button
                onClick={handleOpenPreview}
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
                Open Preview
              </button>
            </div>
          </div>
        </div>
      )}    </div>
  );
}
