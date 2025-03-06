"""Tests for the Subway outlet scraper."""
import pytest
from bs4 import BeautifulSoup
from scraper.subway_scraper_simple import extract_outlets

# Sample HTML fixtures
VISIBLE_OUTLET_HTML = """
<div class="fp_listitem fp_list_marker2" data-latitude="3.128099" data-longitude="101.678678" style="order: 1;">
    <div class="location_left">
        <h4>Subway Menara UOA Bangsar</h4>
        <div class="infoboxcontent">
            <p>Jalan Bangsar Utama 1, Unit 1-2-G, Menara UOA Bangsar, Kuala Lumpur, 59000</p>
            <p></p>
            <p>Monday - Sunday, 8:00 AM - 8:00 PM</p>
            <p></p>
            <p class="infoboxlink"><a href="/find-a-subway" title="Subway Menara UOA Bangsar">Find out more...</a></p>
        </div>
        <div class="infopointer"></div>
    </div>
    <div class="location_right">
        <div class="directionButton">
            <a target="_blank" href="https://goo.gl/maps/8n6W5Syy3vUAGeQV8">
                <i class="fa-solid fa-location-dot"></i>
            </a>
            <a target="_blank" href="https://www.waze.com/example">
                <i class="fa-brands fa-waze"></i>
            </a>
        </div>
    </div>
</div>
"""

HIDDEN_OUTLET_HTML = """
<div class="fp_listitem fp_list_marker29" data-latitude="3.067989" data-longitude="101.489526" style="order: 145; display: none;">
    <div class="location_left">
        <h4>Subway SS7</h4>
        <div class="infoboxcontent">
            <p>#15G Jalan Plumbum R7/R, Pusat Komersial Seksyen 7, Shah Alam, 40000</p>
            <p></p>
            <p>Monday - Sunday, 8:00 AM - 9:30 PM</p>
            <p></p>
            <p class="infoboxlink"><a href="/find-a-subway" title="Subway SS7">Find out more...</a></p>
        </div>
        <div class="infopointer"></div>
    </div>
    <div class="location_right">
        <div class="directionButton">
            <a target="_blank" href="https://goo.gl/maps/example">
                <i class="fa-solid fa-location-dot"></i>
            </a>
            <a target="_blank" href="https://www.waze.com/example">
                <i class="fa-brands fa-waze"></i>
            </a>
        </div>
    </div>
</div>
"""

MULTIPLE_OUTLETS_HTML = VISIBLE_OUTLET_HTML + HIDDEN_OUTLET_HTML

def test_extract_visible_outlet():
    """Test extraction of a visible outlet."""
    outlets = extract_outlets(VISIBLE_OUTLET_HTML)
    assert len(outlets) == 1
    outlet = outlets[0]
    
    assert outlet['name'] == 'Subway Menara UOA Bangsar'
    assert outlet['address'] == 'Jalan Bangsar Utama 1, Unit 1-2-G, Menara UOA Bangsar, Kuala Lumpur, 59000'
    assert outlet['operating_hours'] == 'Monday - Sunday, 8:00 AM - 8:00 PM'
    assert outlet['google_maps_link'] == 'https://goo.gl/maps/8n6W5Syy3vUAGeQV8'
    assert outlet['waze_link'] == 'https://www.waze.com/example'
    assert outlet['lat'] == 3.128099
    assert outlet['long'] == 101.678678

def test_skip_hidden_outlet():
    """Test that hidden outlets are skipped."""
    outlets = extract_outlets(HIDDEN_OUTLET_HTML)
    assert len(outlets) == 0

def test_extract_only_visible_outlets():
    """Test that only visible outlets are extracted when both visible and hidden are present."""
    outlets = extract_outlets(MULTIPLE_OUTLETS_HTML)
    assert len(outlets) == 1
    assert outlets[0]['name'] == 'Subway Menara UOA Bangsar'

def test_extract_with_missing_data():
    """Test extraction with missing optional data."""
    html = """
    <div class="fp_listitem fp_list_marker2" data-latitude="3.128099" style="order: 1;">
        <div class="location_left">
            <h4>Test Outlet</h4>
            <div class="infoboxcontent">
                <p>Test Address</p>
            </div>
        </div>
        <div class="location_right">
            <div class="directionButton">
            </div>
        </div>
    </div>
    """
    outlets = extract_outlets(html)
    assert len(outlets) == 1
    outlet = outlets[0]
    
    assert outlet['name'] == 'Test Outlet'
    assert outlet['address'] == 'Test Address'
    assert outlet['operating_hours'] == 'Not specified'
    assert outlet['google_maps_link'] is None
    assert outlet['waze_link'] is None
    assert outlet['lat'] == 3.128099
    assert outlet['long'] is None

def test_extract_with_invalid_coordinates():
    """Test extraction with invalid coordinate data."""
    html = """
    <div class="fp_listitem fp_list_marker2" data-latitude="invalid" data-longitude="invalid" style="order: 1;">
        <div class="location_left">
            <h4>Test Outlet</h4>
            <div class="infoboxcontent">
                <p>Test Address</p>
            </div>
        </div>
    </div>
    """
    outlets = extract_outlets(html)
    assert len(outlets) == 1
    outlet = outlets[0]
    
    assert outlet['lat'] is None
    assert outlet['long'] is None

def test_extract_with_empty_html():
    """Test extraction with empty HTML."""
    outlets = extract_outlets("")
    assert len(outlets) == 0

def test_extract_with_no_outlets():
    """Test extraction with HTML but no outlets."""
    html = "<div>No outlets here</div>"
    outlets = extract_outlets(html)
    assert len(outlets) == 0 