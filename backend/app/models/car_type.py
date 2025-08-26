from sqlalchemy import Column, String, Integer
from ..database.base import Base

class CarType(Base):
    __tablename__ = "car_type"
    
    clientid = Column(String(50), primary_key=True)
    car_type = Column(String(50))
    model_year = Column(Integer)
    model_month = Column(Integer)
    
    def __repr__(self):
        return f"<CarType(clientid='{self.clientid}', car_type='{self.car_type}', model_year={self.model_year})>"
