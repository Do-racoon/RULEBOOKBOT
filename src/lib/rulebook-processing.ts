export type RulebookChunkDraft = {
  chunkIndex: number;
  content: string;
  tokenCount: number;
  pageNumber: number | null;
};

const MAX_CHARS = 1200;
const OVERLAP_CHARS = 160;

function estimateTokenCount(text: string) {
  return Math.ceil(text.length / 3);
}

function normalizeRulebookText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function detectPageNumber(text: string) {
  const pageMatch = text.match(/(?:^|\n)\s*(?:page|p\.|쪽|페이지)\s*[:.-]?\s*(\d{1,3})\s*(?:\n|$)/i);
  return pageMatch ? Number(pageMatch[1]) : null;
}

export function chunkRulebookText(rawText: string): RulebookChunkDraft[] {
  const normalized = normalizeRulebookText(rawText);

  if (!normalized) {
    return [];
  }

  const paragraphs = normalized.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);
  const chunks: RulebookChunkDraft[] = [];
  let current = "";

  function pushCurrent() {
    const content = current.trim();

    if (!content) {
      return;
    }

    chunks.push({
      chunkIndex: chunks.length,
      content,
      tokenCount: estimateTokenCount(content),
      pageNumber: detectPageNumber(content)
    });

    current = content.slice(Math.max(0, content.length - OVERLAP_CHARS));
  }

  for (const paragraph of paragraphs) {
    if (paragraph.length > MAX_CHARS) {
      pushCurrent();

      for (let start = 0; start < paragraph.length; start += MAX_CHARS - OVERLAP_CHARS) {
        const content = paragraph.slice(start, start + MAX_CHARS).trim();

        if (content) {
          chunks.push({
            chunkIndex: chunks.length,
            content,
            tokenCount: estimateTokenCount(content),
            pageNumber: detectPageNumber(content)
          });
        }
      }

      current = "";
      continue;
    }

    const next = current ? `${current}\n\n${paragraph}` : paragraph;

    if (next.length > MAX_CHARS) {
      pushCurrent();
      current = current ? `${current}\n\n${paragraph}` : paragraph;
    } else {
      current = next;
    }
  }

  pushCurrent();

  return chunks.map((chunk, index) => ({
    ...chunk,
    chunkIndex: index
  }));
}
