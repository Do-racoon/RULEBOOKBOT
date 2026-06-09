import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { chunkRulebookText } from "@/lib/rulebook-processing";

export const runtime = "nodejs";

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase 관리자 환경 변수가 설정되지 않았습니다.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false
    }
  });
}

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient();

    const { data: rulebooks, error } = await supabase
      .from("rulebooks")
      .select(
        `
        id,
        board_game_id,
        source_type,
        source_url,
        file_name,
        language_code,
        version_label,
        ingestion_status,
        raw_ocr_text,
        metadata,
        created_at,
        board_games (
          id,
          slug,
          title
        ),
        rulebook_chunks (
          id,
          chunk_index,
          content,
          token_count,
          page_number,
          created_at
        )
      `
      )
      .order("created_at", { ascending: false })
      .order("chunk_index", { referencedTable: "rulebook_chunks", ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ rulebooks: rulebooks ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "룰북 목록을 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      rulebookId?: string;
      action?: "save_text" | "generate_chunks" | "approve" | "mark_failed";
      rawOcrText?: string;
      failureReason?: string;
    };

    if (!body.rulebookId || !body.action) {
      return NextResponse.json({ error: "rulebookId와 action은 필수입니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    const { data: rulebook, error: rulebookError } = await supabase
      .from("rulebooks")
      .select("id, raw_ocr_text, metadata")
      .eq("id", body.rulebookId)
      .single();

    if (rulebookError) {
      return NextResponse.json({ error: rulebookError.message }, { status: 500 });
    }

    const previousMetadata = (rulebook.metadata as Record<string, unknown> | null) ?? {};

    if (body.action === "save_text") {
      const { data, error } = await supabase
        .from("rulebooks")
        .update({
          raw_ocr_text: body.rawOcrText ?? "",
          ingestion_status: "queued",
          metadata: {
            ...previousMetadata,
            reviewStatus: "text_saved",
            reviewedAt: null
          }
        })
        .eq("id", body.rulebookId)
        .select("id")
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ rulebook: data });
    }

    if (body.action === "generate_chunks") {
      const rawText = body.rawOcrText ?? rulebook.raw_ocr_text ?? "";
      const chunks = chunkRulebookText(rawText);

      if (chunks.length === 0) {
        return NextResponse.json({ error: "청크를 만들 OCR 텍스트가 없습니다." }, { status: 400 });
      }

      const { error: deleteError } = await supabase.from("rulebook_chunks").delete().eq("rulebook_id", body.rulebookId);

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }

      const { error: insertError } = await supabase.from("rulebook_chunks").insert(
        chunks.map((chunk) => ({
          rulebook_id: body.rulebookId,
          chunk_index: chunk.chunkIndex,
          content: chunk.content,
          token_count: chunk.tokenCount,
          page_number: chunk.pageNumber,
          metadata: {
            reviewStatus: "pending"
          }
        }))
      );

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      const { data, error: updateError } = await supabase
        .from("rulebooks")
        .update({
          raw_ocr_text: rawText,
          ingestion_status: "queued",
          metadata: {
            ...previousMetadata,
            reviewStatus: "chunks_ready",
            chunkCount: chunks.length,
            chunkedAt: new Date().toISOString(),
            reviewedAt: null
          }
        })
        .eq("id", body.rulebookId)
        .select("id")
        .single();

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ rulebook: data, chunkCount: chunks.length });
    }

    if (body.action === "approve") {
      const { data, error } = await supabase
        .from("rulebooks")
        .update({
          ingestion_status: "ready",
          metadata: {
            ...previousMetadata,
            reviewStatus: "approved",
            reviewedAt: new Date().toISOString()
          }
        })
        .eq("id", body.rulebookId)
        .select("id")
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ rulebook: data });
    }

    const { data, error } = await supabase
      .from("rulebooks")
      .update({
        ingestion_status: "failed",
        metadata: {
          ...previousMetadata,
          reviewStatus: "failed",
          failureReason: body.failureReason ?? "수동 검증 실패",
          reviewedAt: new Date().toISOString()
        }
      })
      .eq("id", body.rulebookId)
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ rulebook: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "룰북 검증 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
