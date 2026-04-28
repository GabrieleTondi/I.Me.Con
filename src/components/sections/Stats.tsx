"use client";

import { motion } from 'framer-motion';
import { Users, Briefcase, Award } from 'lucide-react';

export const Stats = () => {
  const stats = [
    {
      id: 1,
      icon: <Award size={40} />, // ICONA: Modifica questo tag (es: <Globe />) per cambiare l'icona
      title: "20 Anni", // TESTO PRIMARIO
      subtitle: "di attività", // TESTO SECONDARIO
      description: "Operiamo con eccellenza dal 2004." // DESCRIZIONE
    },
    {
      id: 2,
      icon: <Briefcase size={40} />,
      title: "100+",
      subtitle: "Mediazioni annue",
      description: "Gestiamo centinaia di casi con successo."
    },
    {
      id: 3,
      icon: <Users size={40} />,
      title: "15 Persone",
      subtitle: "al tuo servizio",
      description: "Un team di professionisti altamente qualificati."
    }
  ];

  /* TRANSIZIONE: Ritardo progressivo delle card (0.2 secondi l'una dall'altra) */
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  /* TRANSIZIONE: Lo spostamento in basso (y: 50 -> 0) e opacità di ogni singola CARD */
  const itemVariants: import('framer-motion').Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    /* COLORE SFONDO SEZIONE: 'bg-brand-neutral' utilizza il codice neutro (#EBF2FA). */
    <section className="bg-brand-neutral py-24 px-6 md:px-12 relative z-10">
      <div className="max-w-7xl mx-auto">
        {/* GRIGLIA FORMA: 'grid-cols-1' su mobile, 'grid-cols-3' (3 colonne affiancate) su desktop */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible" // TRANSIZIONE: Scatta solo quando scorri la pagina fino a qui!
          viewport={{ once: true, margin: "-100px" }}
        >
          {stats.map((stat) => (
            <motion.div 
              key={stat.id}
              variants={itemVariants}
              /* FORMA E COLORE CARD: bg-brand-primary (Sfondo Blu Profondo), rounded-2xl (Bordi smussati) */
              className="bg-brand-primary p-8 rounded-2xl border border-white/5 shadow-2xl hover:border-brand-accent transition-colors group"
            >
              {/* FORMA QUADRATELLO ICONA: bg-white/10 (Trasparente bianco), w-20 h-20 (Grandezza) */}
              <div className="bg-white/10 w-20 h-20 rounded-2xl flex items-center justify-center text-brand-accent mb-6 group-hover:scale-110 transition-transform">
                {stat.icon}
              </div>
              
              {/* COLORE TESTO RISULTATO: text-contrast (Bianco puro) */}
              <h2 className="text-5xl font-chillax text-contrast mb-2">{stat.title}</h2>
              {/* COLORE TESTO SOTTOTITOLO: text-brand-accent (Arancione) */}
              <h3 className="text-xl text-brand-accent font-medium mb-4">{stat.subtitle}</h3>
              {/* TESTO DESCRIZIONE: text-contrast/80 (Bianco opaco all'80%) */}
              <p className="text-contrast/80 leading-relaxed font-light">
                {stat.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
