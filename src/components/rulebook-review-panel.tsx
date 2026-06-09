"use client";

import { CheckCircle2, FileText, RefreshCw, Scissors, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type RulebookChunk = {
  id: string;
  chunk_index: number;
  content: string;
  token_count: number | null;
  page_number: number | null;
};

type RulebookReviewItem = {
  id: string;
  source_url: string | null;
  file_name: string | null;
  version_label: string | null;
  ingestion_status: "queued" | "processing" | "ready" | "failed";
  raw_ocr_text: string | null;
  metadata: Record<string, unknown>;
  board_games: {
    id: string;
    slug: string;
    title: string;
  } | null;
  rulebook_chunks: RulebookChunk[];
};

type RulebookListResponse = {
  rulebooks: RulebookReviewItem[];
  error?: string;
};

const statusLabels: Record<RulebookReviewItem["ingestion_status"], string> = {
  queued: "검수 대기",
  processing: "처리 중",
  ready: "승인 완료",
  failed: "보류"
};

export function RulebookReviewPanel() {
  const [rulebooks, setRulebooks] = useState<RulebookReviewItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [rawText, setRawText] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "error">("loading");
  const [message, setMessage] = useState("");

  const selectedRulebook = useMemo(
    () => rulebooks.find((rulebook) => rulebook.id === selectedId) ?? rulebooks[0] ?? null,
    [rulebooks, selectedId]
  );

  const loadRulebooks = useCallback(async (nextSelectedId = selectedId) => {
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/admin/rulebooks", { cache: "no-store" });
      const payload = (await response.json()) as RulebookListResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "룰북 목록을 불러오지 못했습니다.");
      }

      setRulebooks(payload.rulebooks);
      const nextRulebook =
        payload.rulebooks.find((rulebook) => rulebook.id === nextSelectedId) ?? payload.rulebooks[0] ?? null;
      setSelectedId(nextRulebook?.id ?? "");
      setRawText(nextRulebook?.raw_ocr_text ?? "");
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "룰북 목록을 불러오지 못했습니다.");
    }
  }, [selectedId]);

  useEffect(() => {
    void loadRulebooks("");
  }, [loadRulebooks]);

  function selectRulebook(rulebook: RulebookReviewItem) {
    setSelectedId(rulebook.id);
    setRawText(rulebook.raw_ocr_text ?? "");
    setMessage("");
  }

  async function runAction(action: "save_text" | "generate_chunks" | "approve" | "mark_failed") {
    if (!selectedRulebook) {
      return;
    }

    setStatus("saving");
    setMessage("");

    try {
      const response = await fetch("/api/admin/rulebooks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rulebookId: selectedRulebook.id,
          action,
          rawOcrText: rawText
        })
      });
      const payload = (await response.json()) as { error?: string; chunkCount?: number };

      if (!response.ok) {
        throw new Error(payload.error ?? "처리에 실패했습니다.");
      }

      if (action === "generate_chunks") {
        setMessage(`청크 ${payload.chunkCount ?? 0}개를 생성했습니다. 내용을 확인한 뒤 승인하세요.`);
      } else if (action === "approve") {
        setMessage("룰북을 검색 반영 대상으로 승인했습니다.");
      } else if (action === "mark_failed") {
        setMessage("룰북을 보류 상태로 변경했습니다.");
      } else {
        setMessage("OCR 텍스트를 저장했습니다.");
      }

      await loadRulebooks(selectedRulebook.id);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "처리에 실패했습니다.");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
      <aside className="rounded-lg border border-ink/10 bg-white p-4 text-left shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-semibold text-ink">룰북 목록</h2>
          <button
            type="button"
            onClick={() => void loadRulebooks(selectedRulebook?.id ?? "")}
            className="inline-flex size-9 items-center justify-center rounded-md border border-ink/10 text-ink/65 hover:border-moss/40 hover:text-moss"
            aria-label="룰북 목록 새로고침"
          >
            <RefreshCw size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-2">
          {rulebooks.length === 0 ? (
            <p className="rounded-md bg-paper p-4 text-sm leading-6 text-ink/55">검수할 룰북이 없습니다.</p>
          ) : (
            rulebooks.map((rulebook) => {
              const reviewStatus = String(rulebook.metadata?.reviewStatus ?? "pending");

              return (
                <button
                  key={rulebook.id}
                  type="button"
                  onClick={() => selectRulebook(rulebook)}
                  className={`w-full rounded-md border p-3 text-left transition ${
                    selectedRulebook?.id === rulebook.id
                      ? "border-moss bg-moss/10"
                      : "border-ink/10 bg-white hover:border-moss/40"
                  }`}
                >
                  <p className="font-semibold text-ink">{rulebook.board_games?.title ?? "알 수 없는 게임"}</p>
                  <p className="mt-1 text-xs text-ink/50">{rulebook.file_name ?? rulebook.version_label ?? "룰북"}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="rounded bg-ink/[0.06] px-2 py-1 text-xs text-ink/60">
                      {statusLabels[rulebook.ingestion_status]}
                    </span>
                    <span className="rounded bg-saffron/15 px-2 py-1 text-xs text-yellow-800">{reviewStatus}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <section className="rounded-lg border border-ink/10 bg-white p-5 text-left shadow-sm">
        {!selectedRulebook ? (
          <p className="rounded-md bg-paper p-4 text-sm leading-6 text-ink/55">룰북을 업로드하면 여기에서 검수할 수 있습니다.</p>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-moss">
                  {selectedRulebook.board_games?.slug ?? "rulebook"}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-ink">
                  {selectedRulebook.board_games?.title ?? "룰북 검수"}
                </h2>
                <p className="mt-2 text-sm text-ink/60">
                  상태: {statusLabels[selectedRulebook.ingestion_status]} · 청크 {selectedRulebook.rulebook_chunks.length}개
                </p>
              </div>

              {selectedRulebook.source_url ? (
                <a
                  href={selectedRulebook.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-ink/10 px-3 py-2 text-sm font-medium text-ink/70 hover:border-moss/40 hover:text-moss"
                >
                  <FileText size={16} aria-hidden="true" />
                  PDF 열기
                </a>
              ) : null}
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-ink/75">OCR 원문 검수</span>
              <textarea
                value={rawText}
                onChange={(event) => setRawText(event.target.value)}
                rows={14}
                className="w-full resize-y rounded-md border border-ink/10 px-3 py-2 leading-6 outline-none focus:border-moss focus:ring-4 focus:ring-moss/15"
                placeholder="PDF에서 추출한 텍스트를 붙여넣고, 깨진 문장이나 페이지 구분을 수정하세요."
              />
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void runAction("save_text")}
                disabled={status === "saving"}
                className="inline-flex items-center gap-2 rounded-md border border-ink/10 px-4 py-2 font-medium text-ink/70 hover:border-moss/40 hover:text-moss disabled:opacity-60"
              >
                <FileText size={17} aria-hidden="true" />
                원문 저장
              </button>
              <button
                type="button"
                onClick={() => void runAction("generate_chunks")}
                disabled={status === "saving"}
                className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 font-medium text-white transition hover:bg-ink/90 disabled:opacity-60"
              >
                <Scissors size={17} aria-hidden="true" />
                청크 생성
              </button>
              <button
                type="button"
                onClick={() => void runAction("approve")}
                disabled={status === "saving" || selectedRulebook.rulebook_chunks.length === 0}
                className="inline-flex items-center gap-2 rounded-md bg-moss px-4 py-2 font-medium text-white transition hover:bg-moss/90 disabled:opacity-60"
              >
                <CheckCircle2 size={17} aria-hidden="true" />
                승인
              </button>
              <button
                type="button"
                onClick={() => void runAction("mark_failed")}
                disabled={status === "saving"}
                className="inline-flex items-center gap-2 rounded-md bg-coral px-4 py-2 font-medium text-white transition hover:bg-coral/90 disabled:opacity-60"
              >
                <XCircle size={17} aria-hidden="true" />
                보류
              </button>
            </div>

            {message ? (
              <p className={`rounded-md p-3 text-sm ${status === "error" ? "bg-coral/10 text-coral" : "bg-moss/10 text-moss"}`}>
                {message}
              </p>
            ) : null}

            <div>
              <h3 className="mb-3 font-semibold text-ink">청크 미리보기</h3>
              <div className="grid gap-3">
                {selectedRulebook.rulebook_chunks.length === 0 ? (
                  <p className="rounded-md bg-paper p-4 text-sm leading-6 text-ink/55">
                    아직 생성된 청크가 없습니다. OCR 원문을 확인한 뒤 청크 생성을 눌러주세요.
                  </p>
                ) : (
                  selectedRulebook.rulebook_chunks.slice(0, 12).map((chunk) => (
                    <article key={chunk.id} className="rounded-md border border-ink/10 p-4">
                      <div className="mb-2 flex flex-wrap gap-2 text-xs text-ink/45">
                        <span>#{chunk.chunk_index + 1}</span>
                        {chunk.page_number ? <span>p.{chunk.page_number}</span> : null}
                        {chunk.token_count ? <span>약 {chunk.token_count} tokens</span> : null}
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-6 text-ink/70">{chunk.content}</p>
                    </article>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
