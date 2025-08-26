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
    offset: int = Query(0, ge=0),
    db: asyncpg.Connection = Depends(get_db)
):
    """배터리 성능 비교 데이터 조회"""
    return await analytics_crud.get_battery_comparison(db, limit=limit, offset=offset)

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
    return await analytics_crud.get_analytics_summary(db)

@router.post("/materialized-views/refresh")
async def refresh_materialized_views(db: asyncpg.Connection = Depends(get_db)):
    """MATERIALIZED VIEW 새로고침 (관리자용)"""
    return await analytics_crud.refresh_materialized_views(db)

@router.get("/materialized-views/status")
async def get_materialized_view_status(db: asyncpg.Connection = Depends(get_db)):
    """MATERIALIZED VIEW 상태 및 통계 정보 조회"""
    return await analytics_crud.get_materialized_view_status(db)

@router.get("/battery/overall-distribution")
async def get_overall_performance_distribution(db: asyncpg.Connection = Depends(get_db)):
    """전체 차량의 성능 등급 분포 조회"""
    return await analytics_crud.get_overall_performance_distribution(db)

@router.get("/battery/vehicles-by-grade/{grade}")
async def get_vehicles_by_grade(
    grade: str,
    limit: int = Query(10, ge=1, le=50),
    offset: int = Query(0, ge=0),
    db: asyncpg.Connection = Depends(get_db)
):
    """특정 등급의 차량 목록 조회"""
    return await analytics_crud.get_vehicles_by_grade(db, grade, limit, offset)
