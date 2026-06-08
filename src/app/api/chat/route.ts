import { NextResponse } from "next/server";
import { retrieveRulebookContext } from "@/lib/retrieval";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    gameId?: string;
    question?: string;
  };

  if (!body.gameId || !body.question) {
    return NextResponse.json({ error: "gameId and question are required." }, { status: 400 });
  }

  const hits = await retrieveRulebookContext({
    gameId: body.gameId,
    question: body.question
  });

  return NextResponse.json({
    answer:
      "아직 Supabase 룰북 검색은 연결 전입니다. " +
      `현재 구조에서는 ${hits.length}개의 룰북 문맥을 찾고 그래프 이웃을 확장한 뒤 "${body.question}"에 답변하게 됩니다.`,
    citations: hits.map((hit) => ({
      chunkId: hit.chunkId,
      sectionTitle: hit.sectionTitle,
      pageNumber: hit.pageNumber,
      similarity: hit.similarity
    }))
  });
}
