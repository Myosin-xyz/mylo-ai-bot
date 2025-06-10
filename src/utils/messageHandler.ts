import { Context } from "grammy"
import { NotionService } from "../services/notion"

/**
 * Handles messages that start with "Hey Mylo" and extracts search queries
 * @param ctx - The Telegram context
 * @param notion - The Notion service instance
 * @param messageText - The full message text (already lowercased)
 */
export async function handleMyloMessage(
  ctx: Context,
  notion: NotionService,
  messageText: string
): Promise<void> {
  try {
    // Extract the search query after "hey mylo"
    const originalText = ctx.message?.text || messageText
    const searchQuery = extractSearchQuery(messageText, originalText)

    if (!searchQuery) {
      await ctx.reply(
        "👋 Hey there! I'm Mylo, your Notion assistant.\n\n" +
          "You can ask me to search for things like:\n" +
          '• "Hey Mylo, search for project proposals"\n' +
          '• "Hey Mylo, find documentation about APIs"\n' +
          '• "Hey Mylo, look for meeting notes"\n\n' +
          "What would you like me to search for?"
      )
      return
    }

    // Acknowledge the request
    await ctx.reply(`🔍 Searching Notion for: "${searchQuery}"...`)

    // Use the existing search functionality
    const { pages, error } = await notion.searchPages(searchQuery)

    if (error) {
      await ctx.reply(`❌ Error: ${error}`)
      return
    }

    if (pages.length === 0) {
      await ctx.reply(
        `📄 No pages found for "${searchQuery}".\n\n` +
          "Try rephrasing your search or using different keywords."
      )
      return
    }

    // Format and send results
    let response = `📚 Found ${pages.length} page(s) for "${searchQuery}":\n\n`

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
    console.error("Mylo message handler error:", error)
    await ctx.reply(
      "❌ Sorry, I encountered an error while processing your request. Please try again later."
    )
  }
}

/**
 * Extracts the search query from a "Hey Mylo" message
 * @param messageText - The full message text (lowercased for trigger detection)
 * @param originalText - The original message text with proper casing
 * @returns The extracted search query or null if none found
 */
function extractSearchQuery(
  messageText: string,
  originalText?: string
): string | null {
  // Use the original text for extraction to preserve case
  const textToProcess = originalText || messageText

  // Remove "hey mylo" from the beginning (case insensitive)
  const withoutTrigger = textToProcess.replace(/^hey mylo[,\s]*/i, "").trim()

  if (!withoutTrigger) {
    return null
  }

  // Handle common search patterns
  const searchPatterns = [
    /^(?:can you\s+)?(?:search|find|look)\s+(?:for\s+)?(.+)$/i,
    /^(?:please\s+)?(?:search|find|look)\s+(?:for\s+)?(.+)$/i,
    /^(?:i\s+)?(?:need|want)\s+(?:to\s+find\s+)?(.+)$/i,
    /^(?:help\s+me\s+)?(?:find|search)\s+(?:for\s+)?(.+)$/i,
    /^(.+)$/ // Fallback: use the entire remaining text
  ]

  for (const pattern of searchPatterns) {
    const match = withoutTrigger.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }

  return withoutTrigger
}
