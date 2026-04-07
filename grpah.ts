import { END, StateGraph } from "@langchain/langgraph";
import { StateAnnotation } from "./state/State";
import { llm } from "./model/llm";
import { questionAnswerSchema } from "./schema/Schema";
import { searchExecutorTool } from "./tools/tool";
import { AIMessage } from "@langchain/core/messages";

export async function responderAgent(state: typeof StateAnnotation.State) {
  const structuredLLM = llm.withStructuredOutput(questionAnswerSchema);

  const SYSTEM_PROMPT = `
You are an expert research assistant.

Provide:
- Detailed answer (~250 words)
- Reflection (missing + superfluous)
- 1-3 search queries

Return ONLY JSON.
`;

  const response = await structuredLLM.invoke([
    { role: "system", content: SYSTEM_PROMPT },
    ...state.messages,
  ]);

  return {
    currentAnswer: response,

    messages: [new AIMessage(`Initial Answer:\n${response.answer}`)],

    repeatCount: 0,
  };
}

export async function reviserAgent(state: typeof StateAnnotation.State) {
  const structuredLLM = llm.withStructuredOutput(questionAnswerSchema);

  const PROMPT = `
You are a revision agent.

Improve answer using:
- reflection
- search results

Add citations like [1].

Return ONLY JSON.
`;

  const response = await structuredLLM.invoke([
    {
      role: "system",
      content: PROMPT,
    },
    {
      role: "user",
      content: `
QUESTION:
${state.messages[0]?.content}

PREVIOUS ANSWER:
${state.currentAnswer.answer}

MISSING:
${state.currentAnswer.reflection.missing}

SEARCH RESULTS:
${JSON.stringify(state.searchResults)}
`,
    },
  ]);

  return {
    currentAnswer: response,

    messages: [new AIMessage(`Revised Answer:\n${response.answer}`)],

    repeatCount: state.repeatCount + 1,
  };
}
export function whereToGoNext(state: typeof StateAnnotation.State) {
  if (state.repeatCount >= 2) {
    return "__end__";
  }

  const missing = state.currentAnswer.reflection.missing.toLowerCase();

  if (missing.includes("nothing") || missing.includes("complete")) {
    return "__end__";
  }

  return "searchExecutor";
}

export const graph = new StateGraph(StateAnnotation)
  .addNode("responder", responderAgent)
  .addNode("searchExecutor", searchExecutorTool)
  .addNode("reviser", reviserAgent)
  .addEdge("__start__", "responder")
  .addEdge("responder", "searchExecutor")
  .addEdge("searchExecutor", "reviser")
  .addConditionalEdges("reviser", whereToGoNext, {
    __end__: END,
    searchExecutor: "searchExecutor",
  })
  .compile();
