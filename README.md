# Mylo agentic Bot

Mylo is an agentic Telegram bot that helps automatically run the Myosin community.

## Features

- 👋 Responds with personalized messages to member questions
- 📊 Tracks members engagement with the DAO
- 🤖 Simple and friendly interface
- ⚡ Built with Grammy (Telegram Bot Framework)

## Getting Started

### 1. Create a Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Start a chat and send `/newbot`
3. Choose a name for your bot (e.g., "My Hello Bot")
4. Choose a username ending in 'bot' (e.g., "myhellobot")
5. Copy the token BotFather gives you

### 2. Setup Environment

1. Copy your bot token
2. Open the `.env` file in this directory
3. Replace `YOUR_BOT_TOKEN_HERE` with your actual token:
   ```
   TELEGRAM_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   ```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Bot

For development:

```bash
npm run dev
```

For production:

```bash
npm run build
npm start
```

## Commands

- `/start` - Get started with the bot
- `/hello` - Receive a friendly greeting
- `/about` - Learn more about the bot

## Project Structure

```
src/
├── bot.ts          # Main bot logic
├── package.json    # Dependencies and scripts
├── tsconfig.json   # TypeScript configuration
└── .env           # Environment variables (add your token here)
```

## Technologies Used

- **Grammy** - Modern Telegram Bot Framework
- **TypeScript** - Type-safe JavaScript
- **Express** - Web server for production webhooks
- **Node.js** - Runtime environment

## License

MIT - Feel free to use this bot as a starting point for your own projects!
