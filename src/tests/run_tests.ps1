# Script PowerShell per i test automatizzati di I.Me.Con
$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:3000"
if ($args.Count -gt 0) {
    $baseUrl = $args[0]
}

Write-Host "====================================================" -ForegroundColor Blue
Write-Host "   AVVIO DEI TEST AUTOMATIZZATI POWERSHELL - I.ME.CON   " -ForegroundColor Blue
Write-Host "====================================================" -ForegroundColor Blue
Write-Host "Target URL: $baseUrl`n" -ForegroundColor Yellow

function Print-Result($success, $name) {
    if ($success) {
        Write-Host "  [OK] $name" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] $name" -ForegroundColor Red
        Cleanup-And-Exit $false
    }
}

function Cleanup-And-Exit($success) {
    Write-Host "`nEsecuzione pulizia dati di test (Cleanup)..." -ForegroundColor Yellow
    try {
        $cleanupRes = Invoke-RestMethod -Uri "$baseUrl/api/test/auth" -Method Delete
        if ($cleanupRes.success -eq $true) {
            Write-Host "  [OK] Cleanup database completato con successo" -ForegroundColor Green
        } else {
            Write-Host "  [FAIL] Errore durante il cleanup" -ForegroundColor Red
        }
    } catch {
        Write-Host "  [FAIL] Errore di connessione per il cleanup: $_" -ForegroundColor Red
    }

    if ($success) {
        Write-Host "`n====================================================" -ForegroundColor Green
        Write-Host "        TUTTI I TEST SONO PASSATI CON SUCCESSO!      " -ForegroundColor Green
        Write-Host "====================================================" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "`n====================================================" -ForegroundColor Red
        Write-Host "          TEST FALLITI. CONTROLLA I LOG IN ALTO.      " -ForegroundColor Red
        Write-Host "====================================================" -ForegroundColor Red
        exit 1
    }
}

# 1. Verifica raggiungibilità dell'applicazione
Write-Host "[1/6] Verifica raggiungibilità server Next.js..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/login" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Print-Result $true "Server attivo su $baseUrl"
    } else {
        Print-Result $false "Server attivo su $baseUrl (Status: $($response.StatusCode))"
    }
} catch {
    Write-Host "Errore di connessione: $_" -ForegroundColor Red
    Write-Host "Assicurati che il server Next.js sia attivo (es. esegui 'npm run dev')." -ForegroundColor Yellow
    exit 1
}

# 2. Esecuzione del Database Integrity & Seed Check
Write-Host "`n[2/6] Verifica integrità database ed esito seeding..." -ForegroundColor Yellow
npx tsx src/tests/verify-db.ts
if ($LASTEXITCODE -eq 0) {
    Print-Result $true "Integrità database verificata con successo"
} else {
    Print-Result $false "Errore durante la verifica del database"
}

# 2b. Esecuzione dei test unitari (Vitest)
Write-Host "`n[2b/6] Esecuzione dei test unitari con Vitest..." -ForegroundColor Yellow
npx vitest run
if ($LASTEXITCODE -eq 0) {
    Print-Result $true "Test unitari eseguiti con successo"
} else {
    Print-Result $false "Errore durante l'esecuzione dei test unitari"
}

# 3. Test delle rotte pubbliche (GET)
Write-Host "`n[3/6] Test delle rotte pubbliche..." -ForegroundColor Yellow

$routes = @("/", "/login", "/chi-siamo", "/dove-siamo", "/contatti")
foreach ($route in $routes) {
    try {
        $res = Invoke-WebRequest -Uri "$baseUrl$route" -UseBasicParsing -TimeoutSec 2
        Print-Result ($res.StatusCode -eq 200) "GET $route"
    } catch {
        Print-Result $false "GET $route (Errore: $_)"
    }
}

# 4. Test del Flusso di Autenticazione
Write-Host "`n[4/6] Test autenticazione (Registrazione, Duplicate check, Login)..." -ForegroundColor Yellow

# A. Controllo sessione iniziale (deve essere null)
Write-Host "  Controllo stato di sessione iniziale..."
try {
    $session = Invoke-RestMethod -Uri "$baseUrl/api/auth/me"
    Print-Result ($session.user -eq $null) "Inizialmente non autenticato"
} catch {
    Print-Result $false "Verifica sessione iniziale fallita: $_"
}

# B. Registrazione utente di test
Write-Host "  Registrazione nuovo utente..."
$headers = @{ "Content-Type" = "application/json" }
$regBody = @{
    action = "register"
    data = @{
        nomeCognome = "Test User"
        email = "test_user_unique@example.com"
        telefono = "3331234567"
        username = "test_user_unique"
        password = "testPassword123"
    }
} | ConvertTo-Json -Depth 5

try {
    $regRes = Invoke-RestMethod -Uri "$baseUrl/api/test/auth" -Method Post -Headers $headers -Body $regBody
    Print-Result ($regRes.success -eq $true) "Registrazione utente completata"
} catch {
    Print-Result $false "Registrazione fallita: $_"
}

# C. Tentativo registrazione duplicato (deve fallire)
Write-Host "  Tentativo registrazione duplicato..."
try {
    $regDupRes = Invoke-RestMethod -Uri "$baseUrl/api/test/auth" -Method Post -Headers $headers -Body $regBody
    Print-Result $false "Controllo duplicato email/username dovrebbe fallire"
} catch [System.Net.WebException] {
    # Ci aspettiamo 400 Bad Request
    $res = $_.Exception.Response
    $isBadRequest = ($res -ne $null -and [int]$res.StatusCode -eq 400)
    Print-Result $isBadRequest "Controllo duplicato email/username funzionante (atteso 400 Bad Request)"
} catch {
    Print-Result $false "Errore imprevisto sul duplicato: $_"
}

# D. Login utente di test (salvataggio cookie di sessione)
Write-Host "  Esecuzione login..."
$loginBody = @{
    action = "login"
    data = @{
        loginInput = "test_user_unique"
        password = "testPassword123"
    }
} | ConvertTo-Json -Depth 5

$webSession = $null
try {
    # Utilizziamo -SessionVariable per catturare automaticamente i cookie di sessione
    $loginRes = Invoke-RestMethod -Uri "$baseUrl/api/test/auth" -Method Post -Headers $headers -Body $loginBody -SessionVariable webSession
    Print-Result ($loginRes.success -eq $true) "Login riuscito e sessione acquisita"
} catch {
    Print-Result $false "Login fallito: $_"
}

# E. Verifica sessione attiva tramite cookie
Write-Host "  Verifica sessione attiva..."
try {
    $activeSession = Invoke-RestMethod -Uri "$baseUrl/api/auth/me" -WebSession $webSession
    Print-Result ($activeSession.user.username -eq "test_user_unique") "Utente autenticato rilevato correttamente: $($activeSession.user.nomeCognome)"
} catch {
    Print-Result $false "Sessione attiva non riconosciuta: $_"
}

# 5. Test di Creazione Pratica di Mediazione
Write-Host "`n[5/6] Test invio richiesta di mediazione..." -ForegroundColor Yellow

$medBody = @{
    areaId = 1
    materia = "Materia di Test"
    valore = "15000.00"
    valoreIndeterminato = "false"
    descrizioneFatti = "Descrizione di prova per i fatti di questa lite di test automatizzato."
    istanteTipo = "PF"
    istanteDenominazione = "Mario Rossi Istante"
    istanteCodiceFiscale = "TESTISTANTE12345"
    istanteEmail = "mario.rossi@test.it"
    istanteTelefono = "1234567890"
    haAvvocato = "true"
    avvocatoNome = "Avv. Luigi Bianchi"
    avvocatoCodiceFiscale = "TESTAVVOCATO1234"
    avvocatoEmail = "luigi.bianchi@test.it"
    convenutoTipo = "PG"
    convenutoDenominazione = "Azienda Convenuto S.R.L."
    convenutoCodiceFiscale = "TESTCONVENUTO123"
    convenutoEmail = "info@aziendatest.it"
    convenutoTelefono = "0987654321"
} | ConvertTo-Json -Depth 5

try {
    $medRes = Invoke-RestMethod -Uri "$baseUrl/api/test/mediation" -Method Post -Headers $headers -Body $medBody -WebSession $webSession
    if ($medRes.success -eq $true) {
        Print-Result $true "Invio richiesta mediazione riuscito"
        Write-Host "  Generato Protocollo: $($medRes.protocollo)" -ForegroundColor Green
    } else {
        Print-Result $false "Creazione mediazione fallita: $($medRes.error)"
    }
} catch {
    Print-Result $false "Richiesta mediazione fallita: $_"
}

# 5b. Test di Generazione PDF Riassuntivo Pratica ADR
Write-Host "`n[5b/6] Test di generazione PDF riassuntivo..." -ForegroundColor Yellow
$newMediationId = $medRes.id

# A. Tentativo di accesso come utente standard (deve fallire con 403 Forbidden)
Write-Host "  Accesso al PDF come utente standard..."
try {
    $pdfRes = Invoke-WebRequest -Uri "$baseUrl/api/gestionale/pdf-riassunto?id=$newMediationId" -WebSession $webSession -UseBasicParsing
    Print-Result $false "L'utente standard non dovrebbe poter accedere al PDF"
} catch [System.Net.WebException] {
    $res = $_.Exception.Response
    $isForbidden = ($res -ne $null -and [int]$res.StatusCode -eq 403)
    Print-Result $isForbidden "Accesso negato correttamente per utente standard (atteso 403 Forbidden)"
} catch {
    Print-Result $false "Errore imprevisto durante l'accesso al PDF: $_"
}

# B. Promozione utente a Amministratore
Write-Host "  Promozione utente a ruolo Amministratore..."
$promoteBody = @{
    action = "promoteToAdmin"
    data = @{
        username = "test_user_unique"
    }
} | ConvertTo-Json -Depth 5

try {
    $promoteRes = Invoke-RestMethod -Uri "$baseUrl/api/test/auth" -Method Post -Headers $headers -Body $promoteBody
    Print-Result ($promoteRes.success -eq $true) "Utente promosso ad Amministratore con successo"
} catch {
    Print-Result $false "Promozione utente fallita: $_"
}

# C. Accesso al PDF come Amministratore (deve riuscire)
Write-Host "  Accesso al PDF come Amministratore..."
try {
    $pdfRes = Invoke-WebRequest -Uri "$baseUrl/api/gestionale/pdf-riassunto?id=$newMediationId" -WebSession $webSession -UseBasicParsing
    $contentType = $pdfRes.Headers["Content-Type"]
    $isPdf = ($pdfRes.StatusCode -eq 200 -and $contentType -eq "application/pdf")
    Print-Result $isPdf "PDF scaricato con successo (Status 200, Content-Type: application/pdf)"
} catch {
    Print-Result $false "Accesso al PDF come Amministratore fallito: $_"
}

# 6. Esecuzione Cleanup Dati di Test
Cleanup-And-Exit $true
