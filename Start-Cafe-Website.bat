@echo off
setlocal

set "PROJECT_DIR=%~dp0"
set "PHP_EXE=C:\wamp64\bin\php\php8.2.0\php.exe"
set "MYSQL_EXE=C:\MAMP\bin\mysql\bin\mysqld.exe"
set "MYSQL_INI=C:\MAMP\conf\mysql\my.ini"
set "SITE_URL=http://localhost:8000/HTML/Login.html"

echo Starting Cafe Aroma website...
echo.

if not exist "%PHP_EXE%" (
  echo ERROR: PHP was not found at:
  echo %PHP_EXE%
  echo.
  pause
  exit /b 1
)

if not exist "%MYSQL_EXE%" (
  echo ERROR: MySQL was not found at:
  echo %MYSQL_EXE%
  echo.
  pause
  exit /b 1
)

netstat -ano | findstr ":3306 " >nul
if errorlevel 1 (
  echo Starting MySQL database...
  start "Cafe Aroma MySQL" /min "%MYSQL_EXE%" --defaults-file="%MYSQL_INI%"
  timeout /t 5 /nobreak >nul
) else (
  echo MySQL database is already running.
)

netstat -ano | findstr ":8000 " >nul
if errorlevel 1 (
  echo Starting PHP server on localhost:8000...
  start "Cafe Aroma PHP Server" /min "%PHP_EXE%" -S localhost:8000 -t "%PROJECT_DIR%"
  timeout /t 2 /nobreak >nul
) else (
  echo PHP server is already running on localhost:8000.
)

echo.
echo Opening website...
start "" "%SITE_URL%"
echo.
echo Keep the PHP server window open while using the project.
echo Login: admin / cafe123
echo.
pause

