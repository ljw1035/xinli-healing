@echo off
chcp 65001 >nul

echo 正在创建桌面快捷方式...

set SCRIPT="%TEMP%\create-shortcut.vbs"
set ICON_PATH=%~dp0icon.ico

if not exist "%ICON_PATH%" (
    copy "%~dp0public\icon-192.svg" "%~dp0icon.svg" >nul 2>&1
)

echo Set oWS = WScript.CreateObject("WScript.Shell") >> %SCRIPT%
echo sLinkFile = "%USERPROFILE%\Desktop\心声疗愈.lnk" >> %SCRIPT%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT%
echo oLink.TargetPath = "%~dp0start-app.vbs" >> %SCRIPT%
echo oLink.WorkingDirectory = "%~dp0" >> %SCRIPT%
echo oLink.Description = "心声疗愈 - AI心理辅导智能体" >> %SCRIPT%
echo oLink.Save >> %SCRIPT%

cscript /nologo %SCRIPT%
del %SCRIPT%

echo.
echo ✅ 桌面快捷方式已创建：%USERPROFILE%\Desktop\心声疗愈.lnk
echo.
pause
