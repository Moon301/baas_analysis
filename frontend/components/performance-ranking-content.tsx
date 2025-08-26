"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Calculator, Trophy, TrendingUp, Award, Upload, BarChart3 } from "lucide-react"
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"

// 기준 차량 데이터 (비교 대상)
const referenceVehicles = [
  {
    id: 1,
    model: "Tesla Model S",
    brand: "Tesla",
    batteryCapacity: 100,
    range: 652,
    chargingSpeed: 250,
    efficiency: 4.8,
    performanceScore: 95,
    category: "luxury",
  },
  {
    id: 2,
    model: "현대 아이오닉 6",
    brand: "현대",
    batteryCapacity: 77.4,
    range: 614,
    chargingSpeed: 235,
    efficiency: 5.1,
    performanceScore: 88,
    category: "premium",
  },
  {
    id: 3,
    model: "기아 EV6",
    brand: "기아",
    batteryCapacity: 77.4,
    range: 528,
    chargingSpeed: 240,
    efficiency: 4.2,
    performanceScore: 85,
    category: "premium",
  },
  {
    id: 4,
    model: "BMW iX",
    brand: "BMW",
    batteryCapacity: 111.5,
    range: 630,
    chargingSpeed: 195,
    efficiency: 4.1,
    performanceScore: 82,
    category: "luxury",
  },
  {
    id: 5,
    model: "폭스바겐 ID.4",
    brand: "폭스바겐",
    batteryCapacity: 82,
    range: 520,
    chargingSpeed: 135,
    efficiency: 3.8,
    performanceScore: 75,
    category: "standard",
  },
]

interface UserVehicleData {
  model: string
  brand: string
  batteryCapacity: number
  totalMileage: number
  averageEfficiency: number
  chargingSpeed: number
  batteryHealth: number
  purchaseYear: number
  category: string
}

export function PerformanceRankingContent() {
  const [activeTab, setActiveTab] = useState("input")
  const [userVehicle, setUserVehicle] = useState<UserVehicleData>({
    model: "",
    brand: "",
    batteryCapacity: 0,
    totalMileage: 0,
    averageEfficiency: 0,
    chargingSpeed: 0,
    batteryHealth: 100,
    purchaseYear: new Date().getFullYear(),
    category: "",
  })
  const [analysisResult, setAnalysisResult] = useState<any>(null)

  const calculatePerformanceScore = (vehicle: UserVehicleData) => {
    // 성능 점수 계산 로직
    const efficiencyScore = Math.min((vehicle.averageEfficiency / 5.0) * 25, 25)
    const capacityScore = Math.min((vehicle.batteryCapacity / 100) * 20, 20)
    const chargingScore = Math.min((vehicle.chargingSpeed / 250) * 20, 20)
    const healthScore = (vehicle.batteryHealth / 100) * 20
    const ageScore = Math.max(15 - (new Date().getFullYear() - vehicle.purchaseYear) * 2, 5)

    return Math.round(efficiencyScore + capacityScore + chargingScore + healthScore + ageScore)
  }

  const analyzePerformance = () => {
    const performanceScore = calculatePerformanceScore(userVehicle)

    // 순위 계산
    const allVehicles = [...referenceVehicles, { ...userVehicle, performanceScore }]
    const sortedVehicles = allVehicles.sort((a, b) => b.performanceScore - a.performanceScore)
    const userRank = sortedVehicles.findIndex((v) => v.model === userVehicle.model) + 1

    // 카테고리별 순위
    const categoryVehicles = allVehicles.filter((v) => v.category === userVehicle.category)
    const sortedCategoryVehicles = categoryVehicles.sort((a, b) => b.performanceScore - a.performanceScore)
    const categoryRank = sortedCategoryVehicles.findIndex((v) => v.model === userVehicle.model) + 1

    // 레이더 차트 데이터
    const radarData = [
      { subject: "효율성", userScore: Math.min((userVehicle.averageEfficiency / 5.0) * 100, 100), avgScore: 80 },
      { subject: "배터리 용량", userScore: Math.min((userVehicle.batteryCapacity / 100) * 100, 100), avgScore: 75 },
      { subject: "충전 속도", userScore: Math.min((userVehicle.chargingSpeed / 250) * 100, 100), avgScore: 70 },
      { subject: "배터리 건강도", userScore: userVehicle.batteryHealth, avgScore: 85 },
      {
        subject: "연식",
        userScore: Math.max(100 - (new Date().getFullYear() - userVehicle.purchaseYear) * 10, 20),
        avgScore: 60,
      },
    ]

    setAnalysisResult({
      performanceScore,
      overallRank: userRank,
      totalVehicles: allVehicles.length,
      categoryRank,
      totalCategoryVehicles: categoryVehicles.length,
      radarData,
      comparison: sortedVehicles.slice(0, 5),
    })

    setActiveTab("result")
  }

  const handleInputChange = (field: keyof UserVehicleData, value: string | number) => {
    setUserVehicle((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const getRankBadge = (rank: number, total: number) => {
    const percentage = (rank / total) * 100
    if (percentage <= 20)
      return <Badge className="bg-chart-3/10 text-chart-3 border-chart-3/20">상위 {percentage.toFixed(0)}%</Badge>
    if (percentage <= 50)
      return <Badge className="bg-chart-2/10 text-chart-2 border-chart-2/20">상위 {percentage.toFixed(0)}%</Badge>
    return <Badge className="bg-chart-4/10 text-chart-4 border-chart-4/20">상위 {percentage.toFixed(0)}%</Badge>
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-chart-3"
    if (score >= 70) return "text-chart-2"
    if (score >= 55) return "text-chart-4"
    return "text-chart-5"
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">성능 순위 분석</h1>
        <p className="text-muted-foreground mt-2">입력한 데이터를 기반으로 배터리 성능 순위를 분석하세요</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="input">데이터 입력</TabsTrigger>
          <TabsTrigger value="result" disabled={!analysisResult}>
            분석 결과
          </TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                차량 정보 입력
              </CardTitle>
              <CardDescription>정확한 분석을 위해 차량의 상세 정보를 입력해주세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="brand">브랜드</Label>
                    <Input
                      id="brand"
                      placeholder="예: Tesla, 현대, 기아"
                      value={userVehicle.brand}
                      onChange={(e) => handleInputChange("brand", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="model">모델명</Label>
                    <Input
                      id="model"
                      placeholder="예: Model 3, 아이오닉 5, EV6"
                      value={userVehicle.model}
                      onChange={(e) => handleInputChange("model", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">차량 등급</Label>
                    <Select
                      value={userVehicle.category}
                      onValueChange={(value) => handleInputChange("category", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="차량 등급 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">스탠다드</SelectItem>
                        <SelectItem value="premium">프리미엄</SelectItem>
                        <SelectItem value="luxury">럭셔리</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="purchaseYear">구매 연도</Label>
                    <Input
                      id="purchaseYear"
                      type="number"
                      placeholder="2024"
                      value={userVehicle.purchaseYear || ""}
                      onChange={(e) => handleInputChange("purchaseYear", Number.parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="batteryCapacity">배터리 용량 (kWh)</Label>
                    <Input
                      id="batteryCapacity"
                      type="number"
                      placeholder="77.4"
                      value={userVehicle.batteryCapacity || ""}
                      onChange={(e) => handleInputChange("batteryCapacity", Number.parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="totalMileage">총 주행거리 (km)</Label>
                    <Input
                      id="totalMileage"
                      type="number"
                      placeholder="25000"
                      value={userVehicle.totalMileage || ""}
                      onChange={(e) => handleInputChange("totalMileage", Number.parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="averageEfficiency">평균 효율 (km/kWh)</Label>
                    <Input
                      id="averageEfficiency"
                      type="number"
                      step="0.1"
                      placeholder="4.2"
                      value={userVehicle.averageEfficiency || ""}
                      onChange={(e) => handleInputChange("averageEfficiency", Number.parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="chargingSpeed">최대 충전속도 (kW)</Label>
                    <Input
                      id="chargingSpeed"
                      type="number"
                      placeholder="240"
                      value={userVehicle.chargingSpeed || ""}
                      onChange={(e) => handleInputChange("chargingSpeed", Number.parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="batteryHealth">배터리 건강도 (%)</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Input
                    id="batteryHealth"
                    type="number"
                    min="0"
                    max="100"
                    value={userVehicle.batteryHealth}
                    onChange={(e) => handleInputChange("batteryHealth", Number.parseInt(e.target.value) || 100)}
                    className="max-w-24"
                  />
                  <Progress value={userVehicle.batteryHealth} className="flex-1" />
                  <span className="text-sm font-medium">{userVehicle.batteryHealth}%</span>
                </div>
              </div>

              <Button
                onClick={analyzePerformance}
                className="w-full"
                size="lg"
                disabled={!userVehicle.model || !userVehicle.brand || !userVehicle.category}
              >
                <Calculator className="h-4 w-4 mr-2" />
                성능 분석 시작
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="result" className="space-y-6">
          {analysisResult && (
            <>
              {/* 종합 성능 점수 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="text-center">
                    <Trophy className="h-8 w-8 mx-auto text-accent mb-2" />
                    <CardTitle>종합 성능 점수</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className={`text-4xl font-bold mb-2 ${getScoreColor(analysisResult.performanceScore)}`}>
                      {analysisResult.performanceScore}점
                    </div>
                    <div className="space-y-2">
                      {getRankBadge(analysisResult.overallRank, analysisResult.totalVehicles)}
                      <p className="text-sm text-muted-foreground">
                        전체 {analysisResult.totalVehicles}대 중 {analysisResult.overallRank}위
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="text-center">
                    <Award className="h-8 w-8 mx-auto text-accent mb-2" />
                    <CardTitle>카테고리 순위</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="text-3xl font-bold mb-2 text-chart-2">{analysisResult.categoryRank}위</div>
                    <div className="space-y-2">
                      <Badge variant="outline">{userVehicle.category} 등급</Badge>
                      <p className="text-sm text-muted-foreground">동급 {analysisResult.totalCategoryVehicles}대 중</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="text-center">
                    <BarChart3 className="h-8 w-8 mx-auto text-accent mb-2" />
                    <CardTitle>성능 등급</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="text-2xl font-bold mb-2">
                      {analysisResult.performanceScore >= 85
                        ? "A"
                        : analysisResult.performanceScore >= 70
                          ? "B"
                          : analysisResult.performanceScore >= 55
                            ? "C"
                            : "D"}
                      등급
                    </div>
                    <div className="space-y-2">
                      <Progress value={analysisResult.performanceScore} className="w-full" />
                      <p className="text-sm text-muted-foreground">
                        {analysisResult.performanceScore >= 85
                          ? "우수한"
                          : analysisResult.performanceScore >= 70
                            ? "양호한"
                            : analysisResult.performanceScore >= 55
                              ? "보통의"
                              : "개선이 필요한"}{" "}
                        성능
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 상세 분석 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>성능 분석 레이더</CardTitle>
                    <CardDescription>각 항목별 성능 비교</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={analysisResult.radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} />
                        <Radar
                          name="내 차량"
                          dataKey="userScore"
                          stroke="var(--chart-1)"
                          fill="var(--chart-1)"
                          fillOpacity={0.3}
                          strokeWidth={2}
                        />
                        <Radar
                          name="평균"
                          dataKey="avgScore"
                          stroke="var(--chart-2)"
                          fill="var(--chart-2)"
                          fillOpacity={0.1}
                          strokeWidth={2}
                          strokeDasharray="5 5"
                        />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>경쟁 차량 비교</CardTitle>
                    <CardDescription>상위 5개 차량과의 성능 비교</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analysisResult.comparison}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="model" angle={-45} textAnchor="end" height={80} fontSize={12} />
                        <YAxis />
                        <Tooltip />
                        <Bar
                          dataKey="performanceScore"
                          fill={(entry: any) =>
                            entry.model === userVehicle.model ? "var(--chart-1)" : "var(--chart-2)"
                          }
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* 개선 제안 */}
              <Card>
                <CardHeader>
                  <CardTitle>성능 개선 제안</CardTitle>
                  <CardDescription>더 높은 순위를 위한 개선 방안</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysisResult.radarData.map((item: any, index: number) => {
                      const improvement = item.avgScore - item.userScore
                      if (improvement > 10) {
                        return (
                          <div key={index} className="p-4 border border-border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{item.subject}</h4>
                              <TrendingUp className="h-4 w-4 text-chart-4" />
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              현재: {item.userScore.toFixed(1)}점 → 목표: {item.avgScore.toFixed(1)}점
                            </p>
                            <p className="text-sm">
                              {item.subject === "효율성" && "에코 모드 사용과 부드러운 운전으로 효율을 개선하세요"}
                              {item.subject === "배터리 용량" && "배터리 관리 시스템을 점검하고 정기 진단을 받으세요"}
                              {item.subject === "충전 속도" && "충전 포트와 케이블 상태를 확인하세요"}
                              {item.subject === "배터리 건강도" && "적정 충전 범위(20-80%)를 유지하세요"}
                              {item.subject === "연식" && "최신 소프트웨어 업데이트를 확인하세요"}
                            </p>
                          </div>
                        )
                      }
                      return null
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* 새로운 분석 버튼 */}
              <div className="text-center">
                <Button onClick={() => setActiveTab("input")} variant="outline">
                  새로운 차량 분석하기
                </Button>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
