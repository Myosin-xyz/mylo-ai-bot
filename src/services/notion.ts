import { Client } from "@notionhq/client"
import { z } from "zod"
import { iteratePaginatedAPI } from "@notionhq/client"
import {
  NotionPageSchema,
  NotionBlockSchema,
  NotionDatabaseQuerySchema
} from "../types/notion"

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
  async queryDatabase(databaseId: string): Promise<{
    pages: NotionPage[]
    error: string | null
  }> {
    try {
      if (!databaseId.trim()) {
        return { pages: [], error: "Database ID cannot be empty" }
      }

      const response = await this.client.databases.query({
        database_id: databaseId
      })

      return { pages: response.results as NotionPage[], error: null }
    } catch (error) {
      console.error("Failed to query database:", error)
      return { pages: [], error: "Failed to query Notion database" }
    }
  }

  /**
   * Get all users from Notion
   * @returns Array of Notion users
   */
  async getUsers(): Promise<any[]> {
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
  async getPageContent(pageId: string): Promise<{
    content: string
    error: string | null
  }> {
    try {
      if (!pageId.trim()) {
        return { content: "", error: "Page ID cannot be empty" }
      }

      console.log("Fetching blocks for page:", pageId)
      const blocks = await this.client.blocks.children.list({
        block_id: pageId
      })

      if (!blocks.results || blocks.results.length === 0) {
        console.log("No blocks found for page:", pageId)
        return { content: "This page appears to be empty.", error: null }
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

      return { content: content.trim(), error: null }
    } catch (error) {
      console.error("Failed to get page content:", error)
      return { content: "", error: "Failed to retrieve page content" }
    }
  }

  /**
   * Search for pages in Notion
   * @param query - The search query
   * @returns Array of matching pages
   */
  async searchPages(query: string): Promise<{
    pages: NotionPage[]
    error: string | null
  }> {
    try {
      if (!query.trim()) {
        return { pages: [], error: "Search query cannot be empty" }
      }

      const response = await this.client.search({
        query,
        filter: {
          property: "object",
          value: "page"
        }
      })

      return { pages: response.results as NotionPage[], error: null }
    } catch (error) {
      console.error("Search failed:", error)
      return { pages: [], error: "Failed to search Notion pages" }
    }
  }

  /**
   * Get a summary of a page including title and first few blocks
   * @param pageId - The ID of the Notion page
   * @returns Formatted page summary
   */
  async getPageSummary(pageId: string): Promise<{
    summary: string
    error: string | null
  }> {
    try {
      if (!pageId.trim()) {
        return { summary: "", error: "Page ID cannot be empty" }
      }

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

      return { summary: summary.trim(), error: null }
    } catch (error) {
      console.error("Failed to get page summary:", error)
      return { summary: "", error: "Failed to retrieve page summary" }
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
