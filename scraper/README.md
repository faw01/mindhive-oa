# Scraper

Python scraper for collecting Subway Malaysia outlet data.

## Features

- Scrapes outlet details from Subway website
- Geocodes addresses to coordinates via Google Maps Link 
- Validates and cleans data
- Exports to PostgreSQL

## Usage

```bash
# Run scraper
python -m scraper.main

# Run tests
pytest
```

## Output Format

```json
{
  "name": "Outlet Name",
  "address": "Full Address",
  "operating_hours": "9am-10pm",
  "coordinates": {
    "lat": 3.15,
    "lng": 101.71
  }
}
```
