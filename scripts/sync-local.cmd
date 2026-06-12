@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0sync-local.ps1" %*
exit /b %ERRORLEVEL%
