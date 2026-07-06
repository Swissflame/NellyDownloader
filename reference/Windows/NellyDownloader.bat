@echo off
setlocal
title Nelly Downloader
cd /d "%~dp0"
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0NellyDownloader.ps1"
endlocal
