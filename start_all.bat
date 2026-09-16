@echo off
title StockSikh Launcher
echo ===================================================
echo             Starting StockSikh Platform
echo        Groww-Inspired UI + FastAPI + SQLite
echo ===================================================
echo.

cd /d "%~dp0backend"
start "StockSikh Backend (Port 8000)" cmd /k "python -m uvicorn main:app --reload --port 8000"

timeout /t 2 >nul

cd /d "%~dp0frontend"
start "StockSikh Frontend (Port 3000)" cmd /k "npm start"

echo.
echo Backend running on http://127.0.0.1:8000
echo Frontend starting on http://localhost:3000
echo.
echo Enjoy StockSikh!
