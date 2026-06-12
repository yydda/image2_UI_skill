@echo off
setlocal
cd /d "%~dp0"
call npm.cmd run architecture:check || exit /b %ERRORLEVEL%
call npm.cmd run typecheck || exit /b %ERRORLEVEL%
call npm.cmd run build || exit /b %ERRORLEVEL%
