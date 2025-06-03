import { Client, UserObjectResponse } from "@notionhq/client"
import { z } from "zod"
import { iteratePaginatedAPI } from "@notionhq/client"
import { User } from "@grammyjs/types"

// Zod schemas for Notion API responses
const NotionRichTextSchema = z.object({
  type: z.string(),
  text: z
    .object({
      content: z.string()
    })
    .optional(),
  plain_text: z.string()
})

const NotionPropertySchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.array(NotionRichTextSchema).optional(),
  rich_text: z.array(NotionRichTextSchema).optional()
})

const NotionPageSchema = z.object({
  id: z.string(),
  properties: z.record(z.string(), NotionPropertySchema),
  url: z.string(),
  created_time: z.string(),
  last_edited_time: z.string()
})

const NotionBlockContentSchema = z.object({
  rich_text: z.array(NotionRichTextSchema)
})

const NotionBlockSchema = z.object({
  id: z.string(),
  type: z.string(),
  paragraph: NotionBlockContentSchema.optional(),
  heading_1: NotionBlockContentSchema.optional(),
  heading_2: NotionBlockContentSchema.optional(),
  heading_3: NotionBlockContentSchema.optional(),
  bulleted_list_item: NotionBlockContentSchema.optional(),
  numbered_list_item: NotionBlockContentSchema.optional()
})

const NotionDatabaseQuerySchema = z.object({
  results: z.array(NotionPageSchema),
  next_cursor: z.string().nullable(),
  has_more: z.boolean()
})

// Infer TypeScript types from Zod schemas
export type NotionPage = z.infer<typeof NotionPageSchema>
export type NotionBlock = z.infer<typeof NotionBlockSchema>
export type NotionDatabaseQuery = z.infer<typeof NotionDatabaseQuerySchema>

/**
 * Service class for interacting with the Notion API
 */
export class NotionService {
  private client: Client

  constructor() {
    if (!process.env.NOTION_TOKEN) {
      throw new Error("NOTION_TOKEN environment variable is required")
    }

    this.client = new Client({
      auth: process.env.NOTION_TOKEN
    })
  }

  /**
   * Query a Notion database and return all pages
   * @param databaseId - The ID of the Notion database
   * @returns Array of pages from the database
   */
  async queryDatabase(databaseId: string): Promise<NotionPage[]> {
    try {
      const response = await this.client.databases.query({
        database_id: databaseId
      })

      const validatedResponse = NotionDatabaseQuerySchema.parse(response)
      return validatedResponse.results
    } catch (error) {
      console.error("Error querying Notion database:", error)
      throw new Error("Failed to query Notion database")
    }
  }

  /**
   * Get all users from Notion
   * @returns Array of Notion users
   */
  async getUsers(): Promise<UserObjectResponse[]> {
    try {
      const listUsersResponse = await this.client.users.list({})
      return listUsersResponse.results
    } catch (error) {
      console.error("Error getting Notion users:", error)
      throw new Error("Failed to get Notion users")
    }
  }

  /**
   * Get the content of a specific Notion page
   * @param pageId - The ID of the Notion page
   * @returns The page content as formatted text
   */
  async getPageContent(pageId: string): Promise<string | undefined> {
    try {
      console.log("Fetching blocks for page:", pageId)
      const blocks = await this.client.blocks.children.list({
        block_id: pageId
      })

      if (!blocks.results || blocks.results.length === 0) {
        console.log("No blocks found for page:", pageId)
        return "This page appears to be empty."
      }

      console.log("Found blocks:", blocks.results.length)
      let content = ""

      for (const block of blocks.results) {
        // Type assertion since we know the structure
        const typedBlock = block as any
        const blockText = this.formatBlock(typedBlock)
        if (blockText.trim()) {
          content += blockText + "\n"
        }
      }

      return content.trim()
    } catch (error) {
      console.error("Error getting Notion page content:", error)
      if (error instanceof Error) {
        if (error.message === "unauthorized") {
          throw new Error(
            "Not authorized to access this page. Please ensure the page is shared with your integration."
          )
        } else if (error.message === "object_not_found") {
          throw new Error("Page not found. Please check the page ID.")
        }
        throw new Error("Failed to get page content")
      }
    }
  }

  /**
   * Search for pages in Notion
   * @param query - The search query
   * @returns Array of matching pages
   */
  async searchPages(query: string): Promise<NotionPage[]> {
    try {
      const response = await this.client.search({
        query
      })

      console.log("results", response.results)
      return response.results
        .filter((result: any) => result.object === "page")
        .map((page: any) => NotionPageSchema.parse(page))
    } catch (error) {
      console.error("Error searching Notion pages:", error)
      throw new Error("Failed to search pages")
    }
  }

  /**
   * Get a summary of a page including title and first few blocks
   * @param pageId - The ID of the Notion page
   * @returns Formatted page summary
   */
  async getPageSummary(pageId: string): Promise<string> {
    try {
      // Get page details
      const page = await this.client.pages.retrieve({ page_id: pageId })
      const validatedPage = NotionPageSchema.parse(page)

      // Get page title
      let title = "Untitled"
      for (const [, property] of Object.entries(validatedPage.properties)) {
        if (property.type === "title" && property.title) {
          title = property.title.map(t => t.plain_text).join("")
          break
        }
      }

      // Get first few blocks for summary
      const blocks = await this.client.blocks.children.list({
        block_id: pageId,
        page_size: 5
      })

      let summary = `**${title}**\n\n`

      for (const block of blocks.results.slice(0, 3)) {
        const typedBlock = block as any
        const blockText = this.formatBlock(typedBlock)
        if (blockText.trim()) {
          summary += blockText + "\n"
        }
      }

      return summary.trim()
    } catch (error) {
      console.error("Error getting Notion page summary:", error)
      throw new Error("Failed to get page summary")
    }
  }

  /**
   * Retrieve all blocks from a page
   * @param pageId - The ID of the Notion page
   * @returns Array of blocks
   */
  async retrieveBlockChildren(pageId: string) {
    console.log("Retrieving blocks (async)...")
    const blocks = []

    // Use iteratePaginatedAPI helper function to get all blocks first-level blocks on the page
    for await (const block of iteratePaginatedAPI(
      this.client.blocks.children.list,
      {
        block_id: pageId // A page ID can be passed as a block ID: https://developers.notion.com/docs/working-with-page-content#modeling-content-as-blocks
      }
    )) {
      blocks.push(block)
    }

    return blocks
  }

  /**
   * Format a Notion block into readable text
   * @param block - The Notion block to format
   * @returns Formatted text representation of the block
   */
  private formatBlock(block: { type: string; [key: string]: any }): string {
    const type = block.type
    const blockData = block[type]

    if (!blockData || !blockData.rich_text) {
      return ""
    }

    const text = blockData.rich_text.map((t: any) => t.plain_text).join("")

    switch (type) {
      case "paragraph":
        return text

      case "heading_1":
        return "# " + text

      case "heading_2":
        return "## " + text

      case "heading_3":
        return "### " + text

      case "bulleted_list_item":
        return "• " + text

      case "numbered_list_item":
        return "1. " + text

      default:
        return text
    }
  }
}
