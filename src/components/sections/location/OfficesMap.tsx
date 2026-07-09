"use client";

import { motion } from 'framer-motion';
import { MapPin, Navigation, Phone } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

// LOGICA E DATI: Configurazione delle tre sedi operative richieste dal progetto Figma
const OFFICES = [
  {
    id: "manfredonia",
    city: "Manfredonia",
    province: "FG",
    address: "Corso Manfredi, 200, 71043 Manfredonia (FG)",
    phone: "+39 0884 123456",
    // LOGICA (POSIZIONE MAPPA): Inserisci qui le coordinate % della puntina rispetto alla tua foto
    pinTop: "45%", 
    pinLeft: "55%"
  },
  {
    id: "lecce",
    city: "Lecce",
    province: "LE",
    address: "Viale Lo Re, 15, 73100 Lecce (LE)",
    phone: "+39 0832 123456",
    pinTop: "68%",
    pinLeft: "76%"
  },
  {
    id: "maglie",
    city: "Maglie",
    province: "LE",
    address: "Piazza Aldo Moro, 1, 73024 Maglie (LE)",
    phone: "+39 0836 123456",
    pinTop: "78%",
    pinLeft: "80%"
  }
];

export const OfficesMap = () => {
  const [hoveredOffice, setHoveredOffice] = useState<string | null>(null);

  /* TRANSIZIONE: Effetto entrata a cascata per i figli (Card) della colonna sinistra */
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" as const } }
  };

  return (
    /* COLORE SFONDO SEZIONE: Il fondo è grigio chiarissimo (bg-brand-neutral) */
    <section className="bg-brand-neutral py-24 px-6 md:px-12 relative overflow-hidden">
      
      {/* FORMA MAIN WRAPPER: grid-cols-1 su telefono per impilare mappa e testi. lg:grid-cols-2 divide in 2 su Desktop. */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        
        {/* ===== COLONNA SINISTRA: Informazioni delle 3 Sedi ===== */}
        <motion.div
           variants={containerVariants}
           initial="hidden"
           whileInView="visible"
           viewport={{ once: true, margin: "-100px" }}
           className="space-y-10"
        >
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-chillax text-brand-primary">
              Le Nostre <span className="text-brand-accent">Sedi</span>
            </h2>
            <p className="text-brand-primary/80 leading-relaxed font-light text-lg">
              Operiamo attivamente in una rete di triplice presidio. Seleziona l'ufficio più vicino a te e prenota un appuntamento conoscitivo.
            </p>
          </div>

          <div className="space-y-6">
             {OFFICES.map((office) => (
               /* LOGICA HOVER MAPPA: Sfiorando una Card col mouse o dito si illumina la Cartina! */
               <motion.div 
                 key={office.id} 
                 variants={cardVariants}
                 onMouseEnter={() => setHoveredOffice(office.id)}
                 onMouseLeave={() => setHoveredOffice(null)}
                 /* COLORE CARD SEDE: bg-white. hover:border-brand-accent svela la cornicetta colorata sopra la card su cui stiamo hoverando */
                 className={`group bg-white p-6 md:p-8 rounded-3xl shadow-md border cursor-pointer transition-all duration-300 ${
                   hoveredOffice === office.id ? 'border-brand-accent shadow-xl scale-[1.02]' : 'border-gray-100 hover:border-brand-third/30'
                 }`}
               >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-chillax text-2xl md:text-3xl text-brand-primary group-hover:text-brand-accent transition-colors">
                      {office.city} <span className="text-sm font-sans text-gray-400">({office.province})</span>
                    </h3>
                    <div className={`p-3 rounded-full transition-colors ${hoveredOffice === office.id ? 'bg-brand-accent text-white' : 'bg-brand-neutral text-brand-primary'}`}>
                      <MapPin size={24} />
                    </div>
                  </div>
                  
                  <div className="space-y-3 pt-2 border-t border-gray-50 flex justify-between items-end">
                    <div className="space-y-2">
                       <p className="text-gray-600 font-light text-sm md:text-base flex items-center gap-2">
                         <Navigation size={16} className="text-gray-400" />
                         {office.address}
                       </p>
                       <p className="text-gray-600 font-light text-sm md:text-base flex items-center gap-2">
                         <Phone size={16} className="text-gray-400" />
                         {office.phone}
                       </p>
                    </div>
                    {/* BOTTONE INDICATORE: Call to action minore all'interno della singola Filiale */}
                    <button className="text-brand-accent text-sm font-medium hover:underline underline-offset-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      Ottieni Indicazioni
                    </button>
                  </div>
               </motion.div>
             ))}
          </div>
        </motion.div>

        {/* ===== COLONNA DESTRA: La Mappa Interattiva (Cartina) ===== */}
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           whileInView={{ opacity: 1, scale: 1 }}
           viewport={{ once: true, margin: "-100px" }}
           transition={{ duration: 0.8, delay: 0.2 }}
           /* FORMA WRAPPER MAPPA: aspect-[4/5] dà forma rettangolare alta. sticky top-32 lascia scivolare la pagina sotto bloccando la visuale della cartina che resta fissa! */
           className="relative aspect-square lg:aspect-[4/5] w-full max-w-lg mx-auto rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white bg-brand-primary sticky top-32"
        >
           {/* IMMAGINE STATICA MAPPA: Attualmente usa '/italia.webp' o in futuro '/cartina salento.jpg' usandola da Plancia. */}
           <Image 
             src="/italia.webp" 
             alt="Mappe Sedi I.Me.Con" 
             fill 
             sizes="(max-width: 768px) 100vw, 50vw" 
             /* EFFETTO FOTO DEBOLE: L'immagine da sola è smorzata (opacity-70) miscelata col blu scurissimo del background */
             className="object-cover opacity-80 mix-blend-luminosity" 
           />

           {/* OVELAY INFORMAZIONE: Striscia sfumata superiore blu con dicitura */}
           <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/80 via-transparent to-brand-primary/80 pointer-events-none" />
           <div className="absolute top-8 left-8 right-8 z-10 text-center">
              <span className="bg-brand-primary text-white text-xs px-4 py-2 rounded-full uppercase tracking-widest shadow-lg border border-white/10 font-medium">Area Operativa Puglia</span>
           </div>

           {/* LOGICA: GENERAZIONE DEI PIN SULLA MAPPA */}
           {OFFICES.map((office) => {
              const isHovered = hoveredOffice === office.id;
              return (
                <div 
                  key={office.id} 
                  /* POSIZIONAMENTO ASSOLUTO: Usa i valori scritti nell'array in cima per piazzare geograficamente il Pin. */
                  className="absolute z-20 group transform -translate-x-1/2 -translate-y-1/2"
                  style={{ top: office.pinTop, left: office.pinLeft }}
                  onMouseEnter={() => setHoveredOffice(office.id)}
                  onMouseLeave={() => setHoveredOffice(null)}
                >
                   {/* PALLINO OMBRE E PULSAZIONE FINTA RADAR (Usa i Ping di CSS) */}
                   <div className="relative flex items-center justify-center">
                      <div className={`absolute w-12 h-12 rounded-full opacity-30 animate-ping ${isHovered ? 'bg-brand-accent' : 'bg-brand-third'}`} />
                      
                      {/* ICONA PUNTEGGIATURA ROSSA/AZZURRA */}
                      <div className={`relative flex items-center justify-center w-10 h-10 rounded-full shadow-2xl border-2 transition-colors duration-300 cursor-pointer ${
                        isHovered ? 'bg-brand-accent border-white text-white scale-125' : 'bg-white border-brand-third text-brand-primary scale-100'
                      }`}>
                         <MapPin size={20} className={isHovered ? 'animate-bounce' : ''} />
                      </div>

                      {/* TOOLTIP NOME CITTA SULLA MAPPA: Nascosto di base, appare se sfiori o fai hover sulla Card o sul Pin! */}
                      <div className={`absolute -top-12 bg-white px-4 py-1.5 rounded-lg shadow-xl border border-gray-100 whitespace-nowrap transition-all duration-300 ${
                        isHovered ? 'opacity-100 translate-y-0 visible text-brand-primary font-bold' : 'opacity-0 translate-y-2 invisible'
                      }`}>
                         {office.city}
                         {/* Piccolo triangolino CSS sotto il fumetto */}
                         <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-b border-r border-gray-100" />
                      </div>
                   </div>
                </div>
              )
           })}

        </motion.div>
        
      </div>
    </section>
  );
};
