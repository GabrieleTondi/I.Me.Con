import { relations, sql } from "drizzle-orm";
import { pgTable, serial, varchar, char, integer, boolean, timestamp, numeric, text, date, check, unique, primaryKey } from "drizzle-orm/pg-core";

// 1.1 Anagrafiche di Base e Tabelle di Lookup

export const qualifica = pgTable("qualifica", {
  id: serial("id").primaryKey(),
  nomeQualifica: varchar("nome_qualifica", { length: 255 }).unique().notNull(),
});

export const ruolo = pgTable("ruolo", {
  id: serial("id").primaryKey(),
  nomeRuolo: varchar("nome_ruolo", { length: 255 }).unique().notNull(),
});

export const area = pgTable("area", {
  id: serial("id").primaryKey(),
  nomeArea: varchar("nome_area", { length: 255 }).unique().notNull(),
});

export const statoMediazione = pgTable("stato_mediazione", {
  id: serial("id").primaryKey(),
  codice: varchar("codice", { length: 255 }).unique().notNull(),
  descrizione: varchar("descrizione", { length: 255 }).notNull(),
});

// 1.2 Entità Principali

export const utente = pgTable("utente", {
  id: serial("id").primaryKey(),
  nomeCognome: varchar("nome_cognome", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  telefono: varchar("telefono", { length: 255 }),
  indirizzo: varchar("indirizzo", { length: 255 }),
  username: varchar("username", { length: 255 }).unique().notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  attivo: boolean("attivo").default(true).notNull(),
  accreditato: boolean("accreditato").default(false).notNull(),
  pubblica: boolean("pubblica").default(false).notNull(),
  ultimoLogin: timestamp("ultimo_login", { withTimezone: true }),
  qualificaId: integer("qualifica_id").references(() => qualifica.id, { onDelete: "restrict" }),
});

export const soggetto = pgTable("soggetto", {
  id: serial("id").primaryKey(),
  tipoSoggetto: char("tipo_soggetto", { length: 2 }).notNull(),
  denominazione: varchar("denominazione", { length: 255 }).notNull(),
  codiceFiscalePiva: varchar("codice_fiscale_piva", { length: 255 }).unique().notNull(),
  email: varchar("email", { length: 255 }),
  telefono: varchar("telefono", { length: 255 }),
}, (table) => [
  check("check_tipo_soggetto", sql`${table.tipoSoggetto} IN ('PF', 'PG')`),
]);

export const mediazione = pgTable("mediazione", {
  id: serial("id").primaryKey(),
  protocollo: varchar("protocollo", { length: 255 }).unique().notNull(),
  oggetto: text("oggetto").notNull(),
  valore: numeric("valore", { precision: 15, scale: 2 }).default("0.00").notNull(),
  dataInserimento: date("data_inserimento").default(sql`CURRENT_DATE`).notNull(),
  statoId: integer("stato_id").notNull().references(() => statoMediazione.id, { onDelete: "restrict" }),
  mediatoreId: integer("mediatore_id").references(() => utente.id, { onDelete: "restrict" }),
  areaId: integer("area_id").notNull().references(() => area.id, { onDelete: "restrict" }),
});

// 1.3 Entità Dipendenti

export const seduta = pgTable("seduta", {
  id: serial("id").primaryKey(),
  mediazioneId: integer("mediazione_id").notNull().references(() => mediazione.id, { onDelete: "cascade" }),
  numeroProgressivo: integer("numero_progressivo").notNull(),
  dataSeduta: timestamp("data_seduta", { withTimezone: true }).notNull(),
  notaVerbale: text("nota_verbale"),
}, (table) => [
  unique("uq_seduta_mediazione_progressivo").on(table.mediazioneId, table.numeroProgressivo),
]);

// 2. Relazioni e Tabelle Ponte (Molti-a-Molti)

export const utenteRuolo = pgTable("utente_ruolo", {
  utenteId: integer("utente_id").notNull().references(() => utente.id, { onDelete: "cascade" }),
  ruoloId: integer("ruolo_id").notNull().references(() => ruolo.id, { onDelete: "restrict" }),
}, (table) => [
  primaryKey({ columns: [table.utenteId, table.ruoloId] }),
]);

export const utenteArea = pgTable("utente_area", {
  utenteId: integer("utente_id").notNull().references(() => utente.id, { onDelete: "cascade" }),
  areaId: integer("area_id").notNull().references(() => area.id, { onDelete: "restrict" }),
}, (table) => [
  primaryKey({ columns: [table.utenteId, table.areaId] }),
]);

export const mediazioneSoggetto = pgTable("mediazione_soggetto", {
  mediazioneId: integer("mediazione_id").notNull().references(() => mediazione.id, { onDelete: "cascade" }),
  soggettoId: integer("soggetto_id").notNull().references(() => soggetto.id, { onDelete: "restrict" }),
  ruoloNellaLite: varchar("ruolo_nella_lite", { length: 255 }).notNull(),
}, (table) => [
  primaryKey({ columns: [table.mediazioneId, table.soggettoId, table.ruoloNellaLite] }),
]);

// DEFINIZIONE RELAZIONI (drizzle-orm relations)

export const qualificaRelations = relations(qualifica, ({ many }) => ({
  utenti: many(utente),
}));

export const ruoloRelations = relations(ruolo, ({ many }) => ({
  utenti: many(utenteRuolo),
}));

export const areaRelations = relations(area, ({ many }) => ({
  utenti: many(utenteArea),
  mediazioni: many(mediazione),
}));

export const statoMediazioneRelations = relations(statoMediazione, ({ many }) => ({
  mediazioni: many(mediazione),
}));

export const utenteRelations = relations(utente, ({ one, many }) => ({
  qualifica: one(qualifica, {
    fields: [utente.qualificaId],
    references: [qualifica.id],
  }),
  ruoli: many(utenteRuolo),
  aree: many(utenteArea),
  mediazioni: many(mediazione),
}));

export const utenteRuoloRelations = relations(utenteRuolo, ({ one }) => ({
  utente: one(utente, {
    fields: [utenteRuolo.utenteId],
    references: [utente.id],
  }),
  ruolo: one(ruolo, {
    fields: [utenteRuolo.ruoloId],
    references: [ruolo.id],
  }),
}));

export const utenteAreaRelations = relations(utenteArea, ({ one }) => ({
  utente: one(utente, {
    fields: [utenteArea.utenteId],
    references: [utente.id],
  }),
  area: one(area, {
    fields: [utenteArea.areaId],
    references: [area.id],
  }),
}));

export const soggettoRelations = relations(soggetto, ({ many }) => ({
  mediazioni: many(mediazioneSoggetto),
}));

export const mediazioneRelations = relations(mediazione, ({ one, many }) => ({
  stato: one(statoMediazione, {
    fields: [mediazione.statoId],
    references: [statoMediazione.id],
  }),
  mediatore: one(utente, {
    fields: [mediazione.mediatoreId],
    references: [utente.id],
  }),
  area: one(area, {
    fields: [mediazione.areaId],
    references: [area.id],
  }),
  sedute: many(seduta),
  soggetti: many(mediazioneSoggetto),
}));

export const sedutaRelations = relations(seduta, ({ one }) => ({
  mediazione: one(mediazione, {
    fields: [seduta.mediazioneId],
    references: [mediazione.id],
  }),
}));

export const mediazioneSoggettoRelations = relations(mediazioneSoggetto, ({ one }) => ({
  mediazione: one(mediazione, {
    fields: [mediazioneSoggetto.mediazioneId],
    references: [mediazione.id],
  }),
  soggetto: one(soggetto, {
    fields: [mediazioneSoggetto.soggettoId],
    references: [soggetto.id],
  }),
}));
