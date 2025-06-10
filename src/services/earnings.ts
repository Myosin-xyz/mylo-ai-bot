import { AirtableService } from "./airtable"

export interface EarningsResult {
  usdcTotal: number
  tokenTotal: number
  totalRecords: number
  month?: string
  error: string | null
}

/**
 * Service for calculating user earnings from the Treasury table
 */
export class EarningsService {
  constructor(private airtable: AirtableService) {}

  /**
   * Calculate earnings for a specific user, optionally filtered by month
   * @param telegramHandle - The user's telegram handle (without @)
   * @param month - Optional month filter (e.g., "May", "June")
   * @returns Earnings breakdown
   */
  async calculateUserEarnings(
    telegramHandle: string,
    month?: string
  ): Promise<EarningsResult> {
    try {
      if (!telegramHandle.trim()) {
        return {
          usdcTotal: 0,
          tokenTotal: 0,
          totalRecords: 0,
          error: "Telegram handle cannot be empty"
        }
      }

      // Clean telegram handle (remove @ if present)
      const cleanHandle = telegramHandle.replace(/^@/, "")

      // Get all records from Treasury table
      const { records, error } = await this.airtable.getTableRecords(
        "Treasury",
        {
          maxRecords: 1000 // Increase limit for earnings calculation
        }
      )

      if (error) {
        return {
          usdcTotal: 0,
          tokenTotal: 0,
          totalRecords: 0,
          error: `Failed to fetch Treasury data: ${error}`
        }
      }

      if (records.length === 0) {
        return {
          usdcTotal: 0,
          tokenTotal: 0,
          totalRecords: 0,
          error: "Treasury table is empty"
        }
      }

      // Filter records for the specific user
      const userRecords = records.filter(record => {
        const telegramField = record.fields.Telegram
        if (!telegramField) return false

        // Handle both string and array formats
        const telegramValue = Array.isArray(telegramField)
          ? telegramField.join(",")
          : String(telegramField)

        // Clean the telegram value and check for match
        const cleanedValue = telegramValue.replace(/^@/, "").toLowerCase()
        return cleanedValue === cleanHandle.toLowerCase()
      })

      if (userRecords.length === 0) {
        return {
          usdcTotal: 0,
          tokenTotal: 0,
          totalRecords: 0,
          month,
          error: null
        }
      }

      // Apply month filter if specified
      const filteredRecords = month
        ? this.filterByMonth(userRecords, month)
        : userRecords

      if (month && filteredRecords.length === 0) {
        return {
          usdcTotal: 0,
          tokenTotal: 0,
          totalRecords: 0,
          month,
          error: null
        }
      }

      // Calculate totals
      let usdcTotal = 0
      let tokenTotal = 0

      filteredRecords.forEach(record => {
        const payout = record.fields.Payout
        const currency = record.fields.Currency

        if (payout && currency) {
          const payoutValue = this.parseNumericValue(payout)
          const currencyValue = String(currency).toUpperCase()

          if (payoutValue > 0) {
            if (currencyValue === "USDC") {
              usdcTotal += payoutValue
            } else if (
              currencyValue === "TOKEN" ||
              currencyValue === "TOKENS"
            ) {
              tokenTotal += payoutValue
            }
          }
        }
      })

      return {
        usdcTotal: Math.round(usdcTotal * 100) / 100, // Round to 2 decimal places
        tokenTotal: Math.round(tokenTotal * 100) / 100,
        totalRecords: filteredRecords.length,
        month,
        error: null
      }
    } catch (error) {
      console.error("Earnings calculation error:", error)
      return {
        usdcTotal: 0,
        tokenTotal: 0,
        totalRecords: 0,
        month,
        error: "Failed to calculate earnings"
      }
    }
  }

  /**
   * Filter records by month based on "Paid out" field
   * @param records - Records to filter
   * @param month - Month to filter by (e.g., "May", "June")
   * @returns Filtered records
   */
  private filterByMonth(records: any[], month: string): any[] {
    const monthLower = month.toLowerCase()

    return records.filter(record => {
      const paidOut = record.fields["Paid out"]
      if (!paidOut) return false

      const paidOutValue = String(paidOut).toLowerCase()

      // Check if the paid out field contains the month (e.g., "May 25", "June 25")
      return paidOutValue.includes(monthLower)
    })
  }

  /**
   * Parse a value to extract numeric amount
   * @param value - Value to parse (could be string, number, or array)
   * @returns Numeric value or 0 if invalid
   */
  private parseNumericValue(value: any): number {
    if (typeof value === "number") {
      return value
    }

    if (typeof value === "string") {
      // Remove currency symbols, commas, etc. and parse
      const cleaned = value.replace(/[^\d.-]/g, "")
      const parsed = parseFloat(cleaned)
      return isNaN(parsed) ? 0 : parsed
    }

    if (Array.isArray(value) && value.length > 0) {
      // If it's an array, try to parse the first element
      return this.parseNumericValue(value[0])
    }

    return 0
  }

  /**
   * Format earnings result into a user-friendly message
   * @param result - Earnings calculation result
   * @param telegramHandle - User's telegram handle
   * @returns Formatted message
   */
  formatEarningsMessage(
    result: EarningsResult,
    telegramHandle: string
  ): string {
    if (result.error) {
      return `❌ ${result.error}`
    }

    if (result.totalRecords === 0) {
      const monthText = result.month ? ` for ${result.month}` : ""
      return `💰 No earnings found for @${telegramHandle}${monthText}.`
    }

    const monthText = result.month ? ` for ${result.month}` : ""
    let message = `💰 **Earnings Summary for @${telegramHandle}**${monthText}\n\n`

    if (result.usdcTotal > 0) {
      message += `💵 **USDC:** $${result.usdcTotal.toFixed(2)}\n`
    }

    if (result.tokenTotal > 0) {
      message += `🪙 **Tokens:** ${result.tokenTotal.toFixed(2)}\n`
    }

    if (result.usdcTotal === 0 && result.tokenTotal === 0) {
      message += `📊 Found ${result.totalRecords} record(s) but no valid payouts.\n`
    } else {
      message += `\n📊 Based on ${result.totalRecords} payout record(s)`
    }

    return message
  }
}
