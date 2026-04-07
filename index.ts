import { graph } from "./grpah"

async function main(){
   const result=  await graph.invoke({ messages: [{ role: "user", content: "logic junior by jyoti mishra" }] })
   console.log(result.messages[result.messages.length-1].content)
}
main()