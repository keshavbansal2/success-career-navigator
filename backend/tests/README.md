# Backend Tests

This directory contains unit and integration tests for the CareerNav AI backend.

## Running Tests

```bash
cd backend
source venv/bin/activate
pytest tests/ -v
```

## Test Structure

- `test_main.py` — API endpoint tests (health check, analyze, interview questions, auth)

## Writing New Tests

Use `pytest` with `httpx.AsyncClient` for async endpoint testing. The test client
uses an in-memory SQLite database to avoid polluting the dev database.
