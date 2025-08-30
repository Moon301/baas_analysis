import asyncpg
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

async def get_bw_data(db: asyncpg.Connection, skip: int = 0, limit: int = 100) -> List[Dict]:
    """모든 bw_data 조회"""
    query = """
    SELECT * FROM bw_data 
    ORDER BY timestamp DESC 
    OFFSET $1 LIMIT $2
    """
    rows = await db.fetch(query, skip, limit)
    return [dict(row) for row in rows]

async def get_bw_data_by_client(db: asyncpg.Connection, clientid: str, skip: int = 0, limit: int = 1000) -> List[Dict]:
    """특정 차량의 데이터 조회"""
    query = """
    SELECT * FROM bw_data 
    WHERE clientid = $1 
    ORDER BY timestamp DESC 
    OFFSET $2 LIMIT $3
    """
    rows = await db.fetch(query, clientid, skip, limit)
    return [dict(row) for row in rows]

async def get_bw_data_filtered(db: asyncpg.Connection, clientid: Optional[str] = None, 
                              start_date: Optional[datetime] = None, 
                              end_date: Optional[datetime] = None, 
                              limit: int = 1000) -> List[Dict]:
    """필터링된 bw_data 조회"""
    conditions = []
    params = []
    param_count = 0
    
    if clientid:
        param_count += 1
        conditions.append(f"clientid = ${param_count}")
        params.append(clientid)
    
    if start_date:
        param_count += 1
        conditions.append(f"timestamp >= ${param_count}")
        params.append(start_date)
    
    if end_date:
        param_count += 1
        conditions.append(f"timestamp <= ${param_count}")
        params.append(end_date)
    
    where_clause = " AND ".join(conditions) if conditions else "1=1"
    param_count += 1
    params.append(limit)
    
    query = f"""
    SELECT * FROM bw_data 
    WHERE {where_clause}
    ORDER BY timestamp DESC 
    LIMIT ${param_count}
    """
    
    rows = await db.fetch(query, *params)
    return [dict(row) for row in rows]

async def get_bw_data_stats(db: asyncpg.Connection, clientid: Optional[str] = None) -> Dict[str, Any]:
    """bw_data 통계 정보 조회 - soc, soh 컬럼 추가"""
    if clientid:
        query = """
        SELECT 
            COUNT(*) as total_records,
            AVG(speed) as avg_speed,
            AVG(pack_v) as avg_battery_voltage,
            AVG(temp_mean) as avg_temperature,
            AVG(soc) as avg_soc,
            AVG(soh) as avg_soh,
            MAX(mileage) as max_mileage,
            MIN(mileage) as min_mileage,
            MAX(soc) as max_soc,
            MIN(soc) as min_soc,
            MAX(soh) as max_soh,
            MIN(soh) as min_soh
        FROM bw_data 
        WHERE clientid = $1
        """
        row = await db.fetchrow(query, clientid)
    else:
        query = """
        SELECT 
            COUNT(*) as total_records,
            AVG(speed) as avg_speed,
            AVG(pack_v) as avg_battery_voltage,
            AVG(temp_mean) as avg_temperature,
            AVG(soc) as avg_soc,
            AVG(soh) as avg_soh,
            MAX(mileage) as max_mileage,
            MIN(mileage) as min_mileage,
            MAX(soc) as max_soc,
            MIN(soc) as min_soc,
            MAX(soh) as max_soh,
            MIN(soh) as min_soh
        FROM bw_data
        """
        row = await db.fetchrow(query)
    
    if not row or row['total_records'] == 0:
        return {
            "total_records": 0,
            "avg_speed": 0,
            "avg_battery_voltage": 0,
            "avg_temperature": 0,
            "avg_soc": 0,
            "avg_soh": 0,
            "total_mileage": 0,
            "soc_range": {"min": 0, "max": 0},
            "soh_range": {"min": 0, "max": 0}
        }
    
    return {
        "total_records": row['total_records'],
        "avg_speed": float(row['avg_speed']) if row['avg_speed'] else 0,
        "avg_battery_voltage": float(row['avg_battery_voltage']) if row['avg_battery_voltage'] else 0,
        "avg_temperature": float(row['avg_temperature']) if row['avg_temperature'] else 0,
        "avg_soc": float(row['avg_soc']) if row['avg_soc'] else 0,
        "avg_soh": float(row['avg_soh']) if row['avg_soh'] else 0,
        "total_mileage": float(row['max_mileage'] - row['min_mileage']) if row['max_mileage'] and row['min_mileage'] else 0,
        "soc_range": {
            "min": float(row['min_soc']) if row['min_soc'] else 0,
            "max": float(row['max_soc']) if row['max_soc'] else 0
        },
        "soh_range": {
            "min": float(row['min_soh']) if row['min_soh'] else 0,
            "max": float(row['max_soh']) if row['max_soh'] else 0
        }
    }

async def get_recent_bw_data(db: asyncpg.Connection, hours: int = 24) -> List[Dict]:
    """최근 N시간 동안의 데이터 조회"""
    cutoff_time = datetime.now() - timedelta(hours=hours)
    query = """
    SELECT * FROM bw_data 
    WHERE timestamp >= $1 
    ORDER BY timestamp DESC
    """
    rows = await db.fetch(query, cutoff_time)
    return [dict(row) for row in rows]
