from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.v1 import vehicles, performance, analytics, baas

app = FastAPI(
    title="BAAS Analysis API",
    description="전기차 성능 분석을 위한 REST API",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[ "http://localhost:3004", "http://127.0.0.1:3004"],  # Frontend 주소
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우터 등록
app.include_router(vehicles.router, prefix="/api/v1")
app.include_router(performance.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(baas.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {
        "message": "BAAS Analysis API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
