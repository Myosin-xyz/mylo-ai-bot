import {
  Bot,
  Context,
  InlineKeyboard,
  session,
  SessionFlavor,
  webhookCallback
} from "grammy"
import express from "express"

// This is the data that will be saved per chat.
export interface SessionData {
  messageCount: number
}

// flavor the context type to include sessions
type MyContext = Context & SessionFlavor<SessionData>

// Create a bot using the Telegram token
export const bot = new Bot<MyContext>(process.env.TELEGRAM_TOKEN || "")

bot.use(session({ initial: () => ({ messageCount: 0 }) }))

// Count messages
bot.on("message", async (ctx, next) => {
  ctx.session.messageCount++
  await next()
})

// Handle /start command
bot.command("start", ctx =>
  ctx.reply("👋 Hello! I'm a simple bot. Try the /hello command!")
)

// Handle new members
bot.on(":new_chat_members:me", ctx =>
  ctx.reply("👋 Hello everyone! I'm a simple bot. Try the /hello command!")
)

// Handle the main /hello command
bot.command("hello", async ctx => {
  const name = ctx.from?.first_name || "there"
  const messageCount = ctx.session.messageCount

  await ctx.reply(
    `🌟 Hello ${name}! 
    
You've sent ${messageCount} messages since I've been here.
    
Have a wonderful day! ✨`,
    { parse_mode: "HTML" }
  )
})

// Handle the /about command with a simple keyboard
const aboutKeyboard = new InlineKeyboard().text("Learn More", "learn_more")

bot.command("about", ctx =>
  ctx.reply(
    "I'm a simple hello bot! 🤖\n\nI can greet you and count your messages.",
    { reply_markup: aboutKeyboard }
  )
)

// Handle callback queries
bot.callbackQuery("learn_more", async ctx => {
  await ctx.answerCallbackQuery()
  await ctx.reply("There's not much more to learn! I just say hello! 😄")
})

// Set bot commands for the menu
bot.api.setMyCommands([
  {
    command: "hello",
    description: "Get a friendly hello message"
  },
  {
    command: "about",
    description: "Learn about this bot"
  }
])

// Introduction message
const introductionMessage = `👋 Hello! I'm a simple Telegram bot.

<b>Commands</b>
/hello — Get a friendly greeting
/about — Learn more about me`

bot.command("start", ctx =>
  ctx.reply(introductionMessage, { parse_mode: "HTML" })
)

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
