import * as React from 'react';
import Image from 'next/image';

export const Footer = () => {
  return (
    /* 
      COLORE E FORMA SFONDO: bg-brand-primary assicura lo sfondo reale istituzionale (#1E40AF - Deep Royal Blue).
      text-contrast/80 e border-white/15 formano una separazione chiara e raffinata.
    */
    <footer className="bg-brand-primary text-contrast/80 py-16 px-6 md:px-12 border-t border-white/15 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        
        <div className="space-y-4">
          <Image 
            src="/imecon logo.png" 
            alt="I.Me.Con Logo" 
            width={180}
            height={50}
            /* TRANSIZIONE ED STILE IMMAGINIE (Logo Footer): 
               grayscale rende il logo in bianco/nero finché non ci passi sopra con hover:grayscale-0.
               bg-contrast p-2.5 rounded-xl crea lo sfondo bianco al di sotto in modo che formi un mattoncino 
            */
            className="h-12 w-auto object-contain bg-contrast p-2.5 rounded-xl grayscale hover:grayscale-0 transition-all duration-300"
          />
          <p className="text-sm pt-2 text-contrast/70 leading-relaxed font-light">
            Il tuo partner di fiducia per la mediazione civile e commerciale. 20 anni di eccellenza al tuo servizio.
          </p>
        </div>
        
        {/* COLONNE MENU (Liste di Link) */}
        <div className="space-y-3">
          <h3 className="text-lg font-chillax font-semibold text-contrast tracking-wider">Link Utili</h3>
          <ul className="space-y-2.5 text-sm">
            <li><a href="/" className="text-contrast/70 hover:text-brand-accent transition-colors hover:underline underline-offset-4">Home</a></li>
            <li><a href="/chi-siamo" className="text-contrast/70 hover:text-brand-accent transition-colors hover:underline underline-offset-4">Chi Siamo</a></li>
            <li><a href="/dove-siamo" className="text-contrast/70 hover:text-brand-accent transition-colors hover:underline underline-offset-4">Dove Siamo</a></li>
            <li><a href="/news" className="text-contrast/70 hover:text-brand-accent transition-colors hover:underline underline-offset-4">News</a></li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-chillax font-semibold text-contrast tracking-wider">Servizi</h3>
          <ul className="space-y-2.5 text-sm">
            <li><a href="/contatti?tab=mediazione" className="text-contrast/70 hover:text-brand-accent transition-colors hover:underline underline-offset-4">Mediazione Online</a></li>
            <li><a href="/contatti?tab=generale" className="text-contrast/70 hover:text-brand-accent transition-colors hover:underline underline-offset-4">Modulistica e Richieste</a></li>
            <li><a href="/chi-siamo" className="text-contrast/70 hover:text-brand-accent transition-colors hover:underline underline-offset-4">Corsi di Aggiornamento</a></li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-chillax font-semibold text-contrast tracking-wider">Contatti</h3>
          <ul className="space-y-2.5 text-sm text-contrast/70">
            <li>Tel: +39 012 345 6789</li>
            <li>Email: info@imecon.it</li>
            {/* SOCIAL ICONS */}
            <li className="flex gap-4 pt-3">
              <a href="#" className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-contrast hover:bg-brand-accent transition-all text-xs font-bold">FB</a>
              <a href="#" className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-contrast hover:bg-brand-accent transition-all text-xs font-bold">IG</a>
              <a href="#" className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-contrast hover:bg-brand-accent transition-all text-xs font-bold">IN</a>
            </li>
          </ul>
        </div>
      </div>
      
      {/* COPYRIGHT BOTTOM BAR */}
      <div className="max-w-7xl mx-auto mt-14 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-contrast/60 gap-4">
        <p>&copy; {new Date().getFullYear()} I.Me.Con. Tutti i diritti riservati. P.IVA / C.F. 01234567890</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-contrast transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-contrast transition-colors">Termini di Servizio</a>
        </div>
      </div>
    </footer>
  );
};
