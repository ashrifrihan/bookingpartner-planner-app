@echo off
cls
echo BookingPartner Planner - Local Demo
echo.
echo Installing packages...
call npm install
if errorlevel 1 goto :error
echo.
echo Starting website at http://localhost:3000
call npm run dev
goto :end
:error
echo.
echo Something failed. Make sure Node.js and internet access for npm are available.
pause
:end
