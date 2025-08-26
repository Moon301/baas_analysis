import asyncpg
import os
from dotenv import load_dotenv
from typing import AsyncGenerator

load_dotenv()

# 환경변수에서 데이터베이스 연결 정보 가져오기
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # 환경변수가 없을 경우 기본값 사용
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "5432")
    DB_NAME = os.getenv("DB_NAME", "postgres")
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "keti1234!")
    
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# 데이터베이스 연결 풀
async def get_db_pool():
    """데이터베이스 연결 풀 생성"""
    return await asyncpg.create_pool(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "5432")),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "keti1234!"),
        database=os.getenv("DB_NAME", "postgres"),
        min_size=1,
        max_size=10
    )

# 데이터베이스 연결 의존성
async def get_db() -> AsyncGenerator[asyncpg.Connection, None]:
    """데이터베이스 연결 의존성"""
    pool = await get_db_pool()
    async with pool.acquire() as connection:
        yield connection
    await pool.close()
