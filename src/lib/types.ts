export type BoardGame = {
  id: string;
  slug: string;
  title: string;
  titleKo?: string;
  yearPublished: number;
  playerCount: string;
  playTime: string;
  complexity: "입문" | "중급" | "전략";
  publisher: string;
  designers: string[];
  mechanics: string[];
  tags: string[];
  summary: string;
  rulebookStatus: "등록됨" | "검토 중" | "텍스트 필요";
  coverGradient: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export type AdminGameRequest = {
  id: string;
  title: string;
  publisher: string;
  yearPublished: number | null;
  playerCount: string;
  playTime: string;
  complexity: BoardGame["complexity"];
  tags: string[];
  summary: string;
  rulebookPdfUrl: string;
  ocrText: string;
  status: "요청됨" | "검토 중" | "등록 완료";
  createdAt: string;
};
