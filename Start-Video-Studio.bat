@echo off
TITLE Video Studio Launcher
echo =======================================
echo    MENJALANKAN SERVER VIDEO STUDIO
echo =======================================
echo.

:: Masuk ke folder project
cd /d "c:\Users\FUJITSU\yt-studio"

:: Jalankan server menggunakan python langsung dari venv (paling cepat, tanpa reload)
echo 1. Memulai server (Fast Mode)...
start "YT-Studio-Server" .\.venv\Scripts\python.exe main.py

:: Tunggu sebentar agar server siap
echo 2. Menunggu server siap dimuat (2 detik)...
timeout /t 2 /nobreak > nul

:: Buka browser
echo 3. Membuka aplikasi di browser...
start http://localhost:8000

echo.
echo Selesai! Selamat menonton.
echo Jendela server akan tetap terbuka di background.
timeout /t 2 > nul
exit
