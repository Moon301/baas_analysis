import { Sidebar } from "@/components/sidebar"
import { DashboardOverview } from "@/components/dashboard-overview"

export default function HomePage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6">
        <DashboardOverview />
      </main>
    </div>
  )
}
