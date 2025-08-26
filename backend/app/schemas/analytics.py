from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class DashboardStats(BaseModel):
    total_vehicles: int
    total_records: int
    avg_battery_efficiency: float
    avg_temperature: float
    recent_activity_count: int
    last_updated: datetime

class PerformanceMetrics(BaseModel):
    clientid: str
    car_type: Optional[str] = None
    avg_speed: float
    avg_efficiency: float
    battery_health_score: float
    driving_score: float
    total_mileage: float
    performance_rank: int

class EfficiencyData(BaseModel):
    clientid: str
    timestamp: datetime
    efficiency: float
    speed: float
    temperature: float
    battery_voltage: float
