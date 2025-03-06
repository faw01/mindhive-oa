import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.main import app
from backend.database.models import Base, Outlet
from backend.database.session import get_db

# Create an in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create the tables
Base.metadata.create_all(bind=engine)

# Override the get_db dependency
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# Create a test client
client = TestClient(app)

# Test data
test_outlets = [
    {
        "name": "Subway KL Sentral",
        "address": "Lot 20, Level 1, KL Sentral Station, 50470 Kuala Lumpur",
        "operating_hours": "8:00 AM - 10:00 PM",
        "waze_link": "https://waze.com/ul/hw282z5hhz",
        "lat": 3.1334,
        "lng": 101.6869
    },
    {
        "name": "Subway Quill City Mall",
        "address": "Lot L1-19, Level 1, Quill City Mall, Jalan Sultan Ismail, 50250 Kuala Lumpur",
        "operating_hours": "10:00 AM - 10:00 PM",
        "waze_link": "https://waze.com/ul/hw282syc5h",
        "lat": 3.1623,
        "lng": 101.7003
    },
    {
        "name": "Subway Intermark Mall",
        "address": "Lot G-13, Ground Floor, The Intermark Mall, 348 Jalan Tun Razak, 50400 Kuala Lumpur",
        "operating_hours": "8:00 AM - 8:00 PM",
        "waze_link": "https://waze.com/ul/hw282u5c5h",
        "lat": 3.1614,
        "lng": 101.7199
    }
]

@pytest.fixture(scope="function")
def setup_test_db():
    # Create test data
    db = TestingSessionLocal()
    
    # Clear existing data
    db.query(Outlet).delete()
    
    # Add test outlets
    for outlet_data in test_outlets:
        db.add(Outlet(**outlet_data))
    
    db.commit()
    
    yield
    
    # Clean up
    db.query(Outlet).delete()
    db.commit()
    db.close()

def test_read_root():
    """Test the root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()
    assert "Subway Outlets API is running" in response.json()["message"]

def test_read_outlets(setup_test_db):
    """Test getting all outlets."""
    response = client.get("/api/outlets/")
    assert response.status_code == 200
    
    outlets = response.json()
    assert len(outlets) == 3
    
    # Check if the outlets have the expected fields
    for outlet in outlets:
        assert "id" in outlet
        assert "name" in outlet
        assert "address" in outlet
        assert "operating_hours" in outlet
        assert "lat" in outlet
        assert "lng" in outlet
        assert "created_at" in outlet
        assert "updated_at" in outlet

def test_read_outlet(setup_test_db):
    """Test getting a specific outlet by ID."""
    # First get all outlets to find an ID
    response = client.get("/api/outlets/")
    outlets = response.json()
    outlet_id = outlets[0]["id"]
    
    # Now get the specific outlet
    response = client.get(f"/api/outlets/{outlet_id}")
    assert response.status_code == 200
    
    outlet = response.json()
    assert outlet["id"] == outlet_id
    assert outlet["name"] == test_outlets[0]["name"]
    assert outlet["address"] == test_outlets[0]["address"]

def test_read_outlet_not_found(setup_test_db):
    """Test getting a non-existent outlet."""
    response = client.get("/api/outlets/9999")
    assert response.status_code == 404
    assert "detail" in response.json()
    assert "not found" in response.json()["detail"]

def test_read_nearby_outlets(setup_test_db):
    """Test getting outlets near a specific location."""
    # Use KL Sentral coordinates
    lat = 3.1334
    lng = 101.6869
    radius = 10.0
    
    response = client.get(f"/api/outlets/nearby/?lat={lat}&lng={lng}&radius={radius}")
    assert response.status_code == 200
    
    outlets = response.json()
    assert len(outlets) > 0
    
    # Check if the outlets have distance field
    for outlet in outlets:
        assert "distance" in outlet
        assert outlet["distance"] <= radius

def test_read_nearby_outlets_small_radius(setup_test_db):
    """Test getting outlets with a small radius."""
    # Use KL Sentral coordinates
    lat = 3.1334
    lng = 101.6869
    radius = 0.1  # Very small radius
    
    response = client.get(f"/api/outlets/nearby/?lat={lat}&lng={lng}&radius={radius}")
    assert response.status_code == 200
    
    # Should only find the KL Sentral outlet or none
    outlets = response.json()
    assert len(outlets) <= 1

def test_read_intersecting_outlets(setup_test_db):
    """Test getting outlets with intersecting catchment areas."""
    response = client.get("/api/outlets/intersecting/?catchment_radius=10.0")
    assert response.status_code == 200
    
    outlets = response.json()
    
    # Check if the outlets have intersects_with field
    for outlet in outlets:
        assert "intersects_with" in outlet
        assert len(outlet["intersects_with"]) > 0

def test_read_catchment_outlets(setup_test_db):
    """Test getting outlets within a catchment area of a specific outlet."""
    # First get all outlets to find an ID
    response = client.get("/api/outlets/")
    outlets = response.json()
    outlet_id = outlets[0]["id"]
    
    # Now get the outlets within the catchment area
    response = client.get(f"/api/outlets/catchment/?outlet_id={outlet_id}&radius=10.0")
    assert response.status_code == 200
    
    catchment_outlets = response.json()
    
    # Check if the outlets have distance field
    for outlet in catchment_outlets:
        assert "distance" in outlet

def test_read_catchment_outlets_not_found(setup_test_db):
    """Test getting catchment outlets for a non-existent outlet."""
    response = client.get("/api/outlets/catchment/?outlet_id=9999&radius=10.0")
    assert response.status_code == 404
    assert "detail" in response.json()
    assert "not found" in response.json()["detail"] 