import { test, expect } from "@playwright/test";

test.describe("Flusso di Richiesta di Mediazione (E2E)", () => {
  
  test.beforeEach(async ({ request }) => {
    // Pulisci i dati di test prima di ogni esecuzione
    await request.delete("/api/test/auth");
  });

  test.afterAll(async ({ request }) => {
    // Pulisci i dati anche al termine del ciclo di test
    await request.delete("/api/test/auth");
  });

  test("Dovrebbe compilare tutti gli step del wizard di mediazione e ottenere un protocollo", async ({ page }) => {
    // 1. Registra e logga l'utente per assicurare la sessione attiva
    await page.goto("/login");
    await page.getByRole("button", { name: "Registrati", exact: true }).click();
    await page.locator('input[name="nomeCognome"]').fill("E2E Mediator User");
    await page.locator('input[name="email"]').fill("test_user_unique@example.com");
    await page.locator('input[name="username"]').fill("test_user_unique");
    await page.locator('input[name="password"]').fill("testPassword123");
    await page.locator('button[type="submit"]').click();
    await page.waitForURL("/");

    // 2. Naviga alla pagina dei contatti
    await page.goto("/contatti");
    await expect(page.locator("h1")).toContainText("Contatto");

    // 3. STEP 1: Dati della Controversia
    // Seleziona la materia
    await page.locator('select[name="materia"]').selectOption("Condominio");
    
    // Inserisci il valore stimato
    await page.locator('input[name="valore"]').fill("12500.50");
    
    // Inserisci la descrizione dei fatti
    await page.locator('textarea[name="descrizioneFatti"]').fill("Descrizione dettagliata dei fatti di causa effettuata tramite un test di automazione Playwright E2E.");
    
    // Prosegui al secondo step
    await page.getByRole("button", { name: /prosegui/i }).click();

    // 4. STEP 2: Dati Istante
    await page.locator('input[name="istanteDenominazione"]').fill("Mario Rossi Istante");
    await page.locator('input[name="istanteCodiceFiscale"]').fill("TESTISTANTE12345");
    await page.locator('input[name="istanteEmail"]').fill("mario.rossi@test.it");
    await page.locator('input[name="istanteTelefono"]').fill("3331112222");
    await page.locator('input[name="istanteDataNascita"]').fill("1985-06-15");
    await page.locator('input[name="istanteIndirizzo"]').fill("Via Garibaldi 10");
    await page.locator('input[name="istanteComune"]').fill("Torino");
    await page.locator('input[name="istanteCap"]').fill("10100");
    await page.locator('input[name="istanteProvincia"]').fill("TO");
    
    // Prosegui al terzo step
    await page.getByRole("button", { name: /prosegui/i }).click();

    // 5. STEP 3: Dati Convenuto
    await page.locator('input[name="convenutoDenominazione"]').fill("Luigi Verdi Convenuto");
    await page.locator('input[name="convenutoCodiceFiscale"]').fill("TESTCONVENUTO123");
    await page.locator('input[name="convenutoEmail"]').fill("luigi.verdi@test.it");
    await page.locator('input[name="convenutoTelefono"]').fill("3334445555");
    await page.locator('input[name="convenutoDataNascita"]').fill("1978-11-20");
    await page.locator('input[name="convenutoIndirizzo"]').fill("Corso Italia 50");
    await page.locator('input[name="convenutoComune"]').fill("Bologna");
    await page.locator('input[name="convenutoCap"]').fill("40100");
    await page.locator('input[name="convenutoProvincia"]').fill("BO");
    
    // Prosegui al quarto step (Riepilogo)
    await page.getByRole("button", { name: /prosegui/i }).click();

    // 6. STEP 4: Riepilogo e invio definitivo
    // Verifica che i dati inseriti siano mostrati nel riepilogo
    await expect(page.locator("body")).toContainText("Mario Rossi Istante");
    await expect(page.locator("body")).toContainText("Nato/a il: 1985-06-15");
    await expect(page.locator("body")).toContainText("Residenza/Sede: Via Garibaldi 10, 10100 Torino (TO)");
    await expect(page.locator("body")).toContainText("Luigi Verdi Convenuto");
    await expect(page.locator("body")).toContainText("Nato/a il: 1978-11-20");
    await expect(page.locator("body")).toContainText("Residenza/Sede: Corso Italia 50, 40100 Bologna (BO)");
    
    // Clicca sul pulsante di deposito finale
    await page.getByRole("button", { name: /deposita richiesta/i }).click();

    // 7. Verifica schermata di successo con il numero di protocollo generato
    const successHeader = page.getByRole("heading", { name: "Domanda di Mediazione Depositata!" });
    await expect(successHeader).toBeVisible();
    
    // Controlla che sia visualizzato un codice di protocollo valido (ADR-YYYY-XXXXXX)
    const protocolCode = page.locator("div.font-mono");
    await expect(protocolCode).toBeVisible();
    await expect(protocolCode).toContainText(/ADR-\d{4}-\d+/);
  });

  test("Dovrebbe mostrare un errore di validazione se i dati obbligatori dell'Istante (nascita e residenza) sono mancanti", async ({ page }) => {
    // 1. Registra e logga l'utente per assicurare la sessione attiva
    await page.goto("/login");
    await page.getByRole("button", { name: "Registrati", exact: true }).click();
    await page.locator('input[name="nomeCognome"]').fill("E2E Mediator User 2");
    await page.locator('input[name="email"]').fill("test_user_unique2@example.com");
    await page.locator('input[name="username"]').fill("test_user_unique2");
    await page.locator('input[name="password"]').fill("testPassword123");
    await page.locator('button[type="submit"]').click();
    await page.waitForURL("/");

    // 2. Naviga alla pagina dei contatti
    await page.goto("/contatti");

    // 3. STEP 1: Dati della Controversia
    await page.locator('select[name="materia"]').selectOption("Condominio");
    await page.locator('input[name="valore"]').fill("12500.50");
    await page.locator('textarea[name="descrizioneFatti"]').fill("Descrizione dei fatti per test di validazione.");
    await page.getByRole("button", { name: /prosegui/i }).click();

    // 4. STEP 2: Dati Istante - Compila solo i campi base e tralascia nascita e residenza
    await page.locator('input[name="istanteDenominazione"]').fill("Mario Rossi Senza Dati");
    await page.locator('input[name="istanteCodiceFiscale"]').fill("TESTISTANTE54321");
    await page.locator('input[name="istanteEmail"]').fill("mario.rossi.no.dati@test.it");
    
    // Clicca prosegui
    await page.getByRole("button", { name: /prosegui/i }).click();

    // 5. Verifica che venga mostrato il messaggio di errore per i campi obbligatori
    await expect(page.locator("body")).toContainText("Compila tutti i campi obbligatori relativi all'Istante (inclusi Nascita e Residenza).");
  });
});
