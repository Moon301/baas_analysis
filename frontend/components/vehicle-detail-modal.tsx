"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Car, 
  Calendar, 
  Clock, 
  MapPin, 
  Battery, 
  Zap,
  TrendingUp,
  Activity
} from "lucide-react"

// Plotly.js 타입 정의
declare global {
  interface Window {
    Plotly: {
      newPlot: (div: HTMLElement, data: unknown[], layout: unknown, config?: unknown) => Promise<void>
      purge: (div: HTMLElement) => void
    }
  }
}

// 차량 요약 정보 타입
interface VehicleSummary {
  clientid: string
  car_type: string | null
  model_year: string | null
  total_segments: number
  valid_segments: number
  total_duration_hours: number
  avg_duration_min: number
  last_activity: string
  total_mileage: number
  avg_soc_per_km: number | null
  segment_counts: {
    charging: number    // 충전
    driving: number     // 주행
    idling: number      // 정차
    parked: number      // 주차
    other: number       // 기타
  }
}

// 구간 데이터 타입
interface SegmentData {
  segment_start_time: string
  segment_end_time: string
  segment_duration_minutes: number
  segment_type: string
  energy_consumed_wh: number
  efficiency_wh_per_km: number
  start_mileage?: number
  end_mileage?: number
  mileage_change?: number
  start_soc?: number
  end_soc?: number
  soc_change?: number
  max_speed?: number
  avg_speed?: number
  engine_on_percentage?: number
  avg_chg_state?: number
}

interface VehicleDetailModalProps {
  isOpen: boolean
  onClose: () => void
  clientid: string
}

export function VehicleDetailModal({ isOpen, onClose, clientid }: VehicleDetailModalProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [vehicleSummary, setVehicleSummary] = useState<VehicleSummary | null>(null)
  const [segmentsData, setSegmentsData] = useState<SegmentData[]>([])
  const [dataType, setDataType] = useState<"mileage" | "soc">("mileage")
  const [plotlyChart, setPlotlyChart] = useState<any>(null)

  // 차량 정보 및 구간 데이터 가져오기
  useEffect(() => {
    if (!isOpen || !clientid) return

    const fetchVehicleData = async () => {
      try {
        setLoading(true)
        setError(null)

        // 차량 요약 정보 가져오기
        const summaryResponse = await fetch(`/api/v1/analytics/vehicle/${clientid}/summary`)
        if (!summaryResponse.ok) throw new Error('차량 요약 정보를 불러올 수 없습니다.')
        const summaryData = await summaryResponse.json()
        setVehicleSummary(summaryData)

        // 구간 데이터 가져오기
        const segmentsResponse = await fetch(`/api/v1/analytics/vehicle/${clientid}/segments?data_type=${dataType}`)
        if (!segmentsResponse.ok) throw new Error('구간 데이터를 불러올 수 없습니다.')
        const segmentsData = await segmentsResponse.json()
        setSegmentsData(segmentsData)

      } catch (err) {
        console.error('차량 데이터 fetch error:', err)
        setError(err instanceof Error ? err.message : '데이터를 불러올 수 없습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchVehicleData()
  }, [isOpen, clientid, dataType])

  // Plotly 차트 렌더링
  useEffect(() => {
    if (!segmentsData.length) return

    // Plotly.js가 로드될 때까지 대기
    const waitForPlotly = () => {
      if (window.Plotly) {
        renderChart()
      } else {
        setTimeout(waitForPlotly, 100)
      }
    }

    const renderChart = () => {
      const chartContainer = document.getElementById('vehicle-chart')
      if (!chartContainer) return

      // 데이터 타입에 따른 차트 데이터 준비
      let xData: any[]
      let yData: any[]
      let textData: string[]

      if (dataType === "mileage") {
        xData = segmentsData.map(seg => new Date(seg.segment_start_time).getTime())
        yData = segmentsData.map(seg => seg.start_mileage || 0)
        textData = segmentsData.map(seg => 
          `${seg.segment_type}<br>` +
          `시간: ${new Date(seg.segment_start_time).toLocaleString('ko-KR')}<br>` +
          `시작: ${seg.start_mileage?.toFixed(1)}km<br>` +
          `종료: ${seg.end_mileage?.toFixed(1)}km<br>` +
          `변화: ${seg.mileage_change?.toFixed(1)}km<br>` +
          `소요시간: ${seg.segment_duration_minutes?.toFixed(1)}분<br>` +
          `최대속도: ${seg.max_speed?.toFixed(1)}km/h<br>` +
          `평균속도: ${seg.avg_speed?.toFixed(1)}km/h`
        )
      } else {
        xData = segmentsData.map(seg => new Date(seg.segment_start_time).getTime())
        yData = segmentsData.map(seg => seg.start_soc || 0)
        textData = segmentsData.map(seg => 
          `${seg.segment_type}<br>` +
          `시간: ${new Date(seg.segment_start_time).toLocaleString('ko-KR')}<br>` +
          `시작 SOC: ${seg.start_soc?.toFixed(1)}%<br>` +
          `종료 SOC: ${seg.end_soc?.toFixed(1)}%<br>` +
          `변화: ${seg.soc_change?.toFixed(1)}%<br>` +
          `소요시간: ${seg.segment_duration_minutes?.toFixed(1)}분<br>` +
          `시동상태: ${seg.engine_on_percentage?.toFixed(1)}%<br>` +
          `충전상태: ${seg.avg_chg_state?.toFixed(3)}`
        )
      }

      // 구간 타입별 색상 설정
      const colors = segmentsData.map(seg => {
        switch (seg.segment_type) {
          case 'driving': return '#4DA8DA' // 파랑
          case 'charging': return '#78C841' // 초록
          case 'idling': return '#FF894F' // 주황
          case 'parked': return 'FF6363' // 빨강
          default: return '#8b5cf6' // 보라
        }
      })

      const chartData = [{
        x: xData,
        y: yData,
        mode: 'markers',
        type: 'scatter',
        marker: {
          size: 8,
          color: colors,
        },
        text: textData,
        hoverinfo: 'text',
        name: '구간 데이터'
      }]

      const layout = {
        title: {
          text: dataType === "mileage" ? '시간별 주행거리 구간 데이터' : '시간별 SOC 구간 데이터',
          font: { size: 16 }
        },
        xaxis: {
          title: '시간',
          type: 'date',
          gridcolor: '#e5e7eb'
        },
        yaxis: {
          title: dataType === "mileage" ? '주행거리 (km)' : 'SOC (%)',
          gridcolor: '#e5e7eb'
        },
        plot_bgcolor: '#ffffff',
        paper_bgcolor: '#ffffff',
        hovermode: 'closest',
        margin: { l: 60, r: 30, t: 60, b: 60 }
      }

      const config = {
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d']
      }

      // 기존 차트 제거 후 새로 생성
      if (plotlyChart) {
        window.Plotly.purge(chartContainer)
      }

      // Plotly.newPlot을 Promise로 처리
      window.Plotly.newPlot(chartContainer, chartData, layout, config)
        .then((newChart: any) => {
          setPlotlyChart(newChart)
        })
        .catch((error: any) => {
          console.error('Plotly 차트 생성 오류:', error)
        })
    }

    // Plotly.js 로딩 대기 시작
    waitForPlotly()

  }, [segmentsData, dataType])

  // 모달 닫기 시 정리
  const handleClose = () => {
    if (plotlyChart) {
      const chartContainer = document.getElementById('vehicle-chart')
      if (chartContainer) {
        window.Plotly.purge(chartContainer)
      }
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            차량 상세 정보 - {clientid}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-500 mb-4">⚠️</div>
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 차량 요약 정보 */}
            {vehicleSummary && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600">차종</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold">{vehicleSummary.car_type || 'Unknown'}</div>
                    <div className="text-sm text-gray-500">{vehicleSummary.model_year || 'Unknown'}</div>
                  </CardContent>
                </Card>


                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600">총 활동 시간</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold">{vehicleSummary.total_duration_hours.toFixed(1)}시간</div>
                    <div className="text-sm text-gray-500">평균: {vehicleSummary.avg_duration_min.toFixed(1)}분</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600">구간 정보</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold">{vehicleSummary.total_segments}개</div>
                    <div className="text-sm text-gray-500">유효: {vehicleSummary.valid_segments}개</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600">구간 종류별 수량</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-green-600">충전:</span>
                        <span className="font-medium">{vehicleSummary.segment_counts.charging}개</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-600">주행:</span>
                        <span className="font-medium">{vehicleSummary.segment_counts.driving}개</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-orange-600">정차:</span>
                        <span className="font-medium">{vehicleSummary.segment_counts.idling}개</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-600">주차:</span>
                        <span className="font-medium">{vehicleSummary.segment_counts.parked}개</span>
                      </div>
                      {vehicleSummary.segment_counts.other > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">기타:</span>
                          <span className="font-medium">{vehicleSummary.segment_counts.other}개</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 차트 컨트롤 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">차트 설정</CardTitle>
                <CardDescription>
                  Y축 기준을 선택하여 구간별 데이터를 확인할 수 있습니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Y축 기준:</span>
                    <Select value={dataType} onValueChange={(value: "mileage" | "soc") => setDataType(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="soc">SOC</SelectItem>
                        <SelectItem value="mileage">주행거리</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    총 {segmentsData.length}개 구간
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* 차트 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">구간별 데이터 시각화</CardTitle>
                <CardDescription>
                  {dataType === "mileage" 
                    ? "시간순으로 주행거리 구간 데이터를 표시합니다" 
                    : "시간순으로 SOC 구간 데이터를 표시합니다"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div id="vehicle-chart" className="w-full h-96"></div>
              </CardContent>
            </Card>

            {/* 구간 데이터 테이블 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">구간 데이터 상세</CardTitle>
                <CardDescription>
                  각 구간의 상세 정보를 확인할 수 있습니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-2 font-medium">구간 타입</th>
                        <th className="text-left p-2 font-medium">시작 시간</th>
                        <th className="text-left p-2 font-medium">종료 시간</th>
                        <th className="text-left p-2 font-medium">소요시간</th>
                        {dataType === "mileage" ? (
                          <>
                            <th className="text-left p-2 font-medium">시작 주행거리</th>
                            <th className="text-left p-2 font-medium">종료 주행거리</th>
                            <th className="text-left p-2 font-medium">주행거리 변화</th>
                          </>
                        ) : (
                          <>
                            <th className="text-left p-2 font-medium">시작 SOC</th>
                            <th className="text-left p-2 font-medium">종료 SOC</th>
                            <th className="text-left p-2 font-medium">SOC 변화</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {segmentsData.map((segment, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-2">
                            <Badge 
                              className={`text-xs ${
                                segment.segment_type === 'driving' ? 'bg-blue-500 hover:bg-blue-600 text-white border-blue-600' :
                                segment.segment_type === 'charging' ? 'bg-green-500 hover:bg-green-600 text-white border-green-600' :
                                segment.segment_type === 'idling' ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-600' :
                                'bg-red-500 hover:bg-red-600 text-white border-red-600'
                              }`}
                            >
                              {segment.segment_type === 'driving' ? '주행' :
                               segment.segment_type === 'charging' ? '충전' :
                               segment.segment_type === 'idling' ? '공회전' :
                               '주차'}
                            </Badge>
                          </td>
                          <td className="p-2 text-gray-600">
                            {new Date(segment.segment_start_time).toLocaleString('ko-KR')}
                          </td>
                          <td className="p-2 text-gray-600">
                            {new Date(segment.segment_end_time).toLocaleString('ko-KR')}
                          </td>
                          <td className="p-2 text-center">
                            {segment.segment_duration_minutes}분
                          </td>
                          {dataType === "mileage" ? (
                            <>
                              <td className="p-2 text-center">{segment.start_mileage?.toFixed(1)}km</td>
                              <td className="p-2 text-center">{segment.end_mileage?.toFixed(1)}km</td>
                              <td className="p-2 text-center">{segment.mileage_change?.toFixed(1)}km</td>
                            </>
                          ) : (
                            <>
                              <td className="p-2 text-center">{segment.start_soc?.toFixed(1)}%</td>
                              <td className="p-2 text-center">{segment.end_soc?.toFixed(1)}%</td>
                              <td className="p-2 text-center">{segment.soc_change?.toFixed(1)}%</td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
