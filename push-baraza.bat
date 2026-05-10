@echo off
cd /d "C:\Users\USER\Downloads\baraza-protocol"
echo Current HEAD:
git log --oneline -1
echo.
echo Pushing to GitHub...
git push origin main
echo.
echo Exit code: %ERRORLEVEL%
echo Done! Check Vercel dashboard for deployment.
pause
