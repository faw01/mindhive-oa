# Backend

FastAPI server providing outlet data and management endpoints.

## Tech Stack

- **Framework**: FastAPI
- **Database**: SQLAlchemy + PostgreSQL
- **Auth**: JWT tokens
- **Testing**: Pytest

## API Endpoints

- `GET /outlets` - List all outlets
- `GET /outlets/{id}` - Get outlet details
- `GET /outlets/nearby` - Find nearby outlets
- `POST /outlets` - Add new outlet
- `PUT /outlets/{id}` - Update outlet

## Development

```bash
uvicorn main:app --reload
```

## Testing

```bash
pytest
```

## Architecture

- `models/` - SQLAlchemy models
- `routes/` - API route handlers
- `schemas/` - Pydantic schemas
- `services/` - Business logic
- `tests/` - Test suites
