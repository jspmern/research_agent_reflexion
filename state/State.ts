import { Annotation, MessagesAnnotation } from "@langchain/langgraph";

export interface QAResponse {
  answer: string;
  reflection: {
    missing: string;
    superfluous: string;
  };
  searchQueries: string[];
}

export interface SearchResult {
  query: string;
  title: string;
  url: string;
  content: string;
}

export const StateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,

  // structured answer
  currentAnswer: Annotation<QAResponse>(),

  // tavily results
  searchResults: Annotation<SearchResult[]>(),

  // loop counter
  repeatCount: Annotation<number>(),
});