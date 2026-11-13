@echo off
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
  echo Hay tao moi truong Python theo README.md truoc.
  pause
  exit /b 1
)
if not exist ".env" (
  echo Hay tao va dien .env theo README.md truoc.
  pause
  exit /b 1
)
.venv\Scripts\python.exe -m uvicorn app:app --host 127.0.0.1 --port 8000
pause
