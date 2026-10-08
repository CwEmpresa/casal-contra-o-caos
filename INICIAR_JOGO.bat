@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo CASAL CONTRA O CAOS - VERSAO 3D
where node >nul 2>nul
if errorlevel 1 (
  echo Instale o Node.js 22 ou superior em https://nodejs.org e abra este arquivo novamente.
  pause
  exit /b 1
)
echo Preparando o jogo. Na primeira vez, voce precisa estar conectado a internet.
call npm ci --omit=dev
if errorlevel 1 (
  echo Nao foi possivel instalar as dependencias. Confira a conexao e a versao do Node.js.
  pause
  exit /b 1
)
node scripts/start-local.js
pause
