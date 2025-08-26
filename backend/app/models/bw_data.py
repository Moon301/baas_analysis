from sqlalchemy import Column, String, DateTime, Float, Text
from sqlalchemy.sql import func
from ..database.base import Base

class BwData(Base):
    __tablename__ = "bw_data"
    
    # 기본 키가 없으므로 복합 키나 인덱스를 사용할 수 있음
    # 여기서는 clientid와 timestamp의 조합을 고유하게 처리
    clientid = Column(String(50), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    
    # 가속도 데이터
    accel1 = Column(Float)
    accel2 = Column(Float)
    accel3 = Column(Float)
    
    # 제동 데이터
    brake1 = Column(Float)
    brake2 = Column(Float)
    brake3 = Column(Float)
    
    # 배터리 데이터
    pack_v = Column(Float)  # 배터리 팩 전압
    current = Column(Float)  # 전류
    chg_sac = Column(Float)  # 충전 상태
    
    # 주행 데이터
    mileage = Column(Float)  # 주행거리
    speed = Column(Float)    # 속도
    
    # GPS 데이터
    gps_alt = Column(Float)  # 고도
    gps_lat = Column(Float)  # 위도
    gps_lon = Column(Float)  # 경도
    
    # 셀 데이터
    cell_max = Column(Float)     # 최대 셀 전압
    cell_min = Column(Float)     # 최소 셀 전압
    cell_mean = Column(Float)    # 평균 셀 전압
    cell_median = Column(Float)  # 중간값 셀 전압
    
    # 온도 데이터
    temp_max = Column(Float)     # 최대 온도
    temp_min = Column(Float)     # 최소 온도
    temp_mean = Column(Float)    # 평균 온도
    temp_median = Column(Float)  # 중간값 온도
    
    def __repr__(self):
        return f"<BwData(clientid='{self.clientid}', timestamp='{self.timestamp}')>"
