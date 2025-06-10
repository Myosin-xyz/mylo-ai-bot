import { AirtableService } from "./services/airtable"
import { config } from "dotenv"

// Load environment variables
config()

/**
 * Test script for Airtable integration
 * Run with: npm run test:airtable
 */
async function testAirtableIntegration() {
  try {
    console.log("🚀 Testing Airtable integration...")

    // Initialize Airtable service
    const airtableService = new AirtableService()
    console.log("✅ Airtable service initialized successfully")

    // Test case 1: Get table summary
    console.log("\n📊 Testing table summary...")
    const { summary, error: summaryError } =
      await airtableService.getTableSummary("Table 1", 5)

    if (summaryError) {
      console.error("❌ Error getting table summary:", summaryError)
    } else {
      console.log("✅ Table summary retrieved successfully:")
      console.log(summary)
    }

    // Test case 2: Get all records from a table
    console.log("\n📋 Testing get all records...")
    const { records, error: recordsError } =
      await airtableService.getTableRecords("Table 1", {
        maxRecords: 10
      })

    if (recordsError) {
      console.error("❌ Error getting records:", recordsError)
    } else {
      console.log(`✅ Retrieved ${records.length} records`)
      if (records.length > 0) {
        console.log("First record fields:", Object.keys(records[0].fields))
      }
    }

    // Test case 3: Get specific fields only
    console.log("\n🔍 Testing get specific fields...")
    const { records: fieldRecords, error: fieldsError } =
      await airtableService.getFieldsFromTable(
        "Table 1",
        ["Name", "Email"], // Replace with actual field names from your table
        { maxRecords: 3 }
      )

    if (fieldsError) {
      console.error("❌ Error getting specific fields:", fieldsError)
    } else {
      console.log(
        `✅ Retrieved ${fieldRecords.length} records with specific fields`
      )
      fieldRecords.forEach((record, index) => {
        console.log(`  Record ${index + 1}:`, record.fields)
      })
    }

    // Test case 4: Search with filter formula
    console.log("\n🔎 Testing search with filter...")
    const { records: searchRecords, error: searchError } =
      await airtableService.searchRecords(
        "Table 1",
        "NOT({Name} = '')", // Simple filter to get records where Name is not empty
        { maxRecords: 5 }
      )

    if (searchError) {
      console.error("❌ Error searching records:", searchError)
    } else {
      console.log(`✅ Found ${searchRecords.length} records matching filter`)
    }

    // Test case 5: Get records from a view (if you have views set up)
    console.log("\n👁️ Testing get view records...")
    const { records: viewRecords, error: viewError } =
      await airtableService.getViewRecords(
        "Table 1",
        "Grid view", // Replace with actual view name
        { maxRecords: 5 }
      )

    if (viewError) {
      console.error("❌ Error getting view records:", viewError)
      console.log("   (This might be expected if the view doesn't exist)")
    } else {
      console.log(`✅ Retrieved ${viewRecords.length} records from view`)
    }

    console.log("\n🎉 Airtable integration test completed!")
  } catch (error) {
    console.error("💥 Test failed with error:", error)

    if (error instanceof Error) {
      if (error.message.includes("AIRTABLE_API_KEY")) {
        console.log("\n💡 Setup Instructions:")
        console.log(
          "1. Get your Airtable API key from https://airtable.com/account"
        )
        console.log("2. Add AIRTABLE_API_KEY to your .env file")
        console.log(
          "3. Add AIRTABLE_BASE_ID to your .env file (found in your Airtable base URL)"
        )
      }
    }
  }
}

// Run the test
testAirtableIntegration()
