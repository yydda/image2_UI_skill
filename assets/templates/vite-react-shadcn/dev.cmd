@echo off
setlocal
cd /d "%~dp0"
node scripts\start-dev-server.mjs %*
set EXIT_CODE=%ERRORLEVEL%
if exist tmp\dev-server.json (
  node -e "const fs=require('fs'); const report=JSON.parse(fs.readFileSync('tmp/dev-server.json','utf8').replace(/^\uFEFF/,'')); if (report.url) console.log(report.url);"
)
exit /b %EXIT_CODE%
