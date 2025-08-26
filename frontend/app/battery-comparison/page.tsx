import { Sidebar } from "@/components/sidebar"
import { BatteryComparisonContent } from "@/components/battery-comparison-content"

export default function BatteryComparisonPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6">
        <BatteryComparisonContent />
      </main>
    </div>
  )
}
