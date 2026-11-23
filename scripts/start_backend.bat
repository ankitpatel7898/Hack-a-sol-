@echo off
echo ==================================================
echo   Starting HealthGuard FastAPI Backend Service
echo ==================================================
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
pause
