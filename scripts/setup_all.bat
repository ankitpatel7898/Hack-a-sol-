@echo off
echo ==============================================================================
echo              HealthGuard Full-Stack Platform One-Click Setup
echo ==============================================================================

echo [1/3] Setting up Python Backend dependencies...
python -m pip install -r backend/requirements.txt

echo.
echo [2/3] Setting up Next.js Frontend dependencies...
cd frontend
call npm.cmd install
cd ..

echo.
echo [3/3] Running Backend End-to-End Test Suite...
python -m backend.test_api

echo.
echo ==============================================================================
echo Setup Completed! You can now start the services:
echo 1. Run scripts\start_backend.bat
echo 2. Run scripts\start_frontend.bat
echo 3. (Optional) Run scripts\start_hardhat.bat and scripts\deploy_contracts.bat
echo ==============================================================================
pause
