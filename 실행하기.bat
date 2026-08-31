@echo off
chcp 65001 > nul
title 마트 가격 나침반 실시간 서버
echo ======================================================
echo  🛒 마트 vs 온라인 실시간 가격비교 서버를 시작합니다...
echo  👉 브라우저가 자동으로 열립니다! (http://localhost:3000)
echo ======================================================
echo.

cd /d "%~dp0"

:: 1초 후 브라우저 자동 실행
start http://localhost:3000

:: 백엔드 크롤러 서버 구동
"C:\Program Files\nodejs\node.exe" server.js

pause
