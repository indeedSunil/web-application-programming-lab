@echo off
echo =============================================
echo   TaskFlow — Django REST + React CRUD App
echo =============================================
echo.

:: Navigate to backend
cd /d "%~dp0backend"

echo [1/4] Creating Python virtual environment...
python -m venv venv

echo [2/4] Activating virtual environment...
call venv\Scripts\activate.bat

echo [3/4] Installing dependencies...
pip install -r requirements.txt

echo [4/4] Running migrations and starting server...
python manage.py makemigrations
python manage.py migrate
python manage.py migrate --run-syncdb

echo.
echo =============================================
echo  [4/4] Starting Django Server and Vite...
echo =============================================
echo.

:: Start Vite dev server in a new command window
echo Starting Frontend React App on port 5173...
pushd "%~dp0frontend"
start cmd /k "npm run dev"
popd

echo Starting Backend API at http://127.0.0.1:8000
python manage.py runserver
