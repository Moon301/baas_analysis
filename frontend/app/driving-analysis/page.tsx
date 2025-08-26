import { Sidebar } from "@/components/sidebar"
import { DrivingAnalysisContent } from "@/components/driving-analysis-content"

export default function DrivingAnalysisPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6">
        <DrivingAnalysisContent />
      </main>
    </div>
  )
}
