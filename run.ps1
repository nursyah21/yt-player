# 1. Mengaktifkan Virtual Environment
if (Test-Path ".\.venv\Scripts\Activate.ps1") {
    & ".\.venv\Scripts\Activate.ps1"
} else {
    Write-Host "Virtual Environment tidak ditemukan! Jalankan versi lengkap dulu sekali." -ForegroundColor Red
    exit
}

# 2. Jalankan Server
$env:RELOAD = "true"
python main.py