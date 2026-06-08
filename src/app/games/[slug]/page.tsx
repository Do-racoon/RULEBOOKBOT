import { notFound } from "next/navigation";
import { CalendarDays, Clock, Layers, Users } from "lucide-react";
import { Chatbot } from "@/components/chatbot";
import { getBoardGameBySlug } from "@/lib/mock-data";

type PageProps = {
  params: {
    slug: string;
  };
};

export default function BoardGameDetailPage({ params }: PageProps) {
  const { slug } = params;
  const game = getBoardGameBySlug(slug);

  if (!game) {
    notFound();
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[minmax(0,1fr)_28rem]">
      <section className="space-y-8">
        <div className={`rounded-lg bg-gradient-to-br ${game.coverGradient} p-8 text-white shadow-soft`}>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-white/75">
            {game.publisher}
          </p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">{game.titleKo ?? game.title}</h1>
          <p className="mt-2 text-white/75">{game.title}</p>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-white/80">{game.summary}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DetailStat icon={<CalendarDays size={18} />} label="출시 연도" value={String(game.yearPublished)} />
          <DetailStat icon={<Users size={18} />} label="인원" value={`${game.playerCount}명`} />
          <DetailStat icon={<Clock size={18} />} label="플레이 시간" value={game.playTime} />
          <DetailStat icon={<Layers size={18} />} label="난이도" value={game.complexity} />
        </div>

        <section className="rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">룰북 상태</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <IndexMetric label="상태" value={game.rulebookStatus} />
            <IndexMetric label="문단 색인" value={game.rulebookStatus === "등록됨" ? "준비됨" : "대기"} />
            <IndexMetric label="Graph RAG" value="스키마 준비" />
          </div>
          <div className="mt-6 space-y-3">
            <h3 className="font-semibold">태그</h3>
            <div className="flex flex-wrap gap-2">
              {game.tags.map((tag) => (
                <span key={tag} className="rounded-md bg-moss/10 px-3 py-1 text-sm font-medium text-moss">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </section>
      </section>

      <Chatbot gameId={game.id} gameTitle={game.title} />
    </div>
  );
}

function DetailStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-sm">
      <div className="mb-3 text-moss">{icon}</div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/40">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function IndexMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-paper p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/40">{label}</p>
      <p className="mt-1 font-semibold text-ink">{value}</p>
    </div>
  );
}
