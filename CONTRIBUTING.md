# Contributing to Mylo AI Bot

Welcome to the Mylo AI Bot project! This guide will help you understand the project structure, setup process, and development workflow.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- A Telegram Bot Token from [@BotFather](https://t.me/botfather)
- A Notion Integration Token

### Setup Steps

1. **Clone and install dependencies:**

   ```bash
   git clone <repository-url>
   cd mylo-ai-bot
   npm install
   ```

2. **Environment Configuration:**

   ```bash
   cp env.sample .env
   ```

   Edit `.env` and configure:

   - `TELEGRAM_TOKEN`: Get from [@BotFather](https://t.me/botfather)
   - `NOTION_TOKEN`: Get from [Notion Integrations](https://www.notion.so/my-integrations)

3. **Notion Setup:**

   - Create a new integration at https://www.notion.so/my-integrations
   - Copy the "Internal Integration Token"
   - Share your Notion pages/databases with the integration
   - Note down page/database IDs for testing

4. **Development:**
   ```bash
   npm run dev     # Start in development mode
   npm run build   # Build for production
   npm run start   # Start production build
   ```

## 🏗️ Project Structure

```
mylo-ai-bot/
├── src/
│   ├── bot.ts              # Main bot logic & commands
│   ├── services/
│   │   └── notion.ts       # Notion API service
│   └── hooks/
│       └── useNotion.ts    # Notion operations hook
├── dist/                   # Compiled TypeScript output
├── env.sample             # Environment variables template
├── environment.d.ts       # TypeScript environment declarations
└── package.json
```

## 🤖 Bot Architecture

### Core Components

- **`src/bot.ts`**: Main bot file with Telegram command handlers
- **`src/services/notion.ts`**: Notion API integration with Zod validation
- **`src/hooks/useNotion.ts`**: Abstraction layer for Notion operations

### Available Commands

| Command           | Description                          | Example                  |
| ----------------- | ------------------------------------ | ------------------------ |
| `/start`          | Welcome message and command overview | `/start`                 |
| `/hello`          | Friendly greeting with message count | `/hello`                 |
| `/search <query>` | Search Notion pages                  | `/search project docs`   |
| `/page <id>`      | Get full page content                | `/page abc123def456`     |
| `/summary <id>`   | Get page summary                     | `/summary abc123def456`  |
| `/database <id>`  | List database pages                  | `/database xyz789ghi012` |
| `/about`          | Bot information with inline keyboard | `/about`                 |

## 🔧 Development Guidelines

### TypeScript & Type Safety

- **All code must use TypeScript**
- Use Zod schemas for API validation (`src/services/notion.ts`)
- Infer types from Zod schemas rather than manual interfaces
- Strict type checking enabled

### Code Organization

- **File size limit**: ≤200 lines per file
- **Single responsibility**: One purpose per hook/service
- **Reusability**: Extract shared patterns into utilities

### State Management

- Local state: `useState`/`useReducer` in hooks
- No global state needed for this bot architecture
- Session data handled by Grammy's session middleware

### Error Handling

- All async operations wrapped in try-catch
- User-friendly error messages via Telegram
- Detailed logging for debugging
- Graceful degradation for API failures

### Notion Integration Patterns

#### Service Layer (`src/services/notion.ts`)

```typescript
// ✅ Good: Zod validation
const result = NotionPageSchema.parse(apiResponse)

// ✅ Good: Proper error handling
try {
  const pages = await this.client.search({ query })
  return NotionDatabaseQuerySchema.parse(pages)
} catch (error) {
  console.error("Search failed:", error)
  throw new Error("Failed to search pages")
}
```

#### Hook Layer (`src/hooks/useNotion.ts`)

```typescript
// ✅ Good: Consistent return pattern
return {
  pages: validatedPages,
  error: null
}

// ✅ Good: Input validation
if (!query.trim()) {
  return { pages: [], error: "Search query cannot be empty" }
}
```

## 📝 Adding New Features

### Adding a New Notion Command

1. **Service Method** (if needed):

   ```typescript
   // src/services/notion.ts
   async newOperation(param: string): Promise<ResultType> {
     // Implementation with Zod validation
   }
   ```

2. **Hook Method**:

   ```typescript
   // src/hooks/useNotion.ts
   const newOperation = async (param: string) => {
     try {
       const result = await notionService.newOperation(param)
       return { result, error: null }
     } catch (error) {
       return { result: null, error: "Operation failed" }
     }
   }
   ```

3. **Bot Command**:

   ```typescript
   // src/bot.ts
   bot.command("newcmd", async ctx => {
     const param = ctx.match?.toString().trim()
     // Implementation with error handling
   })
   ```

4. **Update Commands List**:
   ```typescript
   bot.api.setMyCommands([
     // ... existing commands
     { command: "newcmd", description: "New command description" }
   ])
   ```

## 🧪 Testing

### Manual Testing

- Test all commands with valid inputs
- Test error cases (invalid IDs, network issues)
- Verify Telegram message formatting
- Check long content chunking

### Integration Testing

- Verify Notion API connectivity
- Test with real Notion pages/databases
- Validate response parsing

## 🚀 Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Variables (Production)

- Set `NODE_ENV=production`
- Configure webhook endpoint if needed
- Ensure all secrets are properly set

## 📚 Resources

- [Grammy Bot Framework](https://grammy.dev/)
- [Notion API Documentation](https://developers.notion.com/)
- [Zod Validation Library](https://zod.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🐛 Common Issues

### Notion Token Issues

- Ensure integration has access to pages/databases
- Check token format starts with `secret_`
- Verify pages are shared with integration

### Telegram Formatting

- Use `parse_mode: "Markdown"` for formatted text
- Escape special characters in user content
- Handle message length limits (4096 chars)

### Development

- Use `npm run dev` for hot reloading
- Check console for detailed error logs
- Verify environment variables are loaded
