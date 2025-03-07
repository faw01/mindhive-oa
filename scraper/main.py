"""Main script to run the scraper and insert data into the database."""
import logging
from scraper.scraper import extract_outlets
from playwright.sync_api import sync_playwright
from backend.database.session import SessionLocal
from backend.database.models import Outlet

# Setup logging
logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

def get_subway_html():
    """Get HTML content from the Subway website."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        log.info("Navigating to store locator page...")
        page.goto("https://subway.com.my/find-a-subway")
        page.wait_for_load_state("networkidle")

        # Search for Kuala Lumpur
        log.info("Searching for Kuala Lumpur...")
        search_input = page.get_by_role("textbox", name="Find a Subway")
        search_input.fill("Kuala Lumpur")
        search_input.press("Enter")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(2000)
        
        # Get the page content
        html_content = page.content()
        browser.close()
        
        return html_content

def insert_outlets_to_db(outlets, db=None):
    """Insert outlets into the database.
    
    Args:
        outlets: List of outlet dictionaries
        db: Optional database session. If not provided, a new session will be created.
    """
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True
        
    try:
        # Clear existing outlets
        db.query(Outlet).delete()
        
        # Insert new outlets
        for outlet_data in outlets:
            outlet = Outlet(
                name=outlet_data['name'],
                address=outlet_data['address'],
                operating_hours=outlet_data['operating_hours'],
                waze_link=outlet_data['waze_link'],
                google_maps_link=outlet_data['google_maps_link'],
                lat=outlet_data['lat'],
                long=outlet_data['long']
            )
            db.add(outlet)
        
        # Commit all changes in a single transaction
        db.commit()
        log.info(f"Successfully inserted {len(outlets)} outlets into the database")
    except Exception as e:
        db.rollback()
        log.error(f"Error inserting outlets into database: {str(e)}")
        raise
    finally:
        if close_db:
            db.close()

def main():
    """Main function to run the scraper and insert data into the database."""
    # Get HTML content from the Subway website
    html_content = get_subway_html()
    
    # Extract outlets from HTML
    outlets = extract_outlets(html_content)
    
    # Insert outlets into the database
    insert_outlets_to_db(outlets)
    
    log.info(f"Scraped and inserted {len(outlets)} outlets into the database")
    return outlets

if __name__ == "__main__":
    main() 