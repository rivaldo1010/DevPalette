@echo off
REM Script de backup manual para tu proyecto
setlocal enabledelayedexpansion

REM Obtener fecha y hora en formato YYYY-MM-DD_HH-MM-SS
for /f "tokens=2 delims==." %%I in ('wmic OS Get localdatetime /value') do set datetime=%%I
set date=!datetime:~0,4!-!datetime:~4,2!-!datetime:~6,2!_!datetime:~8,2!-!datetime:~10,2!-!datetime:~12,2!

REM Crear carpeta de backups si no existe
if not exist "backups" mkdir "backups"

REM Copiar todo el proyecto a la carpeta de backup con fecha y hora
xcopy . "backups\backup_!date!" /E /I /H /C /Y /EXCLUDE:backup_manual.bat

REM Mensaje de éxito
echo Backup completado en backups\backup_!date!
pause
