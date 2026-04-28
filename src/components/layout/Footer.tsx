import * as React from 'react';
import Image from 'next/image';

export const Footer = () => {
  return (
    /* 
      COLORE E FORMA SFONDO: bg-brand-primary assicura lo sfondo del footer (#064789).
      text-contrast/80 rende i testi al suo interno bianchi ma un po' opachi. 
      border-white/10 crea quella sottile riga grigio bianca sopra al footer.
    */
    <footer className="bg-brand-primary text-contrast/80 py-12 px-6 md:px-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        <div className="space-y-4">
          <Image 
            src="/logo.png" 
            alt="I.Me.Con Logo" 
            width={180}
            height={50}
            /* TRANSIZIONE ED STILE IMMAGINIE (Logo Footer): 
               grayscale rende il logo in bianco/nero finchè non ci passi sopra con hover:grayscale-0.
               bg-contrast p-2 rounded-lg crea lo sfondo bianco al di sotto in modo che formi un mattoncino 
            */
            className="h-12 w-auto object-contain bg-contrast p-2 rounded-lg grayscale hover:grayscale-0 transition-all duration-300"
          />
          <p className="text-sm pt-2">
            Il tuo partner di fiducia per la mediazione civile e commerciale. 20 anni di esperienza al tuo servizio.
          </p>
        </div>
        
        {/* COLONNE MENU (Liste di Link) */}
        <div className="space-y-4">
          {/* FONT: text-xl e font-chillax per i titoli */}
          <h3 className="text-xl font-chillax text-contrast tracking-wider">Link Utili</h3>
          <ul className="space-y-2 text-sm">
            {/* EFFETTO SUI LINK: hover:text-contrast per farlo sbiancare al passaggio. underline (sottomettura sottolineata) */}
            <li><a href="#" className="hover:text-contrast transition-colors hover:underline underline-offset-4">Home</a></li>
            <li><a href="#" className="hover:text-contrast transition-colors hover:underline underline-offset-4">Chi Siamo</a></li>
            <li><a href="#" className="hover:text-contrast transition-colors hover:underline underline-offset-4">Dove Siamo</a></li>
            <li><a href="#" className="hover:text-contrast transition-colors hover:underline underline-offset-4">News</a></li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-chillax text-contrast tracking-wider">Servizi</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-contrast transition-colors hover:underline underline-offset-4">Mediazione Online</a></li>
            <li><a href="#" className="hover:text-contrast transition-colors hover:underline underline-offset-4">Modulistica</a></li>
            <li><a href="#" className="hover:text-contrast transition-colors hover:underline underline-offset-4">Corsi di Aggiornamento</a></li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-chillax text-contrast tracking-wider">Contatti</h3>
          <ul className="space-y-2 text-sm">
            <li>Tel: +39 012 345 6789</li>
            <li>Email: info@imecon.it</li>
            {/* SOCIAL ICONS (Sostituiti ai placeholder testuali diretti) */}
            <li className="flex gap-4 pt-2">
              <a href="#" className="hover:text-brand-accent transition-colors font-semibold">FB</a>
              <a href="#" className="hover:text-brand-accent transition-colors font-semibold">IG</a>
              <a href="#" className="hover:text-brand-accent transition-colors font-semibold">IN</a>
            </li>
          </ul>
        </div>
      </div>
      
      {/* COPYRIGHT BOTTOM BAR */}
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/10 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} I.Me.Con. Tutti i diritti riservati.</p>
      </div>
    </footer>
  );
};
