"use client";

import { X } from "lucide-react";
import { useMemo, useState } from "react";
import { BoardGameCard } from "@/components/board-game-card";
import { fixedTags } from "@/lib/tags";
import type { BoardGame } from "@/lib/types";

export function BoardGameGrid({ games }: { games: BoardGame[] }) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const filteredGames = useMemo(() => {
    if (selectedTags.length === 0) {
      return games;
    }

    return games.filter((game) => selectedTags.every((tag) => game.tags.includes(tag)));
  }, [games, selectedTags]);

  function toggleTag(tag: string) {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((currentTag) => currentTag !== tag) : [...current, tag]
    );
  }

  return (
    <section className="space-y-8">
      <div className="mx-auto max-w-4xl space-y-3">
        <div className="flex flex-wrap justify-center gap-2">
          {fixedTags.map((tag) => {
            const isSelected = selectedTags.includes(tag);

            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                  isSelected
                    ? "border-moss bg-moss text-white"
                    : "border-ink/10 bg-white text-ink/65 hover:border-moss/40 hover:text-moss"
                }`}
              >
                #{tag}
              </button>
            );
          })}
        </div>

        {selectedTags.length > 0 ? (
          <div className="flex items-center justify-center gap-3 text-sm text-ink/60">
            <span>{filteredGames.length}개 게임 표시 중</span>
            <button
              type="button"
              onClick={() => setSelectedTags([])}
              className="inline-flex items-center gap-1 rounded-md border border-ink/10 bg-white px-2 py-1 text-ink/60 hover:border-coral/40 hover:text-coral"
            >
              <X size={14} aria-hidden="true" />
              필터 해제
            </button>
          </div>
        ) : null}
      </div>

      {filteredGames.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGames.map((game) => (
            <BoardGameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-ink/20 bg-white/70 p-10 text-center text-ink/60">
          선택한 태그를 모두 포함하는 보드게임이 없습니다.
        </div>
      )}
    </section>
  );
}
