import { Sidebar } from "@/components/sidebar"
import { BatteryPerformanceContent } from "@/components/battery-performance-content"

export default function BatteryPerformancePage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6">
        <BatteryPerformanceContent />
      </main>
    </div>
  );
}
