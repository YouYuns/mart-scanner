@echo off
chcp 65001 > nul
echo ========================================================
echo 🚀 마트나침반 Vercel 실시간 자동 배포 스크립트
echo ========================================================
echo.

set /p msg="배포할 작업 내용을 입력하세요 (엔터치면 기본값 적용): "
if "%msg%"=="" set msg=업데이트 배포

echo.
echo [1/3] 변경된 파일들을 Git에 담는 중...
"C:\Program Files\Git\cmd\git.exe" add .

echo.
echo [2/3] 변경사항 커밋 중: "%msg%"
"C:\Program Files\Git\cmd\git.exe" commit -m "%msg%"

echo.
echo [3/3] GitHub 및 Vercel로 업로드 중...
"C:\Program Files\Git\cmd\git.exe" push origin main

echo.
echo ========================================================
echo 🎉 배포 완료! 10초 후 https://mart-compass.vercel.app 에 자동 반영됩니다.
echo ========================================================
pause
