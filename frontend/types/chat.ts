export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  chatId: string
  modelInfo?: {
    provider: string
    model: string
  }
}
