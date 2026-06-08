import fs from "node:fs";

const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    })
);

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const apiKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !apiKey) {
  throw new Error("Supabase URL or API key is missing.");
}

async function supabaseFetch(path, init = {}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {})
    }
  });

  const body = await response.text();

  if (!response.ok) {
    throw new Error(`${response.status} ${body}`);
  }

  return body ? JSON.parse(body) : null;
}

let games = await supabaseFetch("board_games?slug=eq.tichu&select=id,slug,title&limit=1");

if (games.length === 0) {
  await supabaseFetch("board_games", {
    method: "POST",
    headers: {
      Prefer: "return=representation"
    },
    body: JSON.stringify({
      slug: "tichu",
      title: "Tichu",
      year_published: 1991,
      publisher: "Fata Morgana",
      designers: ["Urs Hostettler"],
      min_players: 4,
      max_players: 4,
      min_play_time_minutes: 60,
      max_play_time_minutes: 60,
      complexity: 2.2,
      summary:
        "두 명씩 팀을 이뤄 손패를 털고, 선언과 카운팅, 심리전으로 큰 점수를 노리는 파트너십 카드 게임입니다."
    })
  });

  games = await supabaseFetch("board_games?slug=eq.tichu&select=id,slug,title&limit=1");
}

const game = games[0];
const existingRulebooks = await supabaseFetch(
  `rulebooks?board_game_id=eq.${game.id}&version_label=eq.Tichu%20MVP%20Rulebook%20Request&select=id&limit=1`
);

if (existingRulebooks.length === 0) {
  await supabaseFetch("rulebooks", {
    method: "POST",
    headers: {
      Prefer: "return=representation"
    },
    body: JSON.stringify({
      board_game_id: game.id,
      source_type: "manual_entry",
      language_code: "ko",
      version_label: "Tichu MVP Rulebook Request",
      ingestion_status: "queued",
      raw_ocr_text: "티츄 룰북 원문 또는 PDF 업로드 대기 중입니다.",
      metadata: {
        titleKo: "티츄",
        tags: ["카드", "팀전(협력)", "카운팅", "심리"],
        note: "MVP에서 룰북 연결을 확인하기 위한 초기 레코드입니다."
      }
    })
  });
}

const rulebooks = await supabaseFetch(
  `rulebooks?board_game_id=eq.${game.id}&select=id,version_label,ingestion_status,metadata&order=created_at.desc`
);

console.log(
  JSON.stringify(
    {
      game,
      rulebookCount: rulebooks.length,
      latestRulebook: rulebooks[0]
    },
    null,
    2
  )
);
