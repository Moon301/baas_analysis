from pydantic import BaseModel
from typing import Optional

class CarTypeResponse(BaseModel):
    clientid: str
    car_type: Optional[str] = None
    model_year: Optional[int] = None
    model_month: Optional[int] = None
    
    class Config:
        from_attributes = True

class CarTypeCreate(BaseModel):
    clientid: str
    car_type: Optional[str] = None
    model_year: Optional[int] = None
    model_month: Optional[int] = None
