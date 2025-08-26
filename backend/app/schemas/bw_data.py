from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class BwDataResponse(BaseModel):
    clientid: str
    timestamp: datetime
    accel1: Optional[float] = None
    accel2: Optional[float] = None
    accel3: Optional[float] = None
    brake1: Optional[float] = None
    brake2: Optional[float] = None
    brake3: Optional[float] = None
    pack_v: Optional[float] = None
    mileage: Optional[float] = None
    gps_alt: Optional[float] = None
    gps_lat: Optional[float] = None
    gps_lon: Optional[float] = None
    current: Optional[float] = None
    chg_sac: Optional[float] = None
    speed: Optional[float] = None
    cell_max: Optional[float] = None
    cell_min: Optional[float] = None
    cell_mean: Optional[float] = None
    cell_median: Optional[float] = None
    temp_max: Optional[float] = None
    temp_min: Optional[float] = None
    temp_mean: Optional[float] = None
    temp_median: Optional[float] = None
    
    class Config:
        from_attributes = True

class BwDataFilter(BaseModel):
    clientid: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    limit: Optional[int] = 1000
