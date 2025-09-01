import asyncpg
import os
from dotenv import load_dotenv
from typing import AsyncGenerator

load_dotenv()

# 환경변수에서 데이터베이스 연결 정보 가져오기
DATABASE_URL = os.getenv("DATABASE_URL")


# 전역 데이터베이스 연결 풀
_db_pool = None

async def get_db_pool():
    """데이터베이스 연결 풀 생성 (싱글톤)"""
    global _db_pool
    if _db_pool is None:
        _db_pool = await asyncpg.create_pool(
            host=os.getenv("DB_HOST"),
            port=int(os.getenv("DB_PORT")),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME"),
            min_size=1,
            max_size=10
        )
    return _db_pool

# 데이터베이스 연결 의존성
async def get_db() -> AsyncGenerator[asyncpg.Connection, None]:
    """데이터베이스 연결 의존성"""
    pool = await get_db_pool()
    async with pool.acquire() as connection:
        yield connection
