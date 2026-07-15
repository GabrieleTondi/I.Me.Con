#!/usr/bin/env bash

# Configurazione colori
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL=${1:-"http://localhost:3000"}
COOKIE_FILE="src/tests/cookies.txt"

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}   AVVIO DEI TEST AUTOMATIZZATI BASH - I.ME.CON   ${NC}"
echo -e "${BLUE}====================================================${NC}"
echo -e "Target URL: ${YELLOW}${BASE_URL}${NC}\n"

# Funzione ausiliaria per stampare esito
print_result() {
  local exit_code=$1
  local name=$2
  if [ $exit_code -eq 0 ]; then
    echo -e "  [${GREEN}OK${NC}] ${name}"
  else
    echo -e "  [${RED}FAIL${NC}] ${name}"
    cleanup_and_exit 1
  fi
}

cleanup_and_exit() {
  local exit_code=$1
  if [ -f "$COOKIE_FILE" ]; then
    echo -e "\n${YELLOW}Rimozione del cookie file temporaneo...${NC}"
    rm -f "$COOKIE_FILE"
  fi
  if [ $exit_code -eq 0 ]; then
    echo -e "\n${GREEN}====================================================${NC}"
    echo -e "${GREEN}        TUTTI I TEST SONO PASSATI CON SUCCESSO!      ${NC}"
    echo -e "${GREEN}====================================================${NC}"
  else
    echo -e "\n${RED}====================================================${NC}"
    echo -e "${RED}          TEST FALLITI. CONTROLLA I LOG IN ALTO.      ${NC}"
    echo -e "${RED}====================================================${NC}"
  fi
  exit $exit_code
}

# 1. Verifica raggiungibilità dell'applicazione
echo -e "${YELLOW}[1/6] Verifica raggiungibilità server Next.js...${NC}"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/login")

if [ "$HTTP_STATUS" -ne 200 ]; then
  echo -e "${RED}Errore: L'applicazione non è raggiungibile su ${BASE_URL} (Status: ${HTTP_STATUS}).${NC}"
  echo -e "Assicurati che il server Next.js sia attivo (es. esegui 'npm run dev')."
  exit 1
fi
print_result 0 "Server attivo su ${BASE_URL}"

# 2. Esecuzione del Database Integrity & Seed Check
echo -e "\n${YELLOW}[2/6] Verifica integrità database ed esito seeding...${NC}"
npx tsx src/tests/verify-db.ts
print_result $? "Integrità database verificata con successo"

# 3. Test delle rotte pubbliche (GET)
echo -e "\n${YELLOW}[3/6] Test delle rotte pubbliche...${NC}"

curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/" | grep -q "200"
print_result $? "GET / (Home page)"

curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/login" | grep -q "200"
print_result $? "GET /login (Pagina di login)"

curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/chi-siamo" | grep -q "200"
print_result $? "GET /chi-siamo (Pagina chi siamo)"

curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/dove-siamo" | grep -q "200"
print_result $? "GET /dove-siamo (Pagina sedi/mappa)"

curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/contatti" | grep -q "200"
print_result $? "GET /contatti (Pagina contatti)"

# 4. Test del Flusso di Autenticazione
echo -e "\n${YELLOW}[4/6] Test autenticazione (Registrazione, Duplicate check, Login)...${NC}"

# A. Controllo sessione iniziale (deve essere null)
echo "  Controllo stato di sessione iniziale..."
INITIAL_SESSION=$(curl -s "$BASE_URL/api/auth/me")
echo "$INITIAL_SESSION" | grep -q '"user":null'
print_result $? "Inizialmente non autenticato"

# B. Registrazione utente di test
echo "  Registrazione nuovo utente..."
REG_BODY='{"action":"register","data":{"nomeCognome":"Test User","email":"test_user_unique@example.com","telefono":"3331234567","username":"test_user_unique","password":"testPassword123"}}'
REG_RES=$(curl -s -X POST -H "Content-Type: application/json" -d "$REG_BODY" "$BASE_URL/api/test/auth")
echo "$REG_RES" | grep -q '"success":true'
print_result $? "Registrazione utente completata"

# C. Tentativo registrazione duplicato (deve fallire)
echo "  Tentativo registrazione duplicato..."
REG_DUP_RES=$(curl -s -X POST -H "Content-Type: application/json" -d "$REG_BODY" "$BASE_URL/api/test/auth")
echo "$REG_DUP_RES" | grep -q '"success":false'
print_result $? "Controllo duplicato email/username funzionante"

# D. Login utente di test (salvataggio cookie di sessione)
echo "  Esecuzione login..."
LOGIN_BODY='{"action":"login","data":{"loginInput":"test_user_unique","password":"testPassword123"}}'
LOGIN_RES=$(curl -s -c "$COOKIE_FILE" -X POST -H "Content-Type: application/json" -d "$LOGIN_BODY" "$BASE_URL/api/test/auth")
echo "$LOGIN_RES" | grep -q '"success":true'
print_result $? "Login riuscito e cookie memorizzato"

# E. Verifica sessione attiva tramite cookie
echo "  Verifica sessione attiva..."
ACTIVE_SESSION=$(curl -s -b "$COOKIE_FILE" "$BASE_URL/api/auth/me")
echo "$ACTIVE_SESSION" | grep -q '"username":"test_user_unique"'
print_result $? "Utente autenticato rilevato correttamente"

# 5. Test di Creazione Pratica di Mediazione
echo -e "\n${YELLOW}[5/6] Test invio richiesta di mediazione...${NC}"

MED_BODY='{
  "areaId": 1,
  "materia": "Materia di Test",
  "valore": "15000.00",
  "valoreIndeterminato": "false",
  "descrizioneFatti": "Descrizione di prova per i fatti di questa lite di test automatizzato.",
  "istanteTipo": "PF",
  "istanteDenominazione": "Mario Rossi Istante",
  "istanteCodiceFiscale": "TESTISTANTE12345",
  "istanteEmail": "mario.rossi@test.it",
  "istanteTelefono": "1234567890",
  "haAvvocato": "true",
  "avvocatoNome": "Avv. Luigi Bianchi",
  "avvocatoCodiceFiscale": "TESTAVVOCATO1234",
  "avvocatoEmail": "luigi.bianchi@test.it",
  "convenutoTipo": "PG",
  "convenutoDenominazione": "Azienda Convenuto S.R.L.",
  "convenutoCodiceFiscale": "TESTCONVENUTO123",
  "convenutoEmail": "info@aziendatest.it",
  "convenutoTelefono": "0987654321"
}'

MED_RES=$(curl -s -b "$COOKIE_FILE" -X POST -H "Content-Type: application/json" -d "$MED_BODY" "$BASE_URL/api/test/mediation")
echo "$MED_RES" | grep -q '"success":true'
print_result $? "Invio richiesta mediazione riuscito"

PROTOCOLLO=$(echo "$MED_RES" | sed -n 's/.*"protocollo":"\([^"]*\)".*/\1/p')
echo -e "  Generato Protocollo: ${GREEN}${PROTOCOLLO}${NC}"

# 6. Esecuzione Cleanup Dati di Test
echo -e "\n${YELLOW}[6/6] Esecuzione pulizia dati di test (Cleanup)...${NC}"
CLEANUP_RES=$(curl -s -X DELETE "$BASE_URL/api/test/auth")
echo "$CLEANUP_RES" | grep -q '"success":true'
print_result $? "Cleanup database completato con successo"

cleanup_and_exit 0
