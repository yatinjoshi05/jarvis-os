@echo off
setlocal
cd /d "%~dp0..\..\services\backend"
node src\server.js
