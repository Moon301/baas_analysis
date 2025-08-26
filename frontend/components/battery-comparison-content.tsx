"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Battery, Zap, TrendingUp, TrendingDown, Minus, Car, Gauge, Activity } from "lucide-react"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
} from "recharts"

const vehicleData = [
  {
    id: 1,
    model: "Tesla Model S",
    brand: "Tesla",
    batteryCapacity: 100,
    range: 652,
    chargingSpeed: 250,
    efficiency: 4.8,
    price: 104990,
    category: "luxury",
    performanceRating: 95,
    status: "high",
    rank: 1,
    // 상세 분석 데이터
    batteryHealth: 98,
    odometer: 15420,
    chargeLevel: 87,
    temperatureImpact: -8,
    chargeCycles: 245,
    degradation: 2,
    radarData: [
      { subject: "배터리 용량", A: 95, fullMark: 100 },
      { subject: "주행거리", A: 98, fullMark: 100 },
      { subject: "충전속도", A: 100, fullMark: 100 },
      { subject: "효율성", A: 92, fullMark: 100 },
      { subject: "내구성", A: 96, fullMark: 100 },
      { subject: "가격대비", A: 75, fullMark: 100 },
    ],
    monthlyEfficiency: [
      { month: "1월", efficiency: 4.2 },
      { month: "2월", efficiency: 4.1 },
      { month: "3월", efficiency: 4.5 },
      { month: "4월", efficiency: 4.8 },
      { month: "5월", efficiency: 5.0 },
      { month: "6월", efficiency: 4.9 },
    ],
  },
  {
    id: 2,
    model: "현대 아이오닉 6",
    brand: "현대",
    batteryCapacity: 77.4,
    range: 614,
    chargingSpeed: 235,
    efficiency: 5.1,
    price: 52000,
    category: "premium",
    performanceRating: 88,
    status: "high",
    rank: 2,
    batteryHealth: 96,
    odometer: 8750,
    chargeLevel: 72,
    temperatureImpact: -5,
    chargeCycles: 156,
    degradation: 4,
    radarData: [
      { subject: "배터리 용량", A: 85, fullMark: 100 },
      { subject: "주행거리", A: 90, fullMark: 100 },
      { subject: "충전속도", A: 88, fullMark: 100 },
      { subject: "효율성", A: 98, fullMark: 100 },
      { subject: "내구성", A: 92, fullMark: 100 },
      { subject: "가격대비", A: 95, fullMark: 100 },
    ],
    monthlyEfficiency: [
      { month: "1월", efficiency: 4.8 },
      { month: "2월", efficiency: 4.7 },
      { month: "3월", efficiency: 5.0 },
      { month: "4월", efficiency: 5.2 },
      { month: "5월", efficiency: 5.4 },
      { month: "6월", efficiency: 5.1 },
    ],
  },
  {
    id: 3,
    model: "기아 EV6",
    brand: "기아",
    batteryCapacity: 77.4,
    range: 528,
    chargingSpeed: 240,
    efficiency: 4.2,
    price: 47000,
    category: "premium",
    performanceRating: 85,
    status: "high",
    rank: 3,
    batteryHealth: 94,
    odometer: 12300,
    chargeLevel: 65,
    temperatureImpact: -7,
    chargeCycles: 198,
    degradation: 6,
    radarData: [
      { subject: "배터리 용량", A: 85, fullMark: 100 },
      { subject: "주행거리", A: 82, fullMark: 100 },
      { subject: "충전속도", A: 90, fullMark: 100 },
      { subject: "효율성", A: 80, fullMark: 100 },
      { subject: "내구성", A: 88, fullMark: 100 },
      { subject: "가격대비", A: 98, fullMark: 100 },
    ],
    monthlyEfficiency: [
      { month: "1월", efficiency: 3.8 },
      { month: "2월", efficiency: 3.9 },
      { month: "3월", efficiency: 4.1 },
      { month: "4월", efficiency: 4.3 },
      { month: "5월", efficiency: 4.5 },
      { month: "6월", efficiency: 4.2 },
    ],
  },
  {
    id: 4,
    model: "BMW iX",
    brand: "BMW",
    batteryCapacity: 111.5,
    range: 630,
    chargingSpeed: 195,
    efficiency: 4.1,
    price: 87100,
    category: "luxury",
    performanceRating: 82,
    status: "medium",
    rank: 4,
    batteryHealth: 91,
    odometer: 18650,
    chargeLevel: 58,
    temperatureImpact: -12,
    chargeCycles: 287,
    degradation: 9,
    radarData: [
      { subject: "배터리 용량", A: 98, fullMark: 100 },
      { subject: "주행거리", A: 88, fullMark: 100 },
      { subject: "충전속도", A: 75, fullMark: 100 },
      { subject: "효율성", A: 78, fullMark: 100 },
      { subject: "내구성", A: 85, fullMark: 100 },
      { subject: "가격대비", A: 70, fullMark: 100 },
    ],
    monthlyEfficiency: [
      { month: "1월", efficiency: 3.6 },
      { month: "2월", efficiency: 3.7 },
      { month: "3월", efficiency: 4.0 },
      { month: "4월", efficiency: 4.2 },
      { month: "5월", efficiency: 4.4 },
      { month: "6월", efficiency: 4.1 },
    ],
  },
  {
    id: 5,
    model: "폭스바겐 ID.4",
    brand: "폭스바겐",
    batteryCapacity: 82,
    range: 520,
    chargingSpeed: 135,
    efficiency: 3.8,
    price: 38000,
    category: "standard",
    performanceRating: 75,
    status: "medium",
    rank: 5,
    batteryHealth: 89,
    odometer: 22100,
    chargeLevel: 43,
    temperatureImpact: -15,
    chargeCycles: 342,
    degradation: 11,
    radarData: [
      { subject: "배터리 용량", A: 88, fullMark: 100 },
      { subject: "주행거리", A: 75, fullMark: 100 },
      { subject: "충전속도", A: 65, fullMark: 100 },
      { subject: "효율성", A: 72, fullMark: 100 },
      { subject: "내구성", A: 78, fullMark: 100 },
      { subject: "가격대비", A: 92, fullMark: 100 },
    ],
    monthlyEfficiency: [
      { month: "1월", efficiency: 3.2 },
      { month: "2월", efficiency: 3.4 },
      { month: "3월", efficiency: 3.7 },
      { month: "4월", efficiency: 3.9 },
      { month: "5월", efficiency: 4.1 },
      { month: "6월", efficiency: 3.8 },
    ],
  },
  {
    id: 6,
    model: "닛산 리프",
    brand: "닛산",
    batteryCapacity: 62,
    range: 385,
    chargingSpeed: 100,
    efficiency: 3.2,
    price: 32000,
    category: "standard",
    performanceRating: 65,
    status: "low",
    rank: 6,
    batteryHealth: 82,
    odometer: 35400,
    chargeLevel: 31,
    temperatureImpact: -20,
    chargeCycles: 456,
    degradation: 18,
    radarData: [
      { subject: "배터리 용량", A: 65, fullMark: 100 },
      { subject: "주행거리", A: 58, fullMark: 100 },
      { subject: "충전속도", A: 45, fullMark: 100 },
      { subject: "효율성", A: 60, fullMark: 100 },
      { subject: "내구성", A: 70, fullMark: 100 },
      { subject: "가격대비", A: 88, fullMark: 100 },
    ],
    monthlyEfficiency: [
      { month: "1월", efficiency: 2.8 },
      { month: "2월", efficiency: 2.9 },
      { month: "3월", efficiency: 3.1 },
      { month: "4월", efficiency: 3.3 },
      { month: "5월", efficiency: 3.5 },
      { month: "6월", efficiency: 3.2 },
    ],
  },
]

export function BatteryComparisonContent() {
  const [selectedVehicle, setSelectedVehicle] = useState<(typeof vehicleData)[0] | null>(null)
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false)

  const topPerformers = vehicleData.filter((v) => v.status === "high").sort((a, b) => a.rank - b.rank)
  const mediumPerformers = vehicleData.filter((v) => v.status === "medium").sort((a, b) => a.rank - b.rank)
  const lowPerformers = vehicleData.filter((v) => v.status === "low").sort((a, b) => a.rank - b.rank)

  const performanceDistribution = [
    { name: "고성능 (80+)", value: topPerformers.length, color: "var(--chart-3)" },
    { name: "중간성능 (60-79)", value: mediumPerformers.length, color: "var(--chart-4)" },
    { name: "저성능 (<60)", value: lowPerformers.length, color: "var(--chart-5)" },
  ]

  const handleVehicleClick = (vehicle: (typeof vehicleData)[0]) => {
    setSelectedVehicle(vehicle)
    setIsAnalysisOpen(true)
  }

  const getPerformanceIcon = (status: string) => {
    switch (status) {
      case "high":
        return <TrendingUp className="h-4 w-4 text-chart-3" />
      case "medium":
        return <Minus className="h-4 w-4 text-chart-4" />
      case "low":
        return <TrendingDown className="h-4 w-4 text-chart-5" />
      default:
        return null
    }
  }

  const getPerformanceBadge = (status: string) => {
    const variants = {
      high: "bg-chart-3/10 text-chart-3 border-chart-3/20",
      medium: "bg-chart-4/10 text-chart-4 border-chart-4/20",
      low: "bg-chart-5/10 text-chart-5 border-chart-5/20",
    }
    const labels = { high: "고성능", medium: "중간성능", low: "저성능" }

    return (
      <Badge variant="outline" className={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    )
  }

  const RankingCard = ({
    vehicles,
    title,
    bgColor,
    textColor,
  }: {
    vehicles: typeof vehicleData
    title: string
    bgColor: string
    textColor: string
  }) => (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded-full ${bgColor}`}></div>
          {title}
        </CardTitle>
        <CardDescription>{vehicles.length}대의 차량</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => handleVehicleClick(vehicle)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center text-white font-bold text-sm`}
                  >
                    {vehicle.rank}
                  </div>
                  <div>
                    <div className="font-medium">{vehicle.model}</div>
                    <div className="text-sm text-muted-foreground">{vehicle.brand}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{vehicle.performanceRating}</div>
                  <div className="text-xs text-muted-foreground">점수</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div className="text-muted-foreground">배터리</div>
                  <div className="font-medium">{vehicle.batteryCapacity}kWh</div>
                </div>
                <div>
                  <div className="text-muted-foreground">주행거리</div>
                  <div className="font-medium">{vehicle.range}km</div>
                </div>
                <div>
                  <div className="text-muted-foreground">효율</div>
                  <div className="font-medium">{vehicle.efficiency}km/kWh</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">전기차 성능 랭킹</h1>
        <p className="text-muted-foreground mt-2">차종별 배터리 성능을 비교하고 분석하세요</p>
      </div>

      {/* 성능 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 분석 차량</CardTitle>
            <Car className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicleData.length}대</div>
            <p className="text-xs text-muted-foreground">전기차 모델</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 성능 점수</CardTitle>
            <Gauge className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(vehicleData.reduce((sum, v) => sum + v.performanceRating, 0) / vehicleData.length)}
            </div>
            <p className="text-xs text-muted-foreground">100점 만점</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">최고 성능</CardTitle>
            <TrendingUp className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.max(...vehicleData.map((v) => v.performanceRating))}</div>
            <p className="text-xs text-muted-foreground">
              {
                vehicleData.find(
                  (v) => v.performanceRating === Math.max(...vehicleData.map((v) => v.performanceRating)),
                )?.model
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">성능 분포</CardTitle>
            <Activity className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {topPerformers.length}:{mediumPerformers.length}:{lowPerformers.length}
            </div>
            <p className="text-xs text-muted-foreground">고:중:저 성능</p>
          </CardContent>
        </Card>
      </div>

      {/* 성능 분포 차트 */}
      <Card>
        <CardHeader>
          <CardTitle>성능 분포 현황</CardTitle>
          <CardDescription>전체 차량의 성능 등급별 분포</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={performanceDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {performanceDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 flex justify-center gap-6">
            {performanceDistribution.map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span>
                  {item.name}: {item.value}대
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RankingCard vehicles={topPerformers} title="Top 100 (고성능)" bgColor="bg-chart-3" textColor="text-chart-3" />
        <RankingCard
          vehicles={mediumPerformers}
          title="Medium (중간성능)"
          bgColor="bg-chart-4"
          textColor="text-chart-4"
        />
        <RankingCard
          vehicles={lowPerformers}
          title="Bottom 100 (저성능)"
          bgColor="bg-chart-5"
          textColor="text-chart-5"
        />
      </div>

      <Dialog open={isAnalysisOpen} onOpenChange={setIsAnalysisOpen}>
        <DialogContent className="max-w-[98vw] w-[98vw] max-h-[98vh] h-[98vh] overflow-y-auto p-2">
          <DialogHeader className="px-4 py-2">
            <DialogTitle className="flex items-center gap-3">
              <Car className="h-6 w-6" />
              {selectedVehicle?.model} 상세 분석
            </DialogTitle>
            <DialogDescription>
              {selectedVehicle?.brand} | 랭킹 #{selectedVehicle?.rank} | 성능 점수: {selectedVehicle?.performanceRating}
              점
            </DialogDescription>
          </DialogHeader>

          {selectedVehicle && (
            <div className="space-y-6 px-4 pb-4">
              {/* 핵심 지표 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Battery className="h-8 w-8 mx-auto mb-2 text-chart-3" />
                    <div className="text-2xl font-bold text-chart-3">{selectedVehicle.batteryHealth}%</div>
                    <div className="text-sm text-muted-foreground">배터리 건강도</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Gauge className="h-8 w-8 mx-auto mb-2 text-chart-1" />
                    <div className="text-2xl font-bold">{selectedVehicle.odometer.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">주행거리 (km)</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Zap className="h-8 w-8 mx-auto mb-2 text-chart-2" />
                    <div className="text-2xl font-bold text-chart-2">{selectedVehicle.chargeLevel}%</div>
                    <div className="text-sm text-muted-foreground">현재 충전량</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Activity className="h-8 w-8 mx-auto mb-2 text-chart-4" />
                    <div className="text-2xl font-bold">{selectedVehicle.chargeCycles}</div>
                    <div className="text-sm text-muted-foreground">충전 사이클</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 성능 레이더 차트 */}
                <Card>
                  <CardHeader>
                    <CardTitle>종합 성능 분석</CardTitle>
                    <CardDescription>6개 영역별 성능 평가</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={600}>
                      <RadarChart data={selectedVehicle.radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} />
                        <Radar
                          name="성능"
                          dataKey="A"
                          stroke="var(--chart-1)"
                          fill="var(--chart-1)"
                          fillOpacity={0.3}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* 월별 효율 추이 */}
                <Card>
                  <CardHeader>
                    <CardTitle>월별 효율 추이</CardTitle>
                    <CardDescription>최근 6개월 에너지 효율 변화</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={600}>
                      <LineChart data={selectedVehicle.monthlyEfficiency}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="efficiency"
                          stroke="var(--chart-2)"
                          strokeWidth={2}
                          dot={{ fill: "var(--chart-2)" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* 상세 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>배터리 상태</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>배터리 건강도</span>
                      <span className="font-medium">{selectedVehicle.batteryHealth}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>성능 저하율</span>
                      <span className="font-medium text-chart-5">{selectedVehicle.degradation}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>온도 영향</span>
                      <span className="font-medium">{selectedVehicle.temperatureImpact}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>충전 사이클</span>
                      <span className="font-medium">{selectedVehicle.chargeCycles}회</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>성능 요약</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>종합 점수</span>
                      <span className="font-bold text-lg">{selectedVehicle.performanceRating}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span>성능 등급</span>
                      <div>{getPerformanceBadge(selectedVehicle.status)}</div>
                    </div>
                    <div className="flex justify-between">
                      <span>전체 순위</span>
                      <span className="font-medium">#{selectedVehicle.rank}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>카테고리</span>
                      <span className="font-medium capitalize">{selectedVehicle.category}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
