export type RetrievalHit = {
  chunkId: string;
  content: string;
  sectionTitle: string | null;
  pageNumber: number | null;
  similarity: number;
};

export async function retrieveRulebookContext({
  gameId,
  question
}: {
  gameId: string;
  question: string;
}): Promise<RetrievalHit[]> {
  void gameId;
  void question;

  return [
    {
      chunkId: "mock-setup",
      content:
        "Mock context: retrieve relevant chunks from rulebook_chunks with pgvector, then expand with graph neighbors from rulebook_graph_edges.",
      sectionTitle: "Retrieval placeholder",
      pageNumber: null,
      similarity: 1
    }
  ];
}
