import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const response = await fetch('http://localhost:8004/api/v1/analytics/battery-performance/distribution')
    
    if (!response.ok) {
      throw new Error('Backend API 호출 실패')
    }
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('배터리 성능 분포 데이터 가져오기 실패:', error)
    return NextResponse.json(
      { error: '데이터를 가져올 수 없습니다.' },
      { status: 500 }
    )
  }
}

