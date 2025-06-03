import { UserObjectResponse } from "@notionhq/client"
import { NotionService, type NotionPage } from "../services/notion"

/**
 * Custom hook for Notion operations
 * Provides a clean interface for interacting with Notion API
 */
export const useNotion = () => {
  const notionService = new NotionService()

  /**
   * Search for pages in Notion workspace
   * @param query - Search term
   * @returns Promise with search results and any errors
   */
  const searchPages = async (
    query: string
  ): Promise<{
    pages: NotionPage[]
    error: string | null
  }> => {
    try {
      if (!query.trim()) {
        return { pages: [], error: "Search query cannot be empty" }
      }

      const pages = await notionService.searchPages(query)
      return { pages, error: null }
    } catch (error) {
      console.error("Search failed:", error)
      return { pages: [], error: "Failed to search Notion pages" }
    }
  }

  /**
   * Get content from a specific Notion page
   * @param pageId - The ID of the page to retrieve
   * @returns Promise with page content and any errors
   */
  const getPageContent = async (
    pageId: string
  ): Promise<{
    content: string
    error: string | null
  }> => {
    try {
      if (!pageId.trim()) {
        return { content: "", error: "Page ID cannot be empty" }
      }
      const content = await notionService.getPageContent(pageId)
      if (!content) {
        return { content: "", error: "No content found for page" }
      }
      return { content, error: null }
    } catch (error) {
      console.error("Failed to get page content:", error)
      return { content: "", error: "Failed to retrieve page content" }
    }
  }

  /**
   * Get a summary of a Notion page
   * @param pageId - The ID of the page to summarize
   * @returns Promise with page summary and any errors
   */
  const getPageSummary = async (
    pageId: string
  ): Promise<{
    summary: string
    error: string | null
  }> => {
    try {
      if (!pageId.trim()) {
        return { summary: "", error: "Page ID cannot be empty" }
      }

      const summary = await notionService.getPageSummary(pageId)
      return { summary, error: null }
    } catch (error) {
      console.error("Failed to get page summary:", error)
      return { summary: "", error: "Failed to retrieve page summary" }
    }
  }

  /**
   * Query a specific database in Notion
   * @param databaseId - The ID of the database to query
   * @returns Promise with database pages and any errors
   */
  const queryDatabase = async (
    databaseId: string
  ): Promise<{
    pages: NotionPage[]
    error: string | null
  }> => {
    try {
      if (!databaseId.trim()) {
        return { pages: [], error: "Database ID cannot be empty" }
      }

      const pages = await notionService.queryDatabase(databaseId)
      return { pages, error: null }
    } catch (error) {
      console.error("Failed to query database:", error)
      return { pages: [], error: "Failed to query Notion database" }
    }
  }

  /**
   * Get all users from Notion
   * @returns Promise with users and any errors
   */
  const getUsers = async (): Promise<UserObjectResponse[]> => {
    const users = await notionService.getUsers()
    return users
  }

  return {
    searchPages,
    getPageContent,
    getPageSummary,
    queryDatabase,
    getUsers
  }
}
