"use client";

import { FileText, RefreshCw, Send } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { fixedTags } from "@/lib/tags";
import type { AdminGameRequest, BoardGame } from "@/lib/types";

export function UploadForm() {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [selectedTags, setSelectedTags] = useState<string[]>(["입문"]);
  const [requests, setRequests] = useState<AdminGameRequest[]>([]);

  async function loadRequests() {
    const response = await fetch("/api/admin/game-requests");
    const payload = (await response.json()) as { requests: AdminGameRequest[] };
    setRequests(payload.requests);
  }

  useEffect(() => {
    void loadRequests();
  }, []);

  function toggleTag(tag: string) {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((currentTag) => currentTag !== tag) : [...current, tag]
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");

    const formData = new FormData(event.currentTarget);
    const payload = {
      title: String(formData.get("title") ?? ""),
      publisher: String(formData.get("publisher") ?? ""),
      yearPublished: formData.get("yearPublished") ? Number(formData.get("yearPublished")) : null,
      playerCount: String(formData.get("playerCount") ?? ""),
      playTime: String(formData.get("playTime") ?? ""),
      complexity: String(formData.get("complexity") ?? "입문") as BoardGame["complexity"],
      tags: selectedTags,
      summary: String(formData.get("summary") ?? ""),
      rulebookPdfUrl: String(formData.get("rulebookPdfUrl") ?? ""),
      ocrText: String(formData.get("ocrText") ?? "")
    };

    try {
      const response = await fetch("/api/admin/game-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("요청 저장 실패");
      }

      event.currentTarget.reset();
      setSelectedTags(["입문"]);
      setStatus("saved");
      await loadRequests();
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-ink/10 bg-white p-6 text-left shadow-sm">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-ink/75">게임명</span>
            <input required name="title" className="w-full rounded-md border border-ink/10 px-3 py-2 outline-none focus:border-moss focus:ring-4 focus:ring-moss/15" placeholder="예: 스플렌더" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-ink/75">출판사</span>
            <input name="publisher" className="w-full rounded-md border border-ink/10 px-3 py-2 outline-none focus:border-moss focus:ring-4 focus:ring-moss/15" placeholder="예: 코리아보드게임즈" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-ink/75">출시 연도</span>
            <input name="yearPublished" type="number" min="1900" max="2100" className="w-full rounded-md border border-ink/10 px-3 py-2 outline-none focus:border-moss focus:ring-4 focus:ring-moss/15" placeholder="2024" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-ink/75">인원 / 시간</span>
            <div className="grid grid-cols-2 gap-2">
              <input name="playerCount" className="w-full rounded-md border border-ink/10 px-3 py-2 outline-none focus:border-moss focus:ring-4 focus:ring-moss/15" placeholder="2-4" />
              <input name="playTime" className="w-full rounded-md border border-ink/10 px-3 py-2 outline-none focus:border-moss focus:ring-4 focus:ring-moss/15" placeholder="45분" />
            </div>
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-[12rem_1fr]">
          <label className="space-y-2">
            <span className="text-sm font-medium text-ink/75">난이도</span>
            <select name="complexity" defaultValue="입문" className="w-full rounded-md border border-ink/10 px-3 py-2 outline-none focus:border-moss focus:ring-4 focus:ring-moss/15">
              <option value="입문">입문</option>
              <option value="중급">중급</option>
              <option value="전략">전략</option>
            </select>
          </label>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-ink/75">고정 태그</legend>
            <div className="flex flex-wrap gap-2">
              {fixedTags.map((tag) => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)} className={`rounded-md border px-3 py-1.5 text-sm font-medium transition ${selectedTags.includes(tag) ? "border-moss bg-moss text-white" : "border-ink/10 bg-paper text-ink/65 hover:border-moss/40"}`}>
                  #{tag}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <label className="space-y-2">
          <span className="text-sm font-medium text-ink/75">한 줄 소개</span>
          <textarea required name="summary" rows={3} className="w-full resize-y rounded-md border border-ink/10 px-3 py-2 leading-6 outline-none focus:border-moss focus:ring-4 focus:ring-moss/15" placeholder="관리자가 빠르게 검토할 수 있도록 게임 성격을 적어주세요." />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-ink/75">룰북 PDF URL</span>
          <div className="relative">
            <FileText className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" size={18} />
            <input name="rulebookPdfUrl" className="w-full rounded-md border border-ink/10 px-10 py-2 outline-none focus:border-moss focus:ring-4 focus:ring-moss/15" placeholder="https://..." type="url" />
          </div>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-ink/75">OCR 텍스트</span>
          <textarea name="ocrText" rows={8} className="w-full resize-y rounded-md border border-ink/10 px-3 py-2 leading-6 outline-none focus:border-moss focus:ring-4 focus:ring-moss/15" placeholder="룰북에서 추출한 텍스트가 있으면 붙여넣으세요." />
        </label>

        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-ink/50">
            {status === "saved" && "추가 요청이 저장되었습니다."}
            {status === "error" && "저장 중 오류가 발생했습니다."}
            {status === "idle" && "인증은 아직 적용하지 않았습니다."}
          </p>
          <button type="submit" className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 font-medium text-white transition hover:bg-ink/90">
            <Send size={17} aria-hidden="true" />
            {status === "saving" ? "저장 중" : "추가 요청"}
          </button>
        </div>
      </form>

      <aside className="rounded-lg border border-ink/10 bg-white p-5 text-left shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">요청 확인</h2>
          <button type="button" onClick={() => void loadRequests()} className="inline-flex size-9 items-center justify-center rounded-md border border-ink/10 text-ink/65 hover:border-moss/40 hover:text-moss" aria-label="요청 목록 새로고침">
            <RefreshCw size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="space-y-3">
          {requests.length === 0 ? (
            <p className="rounded-md bg-paper p-4 text-sm leading-6 text-ink/55">아직 추가 요청이 없습니다.</p>
          ) : (
            requests.map((request) => (
              <article key={request.id} className="rounded-md border border-ink/10 p-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h3 className="font-semibold">{request.title}</h3>
                  <span className="rounded-md bg-saffron/15 px-2 py-1 text-xs font-semibold text-yellow-800">{request.status}</span>
                </div>
                <p className="text-sm leading-6 text-ink/65">{request.summary}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {request.tags.map((tag) => (
                    <span key={tag} className="rounded bg-ink/[0.06] px-2 py-1 text-xs text-ink/60">#{tag}</span>
                  ))}
                </div>
              </article>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
