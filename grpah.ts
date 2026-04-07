import { END, StateGraph } from "@langchain/langgraph";
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
        messages:[ new AIMessage(JSON.stringify(response))],
       repeatCount: 0,
    }
}


/**Todo */
async function reviserAgent(state: typeof StateAnnotation.State) {
     const llmInvokeWithStructureOutPut= llm.withStructuredOutput(questionAnswerSchema)
     const currentDateTime = new Date().toLocaleString('sv-SE');
  const Reviser_SYSTEM_PROMPT = `
You are an advanced AI Revisor Agent in a Reflexion-based system.
Current time: ${currentDateTime}

Your job is to IMPROVE a previous answer using:
- The user's original question
- The previous AI answer
- The reflection (missing + superfluous)
- Search results (Tavily)

---

## INPUT YOU WILL RECEIVE
- User Question
- Previous Answer (JSON)
- Reflection:
  - missing
  - superfluous
- Search Results (array with title, content, url)

---

## YOUR TASK

### 1. Revised Answer (MANDATORY FORMAT)

Your "answer" MUST follow this EXACT structure:

[Improved answer (~200–300 words) with inline citations like [1], [2]]

References:
- [1] <REAL URL from search results>
- [2] <REAL URL from search results>
- [3] <REAL URL from search results>

Rules:
- Use ONLY URLs from provided search results
- DO NOT invent URLs
- Inline citations must match reference numbers
- Remove unnecessary parts from previous answer
- Add missing depth using search results
- Keep answer clear and useful

---

### 2. Reflection

- missing:
  What is STILL missing after revision?

- superfluous:
  What is still unnecessary or could be simplified?

---

### 3. Search Queries

- Provide 1–3 improved queries
- Must address remaining gaps
- Must be more specific than before

---

## STRICT OUTPUT RULES

Return ONLY valid JSON:

{
  "answer": string,
  "reflection": {
    "missing": string,
    "superfluous": string
  },
  "searchQueries": string[]
}

- No markdown
- No extra text
- No explanation outside JSON

---

## IMPORTANT

- This is a REVISION step, not first answer
- Prefer correctness over creativity
- Ground answer using search results
- If search data is weak, reflect that

Think internally, output ONLY final JSON.
`

       const response = await llmInvokeWithStructureOutPut.invoke([
        {
            role: 'system',
            content:Reviser_SYSTEM_PROMPT,
        },
        ...state.messages,
        {
            role: 'system',
            content: `Reflect on the user's original question and the actions taken thus far. Respond using structured output.`,
        },
    ]);

    return {
        messages: [new AIMessage(JSON.stringify(response))],
        repeatCount: state.repeatCount + 1,
    };
}
async function wherToGoNext(state: typeof StateAnnotation.State) {
  console.log("state in where to go next is",state.repeatCount)
    if(state.repeatCount && state.repeatCount >= 2){
      return "__end__"
    }
    return "searchExecutor"
}

export const graph= new StateGraph(StateAnnotation)
.addNode("responder", responderAgent)
.addNode('searchExecutor', searchExecutorTool)
.addNode("reviser", reviserAgent)
.addEdge("__start__", "responder")
.addEdge("responder","searchExecutor")
.addEdge("searchExecutor", "reviser")
.addConditionalEdges("reviser", wherToGoNext,{
    __end__: END,
    searchExecutor: "searchExecutor"
})
.compile()