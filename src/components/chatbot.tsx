"use client";

import { Send } from "lucide-react";
import { FormEvent, useState } from "react";
import type { ChatMessage } from "@/lib/types";

export function Chatbot({ gameId, gameTitle }: { gameId: string; gameTitle: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `${gameTitle} 룰 질문을 입력하세요. 룰북 검색 연결 후에는 근거 문단과 함께 답변합니다.`
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = input.trim();

    if (!question || isLoading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: question
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, question })
      });
      const payload = (await response.json()) as { answer: string };

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: payload.answer
        }
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "룰 질문 API에 연결하지 못했습니다. 개발 서버 상태를 확인해주세요."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="flex min-h-[32rem] flex-col rounded-lg border border-ink/10 bg-white shadow-sm">
      <div className="border-b border-ink/10 px-5 py-4">
        <h2 className="text-lg font-semibold">룰 질문</h2>
        <p className="mt-1 text-sm text-ink/60">{gameTitle}</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[88%] rounded-lg px-4 py-3 text-sm leading-6 ${
              message.role === "user"
                ? "ml-auto bg-ink text-white"
                : "mr-auto border border-ink/10 bg-paper text-ink"
            }`}
          >
            {message.content}
          </div>
        ))}
        {isLoading ? (
          <div className="mr-auto rounded-lg border border-ink/10 bg-paper px-4 py-3 text-sm text-ink/60">
            룰북 문맥을 찾는 중...
          </div>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3 border-t border-ink/10 p-4">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="준비, 타이밍, 점수 계산, 예외 상황을 물어보세요."
          className="min-w-0 flex-1 rounded-md border border-ink/10 px-3 py-2 outline-none transition placeholder:text-ink/40 focus:border-moss focus:ring-4 focus:ring-moss/15"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex size-11 items-center justify-center rounded-md bg-moss text-white transition hover:bg-moss/90 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="질문 보내기"
        >
          <Send size={18} aria-hidden="true" />
        </button>
      </form>
    </section>
  );
}
