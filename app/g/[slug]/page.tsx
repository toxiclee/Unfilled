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
        backgroundColor: "#fafafa",
        padding: "40px 20px",
      }}
    >
      {/* Header */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto 40px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "#333",
            margin: "0 0 12px 0",
          }}
        >
          {galleryShare.title}
        </h1>
        {galleryShare.description && (
          <p
            style={{
              fontSize: 13,
              lineHeight: 1.6,
              color: "#666",
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
            maxWidth: 1200,
            margin: "60px auto",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: 13,
              color: "#999",
              letterSpacing: 0.5,
            }}
          >
            No images published yet.
          </p>
        </div>
      ) : (
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {galleryPosts.map((post) => (
            <div
              key={post.id}
              style={{
                position: "relative",
                aspectRatio: "1",
                backgroundColor: "#fff",
                borderRadius: 4,
                overflow: "hidden",
                border: "1px solid #eee",
              }}
            >
              <img
                src={post.image_url}
                alt={post.caption || "Gallery image"}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              {post.caption && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "12px",
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.6), transparent)",
                    color: "#fff",
                    fontSize: 12,
                    lineHeight: 1.4,
                  }}
                >
                  {post.caption}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          maxWidth: 1200,
          margin: "60px auto 0",
          textAlign: "center",
          fontSize: 11,
          color: "#999",
          letterSpacing: 1,
        }}
      >
        {galleryPosts.length > 0 && (
          <p style={{ margin: 0 }}>
            {galleryPosts.length} {galleryPosts.length === 1 ? "image" : "images"}
          </p>
        )}
      </div>
    </div>
  );
}
