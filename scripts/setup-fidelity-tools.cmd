@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-fidelity-tools.ps1" %*
exit /b %ERRORLEVEL%
