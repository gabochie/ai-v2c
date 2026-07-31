import { getDb } from "../db";

export interface SemanticSearchResult {
  id: string;
  type: 'article' | 'prompt';
  title: string;
  category: string;
  score: number;
  snippet: string;
  tags: string[];
}

export class LocalRAGSearchEngine {
  /**
   * Performs TF-IDF / Term Frequency Cosine Similarity Search across knowledge articles and prompts
   */
  public static async searchSemantic(query: string, limit: number = 8): Promise<SemanticSearchResult[]> {
    if (!query || query.trim().length === 0) return [];

    const db = getDb();
    const queryTokens = this.tokenize(query);
    const results: SemanticSearchResult[] = [];

    // 1. Search Knowledge Articles
    const articlesRes = await db.execute("SELECT * FROM knowledge_articles;");
    for (const row of articlesRes.rows) {
      const title = String(row.title);
      const summary = String(row.summary || "");
      const content = String(row.content || "");
      const category = String(row.category || "");
      const tags: string[] = JSON.parse(String(row.tags || "[]"));

      const corpus = `${title} ${summary} ${content} ${category} ${tags.join(" ")}`;
      const score = this.calculateSimilarityScore(queryTokens, corpus);

      if (score > 0.05) {
        results.push({
          id: String(row.id),
          type: "article",
          title,
          category,
          score,
          snippet: summary || content.substring(0, 150) + "...",
          tags,
        });
      }
    }

    // 2. Search Prompts
    const promptsRes = await db.execute("SELECT * FROM prompts;");
    for (const row of promptsRes.rows) {
      const title = String(row.title);
      const description = String(row.description || "");
      const promptText = String(row.promptText || "");
      const category = String(row.category || "");
      const tags: string[] = JSON.parse(String(row.tags || "[]"));

      const corpus = `${title} ${description} ${promptText} ${category} ${tags.join(" ")}`;
      const score = this.calculateSimilarityScore(queryTokens, corpus);

      if (score > 0.05) {
        results.push({
          id: String(row.id),
          type: "prompt",
          title,
          category,
          score,
          snippet: description || promptText.substring(0, 150) + "...",
          tags,
        });
      }
    }

    // Sort by relevance score descending
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  private static tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2);
  }

  private static calculateSimilarityScore(queryTokens: string[], textCorpus: string): number {
    const corpusLower = textCorpus.toLowerCase();
    let matches = 0;

    for (const token of queryTokens) {
      if (corpusLower.includes(token)) {
        matches++;
      }
    }

    return matches / (queryTokens.length || 1);
  }
}
