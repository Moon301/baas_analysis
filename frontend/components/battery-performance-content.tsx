"use client";

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Area, AreaChart, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// 타입 정의
interface VehicleData {
  drivingData: Array<{ time: string; battery: number; driving: boolean }>;
  chargingData: Array<{ time: string; battery: number; charging: boolean }>;
  efficiencyData: Array<{ segment: string; efficiency: number; status: string }>;
}

interface DummyData {
  carTypes: Array<{ name: string; value: number; color: string }>;
  clients: Array<{ name: string; value: number; color: string }>;
  summary: {
    totalSegments: number;
    totalDataRows: number;
    dataPeriod: string;
  };
  performanceRanking: {
    excellent: Array<{ id: string; carType: string; model: string; efficiency: number; clientId: string }>;
    good: Array<{ id: string; carType: string; model: string; efficiency: number; clientId: string }>;
    poor: Array<{ id: string; carType: string; model: string; efficiency: number; clientId: string }>;
  };
  vehicleData: Record<string, VehicleData>;
}

// Dummy 데이터
const dummyData: DummyData = {
  carTypes: [
    { name: 'SUV', value: 45, color: '#8884d8' },
    { name: '세단', value: 30, color: '#82ca9d' },
    { name: '해치백', value: 15, color: '#ffc658' },
    { name: '왜건', value: 10, color: '#ff7300' }
  ],
  clients: [
    { name: '개인고객', value: 60, color: '#8884d8' },
    { name: '기업고객', value: 25, color: '#82ca9d' },
    { name: '리스고객', value: 15, color: '#ffc658' }
  ],
  summary: {
    totalSegments: 1250,
    totalDataRows: 45678,
    dataPeriod: '2024.01.01 ~ 2024.12.31'
  },
  performanceRanking: {
    excellent: [
      { id: 'client001', carType: 'SUV', model: 'Model X', efficiency: 95, clientId: 'client001' },
      { id: 'client002', carType: '세단', model: 'Model S', efficiency: 92, clientId: 'client002' },
      { id: 'client003', carType: 'SUV', model: 'Model Y', efficiency: 90, clientId: 'client003' }
    ],
    good: [
      { id: 'client004', carType: '해치백', model: 'Model 3', efficiency: 78, clientId: 'client004' },
      { id: 'client005', carType: '세단', model: 'Model E', efficiency: 75, clientId: 'client005' }
    ],
    poor: [
      { id: 'client006', carType: '왜건', model: 'Model W', efficiency: 45, clientId: 'client006' },
      { id: 'client007', carType: 'SUV', model: 'Model Z', efficiency: 52, clientId: 'client007' }
    ]
  },
  vehicleData: {
    'client001': {
      drivingData: [
        { time: '00:00', battery: 100, driving: true },
        { time: '01:00', battery: 95, driving: true },
        { time: '02:00', battery: 90, driving: true },
        { time: '03:00', battery: 85, driving: false },
        { time: '04:00', battery: 85, driving: false },
        { time: '05:00', battery: 85, driving: false },
        { time: '06:00', battery: 85, driving: false },
        { time: '07:00', battery: 85, driving: true },
        { time: '08:00', battery: 80, driving: true },
        { time: '09:00', battery: 75, driving: true },
        { time: '10:00', battery: 70, driving: false },
        { time: '11:00', battery: 70, driving: false },
        { time: '12:00', battery: 70, driving: false },
        { time: '13:00', battery: 70, driving: true },
        { time: '14:00', battery: 65, driving: true },
        { time: '15:00', battery: 60, driving: true },
        { time: '16:00', battery: 55, driving: false },
        { time: '17:00', battery: 55, driving: false },
        { time: '18:00', battery: 55, driving: false },
        { time: '19:00', battery: 55, driving: true },
        { time: '20:00', battery: 50, driving: true },
        { time: '21:00', battery: 45, driving: true },
        { time: '22:00', battery: 40, driving: false },
        { time: '23:00', battery: 40, driving: false }
      ],
      chargingData: [
        { time: '00:00', battery: 40, charging: false },
        { time: '01:00', battery: 40, charging: false },
        { time: '02:00', battery: 40, charging: false },
        { time: '03:00', battery: 40, charging: false },
        { time: '04:00', battery: 40, charging: false },
        { time: '05:00', battery: 40, charging: false },
        { time: '06:00', battery: 40, charging: false },
        { time: '07:00', battery: 40, charging: false },
        { time: '08:00', battery: 40, charging: false },
        { time: '09:00', battery: 40, charging: false },
        { time: '10:00', battery: 40, charging: false },
        { time: '11:00', battery: 40, charging: false },
        { time: '12:00', battery: 40, charging: false },
        { time: '13:00', battery: 40, charging: false },
        { time: '14:00', battery: 40, charging: false },
        { time: '15:00', battery: 40, charging: false },
        { time: '16:00', battery: 40, charging: false },
        { time: '17:00', battery: 40, charging: false },
        { time: '18:00', battery: 40, charging: false },
        { time: '19:00', battery: 40, charging: false },
        { time: '20:00', battery: 40, charging: false },
        { time: '21:00', battery: 40, charging: false },
        { time: '22:00', battery: 40, charging: true },
        { time: '23:00', battery: 100, charging: true }
      ],
      efficiencyData: [
        { segment: '구간1', efficiency: 95, status: 'excellent' },
        { segment: '구간2', efficiency: 88, status: 'good' },
        { segment: '구간3', efficiency: 92, status: 'excellent' },
        { segment: '구간4', efficiency: 85, status: 'good' },
        { segment: '구간5', efficiency: 90, status: 'excellent' }
      ]
    },
    'client002': {
      drivingData: [
        { time: '00:00', battery: 100, driving: false },
        { time: '01:00', battery: 100, driving: false },
        { time: '02:00', battery: 100, driving: false },
        { time: '03:00', battery: 100, driving: false },
        { time: '04:00', battery: 100, driving: false },
        { time: '05:00', battery: 100, driving: false },
        { time: '06:00', battery: 100, driving: true },
        { time: '07:00', battery: 95, driving: true },
        { time: '08:00', battery: 90, driving: true },
        { time: '09:00', battery: 85, driving: false },
        { time: '10:00', battery: 85, driving: false },
        { time: '11:00', battery: 85, driving: false },
        { time: '12:00', battery: 85, driving: true },
        { time: '13:00', battery: 80, driving: true },
        { time: '14:00', battery: 75, driving: true },
        { time: '15:00', battery: 70, driving: false },
        { time: '16:00', battery: 70, driving: false },
        { time: '17:00', battery: 70, driving: true },
        { time: '18:00', battery: 65, driving: true },
        { time: '19:00', battery: 60, driving: true },
        { time: '20:00', battery: 55, driving: false },
        { time: '21:00', battery: 55, driving: false },
        { time: '22:00', battery: 55, driving: false },
        { time: '23:00', battery: 55, driving: false }
      ],
      chargingData: [
        { time: '00:00', battery: 55, charging: false },
        { time: '01:00', battery: 55, charging: false },
        { time: '02:00', battery: 55, charging: false },
        { time: '03:00', battery: 55, charging: false },
        { time: '04:00', battery: 55, charging: false },
        { time: '05:00', battery: 55, charging: false },
        { time: '06:00', battery: 55, charging: false },
        { time: '07:00', battery: 55, charging: false },
        { time: '08:00', battery: 55, charging: false },
        { time: '09:00', battery: 55, charging: false },
        { time: '10:00', battery: 55, charging: false },
        { time: '11:00', battery: 55, charging: false },
        { time: '12:00', battery: 55, charging: false },
        { time: '13:00', battery: 55, charging: false },
        { time: '14:00', battery: 55, charging: false },
        { time: '15:00', battery: 55, charging: false },
        { time: '16:00', battery: 55, charging: false },
        { time: '17:00', battery: 55, charging: false },
        { time: '18:00', battery: 55, charging: false },
        { time: '19:00', battery: 55, charging: false },
        { time: '20:00', battery: 55, charging: false },
        { time: '21:00', battery: 55, charging: false },
        { time: '22:00', battery: 55, charging: false },
        { time: '23:00', battery: 55, charging: true }
      ],
      efficiencyData: [
        { segment: '구간1', efficiency: 92, status: 'excellent' },
        { segment: '구간2', efficiency: 85, status: 'good' },
        { segment: '구간3', efficiency: 88, status: 'good' },
        { segment: '구간4', efficiency: 90, status: 'excellent' },
        { segment: '구간5', efficiency: 87, status: 'good' }
      ]
    },
    'client004': {
      drivingData: [
        { time: '00:00', battery: 100, driving: false },
        { time: '01:00', battery: 100, driving: false },
        { time: '02:00', battery: 100, driving: false },
        { time: '03:00', battery: 100, driving: false },
        { time: '04:00', battery: 100, driving: false },
        { time: '05:00', battery: 100, driving: false },
        { time: '06:00', battery: 100, driving: true },
        { time: '07:00', battery: 92, driving: true },
        { time: '08:00', battery: 84, driving: true },
        { time: '09:00', battery: 76, driving: false },
        { time: '10:00', battery: 76, driving: false },
        { time: '11:00', battery: 76, driving: false },
        { time: '12:00', battery: 76, driving: true },
        { time: '13:00', battery: 68, driving: true },
        { time: '14:00', battery: 60, driving: true },
        { time: '15:00', battery: 52, driving: false },
        { time: '16:00', battery: 52, driving: false },
        { time: '17:00', battery: 52, driving: true },
        { time: '18:00', battery: 44, driving: true },
        { time: '19:00', battery: 36, driving: true },
        { time: '20:00', battery: 28, driving: false },
        { time: '21:00', battery: 28, driving: false },
        { time: '22:00', battery: 28, driving: false },
        { time: '23:00', battery: 28, driving: false }
      ],
      chargingData: [
        { time: '00:00', battery: 28, charging: false },
        { time: '01:00', battery: 28, charging: false },
        { time: '02:00', battery: 28, charging: false },
        { time: '03:00', battery: 28, charging: false },
        { time: '04:00', battery: 28, charging: false },
        { time: '05:00', battery: 28, charging: false },
        { time: '06:00', battery: 28, charging: false },
        { time: '07:00', battery: 28, charging: false },
        { time: '08:00', battery: 28, charging: false },
        { time: '09:00', battery: 28, charging: false },
        { time: '10:00', battery: 28, charging: false },
        { time: '11:00', battery: 28, charging: false },
        { time: '12:00', battery: 28, charging: false },
        { time: '13:00', battery: 28, charging: false },
        { time: '14:00', battery: 28, charging: false },
        { time: '15:00', battery: 28, charging: false },
        { time: '16:00', battery: 28, charging: false },
        { time: '17:00', battery: 28, charging: false },
        { time: '18:00', battery: 28, charging: false },
        { time: '19:00', battery: 28, charging: false },
        { time: '20:00', battery: 28, charging: false },
        { time: '21:00', battery: 28, charging: false },
        { time: '22:00', battery: 28, charging: false },
        { time: '23:00', battery: 100, charging: true }
      ],
      efficiencyData: [
        { segment: '구간1', efficiency: 78, status: 'good' },
        { segment: '구간2', efficiency: 72, status: 'good' },
        { segment: '구간3', efficiency: 75, status: 'good' },
        { segment: '구간4', efficiency: 68, status: 'good' },
        { segment: '구간5', efficiency: 70, status: 'good' }
      ]
    },
    'client006': {
      drivingData: [
        { time: '00:00', battery: 100, driving: false },
        { time: '01:00', battery: 100, driving: false },
        { time: '02:00', battery: 100, driving: false },
        { time: '03:00', battery: 100, driving: false },
        { time: '04:00', battery: 100, driving: false },
        { time: '05:00', battery: 100, driving: false },
        { time: '06:00', battery: 100, driving: true },
        { time: '07:00', battery: 88, driving: true },
        { time: '08:00', battery: 76, driving: true },
        { time: '09:00', battery: 64, driving: false },
        { time: '10:00', battery: 64, driving: false },
        { time: '11:00', battery: 64, driving: false },
        { time: '12:00', battery: 64, driving: true },
        { time: '13:00', battery: 52, driving: true },
        { time: '14:00', battery: 40, driving: true },
        { time: '15:00', battery: 28, driving: false },
        { time: '16:00', battery: 28, driving: false },
        { time: '17:00', battery: 28, driving: true },
        { time: '18:00', battery: 16, driving: true },
        { time: '19:00', battery: 4, driving: true },
        { time: '20:00', battery: 0, driving: false },
        { time: '21:00', battery: 0, driving: false },
        { time: '22:00', battery: 0, driving: false },
        { time: '23:00', battery: 0, driving: false }
      ],
      chargingData: [
        { time: '00:00', battery: 0, charging: false },
        { time: '01:00', battery: 0, charging: false },
        { time: '02:00', battery: 0, charging: false },
        { time: '03:00', battery: 0, charging: false },
        { time: '04:00', battery: 0, charging: false },
        { time: '05:00', battery: 0, charging: false },
        { time: '06:00', battery: 0, charging: false },
        { time: '07:00', battery: 0, charging: false },
        { time: '08:00', battery: 0, charging: false },
        { time: '09:00', battery: 0, charging: false },
        { time: '10:00', battery: 0, charging: false },
        { time: '11:00', battery: 0, charging: false },
        { time: '12:00', battery: 0, charging: false },
        { time: '13:00', battery: 0, charging: false },
        { time: '14:00', battery: 0, charging: false },
        { time: '15:00', battery: 0, charging: false },
        { time: '16:00', battery: 0, charging: false },
        { time: '17:00', battery: 0, charging: false },
        { time: '18:00', battery: 0, charging: false },
        { time: '19:00', battery: 0, charging: false },
        { time: '20:00', battery: 0, charging: false },
        { time: '21:00', battery: 0, charging: false },
        { time: '22:00', battery: 0, charging: false },
        { time: '23:00', battery: 100, charging: true }
      ],
      efficiencyData: [
        { segment: '구간1', efficiency: 45, status: 'poor' },
        { segment: '구간2', efficiency: 38, status: 'poor' },
        { segment: '구간3', efficiency: 42, status: 'poor' },
        { segment: '구간4', efficiency: 35, status: 'poor' },
        { segment: '구간5', efficiency: 40, status: 'poor' }
      ]
    }
  }
};

export default function BatteryPerformanceContent() {
  const [selectedGraph, setSelectedGraph] = useState('driving');
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  const renderGraph = () => {
    if (!selectedVehicle) return null;

    const data = dummyData.vehicleData[selectedVehicle];
    if (!data) return null;

    switch (selectedGraph) {
            case 'driving':
        return (
          <LineChart width={700} height={350} data={data.drivingData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="battery" 
              stroke="#8884d8" 
              strokeWidth={2}
              connectNulls={false}
            />
            {data.drivingData.map((point: { time: string; battery: number; driving: boolean }, index: number) => (
              <Line
                key={index}
                type="monotone"
                dataKey="battery"
                data={point.driving ? [point] : []}
                stroke="#8884d8"
                strokeWidth={3}
                dot={{ fill: point.driving ? '#8884d8' : 'transparent' }}
              />
            ))}
          </LineChart>
        );
      case 'charging':
        return (
          <AreaChart width={700} height={350} data={data.chargingData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="battery" 
              stroke="#82ca9d" 
              fill="#82ca9d" 
              fillOpacity={0.6}
            />
          </AreaChart>
        );
      case 'efficiency':
        return (
          <LineChart width={700} height={350} data={data.efficiencyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="segment" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="efficiency" 
              stroke="#ffc658" 
              strokeWidth={3}
              dot={{ fill: '#ffc658', r: 6 }}
            />
          </LineChart>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* 전체 차량 성능 분포 대시보드 */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center gap-2">
            <div className="h-5 w-5">📊</div>
            전체 차량 성능 분포
          </CardTitle>
          <CardDescription className="text-blue-600">
            총 7대의 차량 중 등급별 분포
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
                        {
                          name: '우수',
                          value: 3,
                          color: '#10b981'
                        },
                        {
                          name: '보통',
                          value: 2,
                          color: '#f59e0b'
                        },
                        {
                          name: '나쁨',
                          value: 2,
                          color: '#ef4444'
                        }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {[
                        { name: '우수', value: 3, color: '#10b981' },
                        { name: '보통', value: 2, color: '#f59e0b' },
                        { name: '나쁨', value: 2, color: '#ef4444' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`${value}대`, name]}
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
                    3
                  </div>
                  <div className="text-sm text-green-600">우수</div>
                  <div className="text-xs text-gray-500">
                    42.9%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    2
                  </div>
                  <div className="text-sm text-yellow-600">보통</div>
                  <div className="text-xs text-gray-500">
                    28.6%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    2
                  </div>
                  <div className="text-sm text-red-600">나쁨</div>
                  <div className="text-xs text-gray-500">
                    28.6%
                  </div>
                </div>
              </div>
              
              {/* 추가 통계 */}
              <div className="mt-6 p-4 bg-white rounded-lg border border-blue-100">
                <div className="text-sm text-blue-800 font-medium mb-2">성능 요약</div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-600">평균 효율:</span>
                    <span className="ml-2 font-medium text-blue-600">75.3%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">최고 효율:</span>
                    <span className="ml-2 font-medium text-green-600">95%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">최저 효율:</span>
                    <span className="ml-2 font-medium text-red-600">45%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">표준편차:</span>
                    <span className="ml-2 font-medium text-blue-600">±18.2%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 성능 순위 섹션 */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">차종별 배터리 성능 순위</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 우수 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800 border-green-200">우수</Badge>
                <span className="text-sm text-muted-foreground">({dummyData.performanceRanking.excellent.length}대)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dummyData.performanceRanking.excellent.map((vehicle) => (
                <Dialog key={vehicle.id}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() => setSelectedVehicle(vehicle.clientId)}
                    >
                      <span>{vehicle.carType} - {vehicle.model}</span>
                      <span className="text-green-600 font-semibold">{vehicle.efficiency}%</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[90vw] max-w-[1200px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        {vehicle.carType} - {vehicle.model} 상세 분석
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      {/* 기본 정보 */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-700">{vehicle.efficiency}%</div>
                          <div className="text-xs text-gray-600">배터리 효율</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-700">{vehicle.carType}</div>
                          <div className="text-xs text-gray-600">차종</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-700">{vehicle.model}</div>
                          <div className="text-xs text-gray-600">모델</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-700">{vehicle.clientId}</div>
                          <div className="text-xs text-gray-600">고객 ID</div>
                        </div>
                      </div>

                      {/* 그래프 선택 및 표시 */}
                      <div className="space-y-4">
                        <div className="flex gap-4">
                          <Select value={selectedGraph} onValueChange={setSelectedGraph}>
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="그래프 선택" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="driving">주행 그래프</SelectItem>
                              <SelectItem value="charging">충전 그래프</SelectItem>
                              <SelectItem value="efficiency">효율 그래프</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-center overflow-x-auto">
                          <div className="min-w-0">
                            {renderGraph()}
                          </div>
                        </div>
                      </div>

                      {/* 추가 정보 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">배터리 상태 요약</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">현재 상태:</span>
                                <Badge className={vehicle.efficiency >= 85 ? "bg-green-100 text-green-800" : vehicle.efficiency >= 65 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}>
                                  {vehicle.efficiency >= 85 ? "우수" : vehicle.efficiency >= 65 ? "보통" : "나쁨"}
                                </Badge>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">효율 점수:</span>
                                <span className="font-medium">{vehicle.efficiency}점</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">권장사항</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-sm text-gray-600">
                              {vehicle.efficiency >= 85 
                                ? "배터리 상태가 매우 양호합니다. 현재 사용 패턴을 유지하세요."
                                : vehicle.efficiency >= 65 
                                ? "배터리 상태가 보통입니다. 충전 패턴을 개선하면 효율을 높일 수 있습니다."
                                : "배터리 상태가 좋지 않습니다. 전문가 상담을 권장합니다."
                              }
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </CardContent>
          </Card>

          {/* 보통 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">보통</Badge>
                <span className="text-sm text-muted-foreground">({dummyData.performanceRanking.good.length}대)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dummyData.performanceRanking.good.map((vehicle) => (
                <Dialog key={vehicle.id}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() => setSelectedVehicle(vehicle.clientId)}
                    >
                      <span>{vehicle.carType} - {vehicle.model}</span>
                      <span className="text-yellow-600 font-semibold">{vehicle.efficiency}%</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[90vw] max-w-[1200px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        {vehicle.carType} - {vehicle.model} 상세 분석
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      {/* 기본 정보 */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-700">{vehicle.efficiency}%</div>
                          <div className="text-xs text-gray-600">배터리 효율</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-700">{vehicle.carType}</div>
                          <div className="text-xs text-gray-600">차종</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-700">{vehicle.model}</div>
                          <div className="text-xs text-gray-600">모델</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-700">{vehicle.clientId}</div>
                          <div className="text-xs text-gray-600">고객 ID</div>
                        </div>
                      </div>

                      {/* 그래프 선택 및 표시 */}
                      <div className="space-y-4">
                        <div className="flex gap-4">
                          <Select value={selectedGraph} onValueChange={setSelectedGraph}>
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="그래프 선택" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="driving">주행 그래프</SelectItem>
                              <SelectItem value="charging">충전 그래프</SelectItem>
                              <SelectItem value="efficiency">효율 그래프</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-center overflow-x-auto">
                          <div className="min-w-0">
                            {renderGraph()}
                          </div>
                        </div>
                      </div>

                      {/* 추가 정보 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">배터리 상태 요약</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">현재 상태:</span>
                                <Badge className={vehicle.efficiency >= 85 ? "bg-green-100 text-green-800" : vehicle.efficiency >= 65 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}>
                                  {vehicle.efficiency >= 85 ? "우수" : vehicle.efficiency >= 65 ? "보통" : "나쁨"}
                                </Badge>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">효율 점수:</span>
                                <span className="text-yellow-600 font-medium">{vehicle.efficiency}점</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">권장사항</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-sm text-gray-600">
                              {vehicle.efficiency >= 85 
                                ? "배터리 상태가 매우 양호합니다. 현재 사용 패턴을 유지하세요."
                                : vehicle.efficiency >= 65 
                                ? "배터리 상태가 보통입니다. 충전 패턴을 개선하면 효율을 높일 수 있습니다."
                                : "배터리 상태가 좋지 않습니다. 전문가 상담을 권장합니다."
                              }
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </CardContent>
          </Card>

          {/* 나쁨 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge className="bg-red-100 text-red-800 border-red-200">나쁨</Badge>
                <span className="text-sm text-muted-foreground">({dummyData.performanceRanking.poor.length}대)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dummyData.performanceRanking.poor.map((vehicle) => (
                <Dialog key={vehicle.id}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() => setSelectedVehicle(vehicle.clientId)}
                    >
                      <span>{vehicle.carType} - {vehicle.model}</span>
                      <span className="text-red-600 font-semibold">{vehicle.efficiency}%</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[90vw] max-w-[1200px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        {vehicle.carType} - {vehicle.model} 상세 분석
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      {/* 기본 정보 */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-700">{vehicle.efficiency}%</div>
                          <div className="text-xs text-gray-600">배터리 효율</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-700">{vehicle.carType}</div>
                          <div className="text-xs text-gray-600">차종</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-700">{vehicle.model}</div>
                          <div className="text-xs text-gray-600">모델</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-700">{vehicle.clientId}</div>
                          <div className="text-xs text-gray-600">고객 ID</div>
                        </div>
                      </div>

                      {/* 그래프 선택 및 표시 */}
                      <div className="space-y-4">
                        <div className="flex gap-4">
                          <Select value={selectedGraph} onValueChange={setSelectedGraph}>
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="그래프 선택" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="driving">주행 그래프</SelectItem>
                              <SelectItem value="charging">충전 그래프</SelectItem>
                              <SelectItem value="efficiency">효율 그래프</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-center overflow-x-auto">
                          <div className="min-w-0">
                            {renderGraph()}
                          </div>
                        </div>
                      </div>

                      {/* 추가 정보 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">배터리 상태 요약</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">현재 상태:</span>
                                <Badge className={vehicle.efficiency >= 85 ? "bg-green-100 text-green-800" : vehicle.efficiency >= 65 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}>
                                  {vehicle.efficiency >= 85 ? "우수" : vehicle.efficiency >= 65 ? "보통" : "나쁨"}
                                </Badge>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">효율 점수:</span>
                                <span className="text-red-600 font-medium">{vehicle.efficiency}점</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">권장사항</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-sm text-gray-600">
                              {vehicle.efficiency >= 85 
                                ? "배터리 상태가 매우 양호합니다. 현재 사용 패턴을 유지하세요."
                                : vehicle.efficiency >= 65 
                                ? "배터리 상태가 보통입니다. 충전 패턴을 개선하면 효율을 높일 수 있습니다."
                                : "배터리 상태가 좋지 않습니다. 전문가 상담을 권장합니다."
                              }
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
