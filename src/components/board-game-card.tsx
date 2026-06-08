import Link from "next/link";
import { Clock, Users } from "lucide-react";
import type { BoardGame } from "@/lib/types";

const statusStyles = {
  등록됨: "bg-moss/10 text-moss",
  "검토 중": "bg-saffron/15 text-yellow-800",
  "텍스트 필요": "bg-coral/10 text-coral"
};

export function BoardGameCard({ game }: { game: BoardGame }) {
  return (
    <Link
      href={`/games/${game.slug}`}
      className="group overflow-hidden rounded-lg border border-ink/10 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-moss/40 hover:shadow-soft"
    >
      <div className={`h-36 bg-gradient-to-br ${game.coverGradient} p-4 text-white`}>
        <div className="flex h-full flex-col justify-between">
          <span className="w-fit rounded-md bg-white/20 px-2 py-1 text-xs font-medium backdrop-blur">
            {game.yearPublished}
          </span>
          <div>
            <h2 className="text-2xl font-semibold leading-tight">{game.titleKo ?? game.title}</h2>
            <p className="mt-1 text-sm text-white/75">{game.title}</p>
          </div>
        </div>
      </div>
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-ink/70">{game.publisher}</p>
          <span className={`rounded-md px-2 py-1 text-xs font-semibold ${statusStyles[game.rulebookStatus]}`}>
            {game.rulebookStatus}
          </span>
        </div>
        <p className="line-clamp-3 text-sm leading-6 text-ink/70">{game.summary}</p>
        <div className="flex flex-wrap gap-2">
          {game.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="rounded-md bg-ink/[0.06] px-2 py-1 text-xs text-ink/70">
              #{tag}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-4 border-t border-ink/10 pt-3 text-sm text-ink/60">
          <span className="inline-flex items-center gap-1.5">
            <Users size={15} aria-hidden="true" />
            {game.playerCount}명
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock size={15} aria-hidden="true" />
            {game.playTime}
          </span>
        </div>
      </div>
    </Link>
  );
}
