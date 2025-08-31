import { Sidebar } from "@/components/sidebar"
import { EvChatContent } from "@/components/ev-chat-content"

export default function EvChatPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1">
        <EvChatContent />
      </main>
    </div>
  )
}



