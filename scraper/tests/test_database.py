"""Tests for database integration."""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from backend.database.models import Base, Outlet
from scraper.main import insert_outlets_to_db
from backend.database.session import SessionLocal

# Create test database
TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session() -> Session:
    """Create a fresh database for each test."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    
    # Override the global SessionLocal
    original_session_local = SessionLocal
    SessionLocal.__call__ = lambda: session
    
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        # Restore the original SessionLocal
        SessionLocal.__call__ = original_session_local.__call__

def test_insert_outlets(db_session):
    """Test inserting outlets into the database."""
    test_outlets = [
        {
            'name': 'Test Outlet 1',
            'address': 'Test Address 1',
            'operating_hours': 'Monday - Sunday, 9:00 AM - 10:00 PM',
            'waze_link': 'https://waze.com/test1',
            'google_maps_link': 'https://maps.google.com/test1',
            'lat': 3.1234,
            'long': 101.1234
        },
        {
            'name': 'Test Outlet 2',
            'address': 'Test Address 2',
            'operating_hours': 'Monday - Sunday, 8:00 AM - 9:00 PM',
            'waze_link': 'https://waze.com/test2',
            'google_maps_link': 'https://maps.google.com/test2',
            'lat': 3.5678,
            'long': 101.5678
        }
    ]
    
    # Insert outlets
    insert_outlets_to_db(test_outlets, db=db_session)
    
    # Verify outlets in database
    outlets = db_session.query(Outlet).all()
    assert len(outlets) == 2
    
    # Verify first outlet
    outlet1 = db_session.query(Outlet).filter(Outlet.name == 'Test Outlet 1').first()
    assert outlet1.address == 'Test Address 1'
    assert outlet1.operating_hours == 'Monday - Sunday, 9:00 AM - 10:00 PM'
    assert outlet1.waze_link == 'https://waze.com/test1'
    assert outlet1.google_maps_link == 'https://maps.google.com/test1'
    assert outlet1.lat == 3.1234
    assert outlet1.long == 101.1234
    
    # Verify second outlet
    outlet2 = db_session.query(Outlet).filter(Outlet.name == 'Test Outlet 2').first()
    assert outlet2.address == 'Test Address 2'

def test_insert_outlets_with_missing_data(db_session):
    """Test inserting outlets with missing optional data."""
    test_outlets = [
        {
            'name': 'Test Outlet',
            'address': 'Test Address',
            'operating_hours': 'Not specified',
            'waze_link': None,
            'google_maps_link': None,
            'lat': None,
            'long': None
        }
    ]
    
    # Insert outlets
    insert_outlets_to_db(test_outlets, db=db_session)
    
    # Verify outlet in database
    outlet = db_session.query(Outlet).first()
    assert outlet.name == 'Test Outlet'
    assert outlet.address == 'Test Address'
    assert outlet.operating_hours == 'Not specified'
    assert outlet.waze_link is None
    assert outlet.google_maps_link is None
    assert outlet.lat is None
    assert outlet.long is None

def test_clear_existing_outlets(db_session):
    """Test that existing outlets are cleared before inserting new ones."""
    # Insert initial outlets
    initial_outlets = [
        {
            'name': 'Initial Outlet',
            'address': 'Initial Address',
            'operating_hours': 'Monday - Sunday, 9:00 AM - 10:00 PM',
            'waze_link': None,
            'google_maps_link': None,
            'lat': None,
            'long': None
        }
    ]
    insert_outlets_to_db(initial_outlets, db=db_session)
    
    # Insert new outlets
    new_outlets = [
        {
            'name': 'New Outlet',
            'address': 'New Address',
            'operating_hours': 'Monday - Sunday, 8:00 AM - 9:00 PM',
            'waze_link': None,
            'google_maps_link': None,
            'lat': None,
            'long': None
        }
    ]
    insert_outlets_to_db(new_outlets, db=db_session)
    
    # Verify only new outlets exist
    outlets = db_session.query(Outlet).all()
    assert len(outlets) == 1
    assert outlets[0].name == 'New Outlet' 