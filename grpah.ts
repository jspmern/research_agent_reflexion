import { StateGraph } from "@langchain/langgraph";
import { StateAnnotation } from "./state/State";
import { llm } from "./model/llm";
import { questionAnswerSchema } from "./schema/Schema";
import { searchExecutorTool } from "./tools/tool";
import { AIMessage } from "@langchain/core/messages";

async function responderAgent(state: typeof StateAnnotation.State) {
    const llmInvokeWithStructureOutPut= llm.withStructuredOutput(questionAnswerSchema)
     const currentDateTime = new Date().toLocaleString('sv-SE');
    const systemPrompt=`You are an expert research assistant and critical thinker.
    Current time: ${currentDateTime}

Your task is to answer the user’s question in a clear, detailed, and well-structured way, and then critically evaluate your own answer.

You MUST strictly follow the required JSON structure and return ONLY valid JSON. Do not include any extra text outside the JSON.

Guidelines:

1. Answer:
- Provide a high-quality, detailed answer (~200–300 words).
- Make it clear, practical, and easy to understand.
- Use examples where helpful.
- Avoid vague or generic explanations.

2. Reflection:
- missing:
  - Identify what important details, perspectives, or depth are missing from your answer.
  - Be honest and analytical.
- superfluous:
  - Identify anything unnecessary, redundant, or overly verbose in your answer.

3. Search Queries:
- Provide 1 to 3 highly relevant search queries.
- These queries should help improve the weaknesses identified in the reflection.
- Make them specific and actionable (not generic).

Output Rules (STRICT):
- Return ONLY valid JSON.
- Follow the exact schema:
  {
    "answer": string,
    "reflection": {
      "missing": string,
      "superfluous": string
    },
    "searchQueries": string[]
  }
- Do NOT include explanations, markdown, or text outside JSON.
- Do NOT change field names.

Think step-by-step internally, but only output the final JSON.`
    const response= await llmInvokeWithStructureOutPut.invoke([
        { role: "system", content: systemPrompt },
         ...state.messages,
          {
            role: 'system',
            content: `Reflect on the user's original question and the actions taken thus far. Respond using structured output.`,
        }
    ])
    return {
        messages:[ new AIMessage(JSON.stringify(response))]
    }
}


/**Todo */
function reviserAgent(state: typeof StateAnnotation.State) {
    //llm.withStructuredOutput
    return state
}

export const graph= new StateGraph(StateAnnotation)
.addNode("responder", responderAgent)
.addNode('searchExecutor', searchExecutorTool)
/**Todo */
// .addNode("searchExecutor", searchExecutorTool)
// .addNode("reviser", reviserAgent)
.addEdge("__start__", "responder")
.addEdge("responder","searchExecutor")
.addEdge("searchExecutor", "__end__")
.compile()