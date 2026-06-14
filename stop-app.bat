@echo off
chcp 65001 >nul
title 停止心声疗愈服务器

echo.
echo ========================================
echo    停止心声疗愈服务器
echo ========================================
echo.

set PORT=5173

echo 正在查找运行中的服务器 (端口 %PORT%)...
for /f "tokens=5" %%a in ('netstat -ano ^| find ":%PORT%" ^| find "LISTENING"') do (
    echo 找到进程 PID: %%a
    taskkill /PID %%a /F >nul 2>&1
    if not errorlevel 1 (
        echo ✅ 服务器已停止
    ) else (
        echo ⚠️ 停止失败，请手动结束进程
    )
)

echo.
echo 操作完成。
echo.
timeout /t 2 >nul
