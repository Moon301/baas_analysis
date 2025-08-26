# BAAS Analysis Backend

전기차 성능 분석을 위한 FastAPI 기반 백엔드 API 서버입니다.

## 🚀 기능

- **차량 관리**: 차량 정보 CRUD 작업
- **성능 데이터**: 실시간 차량 성능 데이터 조회 및 분석
- **분석 기능**: 대시보드 통계, 성능 순위, 효율성 분석
- **데이터 필터링**: 날짜, 차량 ID 기반 데이터 필터링

## 🛠️ 기술 스택

- **Framework**: FastAPI
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy
- **Validation**: Pydantic
- **Documentation**: Auto-generated OpenAPI docs

## 📊 데이터베이스 구조

### bw_data 테이블
실시간 차량 데이터를 저장하는 테이블입니다.
- `clientid`: 차량 식별자
- `timestamp`: 데이터 수집 시간
- `accel1~3`: 가속도 데이터
- `brake1~3`: 제동 데이터
- `pack_v`: 배터리 팩 전압
- `speed`: 속도
- `mileage`: 주행거리
- `gps_lat/lon/alt`: GPS 위치 정보
- `cell_max/min/mean/median`: 셀 전압 데이터
- `temp_max/min/mean/median`: 온도 데이터

### car_type 테이블
차량 기본 정보를 저장하는 테이블입니다.
- `clientid`: 차량 식별자 (Primary Key)
- `car_type`: 차량 타입
- `model_year`: 제조년도
- `model_month`: 제조월

## 🚀 설치 및 실행

### 1. 의존성 설치
```bash
pip install -r requirements.txt
```

### 2. 환경변수 설정
`.env` 파일을 생성하고 데이터베이스 연결 정보를 설정하세요:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/baas_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=baas_db
DB_USER=username
DB_PASSWORD=password
```

### 3. 서버 실행
```bash
# 개발 모드
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 또는
python -m app.main
```

## 📚 API 문서

서버 실행 후 다음 URL에서 API 문서를 확인할 수 있습니다:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔌 주요 API 엔드포인트

### 차량 관리
- `GET /api/v1/vehicles/` - 모든 차량 조회
- `GET /api/v1/vehicles/{clientid}` - 특정 차량 조회
- `POST /api/v1/vehicles/` - 새 차량 등록

### 성능 데이터
- `GET /api/v1/performance/data` - 성능 데이터 조회
- `GET /api/v1/performance/data/{clientid}` - 특정 차량 성능 데이터
- `GET /api/v1/performance/stats/{clientid}` - 차량 통계

### 분석
- `GET /api/v1/analytics/dashboard` - 대시보드 통계
- `GET /api/v1/analytics/performance/ranking` - 성능 순위
- `GET /api/v1/analytics/efficiency` - 효율성 분석

## 🔧 개발

### 프로젝트 구조
```
backend/
├── app/
│   ├── models/          # SQLAlchemy 모델
│   ├── schemas/         # Pydantic 스키마
│   ├── crud/           # 데이터베이스 작업
│   ├── api/            # API 엔드포인트
│   └── database/       # 데이터베이스 설정
├── requirements.txt
└── README.md
```

### 데이터베이스 마이그레이션
현재는 `Base.metadata.create_all()`을 사용하여 테이블을 자동 생성합니다.
프로덕션 환경에서는 Alembic을 사용하여 마이그레이션을 관리하는 것을 권장합니다.

## 📝 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다.


 python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8004
