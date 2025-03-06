from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from geopy.distance import geodesic
from fastapi.encoders import jsonable_encoder
from sqlalchemy import or_

from backend.database.session import get_db
from backend.database.models import Outlet as OutletModel
from backend.schemas.outlet import Outlet, OutletDistance, IntersectingOutlet

router = APIRouter()

@router.get("/", response_model=List[Outlet])
def read_outlets(
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get all outlets with pagination.
    """
    outlets = db.query(OutletModel).offset(skip).limit(limit).all()
    return outlets

@router.get("/search/", response_model=List[Outlet])
def search_outlets(
    query: str = Query(..., description="Search term for outlet name or address"),
    db: Session = Depends(get_db)
):
    """
    Search outlets by name or address.
    """
    search_term = f"%{query}%"
    outlets = db.query(OutletModel).filter(
        or_(
            OutletModel.name.ilike(search_term),
            OutletModel.address.ilike(search_term)
        )
    ).all()
    return outlets

@router.get("/{outlet_id}", response_model=Outlet)
def read_outlet(
    outlet_id: int, 
    db: Session = Depends(get_db)
):
    """
    Get a specific outlet by ID.
    """
    outlet = db.query(OutletModel).filter(OutletModel.id == outlet_id).first()
    if outlet is None:
        raise HTTPException(status_code=404, detail="Outlet not found")
    return outlet

@router.get("/nearby/", response_model=List[OutletDistance])
async def get_nearby_outlets(
    lat: float = Query(..., description="Latitude of the reference point"),
    long: float = Query(..., description="Longitude of the reference point"),
    radius: float = Query(5.0, description="Search radius in kilometers"),
    db: Session = Depends(get_db)
) -> List[OutletDistance]:
    """Get outlets within a specified radius of a reference point."""
    outlets = db.query(OutletModel).all()
    nearby_outlets = []
    
    # Convert reference point to tuple
    reference_point = (lat, long)
    
    # Calculate distances and filter outlets
    for outlet in outlets:
        if outlet.lat is not None and outlet.long is not None:
            outlet_point = (outlet.lat, outlet.long)
            distance = geodesic(reference_point, outlet_point).kilometers
            
            if distance <= radius:
                outlet_dict = jsonable_encoder(outlet)
                outlet_dict["distance"] = distance
                nearby_outlets.append(OutletDistance(**outlet_dict))
    
    # Sort by distance
    nearby_outlets.sort(key=lambda x: x.distance)
    return nearby_outlets

@router.get("/intersecting/", response_model=List[IntersectingOutlet])
async def get_intersecting_outlets(
    db: Session = Depends(get_db)
) -> List[IntersectingOutlet]:
    """Get outlets with intersecting catchment areas."""
    outlets = db.query(OutletModel).all()
    intersecting_outlets = []
    
    # Calculate intersections for each outlet
    for outlet in outlets:
        # Skip outlets without coordinates
        if outlet.lat is None or outlet.long is None:
            continue
            
        outlet_point = (outlet.lat, outlet.long)
        intersecting_ids = []
        
        # Check intersection with other outlets
        for other_outlet in outlets:
            # Skip self and outlets without coordinates
            if other_outlet.id == outlet.id or other_outlet.lat is None or other_outlet.long is None:
                continue
                
            other_point = (other_outlet.lat, other_outlet.long)
            distance = geodesic(outlet_point, other_point).kilometers
            
            # If distance is less than twice the catchment radius, they intersect
            if distance <= 2 * 5.0:
                intersecting_ids.append(other_outlet.id)
        
        if intersecting_ids:
            outlet_dict = jsonable_encoder(outlet)
            outlet_dict["intersects_with"] = intersecting_ids
            intersecting_outlets.append(IntersectingOutlet(**outlet_dict))
    
    return intersecting_outlets

@router.get("/catchment/", response_model=List[OutletDistance])
def read_catchment_outlets(
    outlet_id: int = Query(..., description="ID of the reference outlet"),
    radius: float = Query(1.0, description="Catchment radius in kilometers"),
    db: Session = Depends(get_db)
):
    """
    Get outlets that have catchment areas intersecting with a specific outlet's catchment area.
    """
    # Get the reference outlet
    reference_outlet = db.query(OutletModel).filter(OutletModel.id == outlet_id).first()
    if reference_outlet is None:
        raise HTTPException(status_code=404, detail="Reference outlet not found")
    
    if reference_outlet.lat is None or reference_outlet.long is None:
        raise HTTPException(status_code=400, detail="Reference outlet has no coordinates")
    
    # Get all other outlets
    outlets = db.query(OutletModel).filter(OutletModel.id != outlet_id).all()
    
    result = []
    reference_point = (reference_outlet.lat, reference_outlet.long)
    
    for outlet in outlets:
        if outlet.lat is not None and outlet.long is not None:
            outlet_point = (outlet.lat, outlet.long)
            distance = geodesic(reference_point, outlet_point).kilometers
            
            # If distance is less than 2 * radius, catchment areas intersect
            if distance <= (2 * radius):
                # Convert to Pydantic model and add distance
                outlet_dict = {**outlet.__dict__}
                outlet_dict["distance"] = distance
                result.append(outlet_dict)
    
    # Sort by distance
    result.sort(key=lambda x: x["distance"])
    
    return result

@router.get("/distance/{outlet_id}", response_model=List[OutletDistance])
async def get_outlet_distances(
    outlet_id: int,
    db: Session = Depends(get_db)
) -> List[OutletDistance]:
    """Get distances from a reference outlet to all other outlets."""
    # Get the reference outlet
    reference_outlet = db.query(OutletModel).filter(OutletModel.id == outlet_id).first()
    if not reference_outlet:
        raise HTTPException(status_code=404, detail="Reference outlet not found")
    
    # Skip if reference outlet has no coordinates
    if reference_outlet.lat is None or reference_outlet.long is not None:
        raise HTTPException(status_code=400, detail="Reference outlet has no coordinates")
    
    # Get all other outlets
    outlets = db.query(OutletModel).filter(OutletModel.id != outlet_id).all()
    outlet_distances = []
    
    # Convert reference point to tuple
    reference_point = (reference_outlet.lat, reference_outlet.long)
    
    # Calculate distances
    for outlet in outlets:
        if outlet.lat is not None and outlet.long is not None:
            outlet_point = (outlet.lat, outlet.long)
            distance = geodesic(reference_point, outlet_point).kilometers
            
            outlet_dict = jsonable_encoder(outlet)
            outlet_dict["distance"] = distance
            outlet_distances.append(OutletDistance(**outlet_dict))
    
    # Sort by distance
    outlet_distances.sort(key=lambda x: x.distance)
    return outlet_distances 