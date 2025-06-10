import { Context } from "grammy"
import { NotionService } from "../services/notion"
import { EarningsService } from "../services/earnings"

/**
 * Handles messages that start with "Hey Mylo" and extracts search queries or earnings requests
 * @param ctx - The Telegram context
 * @param notion - The Notion service instance
 * @param earnings - The Earnings service instance
 * @param messageText - The full message text (already lowercased)
 */
export async function handleMyloMessage(
  ctx: Context,
  notion: NotionService,
  earnings: EarningsService | null,
  messageText: string
): Promise<void> {
  try {
    // Extract the original message for processing
    const originalText = ctx.message?.text || messageText

    // Check if this is an earnings query
    const earningsQuery = extractEarningsQuery(messageText, originalText)
    if (earningsQuery) {
      await handleEarningsQuery(ctx, earnings, earningsQuery)
      return
    }

    // Extract the search query after "hey mylo"
    const searchQuery = extractSearchQuery(messageText, originalText)

    if (!searchQuery) {
      await ctx.reply(
        "👋 Hey there! I'm Mylo, your assistant.\n\n" +
          "You can ask me to:\n" +
          '• Search Notion: "Hey Mylo, search for project proposals"\n' +
          '• Check earnings: "Hey Mylo, how much have I earned?"\n' +
          '• Check monthly earnings: "Hey Mylo, how much have I earned in May?"\n\n' +
          "What would you like me to help you with?"
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

/**
 * Extracts earnings query information from a "Hey Mylo" message
 * @param messageText - The full message text (lowercased for trigger detection)
 * @param originalText - The original message text with proper casing
 * @returns Earnings query info or null if not an earnings query
 */
function extractEarningsQuery(
  messageText: string,
  originalText?: string
): { month?: string } | null {
  const textToProcess = (originalText || messageText).toLowerCase()

  // Remove "hey mylo" from the beginning
  const withoutTrigger = textToProcess.replace(/^hey mylo[,\s]*/i, "").trim()

  // Check for earnings-related keywords
  const earningsPatterns = [
    /(?:how much (?:have )?i (?:earned|made))/i,
    /(?:my earnings)/i,
    /(?:what (?:have )?i (?:earned|made))/i,
    /(?:total earnings)/i
  ]

  const isEarningsQuery = earningsPatterns.some(pattern =>
    pattern.test(withoutTrigger)
  )

  if (!isEarningsQuery) {
    return null
  }

  // Extract month if mentioned
  const monthPatterns = [
    /in (january|february|march|april|may|june|july|august|september|october|november|december)/i,
    /for (january|february|march|april|may|june|july|august|september|october|november|december)/i,
    /during (january|february|march|april|may|june|july|august|september|october|november|december)/i
  ]

  for (const pattern of monthPatterns) {
    const match = withoutTrigger.match(pattern)
    if (match && match[1]) {
      return { month: match[1] }
    }
  }

  return {} // Empty object means earnings query without month filter
}

/**
 * Handles earnings-related queries
 * @param ctx - The Telegram context
 * @param earnings - The earnings service instance
 * @param query - The parsed earnings query
 */
async function handleEarningsQuery(
  ctx: Context,
  earnings: EarningsService | null,
  query: { month?: string }
): Promise<void> {
  try {
    if (!earnings) {
      await ctx.reply(
        "💰 Earnings service is not available. Please check the Airtable configuration."
      )
      return
    }

    // Get user's telegram handle
    const telegramHandle = ctx.from?.username
    if (!telegramHandle) {
      await ctx.reply(
        "❌ Could not determine your Telegram handle. Please make sure you have a username set."
      )
      return
    }

    const monthText = query.month ? ` for ${query.month}` : ""
    await ctx.reply(`💰 Calculating your earnings${monthText}...`)

    // Calculate earnings
    const result = await earnings.calculateUserEarnings(
      telegramHandle,
      query.month
    )

    // Format and send response
    const message = earnings.formatEarningsMessage(result, telegramHandle)
    await ctx.reply(message, { parse_mode: "Markdown" })
  } catch (error) {
    console.error("Earnings query error:", error)
    await ctx.reply(
      "❌ Sorry, I encountered an error while calculating your earnings. Please try again later."
    )
  }
}
