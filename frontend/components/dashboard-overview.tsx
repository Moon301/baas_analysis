"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { 
  AlertTriangle,
  Car,
  Database,
  Calendar,
  Users
} from "lucide-react"

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts"

import { VehicleDetailModal } from "./vehicle-detail-modal"

// BW 대시보드 데이터 타입 정의
interface BWDashboardData {
  // === 데이터 수집 현황 ===
  total_data_rows: number;
  total_unique_clients: number;
  unique_car_types: number;
  data_start_date: string;
  data_end_date: string;
  collection_days: number;
  // === 구간 분석 현황 ===
  total_all_segments: number;
  clients_with_any_segments: number;
  total_valid_segments: number;
  clients_with_valid_segments: number;
  invalid_segments: number;
  valid_segment_percentage: number;
  // === 상태별 분포 (유효 구간 기준) ===
  charging_count: number;
  charging_percentage: number;
  charging_avg_min: number;
  driving_count: number;
  driving_percentage: number;
  driving_avg_min: number;
  idling_count: number;
  idling_percentage: number;
  idling_avg_min: number;
  parked_count: number;
  parked_percentage: number;
  parked_avg_min: number;
  unclassified_count: number;
  unclassified_percentage: number;
  unclassified_avg_min: number;
}

// clientid별 차량 정보 타입
interface ClientVehicleInfo {
  clientid: string;
  car_type: string;           // 차종 (BONGO3, IONIQ5 등)
  model_year: string;         // 연식 (2023년, 2024년 등)
  total_segments: number;
  valid_segments: number;
  valid_segment_ratio: number;
  last_activity: string;
  total_duration_hours: number;
  avg_duration_min: number;
}

// 페이지네이션 정보 타입
interface PaginationInfo {
  total_count: number;
  current_offset: number;
  current_limit: number;
  has_more: boolean;
  next_offset: number | null;
  total_pages: number;
}

// API 응답 타입
interface ClientVehiclesResponse {
  data: ClientVehicleInfo[];
  pagination: PaginationInfo;
}

export function DashboardOverview() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bwDashboardData, setBwDashboardData] = useState<BWDashboardData | null>(null)
  const [clientVehicles, setClientVehicles] = useState<ClientVehicleInfo[]>([])
  
  // 차종별 필터링 및 페이지네이션 상태
  const [selectedCarType, setSelectedCarType] = useState<string>("전체")
  const [availableCarTypes, setAvailableCarTypes] = useState<string[]>(["전체"])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 15

  // 차량 상세 모달 상태
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false)

  // BW 대시보드 데이터 가져오기
  useEffect(() => {
    const fetchBWDashboardData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/v1/analytics/bw-dashboard')
        if (!response.ok) {
          throw new Error('대시보드 데이터를 불러올 수 없습니다.')
        }
        const data = await response.json()
        
        if (data.error) {
          throw new Error(data.error)
        }
        
        setBwDashboardData(data)
      } catch (err) {
        console.error('BW 대시보드 데이터 fetch error:', err)
        setError('대시보드 데이터를 불러올 수 없습니다.')
      } finally {
        setLoading(false)
      }
    }

    // 사용 가능한 차종 목록 가져오기
    const fetchAvailableCarTypes = async () => {
      try {
        const response = await fetch('/api/v1/analytics/car-types')
        if (response.ok) {
          const data = await response.json()
          if (Array.isArray(data)) {
            setAvailableCarTypes(data)
          }
        }
      } catch (err) {
        console.error('Car types fetch error:', err)
        setAvailableCarTypes(["전체"])
      }
    }

    // clientid별 차량 정보 가져오기
    const fetchClientVehicles = async () => {
      try {
        const offset = (currentPage - 1) * itemsPerPage
        const carTypeParam = selectedCarType === "전체" ? "" : selectedCarType
        
        const url = `/api/v1/analytics/client-vehicles?limit=${itemsPerPage}&offset=${offset}${carTypeParam ? `&car_type=${encodeURIComponent(carTypeParam)}` : ''}`
        const response = await fetch(url)
        
        if (!response.ok) {
          throw new Error('차량 정보를 불러올 수 없습니다.')
        }
        
        const data: ClientVehiclesResponse = await response.json()
        
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
          setClientVehicles(data.data)
          setTotalCount(data.pagination.total_count)
          setTotalPages(data.pagination.total_pages)
        } else {
          setClientVehicles([])
          setTotalCount(0)
          setTotalPages(0)
        }
      } catch (err) {
        console.error('Client vehicles fetch error:', err)
        setClientVehicles([])
        setTotalCount(0)
        setTotalPages(0)
      }
    }

    fetchBWDashboardData()
    fetchAvailableCarTypes()
    fetchClientVehicles()
  }, [currentPage, selectedCarType])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">데이터 로딩 실패</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          새로고침
        </button>
      </div>
    )
  }

  if (!bwDashboardData) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">데이터 없음</h2>
        <p className="text-gray-600 mb-4">대시보드 데이터를 불러올 수 없습니다.</p>
      </div>
    )
  }

  // 차량 행 클릭 핸들러
  const handleVehicleRowClick = (clientid: string) => {
    setSelectedVehicleId(clientid)
    setIsVehicleModalOpen(true)
  }

  // 차량 모달 닫기 핸들러
  const handleVehicleModalClose = () => {
    setIsVehicleModalOpen(false)
    setSelectedVehicleId(null)
  }

  return (
    <div className="space-y-6">
      {/* 페이지 제목 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">EV Performance Dashboard</h1>
        <p className="text-gray-600 mt-2">전기차 성능진단 시스템 대시보드 (SOC/SOH 포함)</p>
      </div>

      {/* 데이터 수집 현황 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 총 데이터 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-900">총 데이터</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">
              {bwDashboardData.total_data_rows.toLocaleString()}행
            </div>
            <p className="text-sm text-blue-700 mt-1">데이터 행</p>
            <p className="text-sm text-blue-700">
              마지막 업데이트: {new Date().toLocaleString('ko-KR')}
            </p>
          </CardContent>
        </Card>

        {/* 수집 기간 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-900">수집 기간</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {bwDashboardData.collection_days.toFixed(0)}일
            </div>
            <p className="text-sm text-green-700 mt-1">
              {new Date(bwDashboardData.data_start_date).toLocaleDateString('ko-KR')} ~ {new Date(bwDashboardData.data_end_date).toLocaleDateString('ko-KR')}
            </p>
            <p className="text-sm text-green-700">
              약 {(bwDashboardData.collection_days / 30).toFixed(1)}개월
            </p>
          </CardContent>
        </Card>

        {/* 차량 현황 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-purple-900">차량 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">
              {bwDashboardData.total_unique_clients}대
            </div>
            <p className="text-sm text-purple-700 mt-1">총 차량 수</p>
            <p className="text-sm text-purple-700">
              차종: {bwDashboardData.unique_car_types}종
            </p>
          </CardContent>
        </Card>

        {/* 구간 현황 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-orange-900">구간 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900">
              {bwDashboardData.total_all_segments.toLocaleString()}개
            </div>
            <p className="text-sm text-orange-700 mt-1">전체 구간</p>
            <p className="text-sm text-orange-700">
              유효: {bwDashboardData.valid_segment_percentage}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 구간 분석 현황 및 상태별 분포 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 구간 분석 현황 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-5 w-5">📊</div>
              구간 분석 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {bwDashboardData.total_all_segments.toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-600">전체 구간</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {bwDashboardData.total_valid_segments.toLocaleString()}
                  </div>
                  <div className="text-sm text-green-600">유효 구간</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">유효 구간 비율</span>
                  <span className="font-medium text-green-600">{bwDashboardData.valid_segment_percentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">무효 구간</span>
                  <span className="font-medium text-red-600">{bwDashboardData.invalid_segments}개</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">구간당 최소 수량</span>
                  <span className="font-medium text-blue-600">10개 이상</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 상태별 분포 원형 그래프 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-5 w-5">🔄</div>
              상태별 분포 (유효 구간 기준)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: '충전',
                        value: bwDashboardData.charging_count,
                        color: '#10b981',
                        percentage: bwDashboardData.charging_percentage,
                        avgDuration: bwDashboardData.charging_avg_min
                      },
                      {
                        name: '주행',
                        value: bwDashboardData.driving_count,
                        color: '#3b82f6',
                        percentage: bwDashboardData.driving_percentage,
                        avgDuration: bwDashboardData.driving_avg_min
                      },
                      {
                        name: '정차',
                        value: bwDashboardData.idling_count,
                        color: '#f59e0b',
                        percentage: bwDashboardData.idling_percentage,
                        avgDuration: bwDashboardData.idling_avg_min
                      },
                      {
                        name: '주차',
                        value: bwDashboardData.parked_count,
                        color: '#8b5cf6',
                        percentage: bwDashboardData.parked_percentage,
                        avgDuration: bwDashboardData.parked_avg_min
                      },
                      {
                        name: '기타',
                        value: bwDashboardData.unclassified_count,
                        color: '#6b7280',
                        percentage: bwDashboardData.unclassified_percentage,
                        avgDuration: bwDashboardData.unclassified_avg_min
                      }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    labelLine={false}
                    label={({ name, percentage, avgDuration }) => `${name} ${percentage}%`}
                  >
                    {[
                      { name: '충전', value: bwDashboardData.charging_count, color: '#10b981' },
                      { name: '주행', value: bwDashboardData.driving_count, color: '#3b82f6' },
                      { name: '정차', value: bwDashboardData.idling_count, color: '#f59e0b' },
                      { name: '주차', value: bwDashboardData.parked_count, color: '#8b5cf6' },
                      { name: '기타', value: bwDashboardData.unclassified_count, color: '#6b7280' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${value}개 (${props.payload.percentage}%)`,
                      `${name} - 평균 ${props.payload.avgDuration}분`
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client ID별 차량 조회 리스트 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            모델별 차량 현황
          </CardTitle>
          <CardDescription>
            수집된 모델별로 차량 정보를 조회할 수 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* 차종별 필터링 */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">차종:</span>
              <Select value={selectedCarType} onValueChange={setSelectedCarType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="차종 선택" />
                </SelectTrigger>
                <SelectContent>
                  {availableCarTypes.map((carType) => (
                    <SelectItem key={carType} value={carType}>
                      {carType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-gray-600">
              총 {totalCount}개 차량
            </div>
          </div>
          
          {clientVehicles.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-medium">모델 ID</th>
                      <th className="text-left p-3 font-medium">차종</th>
                      <th className="text-left p-3 font-medium">연식</th>
                      <th className="text-left p-3 font-medium">전체 구간</th>
                      <th className="text-left p-3 font-medium">유효 구간</th>
                      <th className="text-left p-3 font-medium">유효 비율</th>
                      <th className="text-left p-3 font-medium">총 활동 시간</th>
                      <th className="text-left p-3 font-medium">평균 구간 시간</th>
                      <th className="text-left p-3 font-medium">마지막 활동</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientVehicles.map((vehicle, index) => (
                      <tr 
                        key={index} 
                        className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleVehicleRowClick(vehicle.clientid)}
                      >
                        <td className="p-3 font-medium text-blue-600">
                          {vehicle.clientid}
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {vehicle.car_type}
                          </span>
                        </td>
                        <td className="p-3 font-medium">{vehicle.model_year}</td>
                        <td className="p-3 text-center">
                          <span className="font-medium">{vehicle.total_segments.toLocaleString()}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-medium text-green-600">{vehicle.valid_segments.toLocaleString()}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`font-medium ${
                            vehicle.valid_segment_ratio >= 90 ? 'text-green-600' :
                            vehicle.valid_segment_ratio >= 80 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {vehicle.valid_segment_ratio.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-medium">{vehicle.total_duration_hours.toFixed(1)}시간</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-medium">{vehicle.avg_duration_min.toFixed(1)}분</span>
                        </td>
                        <td className="p-3 text-gray-600">
                          {new Date(vehicle.last_activity).toLocaleDateString('ko-KR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-600">
                    {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalCount)} / {totalCount}개
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      이전
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }
                        
                        if (pageNum < 1 || pageNum > totalPages) return null
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      다음
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-32 flex items-center justify-center text-gray-500">
              차량 정보가 없습니다.
            </div>
          )}
        </CardContent>
      </Card>

      {/* 차량 상세 정보 모달 */}
      {selectedVehicleId && (
        <VehicleDetailModal
          isOpen={isVehicleModalOpen}
          onClose={handleVehicleModalClose}
          clientid={selectedVehicleId}
        />
      )}
    </div>
  )
}



