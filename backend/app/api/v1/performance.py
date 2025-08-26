from fastapi import APIRouter, Depends, Query
import asyncpg
from typing import List
from ...database.base import get_db
from ...crud import bw_data as bw_data_crud
from ...schemas.bw_data import BwDataResponse, BwDataFilter

router = APIRouter(prefix="/performance", tags=["performance"])

@router.get("/data", response_model=List[BwDataResponse])
async def get_performance_data(
    clientid: str = Query(None, description="차량 ID"),
    start_date: str = Query(None, description="시작 날짜 (YYYY-MM-DD)"),
    end_date: str = Query(None, description="종료 날짜 (YYYY-MM-DD)"),
    limit: int = Query(1000, ge=1, le=10000),
    db: asyncpg.Connection = Depends(get_db)
):
    """성능 데이터 조회"""
    from datetime import datetime
    
    start_dt = datetime.fromisoformat(start_date) if start_date else None
    end_dt = datetime.fromisoformat(end_date) if end_date else None
    
    data = await bw_data_crud.get_bw_data_filtered(
        db, 
        clientid=clientid, 
        start_date=start_dt, 
        end_date=end_dt, 
        limit=limit
    )
    return data

@router.get("/data/{clientid}")
async def get_vehicle_performance_data(
    clientid: str,
    limit: int = Query(1000, ge=1, le=10000),
    db: asyncpg.Connection = Depends(get_db)
):
    """특정 차량의 성능 데이터 조회"""
    data = await bw_data_crud.get_bw_data_by_client(db, clientid=clientid, limit=limit)
    return {
        "clientid": clientid,
        "total_records": len(data),
        "data": data
    }

@router.get("/stats/{clientid}")
async def get_vehicle_stats(clientid: str, db: asyncpg.Connection = Depends(get_db)):
    """특정 차량의 통계 정보 조회"""
    stats = await bw_data_crud.get_bw_data_stats(db, clientid=clientid)
    return {
        "clientid": clientid,
        "stats": stats
    }

@router.get("/recent")
async def get_recent_performance_data(
    hours: int = Query(24, ge=1, le=168),
    db: asyncpg.Connection = Depends(get_db)
):
    """최근 N시간 동안의 성능 데이터 조회"""
    data = await bw_data_crud.get_recent_bw_data(db, hours=hours)
    return {
        "hours": hours,
        "total_records": len(data),
        "data": data
    }
