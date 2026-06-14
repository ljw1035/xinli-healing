@echo off
chcp 65001 >nul
title 心声疗愈 - 启动中...

REM ========================================
REM 心声疗愈 - AI心理辅导智能体 启动脚本
REM ========================================

echo.
echo ========================================
echo    💖 心声疗愈 - AI心理辅导智能体
echo ========================================
echo.

REM 设置端口
set PORT=5173

REM 检查 Node.js 是否安装
where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [错误] 未检测到 Node.js！
    echo.
    echo 请先安装 Node.js: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [1/4] ✓ Node.js 已检测 (v%node_version%)
echo.

REM 检查 dist 目录是否存在
if not exist "%~dp0dist\index.html" (
    color 0E
    echo [警告] 未检测到构建文件 (dist 目录不存在)
    echo 正在自动构建项目...
    echo.
    cd /d "%~dp0"
    call npm run build
    if %errorlevel% neq 0 (
        color 0C
        echo [错误] 构建失败！
        pause
        exit /b 1
    )
    echo.
)

echo [2/4] ✓ 构建文件已就绪
echo.

REM 检查端口是否被占用
netstat -ano | find ":%PORT%" | find "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [3/4] ⚡ 服务器已在运行 (端口 %PORT%)
    echo.
    echo [4/4] 正在打开浏览器...
    timeout /t 1 >nul
    start http://localhost:%PORT%
    echo.
    echo ========================================
    echo    ✅ 应用已打开，请查看浏览器
    echo ========================================
    echo.
    timeout /t 3 >nul
    exit /b 0
)

echo [3/4] 正在启动服务器...
echo.

REM 启动静态服务器（后台运行）
start /min cmd /c "node ""%~dp0server.js"""

REM 等待服务器启动
echo [4/4] 等待服务器启动...
timeout /t 2 >nul

REM 打开浏览器
echo.
echo 正在打开浏览器...
start http://localhost:%PORT%

echo.
echo ========================================
echo    ✅ 应用已启动
echo ========================================
echo.
echo 服务器正在后台运行...
echo 关闭此窗口不会停止服务器
echo.
echo 如需停止服务器，请打开任务管理器结束 "node.exe" 进程
echo.
timeout /t 5 >nul
