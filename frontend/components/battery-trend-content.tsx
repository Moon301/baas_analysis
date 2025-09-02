'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, Calendar, Clock } from 'lucide-react';

interface Vehicle {
  clientid: string;
  car_type: string | null;
}

interface TrendData {
  month: string;
  monthly_p20_esoh: number;
  p20_ma3: number;
  delta_1m: number;
  n_sessions: number;
}

interface WeeklyTrendData {
  week_start: string;
  weekly_p20_esoh: number;
  p20_ma4: number;
  delta_1w: number;
  n_sessions: number;
}

interface BatteryTrendResponse {
  clientid: string;
  data_months: number;
  trend_slope: number;
  trend_data: TrendData[];
}

interface WeeklyBatteryTrendResponse {
  clientid: string;
  data_weeks: number;
  trend_slope: number;
  trend_data: WeeklyTrendData[];
}

export function BatteryTrendContent() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [weeklyVehicles, setWeeklyVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [trendData, setTrendData] = useState<BatteryTrendResponse | null>(null);
  const [weeklyTrendData, setWeeklyTrendData] = useState<WeeklyBatteryTrendResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'monthly' | 'weekly'>('weekly');

  // 차량 목록 로드
  useEffect(() => {
    fetchVehicles();
    fetchWeeklyVehicles();
  }, []);

  // 차량 목록 로드 후 V009BH0000 자동 선택 (주간 차량 목록 기준)
  useEffect(() => {
    if (weeklyVehicles.length > 0 && !selectedVehicle) {
      const defaultVehicle = weeklyVehicles.find(v => v.clientid === 'V009BH0000');
      if (defaultVehicle) {
        setSelectedVehicle('V009BH0000');
        // 자동으로 주간 배터리 트렌드 조회
        setTimeout(() => {
          fetchWeeklyBatteryTrendForVehicle('V009BH0000');
        }, 100);
      }
    }
  }, [weeklyVehicles, selectedVehicle]);

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/v1/battery-trend/vehicles');
      if (response.ok) {
        const data = await response.json();
        setVehicles(data.vehicles);
      }
    } catch (error) {
      console.error('차량 목록 로드 실패:', error);
    }
  };

  const fetchWeeklyVehicles = async () => {
    try {
      const response = await fetch('/api/v1/battery-trend/weekly-vehicles');
      if (response.ok) {
        const data = await response.json();
        setWeeklyVehicles(data.vehicles);
      }
    } catch (error) {
      console.error('주간 차량 목록 로드 실패:', error);
    }
  };

  const fetchBatteryTrend = async () => {
    if (!selectedVehicle) return;
    if (activeTab === 'monthly') {
      await fetchBatteryTrendForVehicle(selectedVehicle);
    } else if (activeTab === 'weekly') {
      await fetchWeeklyBatteryTrendForVehicle(selectedVehicle);
    }
  };

  const fetchBatteryTrendForVehicle = async (clientid: string) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/v1/battery-trend/battery-trend?clientid=${clientid}`);
      if (response.ok) {
        const data = await response.json();
        setTrendData(data);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || '배터리 트렌드 데이터를 불러올 수 없습니다.');
      }
    } catch (error) {
      console.error('배터리 트렌드 로드 실패:', error);
      setError('배터리 트렌드 데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyBatteryTrendForVehicle = async (clientid: string) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/v1/battery-trend/weekly-battery-trend?clientid=${clientid}`);
      if (response.ok) {
        const data = await response.json();
        setWeeklyTrendData(data);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || '주간 배터리 트렌드 데이터를 불러올 수 없습니다.');
      }
    } catch (error) {
      console.error('주간 배터리 트렌드 로드 실패:', error);
      setError('주간 배터리 트렌드 데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleChange = (value: string) => {
    setSelectedVehicle(value);
    setTrendData(null);
    setWeeklyTrendData(null);
    setError('');
  };

  const handleTabChange = (tab: 'monthly' | 'weekly') => {
    setActiveTab(tab);
    setError('');
    
    // 탭 변경 시 선택된 차량이 해당 탭의 차량 목록에 없으면 초기화
    const currentVehicles = tab === 'monthly' ? vehicles : weeklyVehicles;
    if (selectedVehicle && !currentVehicles.find(v => v.clientid === selectedVehicle)) {
      setSelectedVehicle('');
      setTrendData(null);
      setWeeklyTrendData(null);
    }
    
    // 탭 변경 시 해당 데이터가 없으면 로드
    if (tab === 'monthly' && !trendData && selectedVehicle) {
      fetchBatteryTrendForVehicle(selectedVehicle);
    } else if (tab === 'weekly' && !weeklyTrendData && selectedVehicle) {
      fetchWeeklyBatteryTrendForVehicle(selectedVehicle);
    }
  };

  const formatMonth = (monthStr: string) => {
    const date = new Date(monthStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const formatWeek = (weekStr: string) => {
    const date = new Date(weekStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const currentVehicles = activeTab === 'monthly' ? vehicles : weeklyVehicles;
  const selectedVehicleInfo = currentVehicles.find(v => v.clientid === selectedVehicle);

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold text-foreground">배터리 성능 트렌드</h1>
        <p className="text-muted-foreground mt-2">차종별 배터리 트랜드 추이를 확인하고 분석하세요</p>
      </div>

        {/* 월별 eSOH 분석 설명 카드 */}
        {activeTab === 'monthly' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              🔋 eSOH 기반 배터리 성능 추세 분석
            </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 월별 eSOH 카드 */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="text-lg text-blue-600">📌 월별 eSOH</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <strong>P20(하위 20% 분위수)</strong> 사용으로 보수적인 배터리 성능 저하 추적
                  </p>
                  <p className="text-sm ">단기 변동성과 실제 관측 데이터</p>
                  <div className="text-xs bg-blue-50 p-2 rounded">
                    <strong>핵심:</strong> [(에너지(평균 전력(kW)×주행 시간(h))/ΔSOC) / 배터리 용량 (kWh)] * 100%
                  </div>
                  
                </div>
              </CardContent>
            </Card>

            {/* 3개월 이동평균 카드 */}
            <Card className="border-l-4 border-l-green-500">
              <CardHeader >
                <CardTitle className="text-lg text-green-600">📌 3개월 이동평균</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    최근 3개월 평균으로 단기 변동성 완화
                  </p>
                  <p className="text-sm ">단기적인 노이즈를 줄이고, 장기적인 성능 저하 추세 확인</p>
                  <div className="text-xs bg-green-50 p-2 rounded">
                    <strong>핵심:</strong> 최근 3개월의 값을 평균한 3개월 이동평균
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 중간 증가 현상 카드 */}
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader >
                <CardTitle className="text-lg text-orange-600">📌 일시적 상승 현상</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    실제 성능 회복이 아닌 환경·측정 요인
                  </p>
                  <p className="text-sm ">환경 요인으로 해석, 장기적으로는 감소 추세</p>
                  <div className="text-xs bg-orange-50 p-2 rounded">
                    <strong>핵심:</strong> 온도영향, 충전조건 차이, 계산 노이즈 영향
                    
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        )}

        {/* 주간 eSOH 분석 설명 카드 */}
        {activeTab === 'weekly' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              📅 주간 eSOH 기반 배터리 성능 추세 분석
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 주간 eSOH 카드 */}
              <Card className="border-l-4 border-l-purple-500">
                <CardHeader>
                  <CardTitle className="text-lg text-purple-600">📌 주간 eSOH</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      <strong>P20(하위 20% 분위수)</strong> 사용으로 보수적인 배터리 성능 저하 추적
                    </p>
                    <p className="text-sm ">주간 단위의 세밀한 성능 변화 관찰</p>
                    <div className="text-xs bg-purple-50 p-2 rounded">
                      <strong>핵심:</strong> 주간 충전 세션 기반 eSOH 계산
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 4주 이동평균 카드 */}
              <Card className="border-l-4 border-l-indigo-500">
                <CardHeader>
                  <CardTitle className="text-lg text-indigo-600">📌 4주 이동평균</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      최근 4주 평균으로 주간 변동성 완화
                    </p>
                    <p className="text-sm ">월별보다 세밀한 장기 추세 확인</p>
                    <div className="text-xs bg-indigo-50 p-2 rounded">
                      <strong>핵심:</strong> 주간 단위의 안정적인 성능 저하 추세
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 주간 변화율 카드 */}
              <Card className="border-l-4 border-l-pink-500">
                <CardHeader>
                  <CardTitle className="text-lg text-pink-600">📌 주간 변화율</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      전주 대비 eSOH 변화량 (delta_1w)
                    </p>
                    <p className="text-sm ">단기 성능 변화 패턴 분석</p>
                    <div className="text-xs bg-pink-50 p-2 rounded">
                      <strong>핵심:</strong> 주간 단위 성능 저하 속도 측정
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 주간 종합 해석 카드 */}
            <Card className="bg-gray-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-gray-700">📊 주간 분석의 장점</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• <strong>세밀한 관찰</strong>: 월별보다 더 세밀한 성능 변화 추적</p>
                  <p>• <strong>빠른 대응</strong>: 성능 저하를 더 빠르게 감지하고 대응 가능</p>
                  <p>• <strong>패턴 분석</strong>: 주간 단위의 성능 변화 패턴 파악</p>
                  <p>• <strong>4주 이동평균</strong>: 월별 3개월 이동평균보다 세밀한 추세 분석</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      {/* 차량 선택 */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            🚗 차량 선택 및 {activeTab === 'monthly' ? '월별' : '주간'} 배터리 트렌드 조회
          </CardTitle>
          <p className="text-sm text-blue-600">
            {activeTab === 'monthly' 
              ? '6개월 이상 데이터가 있고 감소 추세를 보이는 차량들만 표시됩니다'
              : '6주 이상 데이터가 있고 감소 추세를 보이는 차량들만 표시됩니다'
            }
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                📋 차량 ID 선택
                {selectedVehicle && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    선택됨: {selectedVehicle}
                  </span>
                )}
              </label>
              <Select value={selectedVehicle} onValueChange={handleVehicleChange}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder={`🔍 차량을 선택하세요 (총 ${currentVehicles.length}대)`} />
                </SelectTrigger>
                <SelectContent>
                  {currentVehicles.map((vehicle) => (
                    <SelectItem key={vehicle.clientid} value={vehicle.clientid}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{vehicle.clientid}</span>
                        {vehicle.car_type && (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            {vehicle.car_type}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                💡 현재 {currentVehicles.length}대의 차량이 {activeTab === 'monthly' ? '월별' : '주간'} 조건을 만족합니다
              </p>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={fetchBatteryTrend} 
                disabled={!selectedVehicle || loading}
                className="w-full h-12 text-base font-semibold"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    데이터 로딩 중...
                  </>
                ) : (
                  <>
                    📊 {activeTab === 'monthly' ? '월별' : '주간'} 배터리 트렌드 조회
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 탭 선택 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => handleTabChange('monthly')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium transition-all ${
                activeTab === 'monthly'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Calendar className="h-4 w-4" />
              월별 트렌드
            </button>
            <button
              onClick={() => handleTabChange('weekly')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium transition-all ${
                activeTab === 'weekly'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Clock className="h-4 w-4" />
              주간 트렌드
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 오류 메시지 */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 월별 배터리 트렌드 그래프 */}
      {activeTab === 'monthly' && trendData && (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedVehicleInfo?.clientid} 배터리 성능 트렌드
              {selectedVehicleInfo?.car_type && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({selectedVehicleInfo.car_type})
                </span>
              )}
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              데이터 기간: {trendData.data_months}개월 | 
              추세 기울기: {trendData.trend_slope.toFixed(4)} 
              <span className={trendData.trend_slope < 0 ? "text-red-500" : "text-green-500"}>
                ({trendData.trend_slope < 0 ? "감소 추세" : "증가 추세"})
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData.trend_data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={formatMonth}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    label={{ value: 'eSOH (%)', angle: -90, position: 'insideLeft' }}
                    domain={['dataMin - 5', 'dataMax + 5']}
                  />
                  <Tooltip 
                    labelFormatter={(value) => `월: ${formatMonth(value)}`}
                    formatter={(value: number, name: string) => [
                      `${value.toFixed(2)}%`, 
                      name
                    ]}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="monthly_p20_esoh" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="월별 eSOH"
                    dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="p20_ma3" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    name="3개월 이동평균"
                    dot={{ fill: '#82ca9d', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 주간 배터리 트렌드 그래프 */}
      {activeTab === 'weekly' && weeklyTrendData && (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedVehicleInfo?.clientid} 주간 배터리 성능 트렌드
              {selectedVehicleInfo?.car_type && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({selectedVehicleInfo.car_type})
                </span>
              )}
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              데이터 기간: {weeklyTrendData.data_weeks}주 | 
              추세 기울기: {weeklyTrendData.trend_slope.toFixed(4)} 
              <span className={weeklyTrendData.trend_slope < 0 ? "text-red-500" : "text-green-500"}>
                ({weeklyTrendData.trend_slope < 0 ? "감소 추세" : "증가 추세"})
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyTrendData.trend_data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="week_start" 
                    tickFormatter={formatWeek}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    label={{ value: 'eSOH (%)', angle: -90, position: 'insideLeft' }}
                    domain={['dataMin - 5', 'dataMax + 5']}
                  />
                  <Tooltip 
                    labelFormatter={(value) => `주: ${formatWeek(value)}`}
                    formatter={(value: number, name: string) => [
                      `${value.toFixed(2)}%`, 
                      name
                    ]}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="weekly_p20_esoh" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="주간 eSOH"
                    dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="p20_ma4" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    name="4주 이동평균"
                    dot={{ fill: '#82ca9d', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}