import { Sidebar } from "@/components/sidebar"
import { BatteryTrendContent } from "@/components/battery-trend-content"

export default function BatteryTrendPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6">
        <BatteryTrendContent />
      </main>
    </div>
  );
}
