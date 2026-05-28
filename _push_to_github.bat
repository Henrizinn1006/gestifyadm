@echo off
echo ============================================
echo   Gestify - Enviando codigo para o GitHub
echo ============================================
echo.

cd /d "C:\Users\htava\Documents\Claude\Projects\gestifyadm"

:: Remove .git corrompido se existir
if exist ".git" (
    echo Removendo git anterior...
    rmdir /s /q .git
)

:: Configura git
git config --global user.email "htavares803@gmail.com"
git config --global user.name "Henrizinn1006"

:: Inicializa o repositorio
echo Inicializando repositorio...
git init
git branch -M main

:: Adiciona todos os arquivos
echo Adicionando arquivos...
git add .
git commit -m "feat: primeiro commit - Gestify ADM"

:: Conecta ao GitHub e envia
echo.
echo Enviando para o GitHub...
echo (Uma janela de login pode aparecer - use sua conta GitHub)
echo.
git remote add origin https://github.com/Henrizinn1006/gestifyadm.git
git push -u origin main

echo.
echo ============================================
if %ERRORLEVEL% EQU 0 (
    echo   SUCESSO! Codigo enviado para o GitHub.
) else (
    echo   ERRO no push. Verifique o login e tente de novo.
)
echo ============================================
pause
