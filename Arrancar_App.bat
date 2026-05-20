@echo off
echo ===================================================
echo     INICIANDO NSD INTERNATIONAL FINANCE
echo ===================================================
echo.
echo Preparando el entorno portable... (Bypass de permisos)
set PATH=%~dp0..\node-portable\node-v20.11.1-win-x64;%PATH%

echo.
echo Verificando e instalando componentes de React (esto puede tardar la primera vez)...
call npm install

echo.
echo Todo listo! Arrancando el dashboard web...
echo (Abre tu navegador en el enlace Local que aparecera abajo, normalmente http://localhost:5173)
echo.
call npm run dev
pause
