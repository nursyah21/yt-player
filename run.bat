@echo off

:: Check if node_modules exists, if not install dependencies
if not exist node_modules (
    echo Installing dependencies...
    pnpm install
)

:: Run the Node.js server
echo Starting YT-Studio Server (Node.js)...
pnpm start