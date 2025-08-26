import asyncpg
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import time

# 간단한 메모리 캐시 (실제 운영에서는 Redis 등을 사용 권장)
_cache = {}
_cache_ttl = 300  # 5분 캐시

def _get_cache_key(func_name: str, *args, **kwargs):
    """캐시 키 생성"""
    key_parts = [func_name]
    for arg in args:
        key_parts.append(str(arg))
    for k, v in sorted(kwargs.items()):
        key_parts.append(f"{k}={v}")
    return ":".join(key_parts)

def _get_cached_data(cache_key: str):
    """캐시된 데이터 조회"""
    if cache_key in _cache:
        cached_data, timestamp = _cache[cache_key]
        if time.time() - timestamp < _cache_ttl:
            return cached_data
        else:
            del _cache[cache_key]
    return None

def _set_cached_data(cache_key: str, data: Any):
    """데이터 캐싱"""
    _cache[cache_key] = (data, time.time())

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

async def get_battery_comparison(db: asyncpg.Connection, limit: int = 10, offset: int = 0) -> Dict[str, Any]:
    """배터리 성능 비교 데이터 조회 - 새로운 MATERIALIZED VIEW 사용 + 페이지네이션 + 캐싱"""
    # 캐시 키 생성
    cache_key = _get_cache_key("get_battery_comparison", limit=limit, offset=offset)
    
    # 캐시된 데이터 확인
    cached_result = _get_cached_data(cache_key)
    if cached_result:
        return cached_result
    
    # 전체 데이터 수 조회 (새로운 MATERIALIZED VIEW 사용)
    count_query = "SELECT COUNT(*) FROM client_battery_summary"
    total_count = await db.fetchval(count_query)
    
    # 페이지네이션된 데이터 조회
    query = """
    SELECT 
        clientid,
        car_type,
        model_year,
        total_segments,
        avg_cell_balance_score,
        avg_soc_stability_score,
        avg_thermal_performance_score,
        avg_efficiency_score,
        avg_total_score,
        excellent_segments,
        average_segments,
        poor_segments,
        overall_grade,
        total_distance,
        avg_operating_temperature,
        last_data_timestamp
    FROM client_battery_summary
    ORDER BY avg_total_score DESC
    LIMIT $1 OFFSET $2
    """
    
    rows = await db.fetch(query, limit, offset)
    battery_data = []
    
    for row in rows:
        # 성능 점수에 따른 상태 분류
        if row['avg_total_score'] >= 80:
            status = "high"
        elif row['avg_total_score'] >= 60:
            status = "medium"
        else:
            status = "low"
        
        # 모델명 생성
        model_name = row['car_type'] or '알 수 없음'
        if row['model_year']:
            model_name += f" ({row['model_year']})"
        
        # 성능 등급별 비율 계산
        total_segments = row['total_segments']
        excellent_ratio = (row['excellent_segments'] / total_segments * 100) if total_segments > 0 else 0
        average_ratio = (row['average_segments'] / total_segments * 100) if total_segments > 0 else 0
        poor_ratio = (row['poor_segments'] / total_segments * 100) if total_segments > 0 else 0
        
        battery_data.append({
            "clientid": row['clientid'],
            "car_type": row['car_type'] or '알 수 없음',
            "model_name": model_name,
            "model_year": row['model_year'] or 0,
            "performance_score": round(row['avg_total_score'], 1),
            "status": status,
            "overall_grade": row['overall_grade'],
            "total_segments": row['total_segments'],
            "excellent_segments": row['excellent_segments'],
            "average_segments": row['average_segments'],
            "poor_segments": row['poor_segments'],
            "excellent_ratio": round(excellent_ratio, 1),
            "average_ratio": round(average_ratio, 1),
            "poor_ratio": round(poor_ratio, 1),
            "total_distance": round(row['total_distance'] or 0, 1),
            "avg_operating_temperature": round(row['avg_operating_temperature'] or 0, 1),
            "last_data_timestamp": row['last_data_timestamp'],
            # 세부 점수들
            "cell_balance_score": round(row['avg_cell_balance_score'] or 0, 1),
            "soc_stability_score": round(row['avg_soc_stability_score'] or 0, 1),
            "thermal_performance_score": round(row['avg_thermal_performance_score'] or 0, 1),
            "efficiency_score": round(row['avg_efficiency_score'] or 0, 1)
        })
    
    # 순위 설정 (offset 기반)
    for i, data in enumerate(battery_data):
        data['rank'] = offset + i + 1
    
    result = {
        "data": battery_data,
        "pagination": {
            "total_count": total_count,
            "current_offset": offset,
            "current_limit": limit,
            "has_more": offset + limit < total_count,
            "next_offset": offset + limit if offset + limit < total_count else None
        }
    }
    
    # 결과 캐싱
    _set_cached_data(cache_key, result)
    
    return result

async def get_battery_detail(db: asyncpg.Connection, clientid: str, days: int = 30) -> Dict[str, Any]:
    """특정 차량의 배터리 상세 정보 조회 - 새로운 MATERIALIZED VIEW 사용"""
    # 클라이언트 요약 정보 조회 (새로운 MATERIALIZED VIEW 사용)
    summary_query = """
    SELECT 
        clientid,
        car_type,
        model_year,
        total_segments,
        avg_cell_balance_score,
        avg_soc_stability_score,
        avg_thermal_performance_score,
        avg_efficiency_score,
        avg_total_score,
        excellent_segments,
        average_segments,
        poor_segments,
        overall_grade,
        total_distance,
        avg_operating_temperature,
        last_data_timestamp
    FROM client_battery_summary
    WHERE clientid = $1
    """
    
    summary = await db.fetchrow(summary_query, clientid)
    if not summary:
        return {"error": "차량 정보를 찾을 수 없습니다"}
    
    # 구간별 상세 성능 데이터 조회 (최근 데이터, 새로운 MATERIALIZED VIEW 사용)
    cutoff_date = datetime.now() - timedelta(days=days)
    segments_query = """
    SELECT 
        segment_id,
        segment_start,
        segment_end,
        duration_minutes,
        distance_traveled,
        cell_balance_score,
        soc_stability_score,
        thermal_performance_score,
        efficiency_score,
        total_score,
        performance_grade,
        avg_cell_imbalance,
        voltage_stability,
        avg_temperature,
        max_temp_spread,
        avg_current,
        avg_speed
    FROM battery_performance_evaluation
    WHERE clientid = $1 AND segment_start >= $2
    ORDER BY segment_start DESC
    LIMIT 50
    """
    
    segments = await db.fetch(segments_query, clientid, cutoff_date)
    
    # 월별 성능 추이 계산
    monthly_performance = {}
    for segment in segments:
        month = segment['segment_start'].strftime("%Y-%m")
        if month not in monthly_performance:
            monthly_performance[month] = []
        monthly_performance[month].append(segment['total_score'])
    
    monthly_data = []
    for month, scores in monthly_performance.items():
        monthly_data.append({
            "month": month,
            "performance": round(sum(scores) / len(scores), 1)
        })
    
    # 성능 분포 차트 데이터
    performance_distribution = [
        { "name": "우수", "value": summary['excellent_segments'], "color": "#10b981" },
        { "name": "보통", "value": summary['average_segments'], "color": "#f59e0b" },
        { "name": "나쁨", "value": summary['poor_segments'], "color": "#ef4444" }
    ]
    
    # 레이더 차트 데이터 (4개 영역별 점수)
    radar_data = [
        { "subject": "셀 밸런스", "A": summary['avg_cell_balance_score'], "fullMark": 25 },
        { "subject": "SOC 안정성", "A": summary['avg_soc_stability_score'], "fullMark": 25 },
        { "subject": "열 성능", "A": summary['avg_thermal_performance_score'], "fullMark": 25 },
        { "subject": "에너지 효율", "A": summary['avg_efficiency_score'], "fullMark": 25 }
    ]
    
    # 구간별 성능 추이 차트 데이터
    segment_performance = []
    for segment in segments[:20]:  # 최근 20개 구간
        segment_performance.append({
            "segment": f"#{segment['segment_id']}",
            "score": segment['total_score'],
            "duration": round(segment['duration_minutes'], 1),
            "distance": round(segment['distance_traveled'], 1),
            "grade": segment['performance_grade']
        })
    
    # 모델명 생성
    model_name = summary['car_type'] or '알 수 없음'
    if summary['model_year']:
        model_name += f" ({summary['model_year']})"
    
    return {
        "clientid": clientid,
        "model_name": model_name,
        "car_type": summary['car_type'],
        "model_year": summary['model_year'],
        "overall_grade": summary['overall_grade'],
        "total_score": round(summary['avg_total_score'] or 0, 1),
        "total_segments": summary['total_segments'],
        "total_distance": round(summary['total_distance'] or 0, 1),
        "avg_operating_temperature": round(summary['avg_operating_temperature'] or 0, 1),
        "last_data_timestamp": summary['last_data_timestamp'],
        # 세부 점수들
        "cell_balance_score": round(summary['avg_cell_balance_score'] or 0, 1),
        "soc_stability_score": round(summary['avg_soc_stability_score'] or 0, 1),
        "thermal_performance_score": round(summary['avg_thermal_performance_score'] or 0, 1),
        "efficiency_score": round(summary['avg_efficiency_score'] or 0, 1),
        # 차트 데이터
        "monthly_performance": monthly_data,
        "radar_data": radar_data,
        "segment_performance": segment_performance,
        "performance_distribution": performance_distribution,
        # 등급별 통계
        "excellent_segments": summary['excellent_segments'],
        "average_segments": summary['average_segments'],
        "poor_segments": summary['poor_segments'],
        "excellent_ratio": round((summary['excellent_segments'] / summary['total_segments'] * 100), 1) if summary['total_segments'] > 0 else 0,
        "analysis_period": f"{days}일"
    }

async def refresh_materialized_views(db: asyncpg.Connection) -> Dict[str, str]:
    """MATERIALIZED VIEW 새로고침 (데이터 업데이트 시 사용)"""
    try:
        # MATERIALIZED VIEW 새로고침
        await db.execute("REFRESH MATERIALIZED VIEW bw_trip_segments")
        await db.execute("REFRESH MATERIALIZED VIEW bw_segment_battery_stats")
        
        return {
            "status": "success",
            "message": "MATERIALIZED VIEW가 성공적으로 새로고침되었습니다.",
            "refreshed_views": ["bw_trip_segments", "bw_segment_battery_stats"]
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"MATERIALIZED VIEW 새로고침 중 오류가 발생했습니다: {str(e)}"
        }

async def get_materialized_view_status(db: asyncpg.Connection) -> Dict[str, Any]:
    """MATERIALIZED VIEW 상태 및 통계 정보 조회"""
    try:
        # 각 뷰의 레코드 수 조회
        trip_segments_count = await db.fetchval("SELECT COUNT(*) FROM bw_trip_segments")
        segment_stats_count = await db.fetchval("SELECT COUNT(*) FROM bw_segment_battery_stats")
        client_summary_count = await db.fetchval("SELECT COUNT(*) FROM client_battery_summary")
        
        # 최근 업데이트 시간 (가장 최근 데이터의 timestamp)
        latest_data = await db.fetchval("SELECT MAX(last_data_timestamp) FROM client_battery_summary")
        
        return {
            "status": "success",
            "view_counts": {
                "bw_trip_segments": trip_segments_count,
                "bw_segment_battery_stats": segment_stats_count,
                "client_battery_summary": client_summary_count
            },
            "latest_data_timestamp": latest_data,
            "total_clients": client_summary_count
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"MATERIALIZED VIEW 상태 조회 중 오류가 발생했습니다: {str(e)}"
        }

async def get_analytics_summary(db: asyncpg.Connection) -> Dict[str, Any]:
    """분석 요약 정보 조회"""
    try:
        # 대시보드 통계
        dashboard_stats = await get_dashboard_stats(db)
        
        # 상위 5개 차량 성능
        top_performance = await get_performance_ranking(db, limit=5)
        
        # 최근 7일 효율성
        recent_efficiency = await get_efficiency_analysis(db, days=7)
        
        # MATERIALIZED VIEW 상태
        mv_status = await get_materialized_view_status(db)
        
        return {
            "dashboard": dashboard_stats,
            "top_performance": top_performance,
            "recent_efficiency": {
                "days": 7,
                "total_records": len(recent_efficiency),
                "avg_efficiency": sum(e['efficiency'] for e in recent_efficiency) / len(recent_efficiency) if recent_efficiency else 0
            },
            "materialized_views": mv_status
        }
    except Exception as e:
        return {
            "error": f"분석 요약 정보 조회 중 오류가 발생했습니다: {str(e)}"
        }

async def get_overall_performance_distribution(db: asyncpg.Connection) -> Dict[str, Any]:
    """전체 차량의 성능 등급 분포 조회"""
    try:
        # 전체 차량 수
        total_vehicles = await db.fetchval("SELECT COUNT(*) FROM client_battery_summary")
        
        # 등급별 차량 수
        grade_counts = await db.fetch("""
            SELECT 
                overall_grade,
                COUNT(*) as count
            FROM client_battery_summary
            GROUP BY overall_grade
            ORDER BY overall_grade
        """)
        
        # 등급별 통계
        distribution = {}
        for row in grade_counts:
            grade = row['overall_grade']
            count = row['count']
            percentage = round((count / total_vehicles * 100), 1) if total_vehicles > 0 else 0
            distribution[grade] = {
                "count": count,
                "percentage": percentage
            }
        
        return {
            "total_vehicles": total_vehicles,
            "distribution": distribution
        }
    except Exception as e:
        return {
            "error": f"전체 성능 분포 조회 중 오류가 발생했습니다: {str(e)}"
        }

async def get_vehicles_by_grade(db: asyncpg.Connection, grade: str, limit: int = 10, offset: int = 0) -> Dict[str, Any]:
    """특정 등급의 차량 목록 조회"""
    try:
        # 해당 등급의 전체 차량 수
        total_count = await db.fetchval("""
            SELECT COUNT(*) FROM client_battery_summary 
            WHERE overall_grade = $1
        """, grade)
        
        # 페이지네이션된 차량 목록
        vehicles = await db.fetch("""
            SELECT 
                clientid,
                car_type,
                model_year,
                total_segments,
                avg_cell_balance_score,
                avg_soc_stability_score,
                avg_thermal_performance_score,
                avg_efficiency_score,
                avg_total_score,
                excellent_segments,
                average_segments,
                poor_segments,
                overall_grade,
                total_distance,
                avg_operating_temperature,
                last_data_timestamp
            FROM client_battery_summary
            WHERE overall_grade = $1
            ORDER BY avg_total_score DESC
            LIMIT $2 OFFSET $3
        """, grade, limit, offset)
        
        # 데이터 포맷팅
        vehicle_list = []
        for row in vehicles:
            model_name = row['car_type'] or '알 수 없음'
            if row['model_year']:
                model_name += f" ({row['model_year']})"
            
            total_segments = row['total_segments']
            excellent_ratio = (row['excellent_segments'] / total_segments * 100) if total_segments > 0 else 0
            average_ratio = (row['average_segments'] / total_segments * 100) if total_segments > 0 else 0
            poor_ratio = (row['poor_segments'] / total_segments * 100) if total_segments > 0 else 0
            
            vehicle_list.append({
                "clientid": row['clientid'],
                "car_type": row['car_type'] or '알 수 없음',
                "model_name": model_name,
                "model_year": row['model_year'] or 0,
                "performance_score": round(row['avg_total_score'] or 0, 1),
                "overall_grade": row['overall_grade'],
                "total_segments": row['total_segments'],
                "excellent_segments": row['excellent_segments'],
                "average_segments": row['average_segments'],
                "poor_segments": row['poor_segments'],
                "excellent_ratio": round(excellent_ratio, 1),
                "average_ratio": round(average_ratio, 1),
                "poor_ratio": round(poor_ratio, 1),
                "total_distance": round(row['total_distance'] or 0, 1),
                "avg_operating_temperature": round(row['avg_operating_temperature'] or 0, 1),
                "last_data_timestamp": row['last_data_timestamp'],
                "cell_balance_score": round(row['avg_cell_balance_score'] or 0, 1),
                "soc_stability_score": round(row['avg_soc_stability_score'] or 0, 1),
                "thermal_performance_score": round(row['avg_thermal_performance_score'] or 0, 1),
                "efficiency_score": round(row['avg_efficiency_score'] or 0, 1)
            })
        
        return {
            "grade": grade,
            "data": vehicle_list,
            "pagination": {
                "total_count": total_count,
                "current_offset": offset,
                "current_limit": limit,
                "has_more": offset + limit < total_count,
                "next_offset": offset + limit if offset + limit < total_count else None
            }
        }
    except Exception as e:
        return {
            "error": f"{grade} 등급 차량 조회 중 오류가 발생했습니다: {str(e)}"
        }
