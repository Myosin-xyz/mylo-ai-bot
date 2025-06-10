import { AirtableService } from "../services/airtable"
import { EarningsService } from "../services/earnings"
import { config } from "dotenv"

// Load environment variables
config()

/**
 * Test script for earnings calculation
 * Run with: npm run test:earnings
 */
async function testEarningsCalculation() {
  try {
    console.log("🚀 Testing earnings calculation...")

    // Initialize services
    const airtableService = new AirtableService()
    const earningsService = new EarningsService(airtableService)
    console.log("✅ Services initialized successfully")

    // Test case 1: Calculate earnings for a test user (replace with actual telegram handle)
    console.log("\n💰 Testing earnings calculation...")
    const testHandle = "testuser" // Replace with actual telegram handle for testing

    const result = await earningsService.calculateUserEarnings(testHandle)

    if (result.error) {
      console.error("❌ Error calculating earnings:", result.error)
    } else {
      console.log("✅ Earnings calculation successful:")
      console.log("  USDC Total:", result.usdcTotal)
      console.log("  Token Total:", result.tokenTotal)
      console.log("  Total Records:", result.totalRecords)

      // Format message
      const message = earningsService.formatEarningsMessage(result, testHandle)
      console.log("\n📝 Formatted message:")
      console.log(message)
    }

    // Test case 2: Calculate earnings for a specific month
    console.log("\n💰 Testing monthly earnings calculation (May)...")
    const monthlyResult = await earningsService.calculateUserEarnings(
      testHandle,
      "May"
    )

    if (monthlyResult.error) {
      console.error(
        "❌ Error calculating monthly earnings:",
        monthlyResult.error
      )
    } else {
      console.log("✅ Monthly earnings calculation successful:")
      console.log("  USDC Total (May):", monthlyResult.usdcTotal)
      console.log("  Token Total (May):", monthlyResult.tokenTotal)
      console.log("  Total Records (May):", monthlyResult.totalRecords)

      const monthlyMessage = earningsService.formatEarningsMessage(
        monthlyResult,
        testHandle
      )
      console.log("\n📝 Formatted monthly message:")
      console.log(monthlyMessage)
    }

    // Test case 3: Test with non-existent user
    console.log("\n💰 Testing with non-existent user...")
    const noUserResult = await earningsService.calculateUserEarnings(
      "nonexistentuser123"
    )

    const noUserMessage = earningsService.formatEarningsMessage(
      noUserResult,
      "nonexistentuser123"
    )
    console.log("📝 No user message:")
    console.log(noUserMessage)

    console.log("\n🎉 Earnings calculation test completed!")
  } catch (error) {
    console.error("💥 Test failed with error:", error)

    if (error instanceof Error) {
      if (error.message.includes("AIRTABLE_API_KEY")) {
        console.log("\n💡 Setup Instructions:")
        console.log(
          "1. Make sure your .env file has AIRTABLE_API_KEY and AIRTABLE_BASE_ID"
        )
        console.log("2. Ensure your Airtable base has a 'Treasury' table")
        console.log(
          "3. The Treasury table should have columns: Telegram, Payout, Currency, Paid out"
        )
      }
    }
  }
}

// Run the test
testEarningsCalculation()
