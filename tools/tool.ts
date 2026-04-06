import type { StateAnnotation } from "../state/State";
import { TavilySearch } from "@langchain/tavily";

const tool = new TavilySearch({
  maxResults: 2,
  topic: "general",
});

export function searchExecutorTool(state : typeof StateAnnotation.State) {
    //console.log("state is",state.messages[state.messages.length-1]?.content)
    const parseData= JSON.parse(state.messages[state.messages.length-1]?.content )
    console.log("search query is",parseData.searchQueries)
    return state
}