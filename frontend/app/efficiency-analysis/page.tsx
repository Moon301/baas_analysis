import { Sidebar } from "@/components/sidebar"
import { EfficiencyAnalysisContent } from "@/components/efficiency-analysis-content"

export default function EfficiencyAnalysisPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6">
        <EfficiencyAnalysisContent />
      </main>
    </div>
  )
}
