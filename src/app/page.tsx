import { BoardGameGrid } from "@/components/board-game-grid";
import { boardGames } from "@/lib/mock-data";

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-12 text-center">
      <section className="mx-auto mb-10 max-w-3xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-moss">보드게임 룰북 아카이브</p>
        <h1 className="text-4xl font-semibold leading-tight text-ink sm:text-5xl">
          찾고 싶은 보드게임을 먼저 모아봅니다
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-ink/70">
          검색 기능은 다음 단계에서 붙이고, 지금은 관리자에서 추가 요청한 게임과 기본 등록 게임을 확인하는 흐름에 집중합니다.
        </p>
      </section>

      <BoardGameGrid games={boardGames} />
    </div>
  );
}
