import { RulebookStorageForm } from "@/components/rulebook-storage-form";
import { UploadForm } from "@/components/upload-form";
import Link from "next/link";

export default function AdminUploadPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-10 text-center">
      <section className="mx-auto mb-8 max-w-3xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-coral">관리자</p>
        <h1 className="text-4xl font-semibold leading-tight text-ink">룰북과 보드게임 추가</h1>
        <p className="mt-4 text-lg leading-8 text-ink/70">
          보드게임 요청을 남기거나, 티츄 룰북 PDF를 Supabase Storage에 바로 업로드할 수 있습니다.
        </p>
        <Link
          href="/admin/rulebooks"
          className="mt-5 inline-flex rounded-md border border-ink/10 px-4 py-2 text-sm font-medium text-ink/70 hover:border-moss/40 hover:text-moss"
        >
          룰북 검증 페이지로 이동
        </Link>
      </section>

      <div className="space-y-6">
        <RulebookStorageForm />
        <UploadForm />
      </div>
    </div>
  );
}
