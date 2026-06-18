@echo off
echo Starting DiffView server...
start http://localhost:4173
npx --yes vite preview --port 4173
pause
