import asyncpg
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

async def get_dashboard_stats(db: asyncpg.Connection) -> Dict[str, Any]:
    """대시보드 통계 정보 조회 (Materialized View 사용)"""
    query = "SELECT * FROM mv_dashboard_stats;"
    row = await db.fetchrow(query)

    # row 가 None 일 경우 대비
    if not row:
        return {
            "total_vehicles": 0,
            "total_records": 0,
            "avg_battery_efficiency": 0.0,
            "avg_temperature": 0.0,
            "recent_activity_count": 0,
            "last_updated": None
        }

    return {
        "total_vehicles": row["total_vehicles"],
        "total_records": row["total_records"],
        "avg_battery_efficiency": float(row["avg_battery_efficiency"] or 0),
        "avg_temperature": float(row["avg_temperature"] or 0),
        "recent_activity_count": row["recent_activity"],
        "last_updated": row["last_updated"]
    }

async def get_performance_ranking(db: asyncpg.Connection, limit: int = 10) -> List[Dict[str, Any]]:
    """차량 성능 순위 조회"""
    # 각 차량별 성능 지표 계산
    performance_data = []
    
    # 고유한 차량 ID 조회
    vehicles_query = "SELECT DISTINCT clientid FROM bw_data"
    vehicles = await db.fetch(vehicles_query)
    
    for row in vehicles:
        clientid = row['clientid']
        
        # 해당 차량의 데이터 조회
        vehicle_data_query = """
        SELECT speed, pack_v, cell_max, cell_min, mileage 
        FROM bw_data 
        WHERE clientid = $1
        """
        vehicle_data = await db.fetch(vehicle_data_query, clientid)
        
        if not vehicle_data:
            continue
            
        # 성능 지표 계산
        speeds = [d['speed'] for d in vehicle_data if d['speed'] is not None]
        pack_voltages = [d['pack_v'] for d in vehicle_data if d['pack_v'] is not None]
        
        avg_speed = sum(speeds) / len(speeds) if speeds else 0
        avg_efficiency = sum(pack_voltages) / len(pack_voltages) if pack_voltages else 0
        
        # 배터리 건강도 점수 (셀 전압 분산이 작을수록 높은 점수)
        cell_voltages = [d['cell_max'] - d['cell_min'] for d in vehicle_data if d['cell_max'] and d['cell_min']]
        battery_health_score = 100 - (sum(cell_voltages) / len(cell_voltages) if cell_voltages else 0)
        
        # 주행 점수 (속도와 효율성 기반)
        driving_score = (avg_speed * 0.4 + avg_efficiency * 0.6) / 100
        
        # 총 주행거리
        mileages = [d['mileage'] for d in vehicle_data if d['mileage'] is not None]
        total_mileage = max(mileages) - min(mileages) if mileages else 0
        
        # 차량 타입 정보
        car_type_query = "SELECT car_type FROM car_type WHERE clientid = $1"
        car_type_result = await db.fetchrow(car_type_query, clientid)
        car_type = car_type_result['car_type'] if car_type_result else None
        
        performance_data.append({
            "clientid": clientid,
            "car_type": car_type,
            "avg_speed": avg_speed,
            "avg_efficiency": avg_efficiency,
            "battery_health_score": battery_health_score,
            "driving_score": driving_score,
            "total_mileage": total_mileage,
            "performance_rank": 0  # 나중에 정렬 후 설정
        })
    
    # 성능 점수로 정렬
    performance_data.sort(key=lambda x: x['driving_score'] + x['battery_health_score'], reverse=True)
    
    # 순위 설정
    for i, data in enumerate(performance_data[:limit]):
        data['performance_rank'] = i + 1
    
    return performance_data[:limit]

async def get_efficiency_analysis(db: asyncpg.Connection, clientid: Optional[str] = None, days: int = 30) -> List[Dict[str, Any]]:
    """효율성 분석 데이터 조회"""
    cutoff_date = datetime.now() - timedelta(days=days)
    
    if clientid:
        query = """
        SELECT clientid, timestamp, speed, pack_v, temp_mean
        FROM bw_data 
        WHERE timestamp >= $1 AND clientid = $2
        ORDER BY timestamp
        """
        records = await db.fetch(query, cutoff_date, clientid)
    else:
        query = """
        SELECT clientid, timestamp, speed, pack_v, temp_mean
        FROM bw_data 
        WHERE timestamp >= $1
        ORDER BY timestamp
        """
        records = await db.fetch(query, cutoff_date)
    
    # 시간별 효율성 데이터 집계
    efficiency_data = []
    
    for record in records:
        if record['speed'] and record['pack_v'] and record['temp_mean']:
            efficiency_data.append({
                "clientid": record['clientid'],
                "timestamp": record['timestamp'],
                "efficiency": record['pack_v'] / (record['speed'] + 1),  # 속도가 0일 때 방지
                "speed": record['speed'],
                "temperature": record['temp_mean'],
                "battery_voltage": record['pack_v']
            })
    
    return efficiency_data

async def get_battery_comparison(db: asyncpg.Connection, limit: int = 10) -> List[Dict[str, Any]]:
    """배터리 성능 비교 데이터 조회"""
    # 각 차량별 배터리 성능 지표 계산
    battery_data = []
    
    # 고유한 차량 ID 조회
    vehicles_query = "SELECT DISTINCT clientid FROM bw_data"
    vehicles = await db.fetch(vehicles_query)
    
    for row in vehicles:
        clientid = row['clientid']
        
        # 해당 차량의 배터리 데이터 조회
        battery_query = """
        SELECT 
            pack_v, cell_max, cell_min, cell_mean, cell_median,
            temp_max, temp_min, temp_mean, temp_median,
            current, chg_sac, mileage, speed
        FROM bw_data 
        WHERE clientid = $1
        """
        battery_records = await db.fetch(battery_query, clientid)
        
        if not battery_records:
            continue
            
        # 배터리 성능 지표 계산
        pack_voltages = [r['pack_v'] for r in battery_records if r['pack_v'] is not None]
        cell_maxes = [r['cell_max'] for r in battery_records if r['cell_max'] is not None]
        cell_mins = [r['cell_min'] for r in battery_records if r['cell_min'] is not None]
        temperatures = [r['temp_mean'] for r in battery_records if r['temp_mean'] is not None]
        currents = [r['current'] for r in battery_records if r['current'] is not None]
        mileages = [r['mileage'] for r in battery_records if r['mileage'] is not None]
        
        if not pack_voltages:
            continue
            
        # 평균값 계산
        avg_pack_v = sum(pack_voltages) / len(pack_voltages)
        avg_cell_max = sum(cell_maxes) / len(cell_maxes) if cell_maxes else 0
        avg_cell_min = sum(cell_mins) / len(cell_mins) if cell_mins else 0
        avg_temp = sum(temperatures) / len(temperatures) if temperatures else 0
        avg_current = sum(currents) / len(currents) if currents else 0
        
        # 총 주행거리
        total_mileage = max(mileages) - min(mileages) if mileages else 0
        
        # 배터리 건강도 점수 (셀 전압 분산이 작을수록 높은 점수)
        cell_voltage_range = avg_cell_max - avg_cell_min if avg_cell_max and avg_cell_min else 0
        battery_health_score = max(0, 100 - (cell_voltage_range * 10))
        
        # 성능 점수 계산
        performance_score = (
            (battery_health_score * 0.4) +
            (min(100, (avg_pack_v / 10)) * 0.3) +
            (max(0, 100 - abs(avg_temp - 25) * 2) * 0.3)
        )
        
        # 차량 타입 정보
        car_type_query = "SELECT car_type, model_year FROM car_type WHERE clientid = $1"
        car_type_result = await db.fetchrow(car_type_query, clientid)
        car_type = car_type_result['car_type'] if car_type_result else None
        model_year = car_type_result['model_year'] if car_type_result else None
        
        # 상태 분류
        if performance_score >= 90:
            status = "high"
        elif performance_score >= 70:
            status = "medium"
        else:
            status = "low"
        
        battery_data.append({
            "clientid": clientid,
            "car_type": car_type,
            "model_year": model_year,
            "battery_capacity": avg_pack_v,
            "battery_health": battery_health_score,
            "performance_score": round(performance_score, 1),
            "status": status,
            "avg_temperature": round(avg_temp, 1),
            "avg_current": round(avg_current, 1),
            "total_mileage": round(total_mileage, 1),
            "cell_voltage_range": round(cell_voltage_range, 3)
        })
    
    # 성능 점수로 정렬
    battery_data.sort(key=lambda x: x['performance_score'], reverse=True)
    
    # 순위 설정
    for i, data in enumerate(battery_data[:limit]):
        data['rank'] = i + 1
    
    return battery_data[:limit]

async def get_battery_detail(db: asyncpg.Connection, clientid: str, days: int = 30) -> Dict[str, Any]:
    """특정 차량의 배터리 상세 정보 조회"""
    cutoff_date = datetime.now() - timedelta(days=days)
    
    # 배터리 상세 데이터 조회
    detail_query = """
    SELECT 
        timestamp, pack_v, cell_max, cell_min, cell_mean, cell_median,
        temp_max, temp_min, temp_mean, temp_median,
        current, chg_sac, mileage, speed
    FROM bw_data 
    WHERE clientid = $1 AND timestamp >= $2
    ORDER BY timestamp
    """
    records = await db.fetch(detail_query, clientid, cutoff_date)
    
    if not records:
        return {"error": "데이터가 없습니다"}
    
    # 월별 효율성 데이터
    monthly_data = {}
    for record in records:
        month = record['timestamp'].strftime("%Y-%m")
        if month not in monthly_data:
            monthly_data[month] = []
        monthly_data[month].append(record)
    
    # 월별 평균 효율성 계산
    monthly_efficiency = []
    for month, month_records in monthly_data.items():
        efficiencies = []
        for record in month_records:
            if record['speed'] and record['pack_v']:
                efficiency = record['pack_v'] / (record['speed'] + 1)
                efficiencies.append(efficiency)
        
        if efficiencies:
            monthly_efficiency.append({
                "month": month,
                "efficiency": round(sum(efficiencies) / len(efficiencies), 2)
            })
    
    # 레이더 차트 데이터
    pack_voltages = [r['pack_v'] for r in records if r['pack_v']]
    temperatures = [r['temp_mean'] for r in records if r['temp_mean']]
    mileages = [r['mileage'] for r in records if r['mileage']]
    
    avg_pack_v = sum(pack_voltages) / len(pack_voltages) if pack_voltages else 0
    avg_temp = sum(temperatures) / len(temperatures) if temperatures else 0
    total_mileage = max(mileages) - min(mileages) if mileages else 0
    
    radar_data = [
        { "subject": "배터리 전압", "A": min(100, (avg_pack_v / 10)), "fullMark": 100 },
        { "subject": "온도 안정성", "A": max(0, 100 - abs(avg_temp - 25) * 2), "fullMark": 100 },
        { "subject": "주행거리", "A": min(100, (total_mileage / 1000) * 10), "fullMark": 100 },
        { "subject": "충전 효율", "A": 85, "fullMark": 100 },  # 기본값
        { "subject": "배터리 건강도", "A": 90, "fullMark": 100 },  # 기본값
    ]
    
    return {
        "clientid": clientid,
        "monthly_efficiency": monthly_efficiency,
        "radar_data": radar_data,
        "total_records": len(records),
        "analysis_period": f"{days}일"
    }
