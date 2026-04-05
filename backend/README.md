# Tunely Backend

Django backend for Tunely, set up for Python 3.14 and a simple JSON API.

## Local Setup

1. Activate the virtual environment:
   `.\.venv\Scripts\activate`
2. Install dependencies:
   `pip install -r requirements.txt`
3. Copy the sample environment file:
   `copy .env.example .env`
4. Run database migrations:
   `python manage.py migrate`
5. Start the development server:
   `python manage.py runserver`

## Endpoints

- `GET /api/` returns API metadata.
- `GET /api/health/` returns a health check response.
- `GET /admin/` opens the Django admin.