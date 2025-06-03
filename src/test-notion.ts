#!/usr/bin/env ts-node

/**
 * Test script for Notion integration
 * Run with: npx ts-node src/test-notion.ts
 */

import { NotionService } from "./services/notion"
import { useNotion } from "./hooks/useNotion"

async function testNotionIntegration() {
  console.log("🧪 Testing Notion Integration...\n")

  try {
    // Test service initialization
    console.log("1. Testing NotionService initialization...")
    const service = new NotionService()
    console.log("✅ NotionService initialized successfully\n")

    // Test hook initialization
    console.log("2. Testing useNotion hook...")
    const notion = useNotion()
    console.log("✅ useNotion hook initialized successfully\n")

    // Test search functionality (with error handling for no results)
    console.log("3. Testing search functionality...")
    const { pages, error } = await notion.searchPages("test")

    if (error) {
      console.log(`⚠️  Search returned error: ${error}`)
      console.log(
        "This might be expected if no pages match 'test' or if permissions are not set up\n"
      )
    } else {
      console.log(
        `✅ Search completed successfully. Found ${pages.length} pages\n`
      )

      if (pages.length > 0) {
        console.log("📋 Sample search results:")
        pages.slice(0, 2).forEach((page, index) => {
          // Extract title
          let title = "Untitled"
          for (const [, property] of Object.entries(page.properties)) {
            if (property.type === "title" && property.title) {
              title = property.title.map(t => t.plain_text).join("")
              break
            }
          }
          console.log(`   ${index + 1}. ${title} (ID: ${page.id})`)
        })
        console.log()
      }
    }

    console.log("🎉 Notion integration test completed!")
    console.log("\n📝 Next steps:")
    console.log("1. Start the bot: npm run dev")
    console.log("2. Message your bot with /start")
    console.log("3. Try /search <query> to search your Notion")
    console.log("4. Use /page <id> to get page content")
  } catch (error) {
    console.error("❌ Test failed:", error)
    console.log("\n🔧 Common fixes:")
    console.log("- Check your NOTION_TOKEN in .env file")
    console.log("- Ensure your integration has access to pages")
    console.log("- Verify pages are shared with your integration")
    console.log("- Check https://www.notion.so/my-integrations for setup")
  }
}

// Run the test
if (require.main === module) {
  testNotionIntegration()
}
