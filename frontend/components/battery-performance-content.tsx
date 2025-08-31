"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Battery, Zap, TrendingUp, Car, Gauge, Activity } from "lucide-react"
import {
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
} from "recharts"
import { useEffect, useRef } from "react"

// Plotly.js 타입 정의
declare global {
  interface Window {
    Plotly: any
  }
}

// 타입 정의
interface BatteryPerformanceRanking {
  clientid: string
  car_type: string
  model_year: number
  scores: {
    soh: number
    cell_balance: number
    driving_efficiency: number
    charging_efficiency: number
    temperature_stability: number
    charging_habit: number
    total: number
  }
  rank: number
  grade: number
  metrics: {
    avg_soh: number | null
    avg_cell_imbalance: number | null
    avg_soc_per_km: number | null
    slow_charge_efficiency: number | null
    fast_charge_efficiency: number | null
    avg_temp_range: number | null
    avg_start_soc: number | null
    avg_end_soc: number | null
  }
  data_quality: {
    soh_records: number
    driving_segments: number
    charge_sessions: number
  }
}

interface RankingSummary {
  total_clients: number
  avg_total_score: number
  min_total_score: number
  max_total_score: number
  stddev_total_score: number
  excellent_count: number
  good_count: number
  poor_count: number
  top_30_percent: number
  top_50_percent: number
}

export function BatteryPerformanceContent() {
  const [rankings, setRankings] = useState<BatteryPerformanceRanking[]>([])
  const [summary, setSummary] = useState<RankingSummary | null>(null)
  const [selectedVehicle, setSelectedVehicle] = useState<BatteryPerformanceRanking | null>(null)
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [segmentsData, setSegmentsData] = useState<any[]>([])
  const [pagination, setPagination] = useState({ limit: 1000, offset: 0, total: 0 })
  const chartRef = useRef<HTMLDivElement>(null)

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        console.log('데이터 로드 시작...')
        
        const [rankingsResponse, summaryResponse] = await Promise.all([
          fetch(`http://localhost:8004/api/v1/analytics/battery-performance/ranking?limit=${pagination.limit}&offset=${pagination.offset}`),
          fetch('http://localhost:8004/api/v1/analytics/battery-performance/ranking/summary')
        ])
        
        console.log('랭킹 응답 상태:', rankingsResponse.status)
        console.log('요약 응답 상태:', summaryResponse.status)
        
        if (rankingsResponse.ok) {
          const rankingsData = await rankingsResponse.json()
          console.log('랭킹 데이터:', rankingsData)
          setRankings(rankingsData.data || [])
          setPagination(prev => ({
            ...prev,
            total: rankingsData.pagination?.total_count || 0
          }))
        } else {
          console.error('랭킹 응답 실패:', rankingsResponse.status, rankingsResponse.statusText)
        }
        
        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json()
          console.log('요약 데이터:', summaryData)
          setSummary(summaryData)
        } else {
          console.error('요약 응답 실패:', summaryResponse.status, summaryResponse.statusText)
        }
      } catch (error) {
        console.error('데이터 로드 실패:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [pagination.limit, pagination.offset])

  // Plotly.js 스크립트 로드
  useEffect(() => {
    if (!window.Plotly) {
      const script = document.createElement('script')
      script.src = 'https://cdn.plot.ly/plotly-latest.min.js'
      script.onload = () => {
        console.log('Plotly.js 로드 완료')
      }
      document.head.appendChild(script)
    }
  }, [])

  // segmentsData가 변경될 때 SOC 그래프 그리기
  useEffect(() => {
    if (selectedVehicle && segmentsData.length > 0) {
      // Plotly.js가 로드될 때까지 대기
      const checkPlotly = () => {
        if (window.Plotly) {
          drawSOCChart(selectedVehicle.clientid, segmentsData)
        } else {
          setTimeout(checkPlotly, 100)
        }
      }
      checkPlotly()
    }
  }, [segmentsData, selectedVehicle])

  const topPerformers = rankings.filter((v) => v.scores.total >= 70).sort((a, b) => a.rank - b.rank)
  const mediumPerformers = rankings.filter((v) => v.scores.total >= 50 && v.scores.total < 70).sort((a, b) => a.rank - b.rank)
  const lowPerformers = rankings.filter((v) => v.scores.total < 50).sort((a, b) => a.rank - b.rank)

  const performanceDistribution = [
    { name: "고성능 (70+)", value: topPerformers.length, color: "#10b981" },
    { name: "중간성능 (50-69)", value: mediumPerformers.length, color: "#f59e0b" },
    { name: "저성능 (<50)", value: lowPerformers.length, color: "#ef4444" },
  ]

  const handleVehicleClick = async (vehicle: BatteryPerformanceRanking) => {
    setSelectedVehicle(vehicle)
    setIsAnalysisOpen(true)
    
    // 구간 데이터 가져오기
    try {
      const response = await fetch(`/api/v1/analytics/vehicle/${vehicle.clientid}/segments?soc`)
      if (response.ok) {
        const data = await response.json()
        setSegmentsData(data)
      }
    } catch (error) {
      console.error('구간 데이터 로드 실패:', error)
    }
  }



  const getPerformanceBadge = (totalScore: number) => {
    if (totalScore >= 70) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">고성능</Badge>
    } else if (totalScore >= 50) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">중간성능</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800 border-red-200">저성능</Badge>
    }
  }

  // SOC 그래프 그리기
  const drawSOCChart = (clientid: string, segments: any[]) => {
    if (!window.Plotly || !segments.length) return

    const chartDiv = document.getElementById(`soc-chart-${clientid}`)
    if (!chartDiv) return

    // 충전구간과 주행구간만 필터링
    const filteredSegments = segments.filter(s => 
      s.segment_type === 'charging' || s.segment_type === 'driving'
    )
    
    // 데이터 준비
    const times = filteredSegments.map(s => new Date(s.segment_start_time))
    const socValues = filteredSegments.map(s => s.start_soc)
    const segmentTypes = filteredSegments.map(s => {
      switch(s.segment_type) {
        case 'driving': return '주행'
        case 'charging': return '충전'
        default: return s.segment_type
      }
    })



    // 충전구간과 주행구간을 분리하여 각각 다른 시리즈로 표시
    const chargingData = filteredSegments
      .map((s, i) => ({ x: times[i], y: socValues[i], text: segmentTypes[i] }))
      .filter((_, i) => filteredSegments[i].segment_type === 'charging')
    
    const drivingData = filteredSegments
      .map((s, i) => ({ x: times[i], y: socValues[i], text: segmentTypes[i] }))
      .filter((_, i) => filteredSegments[i].segment_type === 'driving')

    const data = [
      // 충전구간 - 초록색 점
      {
        x: chargingData.map(d => d.x),
        y: chargingData.map(d => d.y),
        type: 'scatter',
        mode: 'markers',
        name: '충전',
        marker: { 
          color: '#10b981',  // 초록색
          size: 10,
          line: { color: '#ffffff', width: 1 },
          symbol: 'circle'
        },
        hovertemplate: 
          '<b>시간:</b> %{x}<br>' +
          '<b>SOC:</b> %{y:.1f}%<br>' +
          '<b>구간:</b> 충전<br>' +
          '<extra></extra>',
        hoverinfo: 'x+y+text'
      },
      // 주행구간 - 파란색 점
      {
        x: drivingData.map(d => d.x),
        y: drivingData.map(d => d.y),
        type: 'scatter',
        mode: 'markers',
        name: '주행',
        marker: { 
          color: '#3b82f6',  // 파란색
          size: 10,
          line: { color: '#ffffff', width: 1 },
          symbol: 'circle'
        },
        hovertemplate: 
          '<b>시간:</b> %{x}<br>' +
          '<b>SOC:</b> %{y:.1f}%<br>' +
          '<b>구간:</b> 주행<br>' +
          '<extra></extra>',
        hoverinfo: 'x+y+text'
      }
    ]

    const layout = {
      title: {
        text: '충전/주행 구간별 SOC 변화',
        font: { size: 16, color: '#374151' }
      },
      xaxis: {
        title: '시간',
        showgrid: true,
        gridcolor: '#e5e7eb',
        tickformat: '%m-%d %H:%M'
      },
      yaxis: {
        title: 'SOC (%)',
        range: [0, 100],
        showgrid: true,
        gridcolor: '#e5e7eb'
      },
      hovermode: 'x unified',
      margin: { l: 60, r: 30, t: 50, b: 60 },
      plot_bgcolor: '#ffffff',
      paper_bgcolor: '#ffffff',
      hoverlabel: {
        bgcolor: '#ffffff',
        bordercolor: '#d1d5db',
        font: { size: 12 }
      },
      showlegend: true,
      legend: {
        x: 0.02,
        y: 0.98,
        bgcolor: 'rgba(255, 255, 255, 0.8)',
        bordercolor: '#d1d5db',
        borderwidth: 1
      }
    }

    const config = {
      responsive: true,
      displayModeBar: false
    }

    window.Plotly.newPlot(chartDiv, data, layout, config)
  }

  const RankingCard = ({
    vehicles,
    title,
    bgColor,
  }: {
    vehicles: BatteryPerformanceRanking[]
    title: string
    bgColor: string
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
              key={vehicle.clientid}
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
                    <div className="font-medium">{vehicle.car_type}</div>
                    <div className="text-sm text-muted-foreground">{vehicle.clientid}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{vehicle.scores.total}</div>
                  <div className="text-xs text-muted-foreground">점수</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div className="text-muted-foreground">SOH</div>
                  <div className="font-medium">{vehicle.metrics.avg_soh?.toFixed(1) || 'N/A'}%</div>
                </div>
                <div>
                  <div className="text-muted-foreground">효율</div>
                  <div className="font-medium">{vehicle.metrics.avg_soc_per_km?.toFixed(2) || 'N/A'} %/km</div>
                </div>
                <div>
                  <div className="text-muted-foreground">등급</div>
                  <div className="font-medium">{vehicle.grade}/10</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">데이터를 불러오는 중...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">배터리 성능 평가</h1>
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
            <div className="text-2xl font-bold">{pagination.total || summary?.total_clients || 0}대</div>
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
              {summary?.avg_total_score?.toFixed(1) || '0.0'}
            </div>
            <p className="text-xs text-muted-foreground">100점 만점</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">최고 성능</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.max_total_score?.toFixed(1) || '0.0'}</div>
            <p className="text-xs text-muted-foreground">
              {rankings.find(v => v.scores.total === summary?.max_total_score)?.car_type || 'N/A'}
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

      {/* 페이지네이션 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">데이터 로드 현황</CardTitle>
          <CardDescription>현재 로드된 데이터 정보</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              총 {pagination.total}대 중 {rankings.length}대 로드됨
            </div>
            <div className="text-sm text-muted-foreground">
              페이지 크기: {pagination.limit}대
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RankingCard vehicles={topPerformers} title="Top 100 (고성능)" bgColor="bg-green-500" />
        <RankingCard
          vehicles={mediumPerformers}
          title="Medium (중간성능)"
          bgColor="bg-yellow-500"
        />
        <RankingCard
          vehicles={lowPerformers}
          title="Bottom 100 (저성능)"
          bgColor="bg-red-500"
        />
      </div>

      <Dialog open={isAnalysisOpen} onOpenChange={setIsAnalysisOpen}>
        <DialogContent className="max-w-[98vw] w-[98vw] max-h-[98vh] h-[98vh] overflow-y-auto p-2">
          <DialogHeader className="px-4 py-2">
            <DialogTitle className="flex items-center gap-3">
              <Car className="h-6 w-6" />
              {selectedVehicle?.car_type} 상세 분석
            </DialogTitle>
            <DialogDescription>
              {selectedVehicle?.clientid} | 랭킹 #{selectedVehicle?.rank} | 성능 점수: {selectedVehicle?.scores.total}
              점
            </DialogDescription>
          </DialogHeader>

          {selectedVehicle && (
            <div className="space-y-6 px-4 pb-4">
              {/* 핵심 지표 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Battery className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <div className="text-2xl font-bold text-green-600">{selectedVehicle.metrics.avg_soh?.toFixed(1) || 'N/A'}%</div>
                    <div className="text-sm text-muted-foreground">배터리 건강도</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Gauge className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <div className="text-2xl font-bold">{selectedVehicle.data_quality.driving_segments}</div>
                    <div className="text-sm text-muted-foreground">주행 구간 </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Zap className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                    <div className="text-2xl font-bold text-yellow-600">{selectedVehicle.metrics.avg_soc_per_km?.toFixed(2) || 'N/A'} %/km</div>
                    <div className="text-sm text-muted-foreground">평균 효율</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Activity className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <div className="text-2xl font-bold">{selectedVehicle.data_quality.charge_sessions}</div>
                    <div className="text-sm text-muted-foreground">충전 구간</div>
                  </CardContent>
                </Card>
              </div>

              {/* 구간별 SOC 그래프 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">충전/주행 구간별 SOC 변화</CardTitle>
                  <CardDescription>
                    충전구간(초록)과 주행구간(파랑)의 SOC 변화를 시각화합니다
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div id={`soc-chart-${selectedVehicle.clientid}`} className="w-full h-80"></div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 성능 레이더 차트 */}
                <Card>
                  <CardHeader>
                    <CardTitle>종합 성능 분석</CardTitle>
                    <CardDescription>6개 영역별 성능 평가</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <RadarChart data={[
                        { subject: "SOH", A: selectedVehicle.scores.soh, fullMark: 20 },
                        { subject: "셀 밸런싱", A: selectedVehicle.scores.cell_balance, fullMark: 15 },
                        { subject: "주행 효율", A: selectedVehicle.scores.driving_efficiency, fullMark: 20 },
                        { subject: "충전 효율", A: selectedVehicle.scores.charging_efficiency, fullMark: 15 },
                        { subject: "온도 안정성", A: selectedVehicle.scores.temperature_stability, fullMark: 15 },
                        { subject: "충전 습관", A: selectedVehicle.scores.charging_habit, fullMark: 15 },
                      ]}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis angle={90} domain={[0, 20]} />
                        <Radar
                          name="성능"
                          dataKey="A"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.3}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* 상세 점수 */}
                <Card>
                  <CardHeader>
                    <CardTitle>상세 점수</CardTitle>
                    <CardDescription>각 영역별 세부 점수</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>SOH (20점)</span>
                      <span className="font-medium">{selectedVehicle.scores.soh}/20</span>
                    </div>
                    <div className="flex justify-between">
                      <span>셀 밸런싱 (15점)</span>
                      <span className="font-medium">{selectedVehicle.scores.cell_balance}/15</span>
                    </div>
                    <div className="flex justify-between">
                      <span>주행 효율 (20점)</span>
                      <span className="font-medium">{selectedVehicle.scores.driving_efficiency}/20</span>
                    </div>
                    <div className="flex justify-between">
                      <span>충전 효율 (15점)</span>
                      <span className="font-medium">{selectedVehicle.scores.charging_efficiency}/15</span>
                    </div>
                    <div className="flex justify-between">
                      <span>온도 안정성 (15점)</span>
                      <span className="font-medium">{selectedVehicle.scores.temperature_stability}/15</span>
                    </div>
                    <div className="flex justify-between">
                      <span>충전 습관 (15점)</span>
                      <span className="font-medium">{selectedVehicle.scores.charging_habit}/15</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-bold text-lg">
                        <span>총점</span>
                        <span>{selectedVehicle.scores.total}/100</span>
                      </div>
                    </div>
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
                      <span className="font-medium">{selectedVehicle.metrics.avg_soh?.toFixed(1) || 'N/A'}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>셀 전압 편차</span>
                      <span className="font-medium">{selectedVehicle.metrics.avg_cell_imbalance?.toFixed(3) || 'N/A'}V</span>
                    </div>
                    <div className="flex justify-between">
                      <span>평균 효율</span>
                      <span className="font-medium">{selectedVehicle.metrics.avg_soc_per_km?.toFixed(2) || 'N/A'} %/km</span>
                    </div>
                    <div className="flex justify-between">
                      <span>온도 범위</span>
                      <span className="font-medium">{selectedVehicle.metrics.avg_temp_range?.toFixed(1) || 'N/A'}°C</span>
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
                      <span className="font-bold text-lg">{selectedVehicle.scores.total}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span>성능 등급</span>
                      <div>{getPerformanceBadge(selectedVehicle.scores.total)}</div>
                    </div>
                    <div className="flex justify-between">
                      <span>전체 순위</span>
                      <span className="font-medium">#{selectedVehicle.rank}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>10등급</span>
                      <span className="font-medium">{selectedVehicle.grade}/10</span>
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
