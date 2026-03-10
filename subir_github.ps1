# ============================================
# Subir Webapp-Cotizador a GitHub
# ============================================

$ErrorActionPreference = "Stop"

# --- CONFIGURACION ---
$repoName = "cotizador-suminregio"   # <-- Cambia si quieres otro nombre
$branch = "main"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SUBIR WEBAPP A GITHUB" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que git esta instalado
try {
    $gitVersion = git --version 2>&1
    Write-Host "[OK] Git encontrado: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Git no esta instalado. Descargalo de https://git-scm.com" -ForegroundColor Red
    Read-Host "Presiona Enter para cerrar"
    exit 1
}

# Verificar que gh (GitHub CLI) esta instalado
$ghInstalled = $false
try {
    $ghVersion = gh --version 2>&1 | Select-Object -First 1
    Write-Host "[OK] GitHub CLI encontrado: $ghVersion" -ForegroundColor Green
    $ghInstalled = $true
} catch {
    Write-Host "[AVISO] GitHub CLI (gh) no esta instalado." -ForegroundColor Yellow
    Write-Host "        Sin gh, tendras que crear el repo manualmente en github.com" -ForegroundColor Yellow
}

# Ir a la carpeta del proyecto
$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectPath
Write-Host ""
Write-Host "Carpeta del proyecto: $projectPath" -ForegroundColor Cyan

# Verificar si ya es un repo git
$isGitRepo = Test-Path ".git"

if (-not $isGitRepo) {
    Write-Host ""
    Write-Host "Inicializando repositorio Git..." -ForegroundColor Yellow
    git init
    git branch -M $branch
    Write-Host "[OK] Repositorio inicializado" -ForegroundColor Green
} else {
    Write-Host "[OK] Ya es un repositorio Git" -ForegroundColor Green
}

# Verificar .gitignore
if (-not (Test-Path ".gitignore")) {
    Write-Host "Creando .gitignore..." -ForegroundColor Yellow
    "Shopify/" | Out-File -FilePath ".gitignore" -Encoding utf8
}

# Agregar todos los archivos
Write-Host ""
Write-Host "Agregando archivos..." -ForegroundColor Yellow
git add -A
Write-Host "[OK] Archivos agregados" -ForegroundColor Green

# Mostrar que se va a subir
Write-Host ""
Write-Host "Archivos a subir:" -ForegroundColor Cyan
git status --short

# Hacer commit
Write-Host ""
Write-Host "Creando commit..." -ForegroundColor Yellow
git commit -m "Fase 1: Dark theme unificado + platform-nav + design system"
Write-Host "[OK] Commit creado" -ForegroundColor Green

# Crear repo en GitHub si gh esta disponible
if ($ghInstalled) {
    Write-Host ""
    $crear = Read-Host "Crear repositorio '$repoName' en GitHub? (s/n)"
    if ($crear -eq "s" -or $crear -eq "S") {
        $visibilidad = Read-Host "Publico o privado? (pub/priv)"
        if ($visibilidad -eq "priv") {
            gh repo create $repoName --private --source=. --remote=origin --push
        } else {
            gh repo create $repoName --public --source=. --remote=origin --push
        }
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  LISTO! Repo subido a GitHub" -ForegroundColor Green
        Write-Host "  https://github.com/$(gh api user --jq '.login')/$repoName" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
    }
} else {
    Write-Host ""
    Write-Host "--- PASOS MANUALES ---" -ForegroundColor Yellow
    Write-Host "1. Ve a https://github.com/new" -ForegroundColor White
    Write-Host "2. Crea un repo llamado: $repoName" -ForegroundColor White
    Write-Host "3. NO marques 'Initialize with README'" -ForegroundColor White
    Write-Host "4. Copia la URL del repo y ejecuta:" -ForegroundColor White
    Write-Host ""
    Write-Host "   git remote add origin https://github.com/TU_USUARIO/$repoName.git" -ForegroundColor Cyan
    Write-Host "   git push -u origin main" -ForegroundColor Cyan
}

Write-Host ""
Read-Host "Presiona Enter para cerrar"
