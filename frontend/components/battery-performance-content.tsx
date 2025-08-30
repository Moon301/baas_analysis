"use client";

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Area, AreaChart, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// 타입 정의
interface BatteryPerformanceData {
  clientid: string;
  mileage_segment: string;
  analysis_method: string;
  scores: {
    soh: number;
    cell_balance: number;
    driving_efficiency: number;
    charging_efficiency: number;
    temperature_stability: number;
    charging_habit: number;
    total: number;
  };
  metrics: {
    avg_soh: number;
    avg_cell_imbalance: number;
    avg_soc_per_km: number;
    slow_charge_efficiency: number;
    fast_charge_efficiency: number;
    avg_temp_range: number;
    avg_start_soc: number;
    avg_end_soc: number;
  };
  data_quality: {
    records: number;
    segments: number;
  };
}

interface LatestPerformanceData {
  clientid: string;
  analysis_method: string;
  scores: {
    soh: number;
    cell_balance: number;
    driving_efficiency: number;
    charging_efficiency: number;
    temperature_stability: number;
    charging_habit: number;
    total: number;
  };
  metrics: {
    avg_soh: number;
    avg_cell_imbalance: number;
    avg_soc_per_km: number;
    slow_charge_efficiency: number;
    fast_charge_efficiency: number;
    avg_temp_range: number;
    avg_start_soc: number;
    avg_end_soc: number;
  };
  data_quality: {
    window_days: number;
    basic_records: number;
    soh_records: number;
    driving_segments: number;
    charging_segments: number;
    slow_charge_count: number;
    fast_charge_count: number;
  };
  availability: {
    soh: boolean;
    cell: boolean;
    driving: boolean;
    charging: boolean;
    temp: boolean;
    habit: boolean;
  };
  coverage_grade: string;
}

interface PerformanceSummary {
  total_clients: number;
  total_records: number;
  score_stats: {
    average: number;
    minimum: number;
    maximum: number;
    standard_deviation: number;
  };
  grade_distribution: {
    excellent: number;
    good: number;
    poor: number;
  };
}

interface LatestPerformanceSummary {
  total_clients: number;
  total_records: number;
  score_stats: {
    average: number;
    minimum: number;
    maximum: number;
    standard_deviation: number;
  };
  grade_distribution: {
    excellent: number;
    good: number;
    poor: number;
  };
  coverage_distribution: {
    high: number;
    medium: number;
    low: number;
  };
}

interface PaginationInfo {
  total_count: number;
  current_offset: number;
  current_limit: number;
  has_more: boolean;
  next_offset: number | null;
  total_pages: number;
}

// API 호출 함수들
const fetchBatteryPerformance = async (limit: number = 50, offset: number = 0): Promise<{data: BatteryPerformanceData[], pagination: PaginationInfo}> => {
  try {
    const response = await fetch(`http://localhost:8004/api/v1/analytics/battery-performance?limit=${limit}&offset=${offset}`);
    if (!response.ok) throw new Error('API 호출 실패');
    return await response.json();
  } catch (error) {
    console.error('배터리 성능 데이터 조회 실패:', error);
    return { data: [], pagination: { total_count: 0, current_offset: 0, current_limit: limit, has_more: false, next_offset: null, total_pages: 0 } };
  }
};

const fetchPerformanceSummary = async (): Promise<PerformanceSummary> => {
  try {
    const response = await fetch('http://localhost:8004/api/v1/analytics/battery-performance/summary');
    if (!response.ok) throw new Error('API 호출 실패');
    return await response.json();
  } catch (error) {
    console.error('성능 요약 조회 실패:', error);
    return {
      total_clients: 0,
      total_records: 0,
      score_stats: { average: 0, minimum: 0, maximum: 0, standard_deviation: 0 },
      grade_distribution: { excellent: 0, good: 0, poor: 0 }
    };
  }
};

const fetchBatteryPerformanceLatest = async (limit: number = 50, offset: number = 0): Promise<{data: LatestPerformanceData[], pagination: PaginationInfo}> => {
  try {
    const response = await fetch(`http://localhost:8004/api/v1/analytics/battery-performance/latest?limit=${limit}&offset=${offset}`);
    if (!response.ok) throw new Error('API 호출 실패');
    return await response.json();
  } catch (error) {
    console.error('최근 3개월 성능 데이터 조회 실패:', error);
    return { data: [], pagination: { total_count: 0, current_offset: 0, current_limit: limit, has_more: false, next_offset: null, total_pages: 0 } };
  }
};

const fetchLatestPerformanceSummary = async (): Promise<LatestPerformanceSummary> => {
  try {
    const response = await fetch('http://localhost:8004/api/v1/analytics/battery-performance/latest/summary');
    if (!response.ok) throw new Error('API 호출 실패');
    return await response.json();
  } catch (error) {
    console.error('최근 3개월 성능 요약 조회 실패:', error);
    return {
      total_clients: 0,
      total_records: 0,
      score_stats: { average: 0, minimum: 0, maximum: 0, standard_deviation: 0 },
      grade_distribution: { excellent: 0, good: 0, poor: 0 },
      coverage_distribution: { high: 0, medium: 0, low: 0 }
    };
  }
};

export default function BatteryPerformanceContent() {
  const [activeTab, setActiveTab] = useState('overall');
  const [performanceData, setPerformanceData] = useState<BatteryPerformanceData[]>([]);
  const [latestPerformanceData, setLatestPerformanceData] = useState<LatestPerformanceData[]>([]);
  const [summary, setSummary] = useState<PerformanceSummary | null>(null);
  const [latestSummary, setLatestSummary] = useState<LatestPerformanceSummary | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [latestPagination, setLatestPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [latestLoading, setLatestLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  // 데이터 로드 함수들
  const loadPerformanceData = async (offset: number = 0) => {
    setLoading(true);
    try {
      const result = await fetchBatteryPerformance(50, offset);
      setPerformanceData(result.data);
      setPagination(result.pagination);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLatestPerformanceData = async (offset: number = 0) => {
    setLatestLoading(true);
    try {
      const result = await fetchBatteryPerformanceLatest(50, offset);
      setLatestPerformanceData(result.data);
      setLatestPagination(result.pagination);
    } catch (error) {
      console.error('최근 3개월 데이터 로드 실패:', error);
    } finally {
      setLatestLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const summaryData = await fetchPerformanceSummary();
      setSummary(summaryData);
    } catch (error) {
      console.error('요약 데이터 로드 실패:', error);
    }
  };

  const loadLatestSummary = async () => {
    try {
      const summaryData = await fetchLatestPerformanceSummary();
      setLatestSummary(summaryData);
    } catch (error) {
      console.error('최근 3개월 요약 데이터 로드 실패:', error);
    }
  };

  // 탭 변경 시 데이터 로드
  useEffect(() => {
    if (activeTab === 'mileage') {
      loadPerformanceData();
      loadSummary();
    } else if (activeTab === 'threeMonth') {
      loadLatestPerformanceData();
      loadLatestSummary();
    }
  }, [activeTab]);

  const getGradeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getGradeText = (score: number) => {
    if (score >= 80) return '우수';
    if (score >= 60) return '보통';
    return '나쁨';
  };

  // 종합점수 탭 렌더링
  const renderOverallTab = () => (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center gap-2">
            <div className="h-5 w-5">📊</div>
            전체 차량 성능 분포
          </CardTitle>
          <CardDescription className="text-blue-600">
            전체 차량의 배터리 성능 등급별 분포
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-2xl font-bold text-gray-700 mb-4">종합 성능 점수</div>
            <div className="text-lg text-gray-600">
              주행거리별 및 최근 3개월 성능을 종합하여 평가한 점수입니다.
            </div>
            <div className="mt-6">
              <Button onClick={() => setActiveTab('mileage')} className="mr-4">
                주행거리별 성능 보기
              </Button>
              <Button onClick={() => setActiveTab('threeMonth')} variant="outline">
                3개월 성능 보기
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // 주행거리별 성능 탭 렌더링
  const renderMileageTab = () => (
    <div className="space-y-6">
      {/* 요약 통계 */}
      {summary && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <div className="h-5 w-5">📊</div>
              주행거리별 배터리 성능 요약
            </CardTitle>
            <CardDescription className="text-blue-600">
              주행거리 구간별 배터리 성능 점수 분석
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* 원형 그래프 */}
              <div className="flex justify-center">
                <div className="w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: '우수', value: summary.grade_distribution.excellent, color: '#10b981' },
                          { name: '보통', value: summary.grade_distribution.good, color: '#f59e0b' },
                          { name: '나쁨', value: summary.grade_distribution.poor, color: '#ef4444' }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      >
                        {[
                          { name: '우수', value: summary.grade_distribution.excellent, color: '#10b981' },
                          { name: '보통', value: summary.grade_distribution.good, color: '#f59e0b' },
                          { name: '나쁨', value: summary.grade_distribution.poor, color: '#ef4444' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => [`${value}건`, name]}
                        labelFormatter={(label) => `${label} 등급`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* 통계 정보 */}
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {summary.grade_distribution.excellent}
                    </div>
                    <div className="text-sm text-green-600">우수</div>
                    <div className="text-xs text-gray-500">
                      {summary.total_records > 0 ? ((summary.grade_distribution.excellent / summary.total_records) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {summary.grade_distribution.good}
                    </div>
                    <div className="text-sm text-yellow-600">보통</div>
                    <div className="text-xs text-gray-500">
                      {summary.total_records > 0 ? ((summary.grade_distribution.good / summary.total_records) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {summary.grade_distribution.poor}
                    </div>
                    <div className="text-sm text-red-600">나쁨</div>
                    <div className="text-xs text-gray-500">
                      {summary.total_records > 0 ? ((summary.grade_distribution.poor / summary.total_records) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                </div>
                
                {/* 추가 통계 */}
                <div className="mt-6 p-4 bg-white rounded-lg border border-blue-100">
                  <div className="text-sm text-blue-800 font-medium mb-2">성능 요약</div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-600">평균 점수:</span>
                      <span className="ml-2 font-medium text-blue-600">{summary.score_stats.average.toFixed(1)}점</span>
                    </div>
                    <div>
                      <span className="text-gray-600">최고 점수:</span>
                      <span className="ml-2 font-medium text-green-600">{summary.score_stats.maximum.toFixed(1)}점</span>
                    </div>
                    <div>
                      <span className="text-gray-600">최저 점수:</span>
                      <span className="ml-2 font-medium text-red-600">{summary.score_stats.minimum.toFixed(1)}점</span>
                    </div>
                    <div>
                      <span className="text-gray-600">표준편차:</span>
                      <span className="ml-2 font-medium text-blue-600">±{summary.score_stats.standard_deviation.toFixed(1)}점</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 성능 데이터 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>주행거리 구간별 배터리 성능 점수</CardTitle>
          <CardDescription>
            총 {pagination?.total_count || 0}건의 성능 데이터
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">데이터를 불러오는 중...</div>
          ) : (
            <div className="space-y-4">
              {performanceData.map((item, index) => (
                <Dialog key={`${item.clientid}-${item.mileage_segment}`}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between h-auto p-4"
                      onClick={() => setSelectedVehicle(item.clientid)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-left">
                          <div className="font-medium">{item.clientid}</div>
                          <div className="text-sm text-gray-500">{item.mileage_segment} 구간</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className={getGradeColor(item.scores.total)}>
                          {getGradeText(item.scores.total)}
                        </Badge>
                        <span className="font-semibold text-lg">{item.scores.total}점</span>
                      </div>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[90vw] max-w-[1200px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        {item.clientid} - {item.mileage_segment} 구간 상세 분석
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      {/* 기본 정보 */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-700">{item.scores.total}점</div>
                          <div className="text-xs text-gray-600">총점</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-700">{item.mileage_segment}</div>
                          <div className="text-xs text-gray-600">주행거리 구간</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-700">{item.data_quality.records}</div>
                          <div className="text-xs text-gray-600">데이터 레코드</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-700">{item.data_quality.segments}</div>
                          <div className="text-xs text-gray-600">세그먼트 수</div>
                        </div>
                      </div>

                      {/* 점수 분포 차트 */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">세부 점수 분포</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={[
                                { name: 'SOH', score: item.scores.soh, color: '#8884d8' },
                                { name: '셀 밸런스', score: item.scores.cell_balance, color: '#82ca9d' },
                                { name: '주행 효율', score: item.scores.driving_efficiency, color: '#ffc658' },
                                { name: '충전 효율', score: item.scores.charging_efficiency, color: '#ff7300' },
                                { name: '온도 안정성', score: item.scores.temperature_stability, color: '#8dd1e1' },
                                { name: '충전 습관', score: item.scores.charging_habit, color: '#d084d0' }
                              ]}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="score" fill="#8884d8" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      {/* 상세 지표 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">배터리 상태 지표</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">평균 SOH:</span>
                                <span className="font-medium">{item.metrics.avg_soh.toFixed(2)}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">셀 불균형:</span>
                                <span className="font-medium">{item.metrics.avg_cell_imbalance.toFixed(3)}V</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">온도 범위:</span>
                                <span className="font-medium">{item.metrics.avg_temp_range.toFixed(1)}°C</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">효율성 지표</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">주행 효율:</span>
                                <span className="font-medium">{item.metrics.avg_soc_per_km.toFixed(4)}%/km</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">완속 충전:</span>
                                <span className="font-medium">{item.metrics.slow_charge_efficiency.toFixed(1)}%/h</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">급속 충전:</span>
                                <span className="font-medium">{item.metrics.fast_charge_efficiency.toFixed(1)}%/h</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* 권장사항 */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">권장사항</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm text-gray-600">
                            {item.scores.total >= 80 
                              ? "배터리 상태가 매우 양호합니다. 현재 사용 패턴을 유지하세요."
                              : item.scores.total >= 60 
                              ? "배터리 상태가 보통입니다. 충전 패턴을 개선하면 효율을 높일 수 있습니다."
                              : "배터리 상태가 좋지 않습니다. 전문가 상담을 권장합니다."
                            }
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          )}

          {/* 페이지네이션 */}
          {pagination && pagination.total_pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => loadPerformanceData(Math.max(0, pagination.current_offset - pagination.current_limit))}
                disabled={pagination.current_offset === 0}
              >
                이전
              </Button>
              <span className="flex items-center px-4">
                {Math.floor(pagination.current_offset / pagination.current_limit) + 1} / {pagination.total_pages}
              </span>
              <Button
                variant="outline"
                onClick={() => loadPerformanceData(pagination.next_offset || 0)}
                disabled={!pagination.has_more}
              >
                다음
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // 3개월 성능 탭 렌더링
  const renderThreeMonthTab = () => (
    <div className="space-y-6">
      {/* 요약 통계 */}
      {latestSummary && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <div className="h-5 w-5">📈</div>
              최근 3개월 배터리 성능 요약
            </CardTitle>
            <CardDescription className="text-green-600">
              최근 3개월간의 배터리 성능 변화 추이 분석
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* 원형 그래프 */}
              <div className="flex justify-center">
                <div className="w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: '우수', value: latestSummary.grade_distribution.excellent, color: '#10b981' },
                          { name: '보통', value: latestSummary.grade_distribution.good, color: '#f59e0b' },
                          { name: '나쁨', value: latestSummary.grade_distribution.poor, color: '#ef4444' }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      >
                        {[
                          { name: '우수', value: latestSummary.grade_distribution.excellent, color: '#10b981' },
                          { name: '보통', value: latestSummary.grade_distribution.good, color: '#f59e0b' },
                          { name: '나쁨', value: latestSummary.grade_distribution.poor, color: '#ef4444' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => [`${value}건`, name]}
                        labelFormatter={(label) => `${label} 등급`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* 통계 정보 */}
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {latestSummary.grade_distribution.excellent}
                    </div>
                    <div className="text-sm text-green-600">우수</div>
                    <div className="text-xs text-gray-500">
                      {latestSummary.total_records > 0 ? ((latestSummary.grade_distribution.excellent / latestSummary.total_records) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {latestSummary.grade_distribution.good}
                    </div>
                    <div className="text-sm text-yellow-600">보통</div>
                    <div className="text-xs text-gray-500">
                      {latestSummary.total_records > 0 ? ((latestSummary.grade_distribution.good / latestSummary.total_records) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {latestSummary.grade_distribution.poor}
                    </div>
                    <div className="text-sm text-red-600">나쁨</div>
                    <div className="text-xs text-gray-500">
                      {latestSummary.total_records > 0 ? ((latestSummary.grade_distribution.poor / latestSummary.total_records) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                </div>
                
                {/* 추가 통계 */}
                <div className="mt-6 p-4 bg-white rounded-lg border border-green-100">
                  <div className="text-sm text-green-800 font-medium mb-2">성능 요약</div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-600">평균 점수:</span>
                      <span className="ml-2 font-medium text-green-600">{latestSummary.score_stats.average.toFixed(1)}점</span>
                    </div>
                    <div>
                      <span className="text-gray-600">최고 점수:</span>
                      <span className="ml-2 font-medium text-green-600">{latestSummary.score_stats.maximum.toFixed(1)}점</span>
                    </div>
                    <div>
                      <span className="text-gray-600">최저 점수:</span>
                      <span className="ml-2 font-medium text-red-600">{latestSummary.score_stats.minimum.toFixed(1)}점</span>
                    </div>
                    <div>
                      <span className="text-gray-600">표준편차:</span>
                      <span className="ml-2 font-medium text-green-600">±{latestSummary.score_stats.standard_deviation.toFixed(1)}점</span>
                    </div>
                  </div>
                </div>

                {/* 데이터 커버리지 */}
                <div className="mt-4 p-4 bg-white rounded-lg border border-green-100">
                  <div className="text-sm text-green-800 font-medium mb-2">데이터 커버리지</div>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {latestSummary.coverage_distribution.high}
                      </div>
                      <div className="text-blue-600">High</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-yellow-600">
                        {latestSummary.coverage_distribution.medium}
                      </div>
                      <div className="text-yellow-600">Medium</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">
                        {latestSummary.coverage_distribution.low}
                      </div>
                      <div className="text-red-600">Low</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 성능 데이터 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>최근 3개월 배터리 성능 점수</CardTitle>
          <CardDescription>
            총 {latestPagination?.total_count || 0}건의 성능 데이터
          </CardDescription>
        </CardHeader>
        <CardContent>
          {latestLoading ? (
            <div className="text-center py-8">데이터를 불러오는 중...</div>
          ) : (
            <div className="space-y-4">
              {latestPerformanceData.map((item, index) => (
                <Dialog key={`${item.clientid}-latest`}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between h-auto p-4"
                      onClick={() => setSelectedVehicle(item.clientid)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-left">
                          <div className="font-medium">{item.clientid}</div>
                          <div className="text-sm text-gray-500">최근 3개월</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className={getGradeColor(item.scores.total)}>
                          {getGradeText(item.scores.total)}
                        </Badge>
                        <span className="font-semibold text-lg">{item.scores.total}점</span>
                        <Badge className={item.coverage_grade === 'High' ? 'bg-green-100 text-green-800' : item.coverage_grade === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                          {item.coverage_grade}
                        </Badge>
                      </div>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[90vw] max-w-[1200px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        {item.clientid} - 최근 3개월 상세 분석
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      {/* 기본 정보 */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-700">{item.scores.total}점</div>
                          <div className="text-xs text-gray-600">총점</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-700">{item.data_quality.window_days}일</div>
                          <div className="text-xs text-gray-600">분석 기간</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-700">{item.data_quality.basic_records}</div>
                          <div className="text-xs text-gray-600">기본 레코드</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-700">{item.coverage_grade}</div>
                          <div className="text-xs text-gray-600">커버리지 등급</div>
                        </div>
                      </div>

                      {/* 점수 분포 차트 */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">세부 점수 분포</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={[
                                { name: 'SOH', score: item.scores.soh, color: '#8884d8' },
                                { name: '셀 밸런스', score: item.scores.cell_balance, color: '#82ca9d' },
                                { name: '주행 효율', score: item.scores.driving_efficiency, color: '#ffc658' },
                                { name: '충전 효율', score: item.scores.charging_efficiency, color: '#ff7300' },
                                { name: '온도 안정성', score: item.scores.temperature_stability, color: '#8dd1e1' },
                                { name: '충전 습관', score: item.scores.charging_habit, color: '#d084d0' }
                              ]}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="score" fill="#8884d8" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      {/* 상세 지표 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">배터리 상태 지표</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">평균 SOH:</span>
                                <span className="font-medium">{item.metrics.avg_soh.toFixed(2)}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">셀 불균형:</span>
                                <span className="font-medium">{item.metrics.avg_cell_imbalance.toFixed(3)}V</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">온도 범위:</span>
                                <span className="font-medium">{item.metrics.avg_temp_range.toFixed(1)}°C</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">효율성 지표</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">주행 효율:</span>
                                <span className="font-medium">{item.metrics.avg_soc_per_km.toFixed(4)}%/km</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">완속 충전:</span>
                                <span className="font-medium">{item.metrics.slow_charge_efficiency.toFixed(1)}%/h</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">급속 충전:</span>
                                <span className="font-medium">{item.metrics.fast_charge_efficiency.toFixed(1)}%/h</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* 데이터 품질 정보 */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">데이터 품질 정보</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                              <div className="text-lg font-bold text-gray-700">{item.data_quality.soh_records}</div>
                              <div className="text-xs text-gray-600">SOH 레코드</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-gray-700">{item.data_quality.driving_segments}</div>
                              <div className="text-xs text-gray-600">주행 세그먼트</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-gray-700">{item.data_quality.charging_segments}</div>
                              <div className="text-xs text-gray-600">충전 세그먼트</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-gray-700">{item.data_quality.slow_charge_count + item.data_quality.fast_charge_count}</div>
                              <div className="text-xs text-gray-600">총 충전 횟수</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* 권장사항 */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">권장사항</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm text-gray-600">
                            {item.scores.total >= 80 
                              ? "배터리 상태가 매우 양호합니다. 현재 사용 패턴을 유지하세요."
                              : item.scores.total >= 60 
                              ? "배터리 상태가 보통입니다. 충전 패턴을 개선하면 효율을 높일 수 있습니다."
                              : "배터리 상태가 좋지 않습니다. 전문가 상담을 권장합니다."
                            }
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          )}

          {/* 페이지네이션 */}
          {latestPagination && latestPagination.total_pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => loadLatestPerformanceData(Math.max(0, latestPagination.current_offset - latestPagination.current_limit))}
                disabled={latestPagination.current_offset === 0}
              >
                이전
              </Button>
              <span className="flex items-center px-4">
                {Math.floor(latestPagination.current_offset / latestPagination.current_limit) + 1} / {latestPagination.total_pages}
              </span>
              <Button
                variant="outline"
                onClick={() => loadLatestPerformanceData(latestPagination.next_offset || 0)}
                disabled={!latestPagination.has_more}
              >
                다음
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overall">종합점수</TabsTrigger>
          <TabsTrigger value="mileage">주행거리별</TabsTrigger>
          <TabsTrigger value="threeMonth">3개월 성능</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overall" className="mt-6">
          {renderOverallTab()}
        </TabsContent>
        
        <TabsContent value="mileage" className="mt-6">
          {renderMileageTab()}
        </TabsContent>
        
        <TabsContent value="threeMonth" className="mt-6">
          {renderThreeMonthTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
