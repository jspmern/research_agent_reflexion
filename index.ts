import { graph } from "./grpah"

async function main(){
   await graph.invoke({ messages: [{ role: "user", content: "what is the react js ?" }] })
}
main()