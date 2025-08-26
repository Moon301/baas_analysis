"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Gauge, AlertTriangle, Clock, MapPin } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts"

const vehicleOptions = [
  { id: "tesla", name: "Tesla Model S", brand: "Tesla" },
  { id: "ioniq6", name: "현대 아이오닉 6", brand: "현대" },
  { id: "ev6", name: "기아 EV6", brand: "기아" },
  { id: "bmw", name: "BMW iX", brand: "BMW" },
  { id: "id4", name: "폭스바겐 ID.4", brand: "폭스바겐" },
]

const vehicleData = {
  tesla: {
    avgSpeed: 58.7,
    totalDistance: 920,
    accelerationEvents: 5,
    drivingTime: 18.2,
    speedData: [
      { time: "00:00", speed: 0, avgSpeed: 52 },
      { time: "02:00", speed: 75, avgSpeed: 55 },
      { time: "04:00", speed: 90, avgSpeed: 62 },
      { time: "06:00", speed: 55, avgSpeed: 54 },
      { time: "08:00", speed: 35, avgSpeed: 48 },
      { time: "10:00", speed: 80, avgSpeed: 65 },
      { time: "12:00", speed: 95, avgSpeed: 68 },
      { time: "14:00", speed: 70, avgSpeed: 63 },
      { time: "16:00", speed: 50, avgSpeed: 58 },
      { time: "18:00", speed: 85, avgSpeed: 66 },
      { time: "20:00", speed: 65, avgSpeed: 61 },
      { time: "22:00", speed: 45, avgSpeed: 55 },
    ],
    distanceData: [
      { date: "1월", distance: 1450, efficiency: 4.8 },
      { date: "2월", distance: 1380, efficiency: 5.1 },
      { date: "3월", distance: 1620, efficiency: 4.6 },
      { date: "4월", distance: 1550, efficiency: 4.9 },
      { date: "5월", distance: 1780, efficiency: 4.4 },
      { date: "6월", distance: 1880, efficiency: 4.3 },
    ],
    safetyScore: 88,
  },
  ioniq6: {
    avgSpeed: 52.3,
    totalDistance: 800,
    accelerationEvents: 8,
    drivingTime: 15.3,
    speedData: [
      { time: "00:00", speed: 0, avgSpeed: 45 },
      { time: "02:00", speed: 65, avgSpeed: 48 },
      { time: "04:00", speed: 80, avgSpeed: 52 },
      { time: "06:00", speed: 45, avgSpeed: 47 },
      { time: "08:00", speed: 30, avgSpeed: 42 },
      { time: "10:00", speed: 70, avgSpeed: 55 },
      { time: "12:00", speed: 85, avgSpeed: 58 },
      { time: "14:00", speed: 60, avgSpeed: 53 },
      { time: "16:00", speed: 40, avgSpeed: 48 },
      { time: "18:00", speed: 75, avgSpeed: 56 },
      { time: "20:00", speed: 55, avgSpeed: 51 },
      { time: "22:00", speed: 35, avgSpeed: 45 },
    ],
    distanceData: [
      { date: "1월", distance: 1250, efficiency: 5.1 },
      { date: "2월", distance: 1180, efficiency: 5.4 },
      { date: "3월", distance: 1420, efficiency: 4.9 },
      { date: "4월", distance: 1350, efficiency: 5.2 },
      { date: "5월", distance: 1580, efficiency: 4.8 },
      { date: "6월", distance: 1680, efficiency: 4.7 },
    ],
    safetyScore: 82,
  },
  ev6: {
    avgSpeed: 49.8,
    totalDistance: 750,
    accelerationEvents: 12,
    drivingTime: 14.8,
    speedData: [
      { time: "00:00", speed: 0, avgSpeed: 42 },
      { time: "02:00", speed: 60, avgSpeed: 45 },
      { time: "04:00", speed: 75, avgSpeed: 49 },
      { time: "06:00", speed: 40, avgSpeed: 44 },
      { time: "08:00", speed: 25, avgSpeed: 39 },
      { time: "10:00", speed: 65, avgSpeed: 52 },
      { time: "12:00", speed: 80, avgSpeed: 55 },
      { time: "14:00", speed: 55, avgSpeed: 50 },
      { time: "16:00", speed: 35, avgSpeed: 45 },
      { time: "18:00", speed: 70, avgSpeed: 53 },
      { time: "20:00", speed: 50, avgSpeed: 48 },
      { time: "22:00", speed: 30, avgSpeed: 42 },
    ],
    distanceData: [
      { date: "1월", distance: 1150, efficiency: 4.2 },
      { date: "2월", distance: 1080, efficiency: 4.5 },
      { date: "3월", distance: 1320, efficiency: 4.1 },
      { date: "4월", distance: 1250, efficiency: 4.3 },
      { date: "5월", distance: 1480, efficiency: 3.9 },
      { date: "6월", distance: 1580, efficiency: 3.8 },
    ],
    safetyScore: 76,
  },
  bmw: {
    avgSpeed: 54.2,
    totalDistance: 680,
    accelerationEvents: 6,
    drivingTime: 12.5,
    speedData: [
      { time: "00:00", speed: 0, avgSpeed: 48 },
      { time: "02:00", speed: 68, avgSpeed: 51 },
      { time: "04:00", speed: 82, avgSpeed: 55 },
      { time: "06:00", speed: 48, avgSpeed: 50 },
      { time: "08:00", speed: 32, avgSpeed: 45 },
      { time: "10:00", speed: 72, avgSpeed: 58 },
      { time: "12:00", speed: 88, avgSpeed: 61 },
      { time: "14:00", speed: 62, avgSpeed: 56 },
      { time: "16:00", speed: 42, avgSpeed: 51 },
      { time: "18:00", speed: 78, avgSpeed: 59 },
      { time: "20:00", speed: 58, avgSpeed: 54 },
      { time: "22:00", speed: 38, avgSpeed: 48 },
    ],
    distanceData: [
      { date: "1월", distance: 1050, efficiency: 4.1 },
      { date: "2월", distance: 980, efficiency: 4.4 },
      { date: "3월", distance: 1220, efficiency: 4.0 },
      { date: "4월", distance: 1150, efficiency: 4.2 },
      { date: "5월", distance: 1380, efficiency: 3.8 },
      { date: "6월", distance: 1480, efficiency: 3.7 },
    ],
    safetyScore: 85,
  },
  id4: {
    avgSpeed: 46.5,
    totalDistance: 620,
    accelerationEvents: 15,
    drivingTime: 13.2,
    speedData: [
      { time: "00:00", speed: 0, avgSpeed: 40 },
      { time: "02:00", speed: 55, avgSpeed: 43 },
      { time: "04:00", speed: 70, avgSpeed: 47 },
      { time: "06:00", speed: 38, avgSpeed: 42 },
      { time: "08:00", speed: 22, avgSpeed: 37 },
      { time: "10:00", speed: 60, avgSpeed: 50 },
      { time: "12:00", speed: 75, avgSpeed: 53 },
      { time: "14:00", speed: 50, avgSpeed: 48 },
      { time: "16:00", speed: 30, avgSpeed: 43 },
      { time: "18:00", speed: 65, avgSpeed: 51 },
      { time: "20:00", speed: 45, avgSpeed: 46 },
      { time: "22:00", speed: 25, avgSpeed: 40 },
    ],
    distanceData: [
      { date: "1월", distance: 950, efficiency: 3.8 },
      { date: "2월", distance: 880, efficiency: 4.1 },
      { date: "3월", distance: 1120, efficiency: 3.7 },
      { date: "4월", distance: 1050, efficiency: 3.9 },
      { date: "5월", distance: 1280, efficiency: 3.5 },
      { date: "6월", distance: 1380, efficiency: 3.4 },
    ],
    safetyScore: 71,
  },
}

export function DrivingAnalysisContent() {
  const [selectedPeriod, setSelectedPeriod] = useState("week")
  const [selectedVehicle, setSelectedVehicle] = useState("ioniq6")

  const getCurrentVehicleData = () => {
    return vehicleData[selectedVehicle as keyof typeof vehicleData] || vehicleData.ioniq6
  }

  const currentData = getCurrentVehicleData()
  const selectedVehicleInfo = vehicleOptions.find((v) => v.id === selectedVehicle)

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 8) return "text-chart-5"
    if (intensity >= 6) return "text-chart-4"
    return "text-chart-3"
  }

  const getIntensityBadge = (intensity: number) => {
    if (intensity >= 8) return <Badge variant="destructive">위험</Badge>
    if (intensity >= 6) return <Badge className="bg-chart-4/10 text-chart-4 border-chart-4/20">주의</Badge>
    return <Badge className="bg-chart-3/10 text-chart-3 border-chart-3/20">양호</Badge>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">주행 특성 분석</h1>
        <p className="text-muted-foreground mt-2">
          {selectedVehicleInfo ? `${selectedVehicleInfo.name}의 ` : ""}속도, 주행거리, 급가속/급제동 패턴을 분석하세요
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 속도</CardTitle>
            <Gauge className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentData.avgSpeed} km/h</div>
            <p className="text-xs text-muted-foreground">지난 7일 평균</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 주행거리</CardTitle>
            <MapPin className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentData.totalDistance} km</div>
            <p className="text-xs text-muted-foreground">이번 주 누적</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">급가속/급제동</CardTitle>
            <AlertTriangle className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentData.accelerationEvents}회</div>
            <p className="text-xs text-muted-foreground">오늘 발생 횟수</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">주행 시간</CardTitle>
            <Clock className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentData.drivingTime}시간</div>
            <p className="text-xs text-muted-foreground">이번 주 총 시간</p>
          </CardContent>
        </Card>
      </div>

      {/* 필터 컨트롤 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="sm:max-w-xs">
            <SelectValue placeholder="기간 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">오늘</SelectItem>
            <SelectItem value="week">이번 주</SelectItem>
            <SelectItem value="month">이번 달</SelectItem>
            <SelectItem value="year">올해</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
          <SelectTrigger className="sm:max-w-xs">
            <SelectValue placeholder="차량 선택" />
          </SelectTrigger>
          <SelectContent>
            {vehicleOptions.map((vehicle) => (
              <SelectItem key={vehicle.id} value={vehicle.id}>
                {vehicle.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="speed" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="speed">속도 분석</TabsTrigger>
          <TabsTrigger value="distance">주행거리</TabsTrigger>
          <TabsTrigger value="acceleration">급가속/급제동</TabsTrigger>
          <TabsTrigger value="patterns">주행 패턴</TabsTrigger>
        </TabsList>

        <TabsContent value="speed" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>시간대별 속도 변화</CardTitle>
                <CardDescription>24시간 동안의 속도 패턴</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={currentData.speedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="speed" stroke="var(--chart-1)" strokeWidth={2} />
                    <Line type="monotone" dataKey="avgSpeed" stroke="var(--chart-2)" strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>속도 구간별 분포</CardTitle>
                <CardDescription>주행 속도 범위별 시간 비율</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">0-30 km/h (시내)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="w-3/5 h-full bg-chart-3 rounded-full"></div>
                      </div>
                      <span className="text-sm font-medium">35%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">31-60 km/h (도심)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="w-4/5 h-full bg-chart-2 rounded-full"></div>
                      </div>
                      <span className="text-sm font-medium">45%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">61-100 km/h (고속)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="w-1/5 h-full bg-chart-1 rounded-full"></div>
                      </div>
                      <span className="text-sm font-medium">20%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="distance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>월별 주행거리</CardTitle>
                <CardDescription>월별 누적 주행거리와 효율성</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={currentData.distanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="distance"
                      stroke="var(--chart-1)"
                      fill="var(--chart-1)"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>주간 주행 통계</CardTitle>
                <CardDescription>요일별 주행 패턴</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      { day: "월", trips: 3, distance: 85, avgSpeed: 42 },
                      { day: "화", trips: 4, distance: 120, avgSpeed: 48 },
                      { day: "수", trips: 2, distance: 65, avgSpeed: 38 },
                      { day: "목", trips: 5, distance: 145, avgSpeed: 52 },
                      { day: "금", trips: 4, distance: 110, avgSpeed: 45 },
                      { day: "토", trips: 2, distance: 180, avgSpeed: 65 },
                      { day: "일", trips: 1, distance: 95, avgSpeed: 55 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="distance" fill="var(--chart-2)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="acceleration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>급가속/급제동 이벤트</CardTitle>
              <CardDescription>오늘 발생한 급가속 및 급제동 상황</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { time: "08:15", type: "급가속", intensity: 8.5, location: "고속도로 진입" },
                  { time: "08:32", type: "급제동", intensity: 7.2, location: "교차로" },
                  { time: "09:45", type: "급가속", intensity: 6.8, location: "추월 구간" },
                  { time: "10:12", type: "급제동", intensity: 9.1, location: "신호등" },
                  { time: "11:30", type: "급가속", intensity: 7.5, location: "합류 구간" },
                  { time: "12:45", type: "급제동", intensity: 8.3, location: "보행자 횡단" },
                  { time: "14:20", type: "급가속", intensity: 6.2, location: "언덕 구간" },
                  { time: "15:55", type: "급제동", intensity: 7.8, location: "주차장 진입" },
                ]
                  .slice(0, currentData.accelerationEvents)
                  .map((event, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-medium">{event.time}</span>
                          <Badge variant={event.type === "급가속" ? "default" : "secondary"} className="text-xs">
                            {event.type}
                          </Badge>
                        </div>
                        <div>
                          <p className="font-medium">{event.location}</p>
                          <p className="text-sm text-muted-foreground">강도: {event.intensity}/10</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${getIntensityColor(event.intensity)}`}>
                          {event.intensity}
                        </span>
                        {getIntensityBadge(event.intensity)}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>급가속/급제동 빈도</CardTitle>
                <CardDescription>시간대별 발생 빈도</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={[
                      { time: "06-09", 급가속: 3, 급제동: 2 },
                      { time: "09-12", 급가속: 1, 급제동: 3 },
                      { time: "12-15", 급가속: 2, 급제동: 1 },
                      { time: "15-18", 급가속: 1, 급제동: 2 },
                      { time: "18-21", 급가속: 0, 급제동: 1 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="급가속" fill="var(--chart-1)" />
                    <Bar dataKey="급제동" fill="var(--chart-5)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>안전 점수</CardTitle>
                <CardDescription>주행 안전성 평가</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-chart-3 mb-2">{currentData.safetyScore}점</div>
                    <p className="text-xs text-muted-foreground">
                      전체 평균보다 {currentData.safetyScore - 70}점 {currentData.safetyScore > 70 ? "높음" : "낮음"}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">속도 준수</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="w-4/5 h-full bg-chart-3 rounded-full"></div>
                        </div>
                        <span className="text-sm">85</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">부드러운 운전</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="w-3/4 h-full bg-chart-4 rounded-full"></div>
                        </div>
                        <span className="text-sm">78</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">안전거리 유지</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="w-5/6 h-full bg-chart-2 rounded-full"></div>
                        </div>
                        <span className="text-sm">88</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>주행 패턴 분포</CardTitle>
                <CardDescription>주행 환경별 시간 비율</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { pattern: "고속주행", percentage: 35, color: "var(--chart-1)" },
                    { pattern: "시내주행", percentage: 45, color: "var(--chart-2)" },
                    { pattern: "정체구간", percentage: 20, color: "var(--chart-3)" },
                  ].map((pattern, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: pattern.color }}></div>
                        <span className="text-sm font-medium">{pattern.pattern}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pattern.percentage}%`,
                              backgroundColor: pattern.color,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{pattern.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>효율성 트렌드</CardTitle>
                <CardDescription>주행 패턴에 따른 에너지 효율</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={currentData.distanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="efficiency" stroke="var(--chart-3)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
