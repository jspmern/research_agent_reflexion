import { graph } from "./grpah"
import readline from "readline"

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function ask(question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve))
}

async function main() {
  while (true) {
    const input = await ask("Enter prompt (type bye to exit): ")
    if (input.trim().toLowerCase() === "bye") {
      console.log("bye")
      break
    }

    const result = await graph.invoke({
      messages: [{ role: "user", content: input }],
    })
    const lastMessage = result.messages?.[result.messages.length - 1]
    if (lastMessage?.content) {
      console.log(lastMessage.content)
    } else {
      console.log("No response available.")
    }
  }

  rl.close()
}

main()