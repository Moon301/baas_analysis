import { Sidebar } from "@/components/sidebar"
import { PerformanceRankingContent } from "@/components/performance-ranking-content"

export default function PerformanceRankingPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6">
        <PerformanceRankingContent />
      </main>
    </div>
  )
}
