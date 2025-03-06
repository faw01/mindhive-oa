"""Simple Subway outlet scraper using Playwright and BeautifulSoup."""

import os
import logging
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
from dotenv import load_dotenv

# Setup logging
logging.basicConfig(level=logging.DEBUG)
log = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

URL = "https://subway.com.my/find-a-subway"

def extract_outlets(html_content):
    """Extract outlet information using BeautifulSoup."""
    soup = BeautifulSoup(html_content, 'html.parser')
    outlets = []
    
    # Find all location divs with the fp_listitem class
    location_divs = soup.find_all('div', {'class': 'fp_listitem'})
    
    for div in location_divs:
        # Skip if the element has display: none
        style = div.get('style', '')
        if 'display: none' in style:
            continue
            
        # Extract coordinates from data attributes
        lat = float(div.get('data-latitude')) if div.get('data-latitude') else None
        long = float(div.get('data-longitude')) if div.get('data-longitude') else None
        
        # Extract name
        name = div.find('h4')
        if name:
            name = name.text.strip()
            
            # Find infoboxcontent
            info_div = div.find('div', {'class': 'infoboxcontent'})
            if info_div:
                # Extract address and hours from paragraphs
                paragraphs = info_div.find_all('p')
                address = paragraphs[0].text.strip() if paragraphs else 'Not specified'
                # Hours are in the third paragraph (index 2)
                operating_hours = paragraphs[2].text.strip() if len(paragraphs) > 2 else 'Not specified'
            
            # Find direction buttons div
            direction_div = div.find('div', {'class': 'directionButton'})
            if direction_div:
                links = direction_div.find_all('a')
                google_maps_link = None
                waze_link = None
                
                for link in links:
                    href = link.get('href', '')
                    # Check for Google Maps link (has fa-location-dot icon)
                    if link.find('i', {'class': 'fa-location-dot'}):
                        google_maps_link = href
                    # Check for Waze link (has fa-waze icon)
                    elif link.find('i', {'class': 'fa-waze'}):
                        waze_link = href
            
            outlets.append({
                'name': name,
                'address': address,
                'operating_hours': operating_hours,
                'waze_link': waze_link,
                'google_maps_link': google_maps_link,
                'lat': lat,
                'long': long
            })
    
    return outlets

def main():
    with sync_playwright() as p, p.chromium.launch(headless=False) as browser:
        page = browser.new_page()
        
        log.info("Navigating to store locator page...")
        page.goto(URL)
        page.wait_for_load_state("networkidle")

        # Search for Kuala Lumpur
        log.info("Searching for Kuala Lumpur...")
        search_input = page.get_by_role("textbox", name="Find a Subway")
        search_input.fill("Kuala Lumpur")
        search_input.press("Enter")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(2000)

        # Get the page content and parse with BeautifulSoup
        html_content = page.content()
        outlets = extract_outlets(html_content)

        log.info(f"Found {len(outlets)} outlets:")
        for outlet in outlets:
            log.info(f"\nName: {outlet['name']}")
            log.info(f"Address: {outlet['address']}")
            log.info(f"Hours: {outlet['operating_hours']}")
            log.info(f"Waze: {outlet['waze_link']}")
            log.info(f"Google Maps: {outlet['google_maps_link']}")
            log.info(f"Coordinates: {outlet['lat']}, {outlet['long']}")

        page.wait_for_timeout(3000)

if __name__ == "__main__":
    main() 