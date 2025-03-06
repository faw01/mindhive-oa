import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from backend.api.endpoints import outlets
from backend.database.models import Base
from backend.database.session import engine

# Load environment variables
load_dotenv()

# Initialize database
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title="Subway Outlets API",
    description="API for Subway outlets in Kuala Lumpur",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(
    outlets.router,
    prefix="/api/outlets",
    tags=["outlets"]
)

@app.get("/")
def read_root():
    """Root endpoint to check if API is running."""
    return {
        "message": "Subway Outlets API is running",
        "documentation": "/docs",
        "outlets": "/api/outlets"
    }

# Run the application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True) 