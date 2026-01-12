"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { getPostWithAsset } from "../../../../lib/gallery/db";
import type { PostWithAsset } from "../../../../lib/gallery/types";

export default function PreviewPostPage() {
  const params = useParams();
  const postId = params.id as string;
  
  const [post, setPost] = useState<PostWithAsset | null>(null);
  const [loading, setLoading] = useState(true);
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
        imageURL.current = URL.createObjectURL(loaded.asset.blob);
      }
    } catch (err) {
      console.error("Failed to load post:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fff",
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
          backgroundColor: "#fff",
        }}
      >
        <div style={{ fontSize: 12, color: "#999" }}>Post not found</div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
      }}
    >
      {/* Image */}
      <div
        style={{
          maxWidth: "90vw",
          maxHeight: "80vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src={imageURL.current}
          alt={post.caption || "Gallery image"}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            width: "auto",
            height: "auto",
            display: "block",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          }}
        />
      </div>

      {/* Caption */}
      {post.caption && (
        <div
          style={{
            marginTop: 40,
            maxWidth: 600,
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.6,
              color: "#666",
              margin: 0,
            }}
          >
            {post.caption}
          </p>
        </div>
      )}
    </div>
  );
}
