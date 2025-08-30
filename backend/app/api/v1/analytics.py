from fastapi import APIRouter, Depends, Query
import asyncpg
from typing import List, Optional
from ...database.base import get_db
from ...crud import analytics as analytics_crud

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/bw-dashboard")
async def get_bw_dashboard_data(db: asyncpg.Connection = Depends(get_db)):
    """BW 종합 대시보드 뷰 데이터 조회"""
    return await analytics_crud.get_bw_dashboard_data(db)

@router.get("/client-vehicles")
async def get_client_vehicles_info(
    car_type: Optional[str] = Query(None, description="차종 필터"),
    limit: int = Query(15, ge=1, le=100, description="페이지당 항목 수"),
    offset: int = Query(0, ge=0, description="페이지 오프셋"),
    db: asyncpg.Connection = Depends(get_db)
):
    """Client ID별 차량 정보 조회 - 페이지네이션 및 차종 필터링 지원"""
    return await analytics_crud.get_client_vehicles_info(db, car_type, limit, offset)

@router.get("/car-types")
async def get_available_car_types(db: asyncpg.Connection = Depends(get_db)):
    """사용 가능한 차종 목록 조회"""
    return await analytics_crud.get_available_car_types(db)

@router.post("/bw-dashboard/refresh")
async def refresh_bw_dashboard_view(db: asyncpg.Connection = Depends(get_db)):
    """BW 대시보드 materialized view 새로고침 (관리자용)"""
    return await analytics_crud.refresh_bw_dashboard_view(db)

@router.get("/bw-dashboard/status")
async def get_bw_dashboard_status(db: asyncpg.Connection = Depends(get_db)):
    """BW 대시보드 관련 테이블 및 뷰 상태 확인"""
    return await analytics_crud.get_bw_dashboard_status(db)
