import asyncpg
from typing import List, Optional, Dict
from ..schemas.car_type import CarTypeCreate

async def get_car_types(db: asyncpg.Connection, skip: int = 0, limit: int = 100) -> List[Dict]:
    """모든 차량 타입 조회"""
    query = """
    SELECT * FROM car_type 
    OFFSET $1 LIMIT $2
    """
    rows = await db.fetch(query, skip, limit)
    return [dict(row) for row in rows]

async def get_car_type_by_id(db: asyncpg.Connection, clientid: str) -> Optional[Dict]:
    """특정 차량 타입 조회"""
    query = """
    SELECT * FROM car_type 
    WHERE clientid = $1
    """
    row = await db.fetchrow(query, clientid)
    return dict(row) if row else None

async def create_car_type(db: asyncpg.Connection, car_type: CarTypeCreate) -> Dict:
    """새로운 차량 타입 생성"""
    query = """
    INSERT INTO car_type (clientid, car_type, model_year, model_month)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    """
    row = await db.fetchrow(
        query, 
        car_type.clientid, 
        car_type.car_type, 
        car_type.model_year, 
        car_type.model_month
    )
    return dict(row)

async def get_unique_car_types(db: asyncpg.Connection) -> List[str]:
    """고유한 차량 타입 목록 조회"""
    query = """
    SELECT DISTINCT car_type 
    FROM car_type 
    WHERE car_type IS NOT NULL
    """
    rows = await db.fetch(query)
    return [row['car_type'] for row in rows]

async def get_vehicles_by_year(db: asyncpg.Connection, year: int) -> List[Dict]:
    """특정 연도 차량 조회"""
    query = """
    SELECT * FROM car_type 
    WHERE model_year = $1
    """
    rows = await db.fetch(query, year)
    return [dict(row) for row in rows]
