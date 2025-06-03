import { Bot, Context, SessionFlavor } from "grammy"

// This is the data that will be saved per chat.
export interface SessionData {
  messageCount: number
}

// flavor the context type to include sessions
export type MyContext = Context & SessionFlavor<SessionData>

// Command handler type
export type CommandHandler = (bot: Bot<MyContext>) => void
