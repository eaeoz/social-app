@echo off
echo Starting Blog Articles Manager...
echo.
echo Opening browser at http://localhost:3000/blog-articles-standalone.html
echo.
echo Press Ctrl+C to stop the server
echo.
start http://localhost:3000/blog-articles-standalone.html
npx serve -l 3000
