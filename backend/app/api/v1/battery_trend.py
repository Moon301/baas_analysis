from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# 데이터베이스 연결 설정
def get_db_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        database=os.getenv("DB_NAME", "ev_analytics"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "password"),
        port=os.getenv("DB_PORT", "5432")
    )

@router.get("/car-types")
async def get_car_types():
    """사용 가능한 차량 종류 목록을 반환합니다."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # bw_esoh_monthly 뷰에 데이터가 있는 차량들의 car_type만 조회
        query = """
        SELECT DISTINCT ct.car_type
        FROM bw_esoh_monthly bem
        JOIN car_type ct ON bem.clientid = ct.clientid
        WHERE ct.car_type IS NOT NULL
        GROUP BY ct.car_type
        ORDER BY ct.car_type
        """
        
        cursor.execute(query)
        results = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return {"car_types": [dict(row) for row in results]}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"데이터베이스 오류: {str(e)}")

@router.get("/vehicles")
async def get_vehicles():
    """6개월 이상 데이터가 있고 전반적으로 감소 추세를 보이는 차량 목록을 반환합니다."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # 6개월 이상 데이터가 있고 전반적으로 감소 추세를 보이는 차량들만 조회
        query = """
        WITH base AS (
          SELECT
            b.*,
            ROW_NUMBER() OVER (PARTITION BY b.clientid ORDER BY b.month) AS month_seq,
            COUNT(*)    OVER (PARTITION BY b.clientid)                   AS n
          FROM bw_esoh_monthly b
        ),
        trend AS (
          SELECT DISTINCT
            clientid,
            n,
            REGR_SLOPE(p20_ma3, month_seq) OVER (
              PARTITION BY clientid
              ORDER BY month_seq
              ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
            ) AS slope
          FROM base
        ),
        eligible_clients AS (
          SELECT clientid
          FROM trend
          WHERE n >= 6
            AND slope < 0          -- 기울기가 음수면 전반적 감소 추세
        )
        SELECT DISTINCT e.clientid, ct.car_type
        FROM eligible_clients e
        LEFT JOIN car_type ct ON e.clientid = ct.clientid
        ORDER BY e.clientid
        """
        
        cursor.execute(query)
        results = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return {"vehicles": [dict(row) for row in results]}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"데이터베이스 오류: {str(e)}")

@router.get("/battery-trend")
async def get_battery_trend(clientid: str = Query(..., description="차량 ID")):
    """특정 차량의 배터리 성능 트렌드를 반환합니다 (6개월 이상, 감소 추세 차량만)."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # 먼저 해당 차량이 조건을 만족하는지 확인
        eligibility_query = """
        WITH base AS (
          SELECT
            b.*,
            ROW_NUMBER() OVER (PARTITION BY b.clientid ORDER BY b.month) AS month_seq,
            COUNT(*)    OVER (PARTITION BY b.clientid)                   AS n
          FROM bw_esoh_monthly b
          WHERE b.clientid = %s
        ),
        trend AS (
          SELECT DISTINCT
            clientid,
            n,
            REGR_SLOPE(p20_ma3, month_seq) OVER (
              PARTITION BY clientid
              ORDER BY month_seq
              ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
            ) AS slope
          FROM base
        )
        SELECT clientid, n, slope
        FROM trend
        WHERE n >= 6 AND slope < 0
        """
        
        cursor.execute(eligibility_query, (clientid,))
        eligibility = cursor.fetchone()
        
        if not eligibility:
            raise HTTPException(
                status_code=400, 
                detail=f"해당 차량({clientid})은 6개월 이상 데이터가 있거나 감소 추세를 보이지 않습니다."
            )
        
        # 조건을 만족하는 경우 배터리 트렌드 데이터 조회
        trend_query = """
        SELECT month, monthly_p20_esoh, p20_ma3, delta_1m, n_sessions
        FROM bw_esoh_monthly
        WHERE clientid = %s
        ORDER BY month
        """
        
        cursor.execute(trend_query, (clientid,))
        results = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return {
            "clientid": clientid,
            "data_months": eligibility['n'],
            "trend_slope": float(eligibility['slope']),
            "trend_data": [dict(row) for row in results]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"데이터베이스 오류: {str(e)}")

@router.get("/weekly-vehicles")
async def get_weekly_vehicles():
    """6주 이상 데이터가 있고 전반적으로 감소 추세를 보이는 차량 목록을 반환합니다."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # 6주 이상 데이터가 있고 전반적으로 감소 추세를 보이는 차량들만 조회
        query = """
        WITH base AS (
          SELECT
            b.*,
            ROW_NUMBER() OVER (PARTITION BY b.clientid ORDER BY b.week_start) AS week_seq,
            COUNT(*)    OVER (PARTITION BY b.clientid)                         AS n
          FROM bw_esoh_weekly b
        ),
        trend AS (
          SELECT DISTINCT
            clientid,
            n,
            REGR_SLOPE(p20_ma4, week_seq) OVER (
              PARTITION BY clientid
              ORDER BY week_seq
              ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
            ) AS slope
          FROM base
        ),
        eligible_clients AS (
          SELECT clientid
          FROM trend
          WHERE n >= 6
            AND slope < 0          -- 기울기가 음수면 전반적 감소 추세
        )
        SELECT DISTINCT e.clientid, ct.car_type
        FROM eligible_clients e
        LEFT JOIN car_type ct ON e.clientid = ct.clientid
        ORDER BY e.clientid
        """
        
        cursor.execute(query)
        results = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return {"vehicles": [dict(row) for row in results]}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"데이터베이스 오류: {str(e)}")

@router.get("/weekly-battery-trend")
async def get_weekly_battery_trend(clientid: str = Query(..., description="차량 ID")):
    """특정 차량의 주간 배터리 성능 트렌드를 반환합니다 (6주 이상, 감소 추세 차량만)."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # 먼저 해당 차량이 조건을 만족하는지 확인
        eligibility_query = """
        WITH base AS (
          SELECT
            b.*,
            ROW_NUMBER() OVER (PARTITION BY b.clientid ORDER BY b.week_start) AS week_seq,
            COUNT(*)    OVER (PARTITION BY b.clientid)                         AS n
          FROM bw_esoh_weekly b
          WHERE b.clientid = %s
        ),
        trend AS (
          SELECT DISTINCT
            clientid,
            n,
            REGR_SLOPE(p20_ma4, week_seq) OVER (
              PARTITION BY clientid
              ORDER BY week_seq
              ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
            ) AS slope
          FROM base
        )
        SELECT clientid, n, slope
        FROM trend
        WHERE n >= 6 AND slope < 0
        """
        
        cursor.execute(eligibility_query, (clientid,))
        eligibility = cursor.fetchone()
        
        if not eligibility:
            raise HTTPException(
                status_code=400, 
                detail=f"해당 차량({clientid})은 6주 이상 데이터가 있거나 감소 추세를 보이지 않습니다."
            )
        
        # 조건을 만족하는 경우 주간 배터리 트렌드 데이터 조회
        trend_query = """
        SELECT week_start, weekly_p20_esoh, p20_ma4, delta_1w, n_sessions
        FROM bw_esoh_weekly
        WHERE clientid = %s
        ORDER BY week_start
        """
        
        cursor.execute(trend_query, (clientid,))
        results = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return {
            "clientid": clientid,
            "data_weeks": eligibility['n'],
            "trend_slope": float(eligibility['slope']),
            "trend_data": [dict(row) for row in results]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"데이터베이스 오류: {str(e)}")

@router.get("/battery-trend-summary")
async def get_battery_trend_summary():
    """전체 차량의 배터리 트렌드 요약 정보를 반환합니다."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # bw_esoh_monthly 뷰에 데이터가 있는 차량들의 요약 정보
        summary_query = """
        WITH latest_trends AS (
            SELECT 
                bem.clientid,
                ct.car_type,
                ct.model_year,
                bem.monthly_p20_esoh,
                bem.p20_ma3,
                bem.delta_1m
            FROM bw_esoh_monthly bem
            JOIN car_type ct ON bem.clientid = ct.clientid
            WHERE ct.car_type IS NOT NULL 
              AND ct.model_year IS NOT NULL
              AND bem.month = (
                SELECT MAX(month) 
                FROM bw_esoh_monthly bem2 
                WHERE bem2.clientid = bem.clientid
              )
        )
        SELECT 
            car_type,
            COUNT(*) as vehicle_count,
            ROUND(AVG(monthly_p20_esoh), 2) as avg_esoh,
            ROUND(AVG(p20_ma3), 2) as avg_ma3,
            ROUND(AVG(delta_1m), 3) as avg_delta
        FROM latest_trends
        GROUP BY car_type
        ORDER BY car_type
        """
        
        cursor.execute(summary_query)
        results = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return {"summary": [dict(row) for row in results]}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"데이터베이스 오류: {str(e)}")
