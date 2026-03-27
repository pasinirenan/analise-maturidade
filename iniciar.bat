@echo off
title Analisador de Maturidade de Inovacao
color 0A

echo.
echo ========================================
echo    Analisador de Maturidade de Inovacao
echo ========================================
echo.

cd /d "%~dp0"

if not exist "node_modules" (
    echo [1/2] Instalando dependencias...
    npm install
    echo.
)

echo [2/2] Iniciando servidor...
echo.
echo    Acesse: http://localhost:3000
echo.
echo Pressione Ctrl+C para parar o servidor
echo.

npm start

pause
