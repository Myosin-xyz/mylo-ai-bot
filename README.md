# Mylo AI Bot

Mylo is an intelligent Telegram bot that integrates with Notion to help you access and search your documentation, knowledge base, and project information directly from Telegram.

## Features

- 🔍 **Notion Search**: Search across all your Notion pages instantly
- 📄 **Page Retrieval**: Get full content of any Notion page
- 📋 **Smart Summaries**: Get quick summaries of long documents
- 🗃️ **Database Queries**: Browse and explore Notion databases
- 👋 **Friendly Interface**: Simple commands with helpful error messages
- ⚡ **Built with Grammy**: Modern Telegram Bot Framework with TypeScript

## Getting Started

### 1. Prerequisites

- Node.js 18+
- A Telegram Bot Token
- A Notion Integration Token

### 2. Create a Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Start a chat and send `/newbot`
3. Choose a name for your bot (e.g., "Mylo Notion Bot")
4. Choose a username ending in 'bot' (e.g., "mylonotiongbot")
5. Copy the token BotFather gives you

### 3. Create a Notion Integration

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Fill in the basic information and create
4. Copy the "Internal Integration Token" (starts with `secret_`)
5. Share your Notion pages/databases with this integration:
   - Open the page/database in Notion
   - Click "Share" → "Invite" → Select your integration

### 4. Setup Environment

1. Copy the environment template:

   ```bash
   cp env.sample .env
   ```

2. Edit `.env` and add your tokens:
   ```env
   TELEGRAM_TOKEN=your_bot_token_from_botfather
   NOTION_TOKEN=secret_your_notion_integration_token
   ```

### 5. Install and Run

```bash
# Install dependencies
npm install

# Development mode (with hot reload)
npm run dev

# Production build and start
npm run build
npm start
```

## Commands

### Notion Commands

- `/search <query>` - Search for pages in your Notion workspace
- `/page <page_id>` - Get the full content of a specific page
- `/summary <page_id>` - Get a quick summary of a page
- `/database <database_id>` - List all pages in a database

### General Commands

- `/start` - Get started with the bot and see all commands
- `/hello` - Receive a friendly greeting with your message count
- `/about` - Learn more about the bot's capabilities

### Usage Examples

```
/search project documentation
/search meeting notes 2024
/page abc123def456ghi789
/summary xyz789abc123def456
/database 1a2b3c4d5e6f7g8h9i0j
```

## How to Get Page/Database IDs

1. **From Search Results**: Use `/search` to find pages, then use the provided IDs
2. **From Notion URL**: Copy the ID from the page URL:
   - `https://notion.so/Page-Title-abc123def456` → `abc123def456`
3. **Database ID**: Same process, but from a database URL

## Project Structure

```
mylo-ai-bot/
├── src/
│   ├── bot.ts              # Main bot logic & Telegram commands
│   ├── services/
│   │   └── notion.ts       # Notion API integration with Zod validation
│   └── hooks/
│       └── useNotion.ts    # Notion operations abstraction layer
├── dist/                   # Compiled TypeScript output
├── env.sample             # Environment variables template
├── CONTRIBUTING.md        # Development guide
└── package.json           # Dependencies and scripts
```

## Technologies Used

- **Grammy** - Modern Telegram Bot Framework
- **@notionhq/client** - Official Notion JavaScript SDK
- **Zod** - TypeScript-first schema validation
- **TypeScript** - Type-safe JavaScript
- **Express** - Web server for production webhooks
- **Node.js** - Runtime environment

## Development

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed development guidelines, architecture overview, and best practices.

### Quick Development Setup

```bash
# Clone and setup
git clone <repository-url>
cd mylo-ai-bot
npm install
cp env.sample .env

# Edit .env with your tokens
# Start development
npm run dev
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for:

- Development setup and guidelines
- Architecture and code organization
- Adding new features and commands
- Testing and deployment

## License

MIT - Feel free to use this bot as a starting point for your own projects!

## Natural Language Search

Mylo now supports natural language search! Simply start your message with "Hey Mylo" (case insensitive) and ask for what you need:

### Examples:

- "Hey Mylo, search for project proposals"
- "HEY MYLO look for meeting notes"
- "hey mylo, please search for available proposals"
- "hey mylo i need to find team documents"
- "hey mylo help me find project plans"

### How it works:

1. **Trigger Detection**: Messages starting with "Hey Mylo" (case insensitive) activate the search
2. **Query Extraction**: The bot intelligently extracts search terms using semantic parsing
3. **Notion Search**: Uses the existing Notion search API to find relevant pages
4. **Smart Responses**: Returns formatted results with page titles, links, and access commands

### Supported Patterns:

- `search for [query]`
- `find [query]`
- `look for [query]`
- `can you search for [query]`
- `please find [query]`
- `i need to find [query]`
- `help me find [query]`
- Direct keywords (e.g., "hey mylo search Latam proposals")
