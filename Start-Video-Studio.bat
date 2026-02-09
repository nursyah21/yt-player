@echo off
TITLE Video Studio Launcher
echo =======================================
echo    MENJALANKAN SERVER VIDEO STUDIO
echo =======================================
echo.

:: Masuk ke folder project
cd /d "%~dp0"

:: Cek apakah port 8000-8005 sudah ada yang dengerin (asumsi itu server kita)
echo 1. Memeriksa apakah server sudah berjalan...

set PORT=8000
:check_port
netstat -ano | findstr LISTENING | findstr :%PORT% > nul
if %errorlevel% equ 0 (
    echo [OK] Server ditemukan berjalan di port %PORT%.
    goto open_browser
)
set /a PORT=%PORT%+1
if %PORT% leq 8005 goto check_port

:: Jika tidak ada yang jalan, nyalakan server baru
echo [!] Server belum jalan. Memulai server baru...
start "YT-Studio-Server" node server.js
echo Menunggu inisialisasi server (3 detik)...
timeout /t 3 /nobreak > nul
set PORT=8000

:open_browser
echo 2. Membuka aplikasi di browser (Port %PORT%)...
start http://localhost:%PORT%

echo.
echo Selesai! Selamat menonton.
timeout /t 2 > nul
exit
