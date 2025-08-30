import asyncpg
from typing import Dict, Any, List, Optional
import math

async def get_bw_dashboard_data(db: asyncpg.Connection) -> Dict[str, Any]:
    """BW 대시보드 데이터 조회 - bw_dashboard 뷰 사용"""
    try:
        query = """
        SELECT 
            total_data_rows,
            total_unique_clients,
            unique_car_types,
            data_start_date,
            data_end_date,
            collection_days,
            total_all_segments,
            clients_with_any_segments,
            total_valid_segments,
            clients_with_valid_segments,
            invalid_segments,
            valid_segment_percentage,
            charging_count,
            charging_percentage,
            charging_avg_min,
            driving_count,
            driving_percentage,
            driving_avg_min,
            idling_count,
            idling_percentage,
            idling_avg_min,
            parked_count,
            parked_percentage,
            parked_avg_min,
            unclassified_count,
            unclassified_percentage,
            unclassified_avg_min
        FROM bw_dashboard
        LIMIT 1
        """
        
        row = await db.fetchrow(query)
        if row:
            return dict(row)
        else:
            raise Exception("bw_dashboard materialized view에서 데이터를 찾을 수 없습니다.")
            
    except Exception as e:
        print(f"BW Dashboard 데이터 조회 오류: {e}")
        raise Exception(f"BW Dashboard 데이터 조회 실패: {str(e)}")

async def get_client_vehicles_info(db: asyncpg.Connection, car_type: Optional[str] = None, limit: int = 15, offset: int = 0) -> Dict[str, Any]:
    """Client ID별 차량 정보 조회 - bw_vehicle_status 뷰 사용"""
    try:
        # 차종 필터링
        where_clause = ""
        params = []
        
        # 차종 필터링
        if car_type and car_type != "전체":
            where_clause = "WHERE car_type = $1"
            params.append(car_type)
        
        # 전체 개수 조회
        count_query = f"SELECT COUNT(*) FROM bw_vehicle_status {where_clause}"
        total_count = await db.fetchval(count_query, *params)
        
        # 페이지네이션된 데이터 조회
        data_query = f"""
        SELECT 
            client_id,
            car_type,
            model_year_month,
            total_segments,
            valid_segments,
            valid_segment_ratio,
            total_activity_time,
            avg_segment_time,
            last_activity,
            total_activity_seconds,
            avg_segment_duration_seconds
        FROM bw_vehicle_status
        {where_clause}
        ORDER BY 
            CASE 
                WHEN model_year_month = 'Unknown' THEN 1
                ELSE 0
            END,
            model_year_month DESC,
            total_segments DESC, 
            valid_segments DESC
        LIMIT ${len(params) + 1} OFFSET ${len(params) + 2}
        """
        
        # 디버깅용 로그
        print(f"DEBUG - Count query: {count_query}")
        print(f"DEBUG - Data query: {data_query}")
        print(f"DEBUG - Params: {params}")
        print(f"DEBUG - Limit: {limit}, Offset: {offset}")
        
        rows = await db.fetch(data_query, *params, limit, offset)
        print(f"DEBUG - Rows fetched: {len(rows)}")
        if rows:
            print(f"DEBUG - First row sample: {dict(rows[0])}")
        
        # 응답 데이터 구성
        vehicles = []
        for row in rows:
            # total_activity_seconds를 시간 단위로 변환
            total_hours = float(row['total_activity_seconds']) / 3600 if row['total_activity_seconds'] else 0
            avg_minutes = float(row['avg_segment_duration_seconds']) / 60 if row['avg_segment_duration_seconds'] else 0
            
            vehicle = {
                'clientid': row['client_id'],
                'car_type': row['car_type'],
                'model_year': row['model_year_month'],
                'total_segments': row['total_segments'],
                'valid_segments': row['valid_segments'],
                'valid_segment_ratio': float(row['valid_segment_ratio']),
                'last_activity': row['last_activity'],
                'total_duration_hours': total_hours,
                'avg_duration_min': avg_minutes
            }
            vehicles.append(vehicle)
        
        # 페이지네이션 정보 계산
        total_pages = math.ceil(total_count / limit) if total_count > 0 else 0
        
        return {
            'data': vehicles,
            'pagination': {
                'total_count': total_count,
                'current_offset': offset,
                'current_limit': limit,
                'has_more': offset + limit < total_count,
                'next_offset': offset + limit if offset + limit < total_count else None,
                'total_pages': total_pages
            }
        }
        
    except Exception as e:
        print(f"Client vehicles 조회 오류: {e}")
        raise Exception(f"Client vehicles 조회 실패: {str(e)}")

async def get_available_car_types(db: asyncpg.Connection) -> List[str]:
    """사용 가능한 차종 목록 조회"""
    try:
        query = """
        SELECT DISTINCT car_type 
        FROM bw_vehicle_status 
        WHERE car_type IS NOT NULL AND car_type != 'Unknown'
        ORDER BY car_type
        """
        rows = await db.fetch(query)
        return ["전체"] + [row['car_type'] for row in rows]
        
    except Exception as e:
        print(f"Car types 조회 오류: {e}")
        return ["전체"]

async def refresh_bw_dashboard_view(db: asyncpg.Connection) -> Dict[str, str]:
    """bw_dashboard materialized view 새로고침"""
    try:
        await db.execute("REFRESH MATERIALIZED VIEW bw_dashboard")
        return {"status": "success", "message": "bw_dashboard 뷰가 성공적으로 새로고침되었습니다."}
    except Exception as e:
        return {"status": "error", "message": f"뷰 새로고침 실패: {str(e)}"}

async def get_bw_dashboard_status(db: asyncpg.Connection) -> Dict[str, Any]:
    """bw_dashboard 뷰 상태 확인"""
    try:
        # 뷰 존재 여부 확인
        view_exists = await db.fetchval("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.views 
                WHERE table_name = 'bw_dashboard'
            )
        """)
        
        if not view_exists:
            return {
                    "status": "error",
                    "message": "bw_dashboard materialized view가 존재하지 않습니다.",
                    "view_exists": False
                }
            
        # 관련 테이블 레코드 수 확인
        bw_data_count = await db.fetchval("SELECT COUNT(*) FROM bw_data")
        bw_segments_count = await db.fetchval("SELECT COUNT(*) FROM bw_segments")
        bw_segment_states_count = await db.fetchval("SELECT COUNT(*) FROM bw_segment_states")
        car_type_count = await db.fetchval("SELECT COUNT(*) FROM car_type")
        
        return {
            "status": "success",
            "message": "bw_dashboard 뷰가 정상적으로 존재합니다.",
            "view_exists": True,
            "table_counts": {
                "bw_data": bw_data_count,
                "bw_segments": bw_segments_count,
                "bw_segment_states": bw_segment_states_count,
                "car_type": car_type_count
            }
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"상태 확인 실패: {str(e)}",
            "view_exists": False
        }
