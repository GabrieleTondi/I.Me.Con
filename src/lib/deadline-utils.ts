/**
 * Utility per il calcolo delle scadenze legali (3 mesi o 6 mesi) e del colore del bollino di avviso.
 */

export function getMediationDeadline(
  dataInserimentoStr: string | Date,
  prorogata: boolean,
  scadenzaPersonalizzata?: string | Date | null
): Date {
  if (scadenzaPersonalizzata) {
    return new Date(scadenzaPersonalizzata);
  }
  const insertDate = new Date(dataInserimentoStr);
  const deadlineDate = new Date(insertDate);
  
  // Proroga estende da 6 a 12 mesi
  const maxMonths = prorogata ? 12 : 6;
  deadlineDate.setMonth(insertDate.getMonth() + maxMonths);
  
  return deadlineDate;
}

export type ScadenzaColor = "rosso" | "giallo" | "verde" | null;

export function getScadenzaStatus(
  dataInserimentoStr: string | Date,
  prorogata: boolean,
  isConclusa: boolean,
  scadenzaPersonalizzata?: string | Date | null,
  referenceDate?: Date
): ScadenzaColor {
  if (isConclusa) {
    return null;
  }
  
  const today = referenceDate ? new Date(referenceDate) : new Date();
  today.setHours(0, 0, 0, 0);
  
  const insertDate = new Date(dataInserimentoStr);
  insertDate.setHours(0, 0, 0, 0);
  
  const deadlineDate = getMediationDeadline(insertDate, prorogata, scadenzaPersonalizzata);
  deadlineDate.setHours(0, 0, 0, 0);
  
  const daysRemaining = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.ceil((today.getTime() - insertDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysRemaining <= 10) {
    return "rosso"; // Meno di 10 giorni alla scadenza o già scaduta
  }
  if (daysElapsed > 60) {
    return "giallo"; // Più di 60 giorni trascorsi
  }
  return "verde"; // Tutto regolare
}
