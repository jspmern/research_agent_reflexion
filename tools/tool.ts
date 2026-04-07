import { HumanMessage } from "@langchain/core/messages";
import type { StateAnnotation } from "../state/State";
import { TavilySearch } from "@langchain/tavily";

const search = new TavilySearch({
  maxResults: 2,
  topic: "general",
});

export async function searchExecutorTool(state : typeof StateAnnotation.State) {
    //console.log("state is",state.messages[state.messages.length-1]?.content)
    const parseData= JSON.parse(state.messages[state.messages.length-1]?.content )
     const response= await search.batch(parseData.searchQueries.map((query:string)=>({ query })))
        const cleanedResults = [];
        response.map((res)=>{
            const query = res.query;
            res.results.map((result:any)=>{
                cleanedResults.push({
                    query,
                    title: result.title,
                    url: result.url,
                    content: result.content,
                })
            })
        })
    return {
        messages:  [new HumanMessage(JSON.stringify({ searchResults: cleanedResults }))]
    }
}