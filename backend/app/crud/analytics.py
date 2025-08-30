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

# 배터리 성능 관련 함수들
async def get_battery_performance_by_mileage(db: asyncpg.Connection, limit: int = 50, offset: int = 0) -> Dict[str, Any]:
    """주행거리 구간별 배터리 성능 점수 조회"""
    try:
        # 전체 개수 조회
        count_query = "SELECT COUNT(*) FROM battery_performance_scores_by_mileage"
        total_count = await db.fetchval(count_query)
        
        # 페이지네이션된 데이터 조회
        data_query = """
        SELECT 
            clientid,
            mileage_segment,
            analysis_method,
            soh_score,
            cell_balance_score,
            driving_efficiency_score,
            charging_efficiency_score,
            temperature_stability_score,
            charging_habit_score,
            total_battery_score,
            avg_soh,
            avg_cell_imbalance,
            avg_soc_per_km,
            slow_charge_efficiency,
            fast_charge_efficiency,
            avg_temp_range,
            avg_start_soc,
            avg_end_soc,
            records_by_mileage,
            segments_by_mileage
        FROM battery_performance_scores_by_mileage
        ORDER BY total_battery_score DESC, clientid ASC
        LIMIT $1 OFFSET $2
        """
        
        rows = await db.fetch(data_query, limit, offset)
        
        # 응답 데이터 구성
        performances = []
        for row in rows:
            performance = {
                'clientid': row['clientid'],
                'mileage_segment': row['mileage_segment'],
                'analysis_method': row['analysis_method'],
                'scores': {
                    'soh': row['soh_score'],
                    'cell_balance': row['cell_balance_score'],
                    'driving_efficiency': row['driving_efficiency_score'],
                    'charging_efficiency': row['charging_efficiency_score'],
                    'temperature_stability': row['temperature_stability_score'],
                    'charging_habit': row['charging_habit_score'],
                    'total': row['total_battery_score']
                },
                'metrics': {
                    'avg_soh': float(row['avg_soh']) if row['avg_soh'] else 0,
                    'avg_cell_imbalance': float(row['avg_cell_imbalance']) if row['avg_cell_imbalance'] else 0,
                    'avg_soc_per_km': float(row['avg_soc_per_km']) if row['avg_soc_per_km'] else 0,
                    'slow_charge_efficiency': float(row['slow_charge_efficiency']) if row['slow_charge_efficiency'] else 0,
                    'fast_charge_efficiency': float(row['fast_charge_efficiency']) if row['fast_charge_efficiency'] else 0,
                    'avg_temp_range': float(row['avg_temp_range']) if row['avg_temp_range'] else 0,
                    'avg_start_soc': float(row['avg_start_soc']) if row['avg_start_soc'] else 0,
                    'avg_end_soc': float(row['avg_end_soc']) if row['avg_end_soc'] else 0
                },
                'data_quality': {
                    'records': row['records_by_mileage'],
                    'segments': row['segments_by_mileage']
                }
            }
            performances.append(performance)
        
        # 페이지네이션 정보 계산
        total_pages = math.ceil(total_count / limit) if total_count > 0 else 0
        
        return {
            'data': performances,
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
        print(f"배터리 성능 점수 조회 오류: {e}")
        raise Exception(f"배터리 성능 점수 조회 실패: {str(e)}")

async def get_battery_performance_summary(db: asyncpg.Connection) -> Dict[str, Any]:
    """배터리 성능 요약 통계 조회"""
    try:
        query = """
        SELECT 
            COUNT(DISTINCT clientid) as total_clients,
            COUNT(*) as total_records,
            ROUND(AVG(total_battery_score), 2) as avg_total_score,
            ROUND(MIN(total_battery_score), 2) as min_total_score,
            ROUND(MAX(total_battery_score), 2) as max_total_score,
            ROUND(STDDEV(total_battery_score), 2) as stddev_total_score,
            COUNT(CASE WHEN total_battery_score >= 80 THEN 1 END) as excellent_count,
            COUNT(CASE WHEN total_battery_score >= 60 AND total_battery_score < 80 THEN 1 END) as good_count,
            COUNT(CASE WHEN total_battery_score < 60 THEN 1 END) as poor_count
        FROM battery_performance_scores_by_mileage
        """
        
        row = await db.fetchrow(query)
        if row:
            return {
                'total_clients': row['total_clients'],
                'total_records': row['total_records'],
                'score_stats': {
                    'average': float(row['avg_total_score']) if row['avg_total_score'] else 0,
                    'minimum': float(row['min_total_score']) if row['min_total_score'] else 0,
                    'maximum': float(row['max_total_score']) if row['max_total_score'] else 0,
                    'standard_deviation': float(row['stddev_total_score']) if row['stddev_total_score'] else 0
                },
                'grade_distribution': {
                    'excellent': row['excellent_count'],
                    'good': row['good_count'],
                    'poor': row['poor_count']
                }
            }
        else:
            return {
                'total_clients': 0,
                'total_records': 0,
                'score_stats': {'average': 0, 'minimum': 0, 'maximum': 0, 'standard_deviation': 0},
                'grade_distribution': {'excellent': 0, 'good': 0, 'poor': 0}
            }
            
    except Exception as e:
        print(f"배터리 성능 요약 조회 오류: {e}")
        return {
            'total_clients': 0,
            'total_records': 0,
            'score_stats': {'average': 0, 'minimum': 0, 'maximum': 0, 'standard_deviation': 0},
            'grade_distribution': {'excellent': 0, 'good': 0, 'poor': 0}
        }

async def get_available_mileage_segments(db: asyncpg.Connection) -> List[str]:
    """사용 가능한 주행거리 구간 목록 조회"""
    try:
        query = """
        SELECT DISTINCT mileage_segment 
        FROM battery_performance_scores_by_mileage 
        ORDER BY 
            CASE mileage_segment
                WHEN '0-5K' THEN 1
                WHEN '5K-10K' THEN 2
                WHEN '10K-15K' THEN 3
                WHEN '15K-20K' THEN 4
                WHEN '20K-30K' THEN 5
                WHEN '30K-50K' THEN 6
                WHEN '50K+' THEN 7
                ELSE 8
            END
        """
        rows = await db.fetch(query)
        return ["전체"] + [row['mileage_segment'] for row in rows]
        
    except Exception as e:
        print(f"주행거리 구간 조회 오류: {e}")
        return ["전체"]

async def get_battery_performance_latest(db: asyncpg.Connection, limit: int = 50, offset: int = 0) -> Dict[str, Any]:
    """최근 3개월 배터리 성능 점수 조회"""
    try:
        # 전체 개수 조회
        count_query = "SELECT COUNT(*) FROM battery_performance_scores_latest"
        total_count = await db.fetchval(count_query)
        
        # 페이지네이션된 데이터 조회
        data_query = """
        SELECT 
            clientid,
            analysis_method,
            soh_score,
            cell_balance_score,
            driving_efficiency_score,
            charging_efficiency_score,
            temperature_stability_score,
            charging_habit_score,
            total_battery_score,
            avg_soh_recent,
            avg_cell_imbalance_recent,
            avg_soc_per_km_recent,
            slow_charge_efficiency_recent,
            fast_charge_efficiency_recent,
            avg_temp_range_recent,
            avg_start_soc_recent,
            avg_end_soc_recent,
            window_days_recent,
            basic_records_recent,
            soh_records_recent,
            driving_segments_recent,
            charging_segments_recent,
            slow_charge_count_recent,
            fast_charge_count_recent,
            soh_available,
            cell_available,
            driving_available,
            charging_available,
            temp_available,
            habit_available,
            coverage_grade
        FROM battery_performance_scores_latest
        ORDER BY total_battery_score DESC, clientid ASC
        LIMIT $1 OFFSET $2
        """
        
        rows = await db.fetch(data_query, limit, offset)
        
        # 응답 데이터 구성
        performances = []
        for row in rows:
            performance = {
                'clientid': row['clientid'],
                'analysis_method': row['analysis_method'],
                'scores': {
                    'soh': row['soh_score'],
                    'cell_balance': row['cell_balance_score'],
                    'driving_efficiency': row['driving_efficiency_score'],
                    'charging_efficiency': row['charging_efficiency_score'],
                    'temperature_stability': row['temperature_stability_score'],
                    'charging_habit': row['charging_habit_score'],
                    'total': row['total_battery_score']
                },
                'metrics': {
                    'avg_soh': float(row['avg_soh_recent']) if row['avg_soh_recent'] else 0,
                    'avg_cell_imbalance': float(row['avg_cell_imbalance_recent']) if row['avg_cell_imbalance_recent'] else 0,
                    'avg_soc_per_km': float(row['avg_soc_per_km_recent']) if row['avg_soc_per_km_recent'] else 0,
                    'slow_charge_efficiency': float(row['slow_charge_efficiency_recent']) if row['slow_charge_efficiency_recent'] else 0,
                    'fast_charge_efficiency': float(row['fast_charge_efficiency_recent']) if row['fast_charge_efficiency_recent'] else 0,
                    'avg_temp_range': float(row['avg_temp_range_recent']) if row['avg_temp_range_recent'] else 0,
                    'avg_start_soc': float(row['avg_start_soc_recent']) if row['avg_start_soc_recent'] else 0,
                    'avg_end_soc': float(row['avg_end_soc_recent']) if row['avg_end_soc_recent'] else 0
                },
                'data_quality': {
                    'window_days': row['window_days_recent'],
                    'basic_records': row['basic_records_recent'],
                    'soh_records': row['soh_records_recent'],
                    'driving_segments': row['driving_segments_recent'],
                    'charging_segments': row['charging_segments_recent'],
                    'slow_charge_count': row['slow_charge_count_recent'],
                    'fast_charge_count': row['fast_charge_count_recent']
                },
                'availability': {
                    'soh': row['soh_available'],
                    'cell': row['cell_available'],
                    'driving': row['driving_available'],
                    'charging': row['charging_available'],
                    'temp': row['temp_available'],
                    'habit': row['habit_available']
                },
                'coverage_grade': row['coverage_grade']
            }
            performances.append(performance)
        
        # 페이지네이션 정보 계산
        total_pages = math.ceil(total_count / limit) if total_count > 0 else 0
        
        return {
            'data': performances,
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
        print(f"최근 3개월 배터리 성능 점수 조회 오류: {e}")
        raise Exception(f"최근 3개월 배터리 성능 점수 조회 실패: {str(e)}")

async def get_latest_performance_summary(db: asyncpg.Connection) -> Dict[str, Any]:
    """최근 3개월 배터리 성능 요약 통계 조회"""
    try:
        query = """
        SELECT 
            COUNT(DISTINCT clientid) as total_clients,
            COUNT(*) as total_records,
            ROUND(AVG(total_battery_score), 2) as avg_total_score,
            ROUND(MIN(total_battery_score), 2) as min_total_score,
            ROUND(MAX(total_battery_score), 2) as max_total_score,
            ROUND(STDDEV(total_battery_score), 2) as stddev_total_score,
            COUNT(CASE WHEN total_battery_score >= 80 THEN 1 END) as excellent_count,
            COUNT(CASE WHEN total_battery_score >= 60 AND total_battery_score < 80 THEN 1 END) as good_count,
            COUNT(CASE WHEN total_battery_score < 60 THEN 1 END) as poor_count,
            COUNT(CASE WHEN coverage_grade = 'High' THEN 1 END) as high_coverage_count,
            COUNT(CASE WHEN coverage_grade = 'Medium' THEN 1 END) as medium_coverage_count,
            COUNT(CASE WHEN coverage_grade = 'Low' THEN 1 END) as low_coverage_count
        FROM battery_performance_scores_latest
        """
        
        row = await db.fetchrow(query)
        if row:
            return {
                'total_clients': row['total_clients'],
                'total_records': row['total_records'],
                'score_stats': {
                    'average': float(row['avg_total_score']) if row['avg_total_score'] else 0,
                    'minimum': float(row['min_total_score']) if row['min_total_score'] else 0,
                    'maximum': float(row['max_total_score']) if row['max_total_score'] else 0,
                    'standard_deviation': float(row['stddev_total_score']) if row['stddev_total_score'] else 0
                },
                'grade_distribution': {
                    'excellent': row['excellent_count'],
                    'good': row['good_count'],
                    'poor': row['poor_count']
                },
                'coverage_distribution': {
                    'high': row['high_coverage_count'],
                    'medium': row['medium_coverage_count'],
                    'low': row['low_coverage_count']
                }
            }
        else:
            return {
                'total_clients': 0,
                'total_records': 0,
                'score_stats': {'average': 0, 'minimum': 0, 'maximum': 0, 'standard_deviation': 0},
                'grade_distribution': {'excellent': 0, 'good': 0, 'poor': 0},
                'coverage_distribution': {'high': 0, 'medium': 0, 'low': 0}
            }
            
    except Exception as e:
        print(f"최근 3개월 성능 요약 조회 오류: {e}")
        return {
            'total_clients': 0,
            'total_records': 0,
            'score_stats': {'average': 0, 'minimum': 0, 'maximum': 0, 'standard_deviation': 0},
            'grade_distribution': {'excellent': 0, 'good': 0, 'poor': 0},
            'coverage_distribution': {'high': 0, 'medium': 0, 'low': 0}
        }

async def get_battery_performance_rankings(db: asyncpg.Connection, limit: int = 50, offset: int = 0) -> Dict[str, Any]:
    """배터리 성능 랭킹 조회"""
    try:
        # 전체 개수 조회
        count_query = "SELECT COUNT(*) FROM battery_performance_rankings"
        total_count = await db.fetchval(count_query)
        
        # 페이지네이션된 데이터 조회
        data_query = """
        SELECT 
            clientid,
            score_latest,
            rank_latest,
            decile_latest,
            best_mileage_segment,
            best_mileage_score,
            best_mileage_rank,
            best_mileage_decile
        FROM battery_performance_rankings
        ORDER BY score_latest DESC, rank_latest ASC
        LIMIT $1 OFFSET $2
        """
        
        rows = await db.fetch(data_query, limit, offset)
        
        # 응답 데이터 구성
        rankings = []
        for row in rows:
            ranking = {
                'clientid': row['clientid'],
                'latest_score': row['score_latest'],
                'latest_rank': row['rank_latest'],
                'latest_decile': row['decile_latest'],
                'best_mileage_segment': row['best_mileage_segment'],
                'best_mileage_score': row['best_mileage_score'],
                'best_mileage_rank': row['best_mileage_rank'],
                'best_mileage_decile': row['best_mileage_decile']
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

async def get_battery_performance_comparison(db: asyncpg.Connection, clientid: str) -> Dict[str, Any]:
    """특정 클라이언트의 배터리 성능 비교 데이터 조회"""
    try:
        query = """
        SELECT 
            clientid,
            method,
            mileage_segment,
            soh_score,
            cell_balance_score,
            driving_efficiency_score,
            charging_efficiency_score,
            temperature_stability_score,
            charging_habit_score,
            total_battery_score,
            avg_soh,
            avg_cell_imbalance,
            avg_soc_per_km,
            slow_charge_efficiency,
            fast_charge_efficiency,
            avg_temp_range,
            data_records,
            slow_charge_count_recent,
            fast_charge_count_recent,
            coverage_grade,
            window_days_recent,
            basic_records_recent
        FROM battery_performance_comparison
        WHERE clientid = $1
        ORDER BY method, mileage_segment
        """
        
        rows = await db.fetch(query, clientid)
        
        # 응답 데이터 구성
        comparisons = []
        for row in rows:
            comparison = {
                'method': row['method'],
                'mileage_segment': row['mileage_segment'],
                'scores': {
                    'soh': row['soh_score'],
                    'cell_balance': row['cell_balance_score'],
                    'driving_efficiency': row['driving_efficiency_score'],
                    'charging_efficiency': row['charging_efficiency_score'],
                    'temperature_stability': row['temperature_stability_score'],
                    'charging_habit': row['charging_habit_score'],
                    'total': row['total_battery_score']
                },
                'metrics': {
                    'avg_soh': float(row['avg_soh']) if row['avg_soh'] else 0,
                    'avg_cell_imbalance': float(row['avg_cell_imbalance']) if row['avg_cell_imbalance'] else 0,
                    'avg_soc_per_km': float(row['avg_soc_per_km']) if row['avg_soc_per_km'] else 0,
                    'slow_charge_efficiency': float(row['slow_charge_efficiency']) if row['slow_charge_efficiency'] else 0,
                    'fast_charge_efficiency': float(row['fast_charge_efficiency']) if row['fast_charge_efficiency'] else 0,
                    'avg_temp_range': float(row['avg_temp_range']) if row['avg_temp_range'] else 0
                },
                'data_quality': {
                    'records': row['data_records'],
                    'slow_charge_count': row['slow_charge_count_recent'],
                    'fast_charge_count': row['fast_charge_count_recent'],
                    'coverage_grade': row['coverage_grade'],
                    'window_days': row['window_days_recent'],
                    'basic_records': row['basic_records_recent']
                }
            }
            comparisons.append(comparison)
        
        return {
            'clientid': clientid,
            'comparisons': comparisons
        }
        
    except Exception as e:
        print(f"배터리 성능 비교 조회 오류: {e}")
        raise Exception(f"배터리 성능 비교 조회 실패: {str(e)}")
