import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const BUCKET_ID = "rulebooks";

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

function slugifyFileName(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase() || "pdf";

  return `rulebook.${extension}`;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const gameSlug = String(formData.get("gameSlug") || "tichu");
    const versionLabel = String(formData.get("versionLabel") || "Tichu Korean PDF Rulebook");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "PDF 파일이 필요합니다." }, { status: 400 });
    }

    if (file.type && file.type !== "application/pdf") {
      return NextResponse.json({ error: "PDF 파일만 업로드할 수 있습니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    const { data: bucket } = await supabase.storage.getBucket(BUCKET_ID);

    if (!bucket) {
      const { error: bucketError } = await supabase.storage.createBucket(BUCKET_ID, {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024,
        allowedMimeTypes: ["application/pdf"]
      });

      if (bucketError) {
        return NextResponse.json({ error: bucketError.message }, { status: 500 });
      }
    }

    const { data: games, error: gameError } = await supabase
      .from("board_games")
      .select("id, slug, title")
      .eq("slug", gameSlug)
      .limit(1);

    if (gameError) {
      return NextResponse.json({ error: gameError.message }, { status: 500 });
    }

    if (!games || games.length === 0) {
      return NextResponse.json({ error: "보드게임을 찾을 수 없습니다." }, { status: 404 });
    }

    const game = games[0];
    const objectPath = `${gameSlug}/${slugifyFileName(file.name)}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage.from(BUCKET_ID).upload(objectPath, buffer, {
      contentType: "application/pdf",
      upsert: true
    });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage.from(BUCKET_ID).getPublicUrl(objectPath);
    const publicUrl = publicUrlData.publicUrl;

    const { data: existingRulebooks, error: rulebookLookupError } = await supabase
      .from("rulebooks")
      .select("id, metadata")
      .eq("board_game_id", game.id)
      .eq("version_label", versionLabel)
      .limit(1);

    if (rulebookLookupError) {
      return NextResponse.json({ error: rulebookLookupError.message }, { status: 500 });
    }

    const metadata = {
      ...((existingRulebooks?.[0]?.metadata as Record<string, unknown> | null) ?? {}),
      storageStatus: "uploaded",
      reviewStatus: "needs_text_review",
      bucket: BUCKET_ID,
      objectPath,
      publicUrl,
      originalFileName: file.name,
      pdfBytes: file.size
    };

    if (existingRulebooks && existingRulebooks.length > 0) {
      const { data: updatedRulebooks, error: updateError } = await supabase
        .from("rulebooks")
        .update({
          source_type: "pdf",
          source_url: publicUrl,
          file_name: file.name,
          language_code: "ko",
          ingestion_status: "queued",
          metadata
        })
        .eq("id", existingRulebooks[0].id)
        .select("id, source_url, file_name, metadata")
        .single();

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({
        bucket: BUCKET_ID,
        objectPath,
        publicUrl,
        rulebook: updatedRulebooks
      });
    }

    const { data: createdRulebook, error: insertError } = await supabase
      .from("rulebooks")
      .insert({
        board_game_id: game.id,
        source_type: "pdf",
        source_url: publicUrl,
        file_name: file.name,
        language_code: "ko",
        version_label: versionLabel,
        ingestion_status: "queued",
        metadata
      })
      .select("id, source_url, file_name, metadata")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      bucket: BUCKET_ID,
      objectPath,
      publicUrl,
      rulebook: createdRulebook
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "룰북 PDF 업로드 중 오류가 발생했습니다."
      },
      { status: 500 }
    );
  }
}
