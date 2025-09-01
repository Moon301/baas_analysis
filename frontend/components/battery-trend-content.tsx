'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';

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

interface BatteryTrendResponse {
  clientid: string;
  data_months: number;
  trend_slope: number;
  trend_data: TrendData[];
}

export function BatteryTrendContent() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [trendData, setTrendData] = useState<BatteryTrendResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // 차량 목록 로드
  useEffect(() => {
    fetchVehicles();
  }, []);

  // 차량 목록 로드 후 V000AL0002 자동 선택
  useEffect(() => {
    if (vehicles.length > 0 && !selectedVehicle) {
      const defaultVehicle = vehicles.find(v => v.clientid === 'V000AL0002');
      if (defaultVehicle) {
        setSelectedVehicle('V000AL0002');
        // 자동으로 배터리 트렌드 조회
        setTimeout(() => {
          fetchBatteryTrendForVehicle('V000AL0002');
        }, 100);
      }
    }
  }, [vehicles, selectedVehicle]);

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

  const fetchBatteryTrend = async () => {
    if (!selectedVehicle) return;
    await fetchBatteryTrendForVehicle(selectedVehicle);
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

  const handleVehicleChange = (value: string) => {
    setSelectedVehicle(value);
    setTrendData(null);
    setError('');
  };

  const formatMonth = (monthStr: string) => {
    const date = new Date(monthStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const selectedVehicleInfo = vehicles.find(v => v.clientid === selectedVehicle);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">배터리 성능 트렌드</h1>
      </div>
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
                    <strong>핵심:</strong> 해당 월의 배터리 건강도 바닥값
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
                  <p className="text-sm ">안정적인 장기 추세 확인</p>
                  <div className="text-xs bg-green-50 p-2 rounded">
                    <strong>핵심:</strong> 장기적 성능 저하 추세를 부드럽게 표시
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
                    <strong>핵심:</strong> 온도, 충전조건, 계산노이즈 영향
                    
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      {/* 차량 선택 */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            🚗 차량 선택 및 배터리 트렌드 조회
          </CardTitle>
          <p className="text-sm text-blue-600">
            6개월 이상 데이터가 있고 감소 추세를 보이는 차량들만 표시됩니다
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
                  <SelectValue placeholder="🔍 차량을 선택하세요 (총 {vehicles.length}대)" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
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
                💡 현재 {vehicles.length}대의 차량이 조건을 만족합니다
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
                    📊 배터리 트렌드 조회
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 오류 메시지 */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 배터리 트렌드 그래프 */}
      {trendData && (
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
                      name === 'monthly_p20_esoh' ? '월별 eSOH' : '3개월 이동평균'
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

    </div>
  );
}