import { RulebookReviewPanel } from "@/components/rulebook-review-panel";

export default function AdminRulebooksPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-10">
      <section className="mx-auto mb-8 max-w-3xl text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-coral">관리자 검수</p>
        <h1 className="text-4xl font-semibold leading-tight text-ink">룰북 전처리 검증</h1>
        <p className="mt-4 text-lg leading-8 text-ink/70">
          PDF 원본과 OCR 텍스트를 확인하고, 검색에 사용할 청크를 만든 뒤 승인합니다.
        </p>
      </section>

      <RulebookReviewPanel />
    </div>
  );
}
