import { getSupabaseClient } from "../supabase/client";

const BUCKET = "gallery-images"; // TODO: 改成你的 bucket_id

export async function uploadImageToSupabase(file: File) {
  try {
    const supabase = getSupabaseClient();

    // 1) 必须登录
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // 2) 路径：userId/uuid.ext  (满足 storage RLS)
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const filePath = `${user.id}/${fileName}`;

    // 3) 上传 storage
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    // 4) 获取 public url（如果 bucket 是 public）
    const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    const imageUrl = publicUrlData.publicUrl;

    // 5) 写 DB（不传 user_id，让 trigger 写 auth.uid()）
    const { error: dbError } = await supabase.from("gallery_posts").insert({
      image_url: imageUrl,
      caption: null,
      visibility: "private",
    });

    if (dbError) {
      return { success: false, error: dbError.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("uploadImageToSupabase error:", err);
    return { success: false, error: err?.message ?? "Unknown error" };
  }
}

/**
 * 删除：先删 DB 行（RLS 会确保只能删自己的），再删 storage 文件
 * 注意：我们通过 imageUrl 解析出 storage path（假设 image_url 是 getPublicUrl 生成的）
 */
export async function deleteImageFromSupabase(postId: string, imageUrl: string) {
  try {
    const supabase = getSupabaseClient();

    // 1) 必须登录
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // 2) 先删 DB（更安全：如果 DB 删失败，不动 storage）
    const { error: dbError } = await supabase.from("gallery_posts").delete().eq("id", postId);

    if (dbError) {
      return { success: false, error: dbError.message };
    }

    // 3) 再删 storage 文件（从 public url 里解析出 path）
    // public url 通常长这样：
    // https://xxxx.supabase.co/storage/v1/object/public/<bucket>/<userId>/<file>
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const idx = imageUrl.indexOf(marker);
    if (idx === -1) {
      // 解析失败也不算致命：DB 已删，图片会“孤儿文件”
      // 你也可以选择 return fail，但那会导致 UI 显示删除失败（其实 DB 已删）
      console.warn("Could not parse storage path from imageUrl:", imageUrl);
      return { success: true };
    }

    const filePath = imageUrl.substring(idx + marker.length);

    // 4) storage remove（RLS 会确保只能删自己目录）
    const { error: storageError } = await supabase.storage.from(BUCKET).remove([filePath]);
    if (storageError) {
      // 同上：DB 已删，留孤儿文件
      console.warn("Storage remove failed:", storageError.message);
      return { success: true };
    }

    return { success: true };
  } catch (err: any) {
    console.error("deleteImageFromSupabase error:", err);
    return { success: false, error: err?.message ?? "Unknown error" };
  }
}
