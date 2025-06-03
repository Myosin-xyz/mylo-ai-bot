import { Bot, Context, session, SessionFlavor, webhookCallback } from "grammy"
import express from "express"
import { registerAllCommands } from "./commands"
import { NotionService } from "./services/notion"

// This is the data that will be saved per chat.
export interface SessionData {
  messageCount: number
}

// flavor the context type to include sessions
type MyContext = Context & SessionFlavor<SessionData>

// Create a bot using the Telegram token
export const bot = new Bot<MyContext>(process.env.TELEGRAM_TOKEN || "")

// Initialize session middleware
bot.use(session({ initial: () => ({ messageCount: 0 }) }))

// Initialize Notion service
const notion = new NotionService()

// Count messages
bot.on("message", async (ctx, next) => {
  ctx.session.messageCount++
  await next()
})

// Register all commands
registerAllCommands(bot, notion)

// Catch errors and log them
bot.catch(err => console.error(err))

// Start the server
if (process.env.NODE_ENV === "production") {
  // Use Webhooks for the production server
  const app = express()
  app.use(express.json())
  app.use(webhookCallback(bot, "express"))

  const PORT = process.env.PORT || 3000
  app.listen(PORT, () => {
    console.log(`Bot listening on port ${PORT}`)
  })
} else {
  // Use Long Polling for development
  console.log("Starting bot in development mode...")
  bot.start()
}
