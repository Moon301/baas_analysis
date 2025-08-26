"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Battery, Zap, TrendingUp, TrendingDown, Minus, Car, Gauge, Activity, AlertTriangle, Clock, MapPin, PieChart } from "lucide-react"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  BarChart,
  Bar,
} from "recharts"
import { apiClient, BatteryComparisonData, BatteryDetailData, OverallPerformanceDistribution, VehiclesByGradeResponse } from "@/lib/api"

// API 응답 타입 정의 제거 (lib/api에서 import)

export function BatteryComparisonContent() {
  const [vehicleData, setVehicleData] = useState<BatteryComparisonData[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<BatteryComparisonData | null>(null)
  const [detailData, setDetailData] = useState<BatteryDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [pagination, setPagination] = useState({
    total_count: 0,
    current_offset: 0,
    current_limit: 10,
    has_more: false,
    next_offset: null as number | null
  })
  
  // 새로운 상태 추가
  const [overallDistribution, setOverallDistribution] = useState<OverallPerformanceDistribution | null>(null)
  const [vehiclesByGrade, setVehiclesByGrade] = useState<{
    [grade: string]: {
      data: BatteryComparisonData[];
      pagination: {
        total_count: number;
        current_offset: number;
        current_limit: number;
        has_more: boolean;
        next_offset: number | null;
      };
    };
  }>({})
  const [loadingGrades, setLoadingGrades] = useState<{ [grade: string]: boolean }>({})
  const [loadingMoreGrades, setLoadingMoreGrades] = useState<{ [grade: string]: boolean }>({})
  const [chartError, setChartError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBatteryData = async () => {
      try {
        setLoading(true)
        const response = await apiClient.getBatteryComparison(10, 0)
        setVehicleData(response.data)
        setPagination(response.pagination)
      } catch (err) {
        setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchBatteryData()
  }, [])

  // 전체 성능 분포 데이터 가져오기
  useEffect(() => {
    const fetchOverallDistribution = async () => {
      try {
        setChartError(null)
        const distribution = await apiClient.getOverallPerformanceDistribution()
        setOverallDistribution(distribution)
        
        // 등급별 차량 데이터도 함께 가져오기
        await Promise.all(['우수', '보통', '나쁨'].map(async (grade) => {
          await fetchVehiclesByGrade(grade, 10, 0)
        }))
      } catch (err) {
        console.error('전체 성능 분포를 불러오는데 실패했습니다:', err)
        setChartError('데이터를 불러오는데 실패했습니다.')
      }
    }

    fetchOverallDistribution()
  }, [])

  const fetchVehiclesByGrade = async (grade: string, limit: number, offset: number) => {
    try {
      setLoadingGrades(prev => ({ ...prev, [grade]: true }))
      const response = await apiClient.getVehiclesByGrade(grade, limit, offset)
      
      setVehiclesByGrade(prev => ({
        ...prev,
        [grade]: {
          data: response.data,
          pagination: response.pagination
        }
      }))
    } catch (err) {
      console.error(`${grade} 등급 차량을 불러오는데 실패했습니다:`, err)
    } finally {
      setLoadingGrades(prev => ({ ...prev, [grade]: false }))
    }
  }

  const loadMoreVehiclesByGrade = async (grade: string) => {
    const currentData = vehiclesByGrade[grade]
    if (!currentData || !currentData.pagination.has_more || loadingMoreGrades[grade]) return
    
    try {
      setLoadingMoreGrades(prev => ({ ...prev, [grade]: true }))
      const response = await apiClient.getVehiclesByGrade(grade, 10, currentData.pagination.next_offset!)
      
      setVehiclesByGrade(prev => ({
        ...prev,
        [grade]: {
          data: [...prev[grade].data, ...response.data],
          pagination: response.pagination
        }
      }))
    } catch (err) {
      console.error(`${grade} 등급 추가 차량을 불러오는데 실패했습니다:`, err)
    } finally {
      setLoadingMoreGrades(prev => ({ ...prev, [grade]: false }))
    }
  }

  const loadMoreData = async () => {
    if (!pagination.has_more || loadingMore) return
    
    try {
      setLoadingMore(true)
      const response = await apiClient.getBatteryComparison(10, pagination.next_offset!)
      setVehicleData(prev => [...prev, ...response.data])
      setPagination(response.pagination)
    } catch (err) {
      console.error('추가 데이터를 불러오는데 실패했습니다:', err)
    } finally {
      setLoadingMore(false)
    }
  }

  const handleVehicleClick = async (vehicle: BatteryComparisonData) => {
    try {
      setSelectedVehicle(vehicle)
      const detail = await apiClient.getBatteryDetail(vehicle.clientid, 30)
      setDetailData(detail)
      setIsDetailOpen(true)
    } catch (err) {
      console.error('상세 정보를 불러오는데 실패했습니다:', err)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'high':
        return 'bg-green-100 text-green-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'high':
        return '우수'
      case 'medium':
        return '보통'
      case 'low':
        return '개선 필요'
      default:
        return '알 수 없음'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">배터리 성능 비교</h1>
          <p className="text-muted-foreground mt-2">데이터를 불러오는 중...</p>
        </div>
        
        {/* 성능 요약 카드 스켈레톤 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="animate-pulse bg-muted h-4 w-24 rounded"></div>
                <div className="animate-pulse bg-muted h-4 w-4 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="animate-pulse bg-muted h-8 w-16 rounded mb-2"></div>
                <div className="animate-pulse bg-muted h-3 w-20 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* 차량 목록 스켈레톤 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="animate-pulse bg-muted h-4 w-32 rounded mb-2"></div>
                <div className="animate-pulse bg-muted h-3 w-24 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="animate-pulse bg-muted h-8 w-20 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="animate-pulse bg-muted h-3 w-full rounded"></div>
                  <div className="animate-pulse bg-muted h-3 w-3/4 rounded"></div>
                  <div className="animate-pulse bg-muted h-3 w-1/2 rounded"></div>
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
          <h1 className="text-3xl font-bold text-foreground">배터리 성능 비교</h1>
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">배터리 성능 비교</h1>
        <p className="text-muted-foreground mt-2">
          차량별 배터리 성능을 비교하고 분석하세요
        </p>
      </div>

      {/* 성능 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">평균 성능 점수</CardTitle>
            <Battery className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {vehicleData.length > 0 
                ? Math.round(vehicleData.reduce((sum, v) => sum + v.performance_score, 0) / vehicleData.length)
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">전체 차량 평균</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">우수 등급</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {vehicleData.filter(v => v.status === 'high').length}
            </div>
            <p className="text-xs text-muted-foreground">80점 이상</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">평균 온도</CardTitle>
            <Gauge className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {vehicleData.length > 0 
                ? Math.round(vehicleData.reduce((sum, v) => sum + v.avg_operating_temperature, 0) / vehicleData.length)
                : 0}°C
            </div>
            <p className="text-xs text-muted-foreground">전체 차량 평균</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">총 분석 차량</CardTitle>
            <Car className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{vehicleData.length}</div>
            <p className="text-xs text-muted-foreground">전체 차량 수</p>
          </CardContent>
        </Card>
      </div>

      {/* 전체 성능 분포 원형 그래프 */}
      {overallDistribution && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              전체 차량 성능 분포
            </CardTitle>
            <CardDescription className="text-blue-600">
              총 {overallDistribution.total_vehicles}대의 차량 중 등급별 분포
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* 원형 그래프 */}
              <div className="flex justify-center">
                {overallDistribution && !chartError && (
                  <div className="w-48 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={[
                            {
                              name: '우수',
                              value: overallDistribution.distribution['우수']?.count || 0,
                              color: '#10b981'
                            },
                            {
                              name: '보통',
                              value: overallDistribution.distribution['보통']?.count || 0,
                              color: '#f59e0b'
                            },
                            {
                              name: '나쁨',
                              value: overallDistribution.distribution['나쁨']?.count || 0,
                              color: '#ef4444'
                            }
                          ].filter(item => item.value > 0)}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          labelLine={false}
                        >
                          {[
                            { name: '우수', value: overallDistribution.distribution['우수']?.count || 0, color: '#10b981' },
                            { name: '보통', value: overallDistribution.distribution['보통']?.count || 0, color: '#f59e0b' },
                            { name: '나쁨', value: overallDistribution.distribution['나쁨']?.count || 0, color: '#ef4444' }
                          ].filter(item => item.value > 0).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name) => [`${value}대`, name]}
                          labelFormatter={(label) => `${label} 등급`}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                )}
                
                {/* 차트 에러 시 대체 표시 */}
                {chartError && (
                  <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded-lg">
                    <div className="text-center text-gray-500">
                      <div className="text-sm">차트 로딩 실패</div>
                      <button 
                        onClick={() => setChartError(null)}
                        className="text-xs text-blue-500 hover:underline mt-1"
                      >
                        다시 시도
                      </button>
                    </div>
                  </div>
                )}
                
                {/* CSS 기반 원형 차트 대안 (Recharts 문제 시 사용) */}
                {/* 
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="16"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="16"
                      strokeDasharray={`${(overallDistribution.distribution['우수']?.count || 0) / (overallDistribution.total_vehicles || 1) * 502.4} 502.4`}
                      strokeDashoffset="0"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="16"
                      strokeDasharray={`${(overallDistribution.distribution['보통']?.count || 0) / (overallDistribution.total_vehicles || 1) * 502.4} 502.4`}
                      strokeDashoffset={`-${(overallDistribution.distribution['우수']?.count || 0) / (overallDistribution.total_vehicles || 1) * 502.4}`}
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="16"
                      strokeDasharray={`${(overallDistribution.distribution['나쁨']?.count || 0) / (overallDistribution.total_vehicles || 1) * 502.4} 502.4`}
                      strokeDashoffset={`-${((overallDistribution.distribution['우수']?.count || 0) + (overallDistribution.distribution['보통']?.count || 0)) / (overallDistribution.total_vehicles || 1) * 502.4}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-700">
                        {overallDistribution.total_vehicles}
                      </div>
                      <div className="text-sm text-gray-500">총 차량</div>
                    </div>
                  </div>
                </div>
                */}
              </div>
              
              {/* 통계 정보 */}
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {overallDistribution.distribution['우수']?.count || 0}
                    </div>
                    <div className="text-sm text-green-600">우수</div>
                    <div className="text-xs text-gray-500">
                      {overallDistribution.distribution['우수']?.percentage || 0}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {overallDistribution.distribution['보통']?.count || 0}
                    </div>
                    <div className="text-sm text-yellow-600">보통</div>
                    <div className="text-xs text-gray-500">
                      {overallDistribution.distribution['보통']?.percentage || 0}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {overallDistribution.distribution['나쁨']?.count || 0}
                    </div>
                    <div className="text-sm text-red-600">나쁨</div>
                    <div className="text-xs text-gray-500">
                      {overallDistribution.distribution['나쁨']?.percentage || 0}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MATERIALIZED VIEW 정보 카드 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center gap-2">
            <Activity className="h-5 w-5" />
            MATERIALIZED VIEW 기반 분석
          </CardTitle>
          <CardDescription className="text-blue-600">
            구간별 데이터 분석으로 정확한 성능 평가
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-blue-600 font-medium">구간 분석</div>
              <div className="text-blue-800">5초 간격 연속 처리</div>
            </div>
            <div>
              <div className="text-blue-600 font-medium">최소 데이터</div>
              <div className="text-blue-800">10개 포인트 이상</div>
            </div>
            <div>
              <div className="text-blue-600 font-medium">최소 시간</div>
              <div className="text-blue-800">30초 이상</div>
            </div>
            <div>
              <div className="text-blue-600 font-medium">4개 영역</div>
              <div className="text-blue-800">각 25점 만점</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 차량 목록 */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">등급별 차량 목록</h2>
        
        {/* 등급별 3열 표시 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 우수 등급 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-green-700 flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                우수 등급
              </h3>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {vehiclesByGrade['우수']?.pagination.total_count || 0}대
              </Badge>
            </div>
            
            {loadingGrades['우수'] ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {vehiclesByGrade['우수']?.data.map((vehicle) => (
                  <Card 
                    key={vehicle.clientid} 
                    className="cursor-pointer hover:shadow-md transition-shadow border-green-200 hover:border-green-300"
                    onClick={() => handleVehicleClick(vehicle)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">{vehicle.model_name}</div>
                        <Badge className="bg-green-100 text-green-800">
                          {vehicle.performance_score}점
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>총 구간: {vehicle.total_segments}개</div>
                        <div>우수 구간: {vehicle.excellent_ratio}%</div>
                        <div>총 거리: {vehicle.total_distance}km</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {vehiclesByGrade['우수']?.pagination.has_more && (
                  <button
                    onClick={() => loadMoreVehiclesByGrade('우수')}
                    disabled={loadingMoreGrades['우수']}
                    className="w-full py-2 px-4 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loadingMoreGrades['우수'] ? (
                      <>
                        <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                        로딩 중...
                      </>
                    ) : (
                      '더보기'
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 보통 등급 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-yellow-700 flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                보통 등급
              </h3>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                {vehiclesByGrade['보통']?.pagination.total_count || 0}대
              </Badge>
            </div>
            
            {loadingGrades['보통'] ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {vehiclesByGrade['보통']?.data.map((vehicle) => (
                  <Card 
                    key={vehicle.clientid} 
                    className="cursor-pointer hover:shadow-md transition-shadow border-yellow-200 hover:border-yellow-300"
                    onClick={() => handleVehicleClick(vehicle)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">{vehicle.model_name}</div>
                        <Badge className="bg-yellow-100 text-yellow-800">
                          {vehicle.performance_score}점
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>총 구간: {vehicle.total_segments}개</div>
                        <div>우수 구간: {vehicle.excellent_ratio}%</div>
                        <div>총 거리: {vehicle.total_distance}km</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {vehiclesByGrade['보통']?.pagination.has_more && (
                  <button
                    onClick={() => loadMoreVehiclesByGrade('보통')}
                    disabled={loadingMoreGrades['보통']}
                    className="w-full py-2 px-4 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loadingMoreGrades['보통'] ? (
                      <>
                        <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                        로딩 중...
                      </>
                    ) : (
                      '더보기'
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 나쁨 등급 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-red-700 flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                나쁨 등급
              </h3>
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                {vehiclesByGrade['나쁨']?.pagination.total_count || 0}대
              </Badge>
            </div>
            
            {loadingGrades['나쁨'] ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {vehiclesByGrade['나쁨']?.data.map((vehicle) => (
                  <Card 
                    key={vehicle.clientid} 
                    className="cursor-pointer hover:shadow-md transition-shadow border-red-200 hover:border-red-300"
                    onClick={() => handleVehicleClick(vehicle)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">{vehicle.model_name}</div>
                        <Badge className="bg-red-100 text-red-800">
                          {vehicle.performance_score}점
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>총 구간: {vehicle.total_segments}개</div>
                        <div>우수 구간: {vehicle.excellent_ratio}%</div>
                        <div>총 거리: {vehicle.total_distance}km</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {vehiclesByGrade['나쁨']?.pagination.has_more && (
                  <button
                    onClick={() => loadMoreVehiclesByGrade('나쁨')}
                    disabled={loadingMoreGrades['나쁨']}
                    className="w-full py-2 px-4 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loadingMoreGrades['나쁨'] ? (
                      <>
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                        로딩 중...
                      </>
                    ) : (
                      '더보기'
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 상세 정보 다이얼로그 */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedVehicle?.model_name} - 배터리 상세 분석
            </DialogTitle>
            <DialogDescription>
              {selectedVehicle?.car_type} 차량의 상세한 배터리 성능 정보
            </DialogDescription>
          </DialogHeader>

          {detailData && (
            <div className="space-y-6">
              {/* 핵심 지표 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Battery className="h-8 w-8 mx-auto mb-2 text-chart-3" />
                    <div className="text-2xl font-bold text-chart-3">{detailData.total_score}</div>
                    <div className="text-sm text-muted-foreground">총 성능 점수</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <MapPin className="h-8 w-8 mx-auto mb-2 text-chart-1" />
                    <div className="text-2xl font-bold">{detailData.total_distance.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">총 주행거리 (km)</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Gauge className="h-8 w-8 mx-auto mb-2 text-chart-2" />
                    <div className="text-2xl font-bold text-chart-2">{detailData.avg_operating_temperature}°C</div>
                    <div className="text-sm text-muted-foreground">평균 운전 온도</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Activity className="h-8 w-8 mx-auto mb-2 text-chart-4" />
                    <div className="text-2xl font-bold">{detailData.total_segments}</div>
                    <div className="text-sm text-muted-foreground">총 구간 수</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 월별 성능 추이 차트 */}
                <Card>
                  <CardHeader>
                    <CardTitle>월별 성능 추이</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={detailData.monthly_performance}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="performance" stroke="#8884d8" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* 레이더 차트 */}
                <Card>
                  <CardHeader>
                    <CardTitle>4개 영역별 성능 분석</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={detailData.radar_data}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis angle={90} domain={[0, 25]} />
                        <Radar
                          name="성능 점수"
                          dataKey="A"
                          stroke="#8884d8"
                          fill="#8884d8"
                          fillOpacity={0.6}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* 구간별 성능 추이 */}
              {detailData.segment_performance && detailData.segment_performance.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>구간별 성능 추이</CardTitle>
                    <CardDescription>최근 20개 구간의 성능 점수 변화</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={detailData.segment_performance}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="segment" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* 성능 분포 차트 */}
              {detailData.performance_distribution && detailData.performance_distribution.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>구간별 성능 등급 분포</CardTitle>
                    <CardDescription>전체 구간 중 등급별 비율</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={detailData.performance_distribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {detailData.performance_distribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 flex justify-center gap-6">
                      {detailData.performance_distribution.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <span>
                            {item.name}: {item.value}개 ({((item.value / detailData.total_segments) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 상세 점수 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>4개 영역별 상세 점수</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>셀 밸런스 점수</span>
                      <span className="font-medium">{detailData.cell_balance_score}/25</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SOC 안정성 점수</span>
                      <span className="font-medium">{detailData.soc_stability_score}/25</span>
                    </div>
                    <div className="flex justify-between">
                      <span>열 성능 점수</span>
                      <span className="font-medium">{detailData.thermal_performance_score}/25</span>
                    </div>
                    <div className="flex justify-between">
                      <span>에너지 효율 점수</span>
                      <span className="font-medium">{detailData.efficiency_score}/25</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-bold">총점</span>
                      <span className="font-bold text-lg">{detailData.total_score}/100</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>성능 요약</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>종합 등급</span>
                      <span className="font-bold text-lg">{detailData.overall_grade}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>전체 구간 수</span>
                      <span className="font-medium">{detailData.total_segments}개</span>
                    </div>
                    <div className="flex justify-between">
                      <span>우수 구간 비율</span>
                      <span className="font-medium text-green-600">{detailData.excellent_ratio}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>분석 기간</span>
                      <span className="font-medium">{detailData.analysis_period}</span>
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
