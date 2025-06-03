import { Bot } from "grammy"
import { MyContext } from "../types/commands"
import { NotionService } from "../services/notion"

export const registerNotionCommands = (
  bot: Bot<MyContext>,
  notion: NotionService
) => {
  // Handle Notion search command
  bot.command("search", async ctx => {
    const query = ctx.match?.toString().trim()

    if (!query) {
      await ctx.reply(
        "🔍 Please provide a search term.\n\nExample: `/search project documentation`",
        { parse_mode: "HTML" }
      )
      return
    }

    try {
      await ctx.reply("🔍 Searching Notion for: " + query)

      const { pages, error } = await notion.searchPages(query)

      if (error) {
        await ctx.reply(`❌ Error: ${error}`)
        return
      }

      if (pages.length === 0) {
        await ctx.reply("📄 No pages found for your search query.")
        return
      }

      let response = `📚 Found ${pages.length} page(s):\n\n`

      for (let i = 0; i < Math.min(pages.length, 5); i++) {
        const page = pages[i]

        // Extract title from properties
        let title = "Untitled"
        for (const [, property] of Object.entries(page.properties)) {
          if (property.type === "title" && property.title) {
            title = property.title.map(t => t.plain_text).join("")
            break
          }
        }

        response += `${i + 1}. **${title}**\n`
        response += `📅 Last edited: ${new Date(
          page.last_edited_time
        ).toLocaleDateString()}\n`
        response += `🔗 [View Page](${page.url})\n`
        response += `📄 Use \`/page ${page.id}\` to get content\n\n`
      }

      if (pages.length > 5) {
        response += `... and ${pages.length - 5} more pages.`
      }

      await ctx.reply(response, { parse_mode: "Markdown" })
    } catch (error) {
      console.error("Search command error:", error)
      await ctx.reply(
        "❌ An error occurred while searching. Please try again later."
      )
    }
  })

  // Handle getting page content
  bot.command("page", async ctx => {
    const pageId = ctx.match?.toString().trim()

    if (!pageId) {
      await ctx.reply(
        "📄 Please provide a page ID.\n\nExample: `/page abc123def456`",
        { parse_mode: "HTML" }
      )
      return
    }

    try {
      await ctx.reply("📖 Retrieving page content...")

      const { content, error } = await notion.getPageContent(pageId)

      if (error) {
        await ctx.reply(`❌ Error: ${error}`)
        return
      }

      if (!content.trim()) {
        await ctx.reply(
          "📄 This page appears to be empty or contains unsupported content types."
        )
        return
      }

      // Split content if it's too long for Telegram
      const maxLength = 4000
      if (content.length <= maxLength) {
        await ctx.reply(content, { parse_mode: "Markdown" })
      } else {
        // Send in chunks
        const chunks: string[] = []
        for (let i = 0; i < content.length; i += maxLength) {
          chunks.push(content.slice(i, i + maxLength))
        }

        for (let i = 0; i < chunks.length; i++) {
          await ctx.reply(
            `📄 Part ${i + 1}/${chunks.length}:\n\n${chunks[i]}`,
            {
              parse_mode: "Markdown"
            }
          )
        }
      }
    } catch (error) {
      console.error("Page command error:", error)
      await ctx.reply(
        "❌ An error occurred while retrieving the page. Please try again later."
      )
    }
  })

  // Handle getting page summary
  bot.command("summary", async ctx => {
    const pageId = ctx.match?.toString().trim()

    if (!pageId) {
      await ctx.reply(
        "📋 Please provide a page ID.\n\nExample: `/summary abc123def456`",
        { parse_mode: "HTML" }
      )
      return
    }

    try {
      await ctx.reply("📋 Getting page summary...")

      const { summary, error } = await notion.getPageSummary(pageId)

      if (error) {
        await ctx.reply(`❌ Error: ${error}`)
        return
      }

      if (!summary.trim()) {
        await ctx.reply("📄 No summary available for this page.")
        return
      }

      await ctx.reply(summary, { parse_mode: "Markdown" })
    } catch (error) {
      console.error("Summary command error:", error)
      await ctx.reply(
        "❌ An error occurred while getting the summary. Please try again later."
      )
    }
  })

  // Handle querying a database
  bot.command("database", async ctx => {
    const databaseId = ctx.match?.toString().trim()

    if (!databaseId) {
      await ctx.reply(
        "🗃️ Please provide a database ID.\n\nExample: `/database abc123def456`",
        { parse_mode: "HTML" }
      )
      return
    }

    try {
      await ctx.reply("🗃️ Querying database...")

      const { pages, error } = await notion.queryDatabase(databaseId)

      if (error) {
        await ctx.reply(`❌ Error: ${error}`)
        return
      }

      if (pages.length === 0) {
        await ctx.reply("📄 No pages found in this database.")
        return
      }

      let response = `🗃️ Database contains ${pages.length} page(s):\n\n`

      for (let i = 0; i < Math.min(pages.length, 10); i++) {
        const page = pages[i]

        // Extract title from properties
        let title = "Untitled"
        for (const [, property] of Object.entries(page.properties)) {
          if (property.type === "title" && property.title) {
            title = property.title.map(t => t.plain_text).join("")
            break
          }
        }

        response += `${i + 1}. **${title}**\n`
        response += `📄 Use \`/page ${page.id}\` to get content\n\n`
      }

      if (pages.length > 10) {
        response += `... and ${pages.length - 10} more pages.`
      }

      await ctx.reply(response, { parse_mode: "Markdown" })
    } catch (error) {
      console.error("Database command error:", error)
      await ctx.reply(
        "❌ An error occurred while querying the database. Please try again later."
      )
    }
  })

  // Add test-notion command
  bot.command("test", async ctx => {
    try {
      await ctx.reply("🧪 Testing Notion connection...")

      // Try to search for any pages
      const { pages, error } = await notion.searchPages("Proposal")

      if (error) {
        await ctx.reply(`❌ Error: ${error}`)
        return
      }

      if (pages.length === 0) {
        await ctx.reply(
          "✅ Connection successful! But no pages found.\n\nMake sure to:\n1. Share some pages with your integration\n2. Try /search <query> to search for specific content"
        )
        return
      }

      let response = "✅ Connection successful! Found pages:\n\n"

      // Show first 3 pages
      for (let i = 0; i < Math.min(pages.length, 3); i++) {
        const page = pages[i]
        let title = "Untitled"
        for (const [, property] of Object.entries(page.properties)) {
          if (property.type === "title" && property.title) {
            title = property.title.map(t => t.plain_text).join("")
            break
          }
        }
        response += `${i + 1}. ${title}\n`
      }

      if (pages.length > 3) {
        response += `\n... and ${pages.length - 3} more pages`
      }

      response += "\n\nTry /search <query> to search for specific content"
      await ctx.reply(response)
    } catch (error) {
      console.error("Test command error:", error)
      await ctx.reply(
        "❌ Error testing Notion connection. Please check:\n1. Your NOTION_TOKEN is correct\n2. The integration has proper permissions\n3. Some pages are shared with the integration"
      )
    }
  })

  // Handle users command
  bot.command("users", async ctx => {
    const users = await notion.getUsers()
    const userList = users.map(user => `${user.id} - ${user.name}`).join("\n")
    ctx.reply(userList)
  })
}
