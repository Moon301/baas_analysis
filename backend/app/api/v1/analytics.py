from fastapi import APIRouter, Depends, Query
import asyncpg
from typing import List, Optional
from ...database.base import get_db
from ...crud import analytics as analytics_crud
from ...schemas.analytics import DashboardStats, PerformanceMetrics, EfficiencyData

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(db: asyncpg.Connection = Depends(get_db)):
    """대시보드 통계 정보 조회"""
    return await analytics_crud.get_dashboard_stats(db)

@router.get("/performance/ranking", response_model=List[PerformanceMetrics])
async def get_performance_ranking(
    limit: int = Query(10, ge=1, le=100),
    db: asyncpg.Connection = Depends(get_db)
):
    """차량 성능 순위 조회"""
    return await analytics_crud.get_performance_ranking(db, limit=limit)

@router.get("/efficiency", response_model=List[EfficiencyData])
async def get_efficiency_analysis(
    clientid: Optional[str] = Query(None, description="차량 ID"),
    days: int = Query(30, ge=1, le=365),
    db: asyncpg.Connection = Depends(get_db)
):
    """효율성 분석 데이터 조회"""
    return await analytics_crud.get_efficiency_analysis(db, clientid=clientid, days=days)

@router.get("/battery/comparison")
async def get_battery_comparison(
    limit: int = Query(10, ge=1, le=50),
    db: asyncpg.Connection = Depends(get_db)
):
    """배터리 성능 비교 데이터 조회"""
    return await analytics_crud.get_battery_comparison(db, limit=limit)

@router.get("/battery/detail/{clientid}")
async def get_battery_detail(
    clientid: str,
    days: int = Query(30, ge=1, le=365),
    db: asyncpg.Connection = Depends(get_db)
):
    """특정 차량의 배터리 상세 정보 조회"""
    return await analytics_crud.get_battery_detail(db, clientid=clientid, days=days)

@router.get("/summary")
async def get_analytics_summary(db: asyncpg.Connection = Depends(get_db)):
    """분석 요약 정보 조회"""
    # 대시보드 통계
    dashboard_stats = await analytics_crud.get_dashboard_stats(db)
    
    # 상위 5개 차량 성능
    top_performance = await analytics_crud.get_performance_ranking(db, limit=5)
    
    # 최근 7일 효율성
    recent_efficiency = await analytics_crud.get_efficiency_analysis(db, days=7)
    
    return {
        "dashboard": dashboard_stats,
        "top_performance": top_performance,
        "recent_efficiency": {
            "days": 7,
            "total_records": len(recent_efficiency),
            "avg_efficiency": sum(e['efficiency'] for e in recent_efficiency) / len(recent_efficiency) if recent_efficiency else 0
        }
    }
