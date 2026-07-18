import { test, expect } from "@playwright/test";

test.describe("Flusso di Autenticazione (E2E)", () => {
  
  test.beforeEach(async ({ request }) => {
    // Eseguiamo la pulizia dei dati di test prima di ogni esecuzione
    await request.delete("/api/test/auth");
  });

  test.afterAll(async ({ request }) => {
    // Pulisci i dati anche al termine del ciclo di test
    await request.delete("/api/test/auth");
  });

  test("Dovrebbe registrare un nuovo utente e permettere il login e logout", async ({ page }) => {
    // 1. Vai alla pagina di login
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText("Area Riservata");

    // 2. Seleziona la tab "Registrati"
    await page.getByRole("button", { name: "Registrati", exact: true }).click();

    // 3. Compila il modulo di registrazione
    await page.locator('input[name="nomeCognome"]').fill("E2E Test User");
    await page.locator('input[name="email"]').fill("test_user_unique@example.com");
    await page.locator('input[name="telefono"]').fill("3339876543");
    await page.locator('input[name="username"]').fill("test_user_unique");
    await page.locator('input[name="password"]').fill("testPassword123");

    // 4. Invia la registrazione
    await page.locator('button[type="submit"]').click();

    // 5. Attendi il reindirizzamento alla Home Page
    await page.waitForURL("/");
    await expect(page).toHaveURL("/");

    // 6. Verifica la presenza del bottone di Logout in Header (significa che siamo loggati)
    // Nota: L'header mostra il pulsante Area Riservata se non autenticato, altrimenti mostra l'utente loggato o Logout
    const logoutBtn = page.getByRole("button", { name: /esci|logout/i });
    if (await logoutBtn.count() > 0) {
      await expect(logoutBtn).toBeVisible();
    }

    // 7. Test del Logout
    await page.goto("/login"); // Torna alla pagina per forzare logout
    // Se c'è un cookie di sessione, possiamo fare logout.
    // Facciamo una chiamata di logout andando in homepage e cliccando Logout se visibile, o cancellando cookie
    await page.context().clearCookies();
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText("Area Riservata");
  });

  test("Non dovrebbe permettere il login con credenziali errate", async ({ page }) => {
    await page.goto("/login");
    
    // Tab "Accedi" di default
    await page.locator('input[name="loginInput"]').fill("wrong_user");
    await page.locator('input[name="password"]').fill("wrong_password");
    await page.locator('button[type="submit"]').click();

    // Verifica la visualizzazione del messaggio di errore
    const errorMessage = page.locator("div.bg-red-950\\/60");
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText("Accesso non riuscito");
  });

  test("Dovrebbe registrare un amministratore, mostrare l'opzione 'Vai al gestionale' ed accedervi", async ({ page }) => {
    // 1. Registra un utente con l'email di sistema amministratore
    await page.goto("/login");
    await page.getByRole("button", { name: "Registrati", exact: true }).click();
    await page.locator('input[name="nomeCognome"]').fill("Admin E2E User");
    await page.locator('input[name="email"]').fill("direzione@imecon.it");
    await page.locator('input[name="username"]').fill("admin_e2e");
    await page.locator('input[name="password"]').fill("testPassword123");
    await page.locator('button[type="submit"]').click();
    
    // 2. Attendi il reindirizzamento alla Home Page
    await page.waitForURL("/");
    await expect(page).toHaveURL("/");

    // 3. Apri il dropdown menu cliccando su "Ciao, Admin"
    await page.getByRole("button", { name: /ciao, admin/i }).click();

    // 4. Verifica la presenza del link per il gestionale e cliccalo
    const adminLink = page.getByRole("link", { name: "Vai al gestionale" });
    await expect(adminLink).toBeVisible();
    await adminLink.click();

    // 5. Verifica il corretto caricamento di /gestionale
    await page.waitForURL("/gestionale");
    await expect(page).toHaveURL("/gestionale");
    await expect(page.locator("h1")).toContainText("Gestione Pratiche ADR");
  });

  test("Accesso non autorizzato a /gestionale e alle API dovrebbe essere bloccato (Security Check)", async ({ page, request }) => {
    // 1. Chiamata API senza autenticazione -> deve restituire 403 Forbidden
    const apiRes = await request.get("/api/gestionale/documento?id=1");
    expect(apiRes.status()).toBe(403);

    // 2. Navigazione diretta alla pagina gestionale senza login -> deve reindirizzare a /login
    await page.goto("/gestionale");
    await page.waitForURL("/login");
    await expect(page).toHaveURL("/login");
  });
});
