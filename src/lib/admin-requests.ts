import { promises as fs } from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import type { AdminGameRequest } from "@/lib/types";

const localStorePath = path.join(process.cwd(), "data", "game-requests.json");

function hasSupabaseAdminConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function getSupabaseAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      persistSession: false
    }
  });
}

async function readLocalRequests(): Promise<AdminGameRequest[]> {
  try {
    const content = await fs.readFile(localStorePath, "utf8");
    return JSON.parse(content) as AdminGameRequest[];
  } catch {
    return [];
  }
}

async function writeLocalRequests(requests: AdminGameRequest[]) {
  await fs.mkdir(path.dirname(localStorePath), { recursive: true });
  await fs.writeFile(localStorePath, JSON.stringify(requests, null, 2), "utf8");
}

export async function listAdminGameRequests(): Promise<AdminGameRequest[]> {
  if (hasSupabaseAdminConfig()) {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("admin_game_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return data.map((row) => ({
      id: row.id,
      title: row.title,
      publisher: row.publisher ?? "",
      yearPublished: row.year_published,
      playerCount: row.player_count ?? "",
      playTime: row.play_time ?? "",
      complexity: row.complexity,
      tags: row.tags ?? [],
      summary: row.summary ?? "",
      rulebookPdfUrl: row.rulebook_pdf_url ?? "",
      ocrText: row.ocr_text ?? "",
      status: row.status,
      createdAt: row.created_at
    }));
  }

  return readLocalRequests();
}

export async function createAdminGameRequest(
  input: Omit<AdminGameRequest, "id" | "status" | "createdAt">
): Promise<AdminGameRequest> {
  const request: AdminGameRequest = {
    ...input,
    id: crypto.randomUUID(),
    status: "요청됨",
    createdAt: new Date().toISOString()
  };

  if (hasSupabaseAdminConfig()) {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("admin_game_requests").insert({
      id: request.id,
      title: request.title,
      publisher: request.publisher,
      year_published: request.yearPublished,
      player_count: request.playerCount,
      play_time: request.playTime,
      complexity: request.complexity,
      tags: request.tags,
      summary: request.summary,
      rulebook_pdf_url: request.rulebookPdfUrl,
      ocr_text: request.ocrText,
      status: request.status,
      created_at: request.createdAt
    });

    if (error) {
      throw error;
    }

    return request;
  }

  const requests = await readLocalRequests();
  await writeLocalRequests([request, ...requests]);
  return request;
}
