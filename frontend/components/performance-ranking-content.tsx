"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Calculator, Trophy, TrendingUp, Award, Upload, BarChart3, Battery, Gauge, Activity, MapPin } from "lucide-react"
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
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { OverallPerformanceDistribution } from "@/lib/api"

interface UserVehicleData {
  cell_balance_score: number
  soc_stability_score: number
  thermal_performance_score: number
  efficiency_score: number
  total_distance: number
  avg_operating_temperature: number
  total_segments: number
}

export function PerformanceRankingContent() {
  const [activeTab, setActiveTab] = useState("input")
  const [userVehicle, setUserVehicle] = useState<UserVehicleData>({
    cell_balance_score: 0,
    soc_stability_score: 0,
    thermal_performance_score: 0,
    efficiency_score: 0,
    total_distance: 0,
    avg_operating_temperature: 0,
    total_segments: 0,
  })
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [overallDistribution, setOverallDistribution] = useState<OverallPerformanceDistribution | null>(null)
  const [vehiclesByGrade, setVehiclesByGrade] = useState<{
    [grade: string]: {
      data: any[];
      pagination: {
        total_count: number;
        current_offset: number;
        current_limit: number;
        has_more: boolean;
        next_offset: number | null;
      };
    };
  }>({})
  const [loading, setLoading] = useState(false)

  // 전체 성능 분포 데이터 가져오기
  useEffect(() => {
    const fetchOverallDistribution = () => {
      setLoading(true)
      
      // 더미 데이터 사용
      const dummyDistribution = {
        total_vehicles: 7,
        distribution: {
          '우수': { count: 3, percentage: 42.9 },
          '보통': { count: 2, percentage: 28.6 },
          '나쁨': { count: 2, percentage: 28.6 }
        }
      }
      setOverallDistribution(dummyDistribution)
      
      // 더미 차량 데이터
      const dummyVehicles = {
        '우수': {
          data: [
            { clientid: 'client001', model_name: 'Model X', performance_score: 95, total_distance: 15000, avg_operating_temperature: 25, total_segments: 120 },
            { clientid: 'client002', model_name: 'Model S', performance_score: 92, total_distance: 12000, avg_operating_temperature: 26, total_segments: 100 },
            { clientid: 'client003', model_name: 'Model Y', performance_score: 90, total_distance: 18000, avg_operating_temperature: 24, total_segments: 150 }
          ],
          pagination: { total_count: 3, current_offset: 0, current_limit: 100, has_more: false, next_offset: null }
        },
        '보통': {
          data: [
            { clientid: 'client004', model_name: 'Model 3', performance_score: 78, total_distance: 8000, avg_operating_temperature: 28, total_segments: 80 },
            { clientid: 'client005', model_name: 'Model E', performance_score: 75, total_distance: 6000, avg_operating_temperature: 29, total_segments: 60 }
          ],
          pagination: { total_count: 2, current_offset: 0, current_limit: 100, has_more: false, next_offset: null }
        },
        '나쁨': {
          data: [
            { clientid: 'client006', model_name: 'Model W', performance_score: 45, total_distance: 3000, avg_operating_temperature: 32, total_segments: 30 },
            { clientid: 'client007', model_name: 'Model Z', performance_score: 52, total_distance: 5000, avg_operating_temperature: 31, total_segments: 50 }
          ],
          pagination: { total_count: 2, current_offset: 0, current_limit: 100, has_more: false, next_offset: null }
        }
      }
      setVehiclesByGrade(dummyVehicles)
      setLoading(false)
    }

    fetchOverallDistribution()
  }, [])

  const calculatePerformanceScore = (vehicle: UserVehicleData) => {
    // 4개 영역별 점수 합계 (각 25점 만점)
    return vehicle.cell_balance_score + vehicle.soc_stability_score + 
           vehicle.thermal_performance_score + vehicle.efficiency_score
  }

  const predictGrade = (score: number) => {
    if (score >= 80) return '우수'
    if (score >= 60) return '보통'
    return '나쁨'
  }

  const analyzePerformance = () => {
    const performanceScore = calculatePerformanceScore(userVehicle)
    const predictedGrade = predictGrade(performanceScore)

    // 전체 차량 데이터에서 순위 계산
    const allVehicles = [
      ...(vehiclesByGrade['우수']?.data || []),
      ...(vehiclesByGrade['보통']?.data || []),
      ...(vehiclesByGrade['나쁨']?.data || [])
    ]
    
    // 성능 점수로 정렬
    const sortedVehicles = allVehicles.sort((a, b) => b.performance_score - a.performance_score)
    
    // 현재 입력된 점수의 순위 찾기
    let rank = 1
    for (const vehicle of sortedVehicles) {
      if (vehicle.performance_score < performanceScore) break
      rank++
    }
    
    // 등급별 분포 계산
    const gradeDistribution = {
      '우수': vehiclesByGrade['우수']?.pagination.total_count || 0,
      '보통': vehiclesByGrade['보통']?.pagination.total_count || 0,
      '나쁨': vehiclesByGrade['나쁨']?.pagination.total_count || 0
    }
    
    const totalVehicles = Object.values(gradeDistribution).reduce((sum, count) => sum + count, 0)
    const percentile = totalVehicles > 0 ? Math.round(((totalVehicles - rank + 1) / totalVehicles) * 100) : 0

    // 레이더 차트 데이터
    const radarData = [
      { subject: "셀 밸런스", userScore: userVehicle.cell_balance_score, maxScore: 25 },
      { subject: "SOC 안정성", userScore: userVehicle.soc_stability_score, maxScore: 25 },
      { subject: "열 성능", userScore: userVehicle.thermal_performance_score, maxScore: 25 },
      { subject: "에너지 효율", userScore: userVehicle.efficiency_score, maxScore: 25 },
    ]

    setAnalysisResult({
      performanceScore,
      predictedGrade,
      overallRank: rank,
      totalVehicles,
      percentile,
      gradeDistribution,
      radarData,
      comparison: [
        { clientid: 'user', model_name: '내 차량', performance_score: performanceScore, car_type: '사용자 입력' },
        ...sortedVehicles.slice(0, 9) // 상위 9개 차량 + 사용자 차량 = 총 10개
      ],
      userVehicle
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
      return <Badge className="bg-green-100 text-green-800 border-green-200">상위 {percentage.toFixed(0)}%</Badge>
    if (percentage <= 50)
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">상위 {percentage.toFixed(0)}%</Badge>
    return <Badge className="bg-red-100 text-red-800 border-red-200">상위 {percentage.toFixed(0)}%</Badge>
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case '우수': return 'bg-green-100 text-green-800 border-green-200'
      case '보통': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case '나쁨': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
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
                    <Label htmlFor="cellBalanceScore">셀 밸런스 점수</Label>
                    <Input
                      id="cellBalanceScore"
                      type="number"
                      placeholder="0-25"
                      value={userVehicle.cell_balance_score || ""}
                      onChange={(e) => handleInputChange("cell_balance_score", Number.parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="socStabilityScore">SOC 안정성 점수</Label>
                    <Input
                      id="socStabilityScore"
                      type="number"
                      placeholder="0-25"
                      value={userVehicle.soc_stability_score || ""}
                      onChange={(e) => handleInputChange("soc_stability_score", Number.parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="thermalPerformanceScore">열 성능 점수</Label>
                    <Input
                      id="thermalPerformanceScore"
                      type="number"
                      placeholder="0-25"
                      value={userVehicle.thermal_performance_score || ""}
                      onChange={(e) => handleInputChange("thermal_performance_score", Number.parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="efficiencyScore">에너지 효율 점수</Label>
                    <Input
                      id="efficiencyScore"
                      type="number"
                      placeholder="0-25"
                      value={userVehicle.efficiency_score || ""}
                      onChange={(e) => handleInputChange("efficiency_score", Number.parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="totalDistance">총 주행거리 (km)</Label>
                    <Input
                      id="totalDistance"
                      type="number"
                      placeholder="10000"
                      value={userVehicle.total_distance || ""}
                      onChange={(e) => handleInputChange("total_distance", Number.parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="avgOperatingTemperature">평균 운전 온도 (°C)</Label>
                    <Input
                      id="avgOperatingTemperature"
                      type="number"
                      placeholder="20"
                      value={userVehicle.avg_operating_temperature || ""}
                      onChange={(e) => handleInputChange("avg_operating_temperature", Number.parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="totalSegments">총 세그먼트 수</Label>
                    <Input
                      id="totalSegments"
                      type="number"
                      placeholder="100"
                      value={userVehicle.total_segments || ""}
                      onChange={(e) => handleInputChange("total_segments", Number.parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={analyzePerformance}
                className="w-full"
                size="lg"
                disabled={loading}
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
                    <CardTitle>예측 등급</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className={`text-3xl font-bold mb-2 ${getGradeColor(analysisResult.predictedGrade)}`}>
                      {analysisResult.predictedGrade}
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        현재 입력된 점수로 예측된 등급입니다.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="text-center">
                    <BarChart3 className="h-8 w-8 mx-auto text-accent mb-2" />
                    <CardTitle>성능 등급 분포</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={Object.entries(analysisResult.gradeDistribution).map(([grade, count]) => ({ name: grade, value: count }))}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          label
                        >
                          {Object.entries(analysisResult.gradeDistribution).map(([grade, count]) => (
                            <Cell key={grade} fill={getGradeColor(grade)} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 text-sm text-muted-foreground">
                      전체 {analysisResult.totalVehicles}대 중 현재 차량은 {analysisResult.percentile}% 순위입니다.
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
                        <PolarRadiusAxis angle={90} domain={[0, 25]} />
                        <Radar
                          name="내 차량"
                          dataKey="userScore"
                          stroke="var(--chart-1)"
                          fill="var(--chart-1)"
                          fillOpacity={0.3}
                          strokeWidth={2}
                        />
                        <Radar
                          name="최고 평균"
                          dataKey="maxScore"
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
                    <CardDescription>상위 10개 차량과의 성능 비교</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analysisResult.comparison}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="model" angle={-45} textAnchor="end" height={80} fontSize={12} />
                        <YAxis />
                        <Tooltip />
                        <Bar
                          dataKey="performance_score"
                          fill="#8884d8"
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
                      const improvement = item.maxScore - item.userScore
                      if (improvement > 5) { // 개선 기준을 5점으로 설정
                        return (
                          <div key={index} className="p-4 border border-border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{item.subject}</h4>
                              <TrendingUp className="h-4 w-4 text-chart-4" />
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              현재: {item.userScore.toFixed(1)}점 → 목표: {item.maxScore.toFixed(1)}점
                            </p>
                            <p className="text-sm">
                              {item.subject === "셀 밸런스" && "배터리 셀 간 전압 차이를 줄이고, 셀 간 온도 차이를 최소화하세요"}
                              {item.subject === "SOC 안정성" && "배터리 관리 시스템을 점검하고 정기 진단을 받으세요"}
                              {item.subject === "열 성능" && "배터리 쿨링 시스템을 점검하고 정기 점검을 받으세요"}
                              {item.subject === "에너지 효율" && "에코 모드 사용과 부드러운 운전으로 효율을 개선하세요"}
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
