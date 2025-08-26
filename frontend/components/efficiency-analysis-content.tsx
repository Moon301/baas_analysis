"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Battery, Thermometer, TrendingUp, RotateCcw } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  RadialBarChart,
  RadialBar,
  PieChart,
  Pie,
  Cell,
} from "recharts"

// 계절별 효율 데이터
const seasonalData = [
  { season: "봄", efficiency: 4.5, temperature: 18, range: 420, consumption: 18.2 },
  { season: "여름", efficiency: 3.8, temperature: 32, range: 365, consumption: 21.5 },
  { season: "가을", efficiency: 4.3, temperature: 15, range: 410, consumption: 18.8 },
  { season: "겨울", efficiency: 3.2, temperature: -5, range: 310, consumption: 25.1 },
]

// 월별 효율 트렌드
const monthlyEfficiency = [
  { month: "1월", efficiency: 3.1, temperature: -3, heating: 35 },
  { month: "2월", efficiency: 3.3, temperature: 2, heating: 30 },
  { month: "3월", efficiency: 4.1, temperature: 12, heating: 15 },
  { month: "4월", efficiency: 4.4, temperature: 18, heating: 5 },
  { month: "5월", efficiency: 4.6, temperature: 23, heating: 0 },
  { month: "6월", efficiency: 4.2, temperature: 28, heating: 0 },
  { month: "7월", efficiency: 3.9, temperature: 32, heating: 0 },
  { month: "8월", efficiency: 3.7, temperature: 31, heating: 0 },
  { month: "9월", efficiency: 4.3, temperature: 25, heating: 0 },
  { month: "10월", efficiency: 4.4, temperature: 18, heating: 8 },
  { month: "11월", efficiency: 3.8, temperature: 10, heating: 20 },
  { month: "12월", efficiency: 3.2, temperature: -1, heating: 32 },
]

// 충방전 사이클 데이터
const chargingCycles = [
  { cycle: 1, capacity: 100, health: 100, date: "2024-01" },
  { cycle: 50, capacity: 99.2, health: 98.5, date: "2024-02" },
  { cycle: 100, capacity: 98.1, health: 97.2, date: "2024-03" },
  { cycle: 150, capacity: 97.3, health: 96.1, date: "2024-04" },
  { cycle: 200, capacity: 96.8, health: 95.3, date: "2024-05" },
  { cycle: 250, capacity: 96.2, health: 94.8, date: "2024-06" },
  { cycle: 300, capacity: 95.7, health: 94.2, date: "2024-07" },
  { cycle: 350, capacity: 95.1, health: 93.7, date: "2024-08" },
  { cycle: 400, capacity: 94.6, health: 93.1, date: "2024-09" },
  { cycle: 450, capacity: 94.2, health: 92.6, date: "2024-10" },
  { cycle: 500, capacity: 93.8, health: 92.1, date: "2024-11" },
  { cycle: 550, capacity: 93.4, health: 91.7, date: "2024-12" },
]

// 충전 패턴 데이터
const chargingPatterns = [
  { type: "완속충전 (AC)", percentage: 65, color: "var(--chart-3)", cycles: 320 },
  { type: "급속충전 (DC)", percentage: 25, color: "var(--chart-1)", cycles: 120 },
  { type: "초급속충전", percentage: 10, color: "var(--chart-5)", cycles: 45 },
]

// 배터리 온도 데이터
const temperatureData = [
  { time: "00:00", batteryTemp: 22, ambientTemp: 18, efficiency: 4.2 },
  { time: "04:00", batteryTemp: 20, ambientTemp: 15, efficiency: 4.3 },
  { time: "08:00", batteryTemp: 28, ambientTemp: 25, efficiency: 4.0 },
  { time: "12:00", batteryTemp: 35, ambientTemp: 32, efficiency: 3.7 },
  { time: "16:00", batteryTemp: 38, ambientTemp: 35, efficiency: 3.5 },
  { time: "20:00", batteryTemp: 32, ambientTemp: 28, efficiency: 3.9 },
]

export function EfficiencyAnalysisContent() {
  const [selectedPeriod, setSelectedPeriod] = useState("year")
  const [selectedMetric, setSelectedMetric] = useState("efficiency")

  const getCurrentBatteryHealth = () => {
    const latest = chargingCycles[chargingCycles.length - 1]
    return latest.health
  }

  const getHealthStatus = (health: number) => {
    if (health >= 95) return { status: "excellent", color: "text-chart-3", label: "우수" }
    if (health >= 90) return { status: "good", color: "text-chart-2", label: "양호" }
    if (health >= 85) return { status: "fair", color: "text-chart-4", label: "보통" }
    return { status: "poor", color: "text-chart-5", label: "주의" }
  }

  const currentHealth = getCurrentBatteryHealth()
  const healthStatus = getHealthStatus(currentHealth)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">배터리 효율 분석</h1>
        <p className="text-muted-foreground mt-2">계절별 효율과 충방전 사이클을 분석하세요</p>
      </div>

      {/* 주요 지표 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">현재 배터리 상태</CardTitle>
            <Battery className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentHealth.toFixed(1)}%</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`${healthStatus.color} bg-transparent border-current`}>{healthStatus.label}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 효율</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.1 km/kWh</div>
            <p className="text-xs text-muted-foreground">지난 12개월 평균</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">충전 사이클</CardTitle>
            <RotateCcw className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">550회</div>
            <p className="text-xs text-muted-foreground">총 누적 사이클</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">온도 영향</CardTitle>
            <Thermometer className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-18%</div>
            <p className="text-xs text-muted-foreground">겨울철 효율 감소</p>
          </CardContent>
        </Card>
      </div>

      {/* 필터 컨트롤 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="sm:max-w-xs">
            <SelectValue placeholder="분석 기간" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">이번 달</SelectItem>
            <SelectItem value="quarter">분기</SelectItem>
            <SelectItem value="year">연간</SelectItem>
            <SelectItem value="all">전체</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedMetric} onValueChange={setSelectedMetric}>
          <SelectTrigger className="sm:max-w-xs">
            <SelectValue placeholder="분석 지표" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="efficiency">효율성</SelectItem>
            <SelectItem value="capacity">배터리 용량</SelectItem>
            <SelectItem value="temperature">온도 영향</SelectItem>
            <SelectItem value="charging">충전 패턴</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="seasonal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="seasonal">계절별 분석</TabsTrigger>
          <TabsTrigger value="cycles">충방전 사이클</TabsTrigger>
          <TabsTrigger value="temperature">온도 영향</TabsTrigger>
          <TabsTrigger value="health">배터리 건강도</TabsTrigger>
        </TabsList>

        <TabsContent value="seasonal" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>계절별 효율 비교</CardTitle>
                <CardDescription>계절에 따른 배터리 효율 변화</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={seasonalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="season" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="efficiency" fill="var(--chart-1)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>월별 효율 트렌드</CardTitle>
                <CardDescription>12개월 효율성 변화 추이</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyEfficiency}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="efficiency" stroke="var(--chart-2)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>계절별 상세 분석</CardTitle>
              <CardDescription>온도와 효율성의 상관관계</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {seasonalData.map((season, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">{season.season}</h3>
                      <Thermometer className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>효율성</span>
                        <span className="font-medium">{season.efficiency} km/kWh</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>평균 온도</span>
                        <span className="font-medium">{season.temperature}°C</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>주행거리</span>
                        <span className="font-medium">{season.range} km</span>
                      </div>
                      <Progress value={(season.efficiency / 5) * 100} className="mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cycles" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>배터리 용량 감소 추이</CardTitle>
                <CardDescription>충방전 사이클에 따른 용량 변화</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chargingCycles}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="cycle" />
                    <YAxis domain={[90, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="capacity" stroke="var(--chart-1)" strokeWidth={2} />
                    <Line
                      type="monotone"
                      dataKey="health"
                      stroke="var(--chart-2)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>충전 패턴 분석</CardTitle>
                <CardDescription>충전 방식별 사용 비율</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chargingPatterns}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="percentage"
                    >
                      {chargingPatterns.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {chargingPatterns.map((pattern, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: pattern.color }}></div>
                        <span>{pattern.type}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span>{pattern.percentage}%</span>
                        <span className="text-muted-foreground">{pattern.cycles}회</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>사이클 수명 예측</CardTitle>
              <CardDescription>현재 사용 패턴 기반 배터리 수명 예측</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-chart-2 mb-2">2,450</div>
                  <p className="text-sm text-muted-foreground">예상 총 사이클</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-chart-3 mb-2">4.2년</div>
                  <p className="text-sm text-muted-foreground">예상 수명</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-chart-1 mb-2">77%</div>
                  <p className="text-sm text-muted-foreground">수명 종료시 용량</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="temperature" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>온도별 효율 변화</CardTitle>
                <CardDescription>배터리 온도와 주변 온도의 영향</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={temperatureData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="batteryTemp"
                      stroke="var(--chart-5)"
                      strokeWidth={2}
                      name="배터리 온도"
                    />
                    <Line
                      type="monotone"
                      dataKey="ambientTemp"
                      stroke="var(--chart-2)"
                      strokeWidth={2}
                      name="주변 온도"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>온도 구간별 효율</CardTitle>
                <CardDescription>최적 온도 범위 분석</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <p className="font-medium">극저온 (-10°C 이하)</p>
                      <p className="text-sm text-muted-foreground">효율 크게 감소</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-chart-5">2.8 km/kWh</p>
                      <p className="text-sm text-chart-5">-32%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <p className="font-medium">저온 (-10°C ~ 10°C)</p>
                      <p className="text-sm text-muted-foreground">효율 감소</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-chart-4">3.5 km/kWh</p>
                      <p className="text-sm text-chart-4">-15%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-chart-3/5">
                    <div>
                      <p className="font-medium">최적 온도 (10°C ~ 25°C)</p>
                      <p className="text-sm text-muted-foreground">최고 효율</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-chart-3">4.5 km/kWh</p>
                      <p className="text-sm text-chart-3">기준</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <p className="font-medium">고온 (25°C ~ 35°C)</p>
                      <p className="text-sm text-muted-foreground">냉각 시스템 가동</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-chart-4">3.9 km/kWh</p>
                      <p className="text-sm text-chart-4">-13%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>배터리 건강도 점수</CardTitle>
                <CardDescription>종합적인 배터리 상태 평가</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-32 h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart
                        cx="50%"
                        cy="50%"
                        innerRadius="60%"
                        outerRadius="90%"
                        data={[{ value: currentHealth }]}
                      >
                        <RadialBar dataKey="value" cornerRadius={10} fill="var(--chart-3)" />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{currentHealth.toFixed(1)}%</div>
                        <div className="text-sm text-muted-foreground">건강도</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">용량 유지율</span>
                    <span className="font-medium">93.4%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">내부 저항</span>
                    <span className="font-medium">정상</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">셀 밸런스</span>
                    <span className="font-medium">양호</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>건강도 개선 제안</CardTitle>
                <CardDescription>배터리 수명 연장을 위한 권장사항</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 border border-border rounded-lg">
                    <div className="w-2 h-2 bg-chart-3 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-sm">충전 습관 개선</p>
                      <p className="text-xs text-muted-foreground">20-80% 구간에서 충전하여 배터리 수명을 연장하세요</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 border border-border rounded-lg">
                    <div className="w-2 h-2 bg-chart-2 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-sm">온도 관리</p>
                      <p className="text-xs text-muted-foreground">
                        극한 온도에서의 주차를 피하고 프리컨디셔닝을 활용하세요
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 border border-border rounded-lg">
                    <div className="w-2 h-2 bg-chart-4 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-sm">급속충전 빈도</p>
                      <p className="text-xs text-muted-foreground">
                        급속충전 사용을 주 2-3회로 제한하여 배터리 스트레스를 줄이세요
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
