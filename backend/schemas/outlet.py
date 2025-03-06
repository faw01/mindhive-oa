from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class OutletBase(BaseModel):
    """Base schema for Subway outlet data."""
    name: str
    address: str
    operating_hours: Optional[str] = None
    waze_link: Optional[str] = None
    google_maps_link: Optional[str] = None
    lat: Optional[float] = None
    long: Optional[float] = None

class OutletCreate(OutletBase):
    """Schema for creating a new outlet."""
    pass

class OutletUpdate(OutletBase):
    """Schema for updating an outlet."""
    name: Optional[str] = None
    address: Optional[str] = None

class OutletInDB(OutletBase):
    """Schema for an outlet in the database."""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        """Configuration for the schema."""
        from_attributes = True

class Outlet(OutletInDB):
    """Schema for an outlet."""
    pass

class OutletDistance(Outlet):
    """Schema for an outlet with distance."""
    distance: float = Field(..., description="Distance in kilometers")

class IntersectingOutlet(Outlet):
    """Schema for an outlet with intersecting catchment area."""
    intersects_with: list[int] = Field(..., description="IDs of outlets with intersecting catchment areas") 