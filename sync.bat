@echo off
title Synchronisation Contexte Prive - Azim404
color 0b
echo ========================================================
echo   Synchronisation du Contexte Prive sur tous les projets
echo ========================================================
echo.
cd /d "%~dp0"
node scripts/sync-local-context.mjs
echo.
echo Termine. Appuyez sur une touche pour quitter.
pause > nul
