@echo off
REM Script para ejecutar el shop-scraper automáticamente
REM Este script se ejecutará mediante el Programador de tareas de Windows

cd /d "%~dp0"

echo ========================================
echo Shop Scraper - Ejecucion automatica
echo Fecha: %date% %time%
echo ========================================

REM Ejecutar el proyecto con Node.js
node src\index.js

REM Registrar el resultado
if %ERRORLEVEL% EQU 0 (
    echo [OK] Ejecucion completada exitosamente
) else (
    echo [ERROR] La ejecucion fallo con codigo: %ERRORLEVEL%
)

echo ========================================
echo Fin de la ejecucion
echo ========================================
