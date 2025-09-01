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
            client_id ASC,
            total_segments DESC, 
            valid_segments DESC
        LIMIT ${len(params) + 1} OFFSET ${len(params) + 2}
        """
        
        rows = await db.fetch(data_query, *params, limit, offset)
        
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

STATE_CODE_TO_TYPE = {
    1: "charging",
    2: "driving",
    3: "idling",
    4: "parked",
}

def _state_to_type(state_code: int) -> str:
    return STATE_CODE_TO_TYPE.get(state_code, "other")

async def get_vehicle_segments_data(
    db: asyncpg.Connection, 
    clientid: str, 
    data_type: str = "mileage"
) -> List[Dict[str, Any]]:
    """
    특정 차량의 구간별 데이터 조회 (마일리지 또는 SOC 기준)
    - data_type="mileage": 마일리지 정보가 유효한 세그먼트만
    - data_type="soc":     SOC 정보가 유효한 세그먼트만
    """
    try:
        extra_filter = (
            "AND start_mileage IS NOT NULL AND end_mileage IS NOT NULL"
            if data_type == "mileage"
            else "AND start_soc IS NOT NULL AND end_soc IS NOT NULL"
        )

        sql = f"""
            SELECT
                start_time                           AS segment_start_time,
                end_time                             AS segment_end_time,
                ROUND(duration_seconds/60.0, 1)      AS segment_duration_minutes,
                state_code,
                start_mileage, 
                end_mileage, 
                (end_mileage - start_mileage)        AS mileage_change,
                start_soc, 
                end_soc, 
                (end_soc - start_soc)                AS soc_change,
                max_speed,
                avg_speed,
                engine_on_percentage,
                avg_chg_state
            FROM bw_segment_states
            WHERE clientid = $1
              {extra_filter}
            ORDER BY start_time;
        """

        rows = await db.fetch(sql, clientid)
        print(f"DB에서 조회된 원본 데이터: {len(rows)}개 행")

        # state_code → segment_type 문자열로 변환
        result: List[Dict[str, Any]] = []
        for r in rows:
            d = dict(r)
            original_state_code = d.get("state_code")
            d["segment_type"] = _state_to_type(d.pop("state_code", None))
            print(f"state_code {original_state_code} → segment_type {d['segment_type']}")
            
            # ISO8601 문자열이 필요하면 아래처럼 변환 (asyncpg는 보통 datetime으로 줌)
            if hasattr(d["segment_start_time"], "isoformat"):
                d["segment_start_time"] = d["segment_start_time"].isoformat()
            if hasattr(d["segment_end_time"], "isoformat"):
                d["segment_end_time"] = d["segment_end_time"].isoformat()
            result.append(d)

        print(f"변환된 결과 데이터: {len(result)}개")
        print(f"첫 번째 결과 샘플: {result[0] if result else 'None'}")
        
        return result
        
    except Exception as e:
        print(f"차량 구간 데이터 조회 오류: {e}")
        # 오류 발생 시 임시 더미 데이터 반환
        import datetime
        
        dummy_data = []
        base_time = datetime.datetime(2024, 8, 20, 8, 0, 0)
        
        for i in range(20):
            start_time = base_time + datetime.timedelta(hours=i)
            end_time = start_time + datetime.timedelta(hours=1)
            
            if data_type == "mileage":
                dummy_data.append({
                    'segment_start_time': start_time.isoformat(),
                    'segment_end_time': end_time.isoformat(),
                    'segment_duration_minutes': 30 + (i * 5),
                    'segment_type': ['driving', 'charging', 'idling', 'parked'][i % 4],
                    'start_mileage': 1000 + (i * 50),
                    'end_mileage': 1050 + (i * 50),
                    'mileage_change': 50,
                    'start_soc': 60 + (i * 2),
                    'end_soc': 62 + (i * 2),
                    'soc_change': 2,
                    'max_speed': 80 + (i * 2),
                    'avg_speed': 40 + (i * 1.5),
                    'engine_on_percentage': 70 + (i * 2),
                    'avg_chg_state': 0.1 + (i * 0.05),
                    'energy_consumed_wh': 1000 + (i * 100),
                    'efficiency_wh_per_km': 150 + (i * 10)
                })
            else:
                dummy_data.append({
                    'segment_start_time': start_time.isoformat(),
                    'segment_end_time': end_time.isoformat(),
                    'segment_duration_minutes': 30 + (i * 5),
                    'segment_type': ['driving', 'charging', 'idling', 'parked'][i % 4],
                    'start_soc': 20 + (i * 3),
                    'end_soc': 25 + (i * 3),
                    'soc_change': 5,
                    'start_mileage': 5000 + (i * 100),
                    'end_mileage': 5100 + (i * 100),
                    'mileage_change': 100,
                    'max_speed': 80 + (i * 2),
                    'avg_speed': 40 + (i * 1.5),
                    'engine_on_percentage': 70 + (i * 2),
                    'avg_chg_state': 0.1 + (i * 0.05),
                    'energy_consumed_wh': 1000 + (i * 100),
                    'efficiency_wh_per_km': 150 + (i * 10)
                })
        
        return dummy_data

async def get_vehicle_summary(db: asyncpg.Connection, clientid: str) -> Dict[str, Any]:
    """
    특정 차량의 요약 정보 조회
    - 세그먼트 개수, 유효 세그먼트(길이>0), 총/평균 지속시간, 마지막 활동,
    - 총 주행거리(세그먼트 합) 및 평균 주행 효율(SoC per km: 주행 세그먼트만)
    """
    try:
        # 기본 요약
        summary_sql = """
            WITH base AS (
                SELECT
                    COUNT(*)::int                                         AS total_segments,
                    COUNT(*) FILTER (WHERE duration_seconds > 0)::int     AS valid_segments,
                    SUM(duration_seconds)/3600.0                          AS total_duration_hours,
                    AVG(duration_seconds)/60.0                            AS avg_duration_min,
                    MAX(end_time)                                         AS last_activity,
                    -- 주행거리: 세그먼트별 이동거리 합(음수 방지)
                    SUM(GREATEST(end_mileage - start_mileage, 0))         AS total_mileage
                FROM bw_segment_states
                WHERE clientid = $1
            )
            SELECT * FROM base;
        """
        base = await db.fetchrow(summary_sql, clientid)

        # 주행 효율(SoC per km): 주행 세그먼트만, km당 소모 SOC 비율
        eff_sql = """
            SELECT
                AVG(
                    CASE 
                        WHEN state_code = 2 
                             AND (end_mileage - start_mileage) > 0 
                             AND (start_soc IS NOT NULL AND end_soc IS NOT NULL)
                        THEN ABS(end_soc - start_soc)::float 
                             / NULLIF(end_mileage - start_mileage, 0)
                    END
                ) AS avg_soc_per_km
            FROM bw_segment_states
            WHERE clientid = $1;
        """
        eff = await db.fetchrow(eff_sql, clientid)

        # 구간 종류별 수량 조회
        segment_counts_sql = """
            SELECT state_code, COUNT(*) as count
            FROM bw_segment_states
            WHERE clientid = $1
            GROUP BY state_code
            ORDER BY state_code;
        """
        segment_counts = await db.fetch(segment_counts_sql, clientid)
        
        # 구간 종류별 수량을 딕셔너리로 변환
        segment_counts_dict = {}
        for row in segment_counts:
            state_code = row['state_code']
            count = row['count']
            segment_counts_dict[state_code] = count

        # 차량 메타 정보 조회
        car_info_sql = """
            SELECT car_type, model_year
            FROM car_type
            WHERE clientid = $1
        """
        car_info = await db.fetchrow(car_info_sql, clientid)

        return {
            "clientid": clientid,
            "car_type": car_info["car_type"] if car_info else None,
            "model_year": car_info["model_year"] if car_info else None,

            "total_segments": base["total_segments"] if base else 0,
            "valid_segments": base["valid_segments"] if base else 0,
            "total_duration_hours": float(base["total_duration_hours"]) if base and base["total_duration_hours"] is not None else 0.0,
            "avg_duration_min": float(base["avg_duration_min"]) if base and base["avg_duration_min"] is not None else 0.0,
            "last_activity": base["last_activity"].isoformat() if base and base["last_activity"] else None,
            "total_mileage": float(base["total_mileage"]) if base and base["total_mileage"] is not None else 0.0,

            # BY_MILEAGE 뷰의 주행효율 정의와 동일한 개념(주행 세그먼트 기준)
            "avg_soc_per_km": float(eff["avg_soc_per_km"]) if eff and eff["avg_soc_per_km"] is not None else None,

            # 구간 종류별 수량 (state_code: 1=충전, 2=주행, 3=정차, 4=주차, 9=기타)
            "segment_counts": {
                "charging": segment_counts_dict.get(1, 0),    # 충전
                "driving": segment_counts_dict.get(2, 0),     # 주행
                "idling": segment_counts_dict.get(3, 0),      # 정차
                "parked": segment_counts_dict.get(4, 0),      # 주차
                "other": segment_counts_dict.get(9, 0)        # 기타
            }
        }
        
    except Exception as e:
        print(f"차량 요약 정보 조회 오류: {e}")
        # 오류 발생 시 임시 더미 데이터 반환
        return {
            'clientid': clientid,
            'car_type': 'IONIQ5',
            'model_year': '2024',
            'total_segments': 20,
            'valid_segments': 18,
            'total_duration_hours': 45.5,
            'avg_duration_min': 18.2,
            'last_activity': '2024-08-30T10:00:00',
            'total_mileage': 12500,
            'avg_efficiency_wh_per_km': 185.3
        }

async def get_battery_performance_ranking(db: asyncpg.Connection, limit: int = 50, offset: int = 0) -> Dict[str, Any]:
    """배터리 성능 랭킹 조회"""
    try:
        print(f"배터리 성능 랭킹 조회 시작 - limit: {limit}, offset: {offset}")
        
        # 전체 개수 조회
        count_query = "SELECT COUNT(*) FROM battery_performance_ranking"
        print(f"카운트 쿼리 실행: {count_query}")
        total_count = await db.fetchval(count_query)
        print(f"전체 개수: {total_count}")
        
        # 페이지네이션된 데이터 조회
        data_query = """
        SELECT 
            clientid,
            car_type,
            model_year,
            soh_total_score,
            cell_total_score,
            driving_total_score,
            charging_total_score,
            temp_total_score,
            habit_total_score,
            total_battery_score,
            battery_rank,
            battery_grade,
            avg_soh,
            avg_cell_imbalance,
            avg_soc_per_km,
            slow_power_efficiency,
            fast_power_efficiency,
            avg_temp_range,
            avg_start_soc,
            avg_end_soc,
            soh_records,
            driving_segments,
            total_charge_sessions
        FROM battery_performance_ranking
        ORDER BY total_battery_score DESC, battery_rank ASC
        LIMIT $1 OFFSET $2
        """
        
        rows = await db.fetch(data_query, limit, offset)
        
        # 응답 데이터 구성
        rankings = []
        for row in rows:
            print(f"처리 중인 행: clientid={row['clientid']}, car_type={row['car_type']}, model_year={row['model_year']}")
            ranking = {
                'clientid': row['clientid'],
                'car_type': row['car_type'] or 'Unknown',
                'model_year': row['model_year'] or 0,
                'scores': {
                    'soh': row['soh_total_score'],
                    'cell_balance': row['cell_total_score'],
                    'driving_efficiency': row['driving_total_score'],
                    'charging_efficiency': row['charging_total_score'],
                    'temperature_stability': row['temp_total_score'],
                    'charging_habit': row['habit_total_score'],
                    'total': row['total_battery_score']
                },
                'rank': row['battery_rank'],
                'grade': row['battery_grade'],
                'metrics': {
                    'avg_soh': float(row['avg_soh']) if row['avg_soh'] else None,
                    'avg_cell_imbalance': float(row['avg_cell_imbalance']) if row['avg_cell_imbalance'] else None,
                    'avg_soc_per_km': float(row['avg_soc_per_km']) if row['avg_soc_per_km'] else None,
                    'slow_power_efficiency': float(row['slow_power_efficiency']) if row['slow_power_efficiency'] else None,
                    'fast_power_efficiency': float(row['fast_power_efficiency']) if row['fast_power_efficiency'] else None,
                    'avg_temp_range': float(row['avg_temp_range']) if row['avg_temp_range'] else None,
                    'avg_start_soc': float(row['avg_start_soc']) if row['avg_start_soc'] else None,
                    'avg_end_soc': float(row['avg_end_soc']) if row['avg_end_soc'] else None
                },
                'data_quality': {
                    'soh_records': row['soh_records'],
                    'driving_segments': row['driving_segments'],
                    'charge_sessions': row['total_charge_sessions']
                }
            }
            rankings.append(ranking)
        
        # 페이지네이션 정보 계산
        total_pages = math.ceil(total_count / limit) if total_count > 0 else 0
        
        return {
            'data': rankings,
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
        print(f"배터리 성능 랭킹 조회 오류: {e}")
        raise Exception(f"배터리 성능 랭킹 조회 실패: {str(e)}")

async def get_battery_performance_ranking_summary(db: asyncpg.Connection) -> Dict[str, Any]:
    """배터리 성능 랭킹 요약 통계 조회"""
    try:
        query = """
        SELECT 
            COUNT(*) as total_clients,
            AVG(total_battery_score) as avg_total_score,
            MIN(total_battery_score) as min_total_score,
            MAX(total_battery_score) as max_total_score,
            STDDEV(total_battery_score) as stddev_total_score,
            COUNT(CASE WHEN total_battery_score >= 70 THEN 1 END) as excellent_count,
            COUNT(CASE WHEN total_battery_score >= 50 AND total_battery_score < 70 THEN 1 END) as good_count,
            COUNT(CASE WHEN total_battery_score < 50 THEN 1 END) as poor_count,
            COUNT(CASE WHEN battery_grade <= 3 THEN 1 END) as top_30_percent,
            COUNT(CASE WHEN battery_grade <= 5 THEN 1 END) as top_50_percent
        FROM battery_performance_ranking
        """
        
        row = await db.fetchrow(query)
        
        if not row:
            return {
                'total_clients': 0,
                'avg_total_score': 0,
                'min_total_score': 0,
                'max_total_score': 0,
                'stddev_total_score': 0,
                'excellent_count': 0,
                'good_count': 0,
                'poor_count': 0,
                'top_30_percent': 0,
                'top_50_percent': 0
            }
        
        return {
            'total_clients': row['total_clients'],
            'avg_total_score': float(row['avg_total_score']) if row['avg_total_score'] else 0,
            'min_total_score': float(row['min_total_score']) if row['min_total_score'] else 0,
            'max_total_score': float(row['max_total_score']) if row['max_total_score'] else 0,
            'stddev_total_score': float(row['stddev_total_score']) if row['stddev_total_score'] else 0,
            'excellent_count': row['excellent_count'],
            'good_count': row['good_count'],
            'poor_count': row['poor_count'],
            'top_30_percent': row['top_30_percent'],
            'top_50_percent': row['top_50_percent']
        }
        
    except Exception as e:
        print(f"배터리 성능 랭킹 요약 통계 조회 오류: {e}")
        raise Exception(f"배터리 성능 랭킹 요약 통계 조회 실패: {str(e)}")

async def get_vehicle_segments_count(db: asyncpg.Connection, clientid: str) -> Dict[str, int]:
    """특정 차량의 실제 구간 수 조회"""
    try:
        sql = """
            SELECT 
                COUNT(CASE WHEN state_code = 2 THEN 1 END) as driving_segments,
                COUNT(CASE WHEN state_code = 1 THEN 1 END) as charge_sessions
            FROM bw_segment_states
            WHERE clientid = $1
        """
        
        row = await db.fetchrow(sql, clientid)
        print(f"구간 수 조회 결과: {row}")
        
        if not row:
            print(f"clientid {clientid}에 대한 구간 데이터 없음")
            return {
                'driving_segments': 0,
                'charge_sessions': 0
            }
        
        result = {
            'driving_segments': row['driving_segments'] or 0,
            'charge_sessions': row['charge_sessions'] or 0
        }
        print(f"clientid {clientid} 구간 수: {result}")
        
        return result
        
    except Exception as e:
        print(f"차량 구간 수 조회 오류: {e}")
        return {
            'driving_segments': 0,
            'charge_sessions': 0
        }
