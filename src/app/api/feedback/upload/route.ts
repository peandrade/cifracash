import { NextResponse } from "next/server";
import { withAuth, errorResponse } from "@/lib/api-utils";
import {
  checkRateLimit,
  getClientIp,
  rateLimitHeaders,
} from "@/lib/rate-limit";
import { createServerSupabase, getPublicUrl, STORAGE_BUCKETS } from "@/lib/supabase";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

/**
 * POST /api/feedback/upload
 *
 * Upload an image attachment for feedback.
 * Rate limited to 10 uploads per minute.
 */
export async function POST(request: Request) {
  // Rate limiting - 10 uploads per minute
  const clientIp = getClientIp(request);
  const rateLimitResult = checkRateLimit(clientIp, {
    limit: 10,
    windowSeconds: 60,
    identifier: "feedback-upload",
  });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Muitas requisições. Aguarde um momento.", code: "RATE_LIMITED" },
      { status: 429, headers: rateLimitHeaders(rateLimitResult) }
    );
  }

  return withAuth(async (session, req) => {
    try {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return errorResponse("Nenhum arquivo enviado", 400, "VALIDATION_ERROR");
      }

      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        return errorResponse(
          "Tipo de arquivo não permitido. Use JPG, PNG, GIF ou WebP.",
          400,
          "VALIDATION_ERROR"
        );
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return errorResponse(
          "Arquivo muito grande. O tamanho máximo é 5MB.",
          400,
          "VALIDATION_ERROR"
        );
      }

      // Generate unique filename
      const ext = file.name.split(".").pop() || "jpg";
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const filename = `${session.user.id}/${timestamp}-${randomId}.${ext}`;

      // Upload to Supabase Storage
      const supabase = createServerSupabase();
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.FEEDBACK_ATTACHMENTS)
        .upload(filename, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        return errorResponse(
          "Erro ao fazer upload do arquivo. Tente novamente.",
          500,
          "INTERNAL_ERROR"
        );
      }

      // Get public URL
      const url = getPublicUrl(STORAGE_BUCKETS.FEEDBACK_ATTACHMENTS, filename);

      return NextResponse.json({ url }, { status: 201 });
    } catch (error) {
      console.error("Upload error:", error);
      return errorResponse("Erro ao processar upload", 500, "INTERNAL_ERROR");
    }
  }, request);
}
