"use client";

import { FileUp } from "lucide-react";
import { FormEvent, useState } from "react";

type UploadResult = {
  publicUrl: string;
  objectPath: string;
};

export function RulebookStorageForm() {
  const [status, setStatus] = useState<"idle" | "uploading" | "uploaded" | "error">("idle");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<UploadResult | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("uploading");
    setMessage("");
    setResult(null);

    const formData = new FormData(event.currentTarget);
    formData.set("gameSlug", "tichu");
    formData.set("versionLabel", "Tichu Korean PDF Rulebook");

    try {
      const response = await fetch("/api/admin/rulebook-storage", {
        method: "POST",
        body: formData
      });
      const payload = (await response.json()) as Partial<UploadResult> & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "업로드 실패");
      }

      setStatus("uploaded");
      setResult({
        publicUrl: payload.publicUrl ?? "",
        objectPath: payload.objectPath ?? ""
      });
      setMessage("티츄 룰북 PDF가 Supabase Storage에 업로드되었습니다.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "업로드 중 오류가 발생했습니다.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-ink/10 bg-white p-6 text-left shadow-sm">
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-moss">Storage</p>
        <h2 className="mt-2 text-2xl font-semibold text-ink">티츄 룰북 PDF 업로드</h2>
        <p className="mt-2 text-sm leading-6 text-ink/60">
          Vercel 서버가 rulebooks 버킷을 만들고 PDF를 업로드한 뒤 DB의 룰북 URL을 업데이트합니다.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <input
          required
          name="file"
          type="file"
          accept="application/pdf"
          className="rounded-md border border-ink/10 bg-paper px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
        />
        <button
          type="submit"
          disabled={status === "uploading"}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-moss px-4 py-2 font-medium text-white transition hover:bg-moss/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FileUp size={17} aria-hidden="true" />
          {status === "uploading" ? "업로드 중" : "PDF 업로드"}
        </button>
      </div>

      {message ? (
        <p className={`mt-4 text-sm ${status === "error" ? "text-coral" : "text-moss"}`}>{message}</p>
      ) : null}

      {result?.publicUrl ? (
        <a
          href={result.publicUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-sm font-medium text-moss underline underline-offset-4"
        >
          업로드된 PDF 열기
        </a>
      ) : null}
    </form>
  );
}
