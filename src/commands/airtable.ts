import { Bot } from "grammy"
import { MyContext } from "../types/commands"
import { AirtableService } from "../services/airtable"

export const registerAirtableCommands = (
  bot: Bot<MyContext>,
  airtable: AirtableService
) => {
  // Handle Airtable table summary command
  bot.command("table", async ctx => {
    const tableName = ctx.match?.toString().trim()

    if (!tableName) {
      await ctx.reply(
        "📊 Please provide a table name.\n\nExample: `/table Contacts`",
        { parse_mode: "HTML" }
      )
      return
    }

    try {
      await ctx.reply("📊 Getting table summary for: " + tableName)

      const { summary, error } = await airtable.getTableSummary(tableName, 5)

      if (error) {
        await ctx.reply(`❌ Error: ${error}`)
        return
      }

      if (!summary.trim()) {
        await ctx.reply(`📄 No data found in table "${tableName}".`)
        return
      }

      // Split content if it's too long for Telegram
      const maxLength = 4000
      if (summary.length <= maxLength) {
        await ctx.reply(summary, { parse_mode: "Markdown" })
      } else {
        // Send in chunks
        const chunks: string[] = []
        for (let i = 0; i < summary.length; i += maxLength) {
          chunks.push(summary.slice(i, i + maxLength))
        }

        for (let i = 0; i < chunks.length; i++) {
          await ctx.reply(
            `📊 Part ${i + 1}/${chunks.length}:\n\n${chunks[i]}`,
            {
              parse_mode: "Markdown"
            }
          )
        }
      }
    } catch (error) {
      console.error("Table command error:", error)
      await ctx.reply(
        "❌ An error occurred while retrieving the table. Please try again later."
      )
    }
  })

  // Handle searching records with filter
  bot.command("filter", async ctx => {
    const args = ctx.match?.toString().trim()

    if (!args) {
      await ctx.reply(
        "🔍 Please provide table name and filter formula.\n\nExample: `/filter Contacts {Name} = 'John'`",
        { parse_mode: "HTML" }
      )
      return
    }

    // Split on first space to separate table name from filter
    const spaceIndex = args.indexOf(" ")
    if (spaceIndex === -1) {
      await ctx.reply(
        "🔍 Please provide both table name and filter formula.\n\nExample: `/filter Contacts {Name} = 'John'`",
        { parse_mode: "HTML" }
      )
      return
    }

    const tableName = args.substring(0, spaceIndex)
    const filterFormula = args.substring(spaceIndex + 1)

    try {
      await ctx.reply(`🔍 Searching ${tableName} with filter: ${filterFormula}`)

      const { records, error } = await airtable.searchRecords(
        tableName,
        filterFormula,
        {
          maxRecords: 10
        }
      )

      if (error) {
        await ctx.reply(`❌ Error: ${error}`)
        return
      }

      if (records.length === 0) {
        await ctx.reply("📄 No records found matching the filter.")
        return
      }

      let response = `🔍 Found ${records.length} record(s) in ${tableName}:\n\n`

      records.slice(0, 5).forEach((record, index) => {
        response += `**${index + 1}.** Record ID: \`${record.id}\`\n`

        // Show first few fields
        const fieldEntries = Object.entries(record.fields).slice(0, 3)
        fieldEntries.forEach(([key, value]) => {
          const displayValue = Array.isArray(value)
            ? value.length > 0
              ? `[${value.length} items]`
              : "[]"
            : typeof value === "object" && value !== null
            ? "[Object]"
            : String(value)
          response += `  • ${key}: ${displayValue}\n`
        })

        if (Object.keys(record.fields).length > 3) {
          response += `  • ... and ${
            Object.keys(record.fields).length - 3
          } more fields\n`
        }
        response += "\n"
      })

      if (records.length > 5) {
        response += `... and ${records.length - 5} more records.`
      }

      await ctx.reply(response, { parse_mode: "Markdown" })
    } catch (error) {
      console.error("Filter command error:", error)
      await ctx.reply(
        "❌ An error occurred while searching. Please try again later."
      )
    }
  })
}
