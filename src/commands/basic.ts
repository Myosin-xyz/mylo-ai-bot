import { Bot, InlineKeyboard } from "grammy"
import { MyContext } from "../types/commands"

// Introduction message
const introductionMessage = `👋 Hello! I'm your Notion-powered Telegram bot.

<b>📋 Notion Commands</b>
/search &lt;query&gt; — Search for pages in Notion
/page &lt;id&gt; — Get full content of a page
/summary &lt;id&gt; — Get a summary of a page
/database &lt;id&gt; — List pages in a database

<b>🤖 Other Commands</b>
/hello — Get a friendly greeting
/about — Learn more about me`

export const registerBasicCommands = (bot: Bot<MyContext>) => {
  // Handle /start command
  bot.command("start", ctx =>
    ctx.reply(introductionMessage, { parse_mode: "HTML" })
  )

  // Handle new members
  bot.on(":new_chat_members:me", ctx =>
    ctx.reply("👋 Hello everyone! I'm Mylo. Try the /hello command!")
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
      "I'm a bot that can help you access Notion content! 🤖\n\nI can search pages, retrieve content, and query databases.",
      { reply_markup: aboutKeyboard }
    )
  )

  // Handle callback queries
  bot.callbackQuery("learn_more", async ctx => {
    await ctx.answerCallbackQuery()
    await ctx.reply(
      `🤖 I can help you with Notion content!\n\n` +
        `📋 Commands:\n` +
        `/search <query> - Search for pages\n` +
        `/page <id> - Get full page content\n` +
        `/summary <id> - Get page summary\n` +
        `/database <id> - List database pages\n\n` +
        `💡 Tip: Get page IDs from search results!`
    )
  })
}
