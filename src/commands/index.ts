import { Bot } from "grammy"
import { MyContext } from "../types/commands"
import { registerBasicCommands } from "./basic"
import { registerNotionCommands } from "./notion"
import { registerAirtableCommands } from "./airtable"
import { NotionService } from "../services/notion"
import { AirtableService } from "../services/airtable"

export const registerAllCommands = (
  bot: Bot<MyContext>,
  notion: NotionService,
  airtable: AirtableService
) => {
  // Register all command handlers
  registerBasicCommands(bot)
  registerNotionCommands(bot, notion)
  registerAirtableCommands(bot, airtable)

  // Update bot commands list
  bot.api.setMyCommands([
    {
      command: "hello",
      description: "Get a friendly hello message"
    },
    {
      command: "test",
      description: "Test Notion connection"
    },
    {
      command: "search",
      description: "Search Notion pages"
    },
    {
      command: "page",
      description: "Get page content by ID"
    },
    {
      command: "summary",
      description: "Get page summary by ID"
    },
    {
      command: "database",
      description: "Query a Notion database"
    },
    {
      command: "users",
      description: "Get all users"
    },
    {
      command: "about",
      description: "Learn about this bot"
    },
    {
      command: "table",
      description: "Get summary of an Airtable table"
    },
    {
      command: "filter",
      description: "Search Airtable records with filter"
    }
  ])
}
