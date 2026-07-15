interface CacheEntry {
  timestamps: number[];
}

const cache = new Map<string, CacheEntry>();

// Pulisce la cache per evitare perdite di memoria in esecuzione locale
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of cache.entries()) {
    // Mantieni solo i timestamp degli ultimi 10 minuti
    const validTimestamps = entry.timestamps.filter((ts) => now - ts < 10 * 60 * 1000);
    if (validTimestamps.length === 0) {
      cache.delete(ip);
    } else {
      cache.set(ip, { timestamps: validTimestamps });
    }
  }
}, 5 * 60 * 1000).unref(); // Esegue ogni 5 minuti in background senza tenere bloccato il processo Node

/**
 * Controlla se una richiesta proveniente da un certo IP supera il limite consentito in una specifica finestra temporale.
 * @param ip Indirizzo IP del client
 * @param limit Massimo numero di richieste permesse
 * @param windowMs Finestra temporale in millisecondi
 * @returns true se la richiesta è bloccata per rate limit, false altrimenti
 */
export async function isRateLimited(ip: string, limit: number, windowMs: number): Promise<boolean> {
  const now = Date.now();
  const entry = cache.get(ip) || { timestamps: [] };
  
  // Rimuovi i timestamp esterni alla finestra temporale corrente
  const currentTimestamps = entry.timestamps.filter((ts) => now - ts < windowMs);
  
  if (currentTimestamps.length >= limit) {
    return true;
  }
  
  // Aggiungi il timestamp corrente e salva
  currentTimestamps.push(now);
  cache.set(ip, { timestamps: currentTimestamps });
  return false;
}
