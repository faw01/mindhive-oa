from sqlalchemy import Column, Integer, String, Float, JSON, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()

class Outlet(Base):
    """Model for Subway outlet data."""
    __tablename__ = "outlets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    address = Column(Text, nullable=False)
    operating_hours = Column(Text, nullable=True)
    waze_link = Column(String(512), nullable=True)
    google_maps_link = Column(String(512), nullable=True)
    lat = Column(Float, nullable=True)
    long = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    def __repr__(self):
        return f"<Outlet(name='{self.name}', address='{self.address}')>" 