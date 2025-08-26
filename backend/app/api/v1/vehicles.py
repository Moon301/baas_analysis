from fastapi import APIRouter, Depends, HTTPException, Query
import asyncpg
from typing import List, Optional
from ...database.base import get_db
from ...crud import car_type as car_type_crud
from ...schemas.car_type import CarTypeResponse, CarTypeCreate

router = APIRouter(prefix="/vehicles", tags=["vehicles"])

@router.get("/", response_model=List[CarTypeResponse])
async def get_vehicles(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: asyncpg.Connection = Depends(get_db)
):
    """모든 차량 정보 조회"""
    vehicles = await car_type_crud.get_car_types(db, skip=skip, limit=limit)
    return vehicles

@router.get("/{clientid}", response_model=CarTypeResponse)
async def get_vehicle(clientid: str, db: asyncpg.Connection = Depends(get_db)):
    """특정 차량 정보 조회"""
    vehicle = await car_type_crud.get_car_type_by_id(db, clientid=clientid)
    if vehicle is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle

@router.post("/", response_model=CarTypeResponse)
async def create_vehicle(vehicle: CarTypeCreate, db: asyncpg.Connection = Depends(get_db)):
    """새로운 차량 정보 생성"""
    # 이미 존재하는지 확인
    existing_vehicle = await car_type_crud.get_car_type_by_id(db, clientid=vehicle.clientid)
    if existing_vehicle:
        raise HTTPException(status_code=400, detail="Vehicle already exists")
    
    return await car_type_crud.create_car_type(db, vehicle)

@router.get("/types/unique")
async def get_unique_car_types(db: asyncpg.Connection = Depends(get_db)):
    """고유한 차량 타입 목록 조회"""
    return await car_type_crud.get_unique_car_types(db)

@router.get("/year/{year}")
async def get_vehicles_by_year(year: int, db: asyncpg.Connection = Depends(get_db)):
    """특정 연도 차량 조회"""
    vehicles = await car_type_crud.get_vehicles_by_year(db, year=year)
    return vehicles
