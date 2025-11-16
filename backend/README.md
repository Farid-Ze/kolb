# KLSI Backend

Dev
- Create venv: `python -m venv .venv`
- Activate: `\.venv\Scripts\Activate.ps1` (PowerShell)
- Install: `pip install -r requirements.txt`
- Run: `uvicorn app.main:app --reload`

DB migrations
- Run alembic commands from the `backend` directory: `alembic upgrade head`
