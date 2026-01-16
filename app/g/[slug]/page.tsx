import { getGalleryShareBySlug } from "../../../lib/gallery/galleryShareUtils";
import { getSupabaseClient } from "../../../lib/supabase/client";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PublicGalleryPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = getSupabaseClient();

  // If Supabase not configured, show message
  if (!supabase) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fafafa",
          padding: "20px",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <h1
            style={{
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "#333",
              marginBottom: 16,
            }}
          >
            Gallery Sharing Unavailable
          </h1>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: "#666" }}>
            Gallery sharing is not configured yet.
          </p>
        </div>
      </div>
    );
  }

  // Get gallery share metadata
  const galleryShare = await getGalleryShareBySlug(slug);

  if (!galleryShare) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fafafa",
          padding: "20px",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <h1
            style={{
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "#333",
              marginBottom: 16,
            }}
          >
            Gallery Not Found
          </h1>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: "#666" }}>
            This gallery link is not available.
          </p>
        </div>
      </div>
    );
  }

  // Fetch gallery posts from Supabase
  const { data: posts, error } = await supabase
    .from("gallery_posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    console.error("Failed to fetch gallery posts:", error);
  }

  const galleryPosts = posts || [];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#fff",
        padding: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "40px 60px",
          borderBottom: "1px solid #eee",
        }}
      >
        <h1
          style={{
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "#333",
            margin: "0 0 8px 0",
          }}
        >
          {galleryShare.title}
        </h1>
        {galleryShare.description && (
          <p
            style={{
              fontSize: 12,
              lineHeight: 1.6,
              color: "#999",
              margin: 0,
            }}
          >
            {galleryShare.description}
          </p>
        )}
      </div>

      {/* Gallery Grid */}
      {galleryPosts.length === 0 ? (
        <div
          style={{
            padding: "100px 60px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: 12,
              color: "#ccc",
              letterSpacing: 1,
            }}
          >
            NO IMAGES PUBLISHED YET
          </p>
        </div>
      ) : (
        <div
          style={{
            padding: "60px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 40,
          }}
        >
          {galleryPosts.map((post) => (
            <div
              key={post.id}
              style={{
                position: "relative",
              }}
              className="public-gallery-item"
            >
              <div
                style={{
                  aspectRatio: "4/5",
                  backgroundColor: "#fafafa",
                  overflow: "hidden",
                  cursor: "pointer",
                }}
              >
                <img
                  src={post.image_url}
                  alt={post.caption || ""}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transition: "transform 0.3s ease",
                  }}
                />
              </div>
              {post.caption && (
                <p
                  style={{
                    marginTop: 12,
                    fontSize: 11,
                    lineHeight: 1.6,
                    color: "#666",
                    letterSpacing: 0.3,
                  }}
                >
                  {post.caption}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          padding: "40px 60px",
          borderTop: "1px solid #eee",
          textAlign: "center",
        }}
      >
        {galleryPosts.length > 0 && (
          <p
            style={{
              margin: 0,
              fontSize: 10,
              color: "#ccc",
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            {galleryPosts.length} {galleryPosts.length === 1 ? "Image" : "Images"}
          </p>
        )}
      </div>
    </div>
  );
}
