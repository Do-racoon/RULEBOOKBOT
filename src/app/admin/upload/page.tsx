import { UploadForm } from "@/components/upload-form";

export default function AdminUploadPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-10 text-center">
      <section className="mx-auto mb-8 max-w-3xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-coral">관리자</p>
        <h1 className="text-4xl font-semibold leading-tight text-ink">보드게임 추가 요청</h1>
        <p className="mt-4 text-lg leading-8 text-ink/70">
          게임 정보, 고정 태그, 룰북 링크나 OCR 텍스트를 남기면 오른쪽 요청 목록에서 바로 확인할 수 있습니다.
        </p>
      </section>

      <UploadForm />
    </div>
  );
}
