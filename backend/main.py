from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

# Import API routers
from api.endpoints import outlets

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
    uvicorn.run(app, host="0.0.0.0", port=8000)