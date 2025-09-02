"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, MessageSquare, Battery, TrendingUp } from "lucide-react"

const navigation = [
  {
    name: "대시보드",
    href: "/",
    icon: Home,
  },
  {
    name: "배터리 성능 평가",
    href: "/battery-performance",
    icon: Battery,
  },
  {
    name: "배터리 성능 트렌드",
    href: "/battery-trend",
    icon: TrendingUp,
  },
  {
    name: "EV Chat Assistant",
    href: "/ev-chat",
    icon: MessageSquare,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border">
      <div className="p-6">
        <h1 className="text-xl font-bold text-sidebar-foreground">EV Performance</h1>
        <p className="text-sm text-muted-foreground mt-1">전기차 성능진단 시스템</p>
      </div>

      <nav className="px-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
