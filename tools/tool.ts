import { TavilySearch } from "@langchain/tavily";
import type { StateAnnotation } from "../state/State";

const search = new TavilySearch({
  maxResults: 2,
  topic: "general",
});

export async function searchExecutorTool(
  state: typeof StateAnnotation.State
) {
  const queries = state.currentAnswer.searchQueries;

  const response = await search.batch(
    queries.map((query: string) => ({ query }))
  );

  const cleanedResults: any[] = [];

  response.forEach((res: any) => {
    const query = res.query;

    res.results.forEach((result: any) => {
      cleanedResults.push({
        query,
        title: result.title,
        url: result.url,
        content: result.content,
      });
    });
  });

  return {
    searchResults: cleanedResults,
  };
}