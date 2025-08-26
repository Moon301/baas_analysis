"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Battery, Car, TrendingUp, Zap } from "lucide-react"
import { apiClient, DashboardStats } from "@/lib/api"

export function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true)
        const data = await apiClient.getDashboardStats()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardStats()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">대시보드</h1>
          <p className="text-muted-foreground mt-2">데이터를 불러오는 중...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground animate-pulse bg-muted h-4 w-24 rounded"></CardTitle>
                <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="animate-pulse bg-muted h-8 w-20 rounded mb-2"></div>
                <div className="flex items-center justify-between mt-2">
                  <div className="animate-pulse bg-muted h-3 w-16 rounded"></div>
                  <div className="animate-pulse bg-muted h-3 w-12 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">대시보드</h1>
          <p className="text-muted-foreground mt-2">오류가 발생했습니다</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-500">
              <p className="mb-2">데이터를 불러올 수 없습니다</p>
              <p className="text-sm">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                다시 시도
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const dashboardStats = [
    {
      title: "등록된 차량",
      value: stats?.total_vehicles?.toLocaleString() || "0",
      description: "전체 분석 대상 차량",
      icon: Car,
      trend: "+12%",
    },
    {
      title: "평균 배터리 효율",
      value: `${(stats?.avg_battery_efficiency || 0).toFixed(1)}%`,
      description: "지난 30일 평균",
      icon: Battery,
      trend: "+2.1%",
    },
    {
      title: "총 주행거리",
      value: `${((stats?.total_records || 0) / 1000).toFixed(1)}K km`,
      description: "누적 데이터",
      icon: TrendingUp,
      trend: "+8.7%",
    },
    {
      title: "충전 효율",
      value: `${(stats?.avg_temperature || 0).toFixed(1)}°C`,
      description: "평균 온도",
      icon: Zap,
      trend: "+1.3%",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">대시보드</h1>
        <p className="text-muted-foreground mt-2">
          전기차 성능 데이터 종합 현황을 확인하세요
          {stats?.last_updated && (
            <span className="ml-2 text-xs">
              (마지막 업데이트: {new Date(stats.last_updated).toLocaleString('ko-KR')})
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">{stat.description}</p>
                <span className="text-xs font-medium text-accent">{stat.trend}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>빠른 분석</CardTitle>
            <CardDescription>주요 분석 기능에 빠르게 접근하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border border-border rounded-lg hover:bg-accent/5 cursor-pointer transition-colors">
                <Battery className="h-6 w-6 text-accent mb-2" />
                <h3 className="font-medium">배터리 비교</h3>
                <p className="text-sm text-muted-foreground">차종별 성능 비교</p>
              </div>
              <div className="p-4 border border-border rounded-lg hover:bg-accent/5 cursor-pointer transition-colors">
                <Car className="h-6 w-6 text-accent mb-2" />
                <h3 className="font-medium">주행 분석</h3>
                <p className="text-sm text-muted-foreground">운전 패턴 분석</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>최근 활동</CardTitle>
            <CardDescription>최근 분석된 데이터 현황</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">데이터 업데이트</p>
                  <p className="text-xs text-muted-foreground">
                    {stats?.recent_activity_count || 0}건의 새로운 데이터
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-chart-2 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">총 레코드 수</p>
                  <p className="text-xs text-muted-foreground">
                    {stats?.total_records?.toLocaleString() || 0}건
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
