declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production"
      PORT?: string
      PWD: string
      TELEGRAM_TOKEN: string
      NOTION_TOKEN: string
    }
  }
}

export {}
