# Database

PostgreSQL database setup and migrations for Subway outlet data.

## Tech Stack

- **Database**: PostgreSQL 15
- **Migrations**: Alembic
- **ORM**: SQLAlchemy

## Schema

- `outlets` - Store outlet information
- `operating_hours` - Operating hours by day
- `coordinates` - Geographical coordinates

## Setup

1. Create database:
```bash
createdb subway_outlets
```

2. Run migrations:
```bash
alembic upgrade head
```

## Migrations

Create new migration:
```bash
alembic revision -m "description"
```

## Backup

Backup database:
```bash
pg_dump subway_outlets > backup.sql
```
