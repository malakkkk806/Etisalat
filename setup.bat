@echo off
echo ================================
echo Etisalat UPG Payment Gateway Setup
echo ================================
echo.

echo Installing Node.js dependencies...
call npm install

echo.
echo ================================
echo Setup Complete!
echo ================================
echo.
echo To start the server:
echo   npm start       (production mode)
echo   npm run dev     (development mode)
echo.
echo Default URL: http://localhost:3000
echo.
echo Remember to update your merchant credentials in server.js:
echo   - MERCHANT_ID
echo   - TERMINAL_ID  
echo   - MERCHANT_SECRET_KEY
echo.
pause
