# Subway Outlet Finder

An intelligent chatbot system for finding and getting information about Subway restaurants in Malaysia. Built with Next.js, Python, and OpenAI's GPT-4.

## Features

- 🤖 Natural language chat interface
- 🔍 Semantic search using embeddings
- 📍 Location-based outlet search
- ⏰ Operating hours lookup
- 🗺️ Navigation integration with Waze

## Project Structure

- `frontend/` - Next.js web application
- `backend/` - FastAPI server for outlet data
- `db/` - PostgreSQL database setup and migrations
- `scraper/` - Python scraper for Subway outlet data

## Quick Start

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in required values
3. Install dependencies:
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd frontend && npm install
```

4. Start the services:
```bash
# Start backend
cd backend && uvicorn main:app --reload

# Start frontend
cd frontend && npm run dev
```

## Environment Variables

Required environment variables:
- `OPENAI_API_KEY` - OpenAI API key
- `NEXT_PUBLIC_MAPBOX_TOKEN` - Mapbox token for maps
- `DATABASE_URL` - PostgreSQL connection string
