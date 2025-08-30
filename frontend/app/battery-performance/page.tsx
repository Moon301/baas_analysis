import { Sidebar } from "@/components/sidebar"
import BatteryPerformanceContent from '@/components/battery-performance-content';

export default function BatteryPerformancePage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-6">배터리 성능 평가</h1>
        <BatteryPerformanceContent />
      </main>
    </div>
  );
}
