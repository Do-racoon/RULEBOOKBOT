import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, UploadCloud } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "룰테이블",
  description: "보드게임 룰북 검색과 룰 질문 MVP"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <header className="border-b border-ink/10 bg-paper/80 backdrop-blur">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-wide text-ink">
              <span className="grid size-9 place-items-center rounded-md bg-ink text-paper">
                <BookOpen size={19} aria-hidden="true" />
              </span>
              룰테이블
            </Link>
            <Link
              href="/admin/upload"
              className="inline-flex items-center gap-2 rounded-md border border-ink/15 bg-white px-3 py-2 text-sm font-medium text-ink shadow-sm transition hover:border-moss/50 hover:text-moss"
            >
              <UploadCloud size={16} aria-hidden="true" />
              관리자
            </Link>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
