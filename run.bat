@echo off

:: 1. Mengaktifkan Virtual Environment
if exist .venv\Scripts\activate.bat (
    call .venv\Scripts\activate.bat
) else (
    echo Virtual Environment tidak ditemukan! Jalankan versi lengkap dulu sekali.
    pause
    exit /b
)

:: 2. Jalankan Server
uvicorn main:app --reload