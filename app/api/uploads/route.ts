console.log("BLOB TOKEN EXISTS:", !!process.env.BLOB_READ_WRITE_TOKEN);
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      request,
      body,

      // 这个回调发生在“签发 client token 之前”
      onBeforeGenerateToken: async (pathname, clientPayload, multipart) => {
        // 你可以用 clientPayload 带上 dateKey / monthId / day 等信息做校验或落库
        // 也可以限制只能上传图片
        return {
          allowedContentTypes: ["image/*"],
          addRandomSuffix: true,
          // 你可以限制最大体积（字节）；这里给个很大的上限示例（比如 50MB）
          maximumSizeInBytes: 50 * 1024 * 1024,
          tokenPayload: JSON.stringify({
            pathname,
            clientPayload,
            multipart,
          }),
        };
      },

      // 上传完成后 Vercel 会回调到这里（用于你写数据库）
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // IMPORTANT:
        // 这里别做太重的事（也别依赖 localhost）。生产环境用来写 DB 很合适。
        // console.log("Upload completed:", blob.url, tokenPayload);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
