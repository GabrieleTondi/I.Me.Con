"use client";

import { motion } from "framer-motion";
import { Mail, ShieldCheck, Phone, Building } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

export const ContactArea = () => {
  /* LOGICA (FORM STATE): Gestiamo l'avvenuta sottomissione finta del form */
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simula invio al database (1.5 secondi)
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      // Ripristina dopo 3 secondi
      setTimeout(() => setIsSuccess(false), 3000);
    }, 1500);
  };

  /* TRANSIZIONE INGRESSO: Sfalsamento dolce per finta lettura */
  const parentVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    /* COLORE SFONDO E FORMA: Schermo diviso al 100% della larghezza (w-full). Su mobile in coda, su Desktop suddiviso al 40/60%. */
    <section className="w-full flex flex-col relative bg-brand-bg pt-20">
      <div className="flex flex-col lg:flex-row min-h-[85vh]">
        
        {/* ===== SETTORE BIANCO (O MEGLIO, BLU SCURO) - SINISTRA (40%) ===== */}
        {/* COLORE DI SFONDO SINISTRA: bg-[#315AA3] ricalca esattamente la gradazione del template Figma, un bel blu di prussia/carta da zucchero scura */}
        <motion.div 
          className="w-full lg:w-[40%] bg-[#42649B] text-white p-12 md:p-20 flex flex-col justify-center space-y-16"
          variants={parentVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="space-y-4">
             {/* FONT E COLORE TITOLO: Segue lo sketch 'Mettiamoci in' BIANCO grassetto, 'Contatto' ARANCIO */}
             <h1 className="text-4xl md:text-5xl font-bold leading-tight">
               Mettiamoci in <br/>
               <span className="text-[#FFC629]">Contatto</span>
             </h1>
             <p className="text-lg text-white/90 font-light leading-relaxed max-w-sm pt-4">
               L'Istituto di Mediazione e Conciliazione è a vostra disposizione per chiarimenti su procedure ADR e percorsi formativi.
             </p>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-8 pl-2">
             {/* SINGOLA RIGA CONTATTO */}
             <div className="flex items-start gap-4">
                <Mail className="mt-1 opacity-90" size={24} />
                <div className="space-y-0.5">
                   <p className="text-[10px] text-white/60 tracking-wider uppercase">La nostra email</p>
                   <p className="font-medium text-lg">imecon@gmail.com</p>
                </div>
             </div>
             
             {/* SINGOLA RIGA PEC */}
             <div className="flex items-start gap-4">
                <ShieldCheck className="mt-1 opacity-90" size={24} />
                <div className="space-y-0.5">
                   <p className="text-[10px] text-white/60 tracking-wider uppercase">La nostra PEC</p>
                   <p className="font-medium text-lg">imecon@pec.it</p>
                </div>
             </div>

             {/* SINGOLA RIGA TELEFONO */}
             <div className="flex items-start gap-4">
                <Phone className="mt-1 opacity-90" size={24} />
                <div className="space-y-0.5">
                   <p className="text-[10px] text-white/60 tracking-wider uppercase">Il nostro telefono</p>
                   <p className="font-medium text-lg">333 333 3333</p>
                </div>
             </div>

             {/* SINGOLA RIGA INFO SOCIETARIE */}
             <div className="flex items-start gap-4">
                <Building className="mt-1 opacity-90" size={24} />
                <div className="space-y-0.5">
                   <p className="text-[10px] text-white/60 tracking-wider uppercase">Dati Societari</p>
                   <p className="font-light text-base text-white/90">qualsiasi cosa sia rilevante</p>
                </div>
             </div>
          </motion.div>
        </motion.div>


        {/* ===== SETTORE FORM AZZURRINO - DESTRA (60%) ===== */}
        {/* COLORE DI SFONDO DESTRA: bg-[#F3F6F9] per un effetto ghiaccio/carta molto sottile, simile allo sketch */}
        <motion.div 
           className="w-full lg:w-[60%] bg-[#F3F6F9] p-12 md:p-20 xl:p-32 flex flex-col justify-center items-center"
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ duration: 1 }}
        >
           <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                 {/* INPUT CORTO NOME */}
                 <input 
                   required
                   type="text" 
                   placeholder="Nome..." 
                   /* COLORE E FORMA INPUTS: bg-[#D9E6F6] fedele alle nuance piatte azzurre richieste nel Figma */
                   className="w-full bg-[#DEECFA] text-brand-primary placeholder:text-brand-primary/50 px-6 py-4 rounded-sm outline-none focus:ring-2 focus:ring-[#42649B]/30 transition-all font-medium text-sm border-none"
                 />
                 {/* INPUT CORTO COGNOME */}
                 <input 
                   required
                   type="text" 
                   placeholder="Cognome..." 
                   className="w-full bg-[#DEECFA] text-brand-primary placeholder:text-brand-primary/50 px-6 py-4 rounded-sm outline-none focus:ring-2 focus:ring-[#42649B]/30 transition-all font-medium text-sm border-none"
                 />
              </div>

              {/* INPUT LUNGO EMAIL */}
              <input 
                required
                type="email" 
                placeholder="Indirizzo email..." 
                className="w-full bg-[#DEECFA] text-brand-primary placeholder:text-brand-primary/50 px-6 py-4 rounded-sm outline-none focus:ring-2 focus:ring-[#42649B]/30 transition-all font-medium text-sm border-none"
              />

              {/* SELECT TENDINA TIPO RICHIESTA */}
              <div className="relative">
                 <select required className="w-full bg-[#DEECFA] text-brand-primary/80 px-6 py-4 rounded-sm outline-none focus:ring-2 focus:ring-[#42649B]/30 transition-all font-medium text-sm border-none appearance-none cursor-pointer">
                    <option value="" disabled selected hidden>Inserisci il tipo di richiesta...</option>
                    <option value="mediazione">Richiesta di Mediazione ADR</option>
                    <option value="informazioni">Richiesta Informazioni Generali</option>
                    <option value="corso">Iscrizione Corsi di Aggiornamento</option>
                 </select>
                 <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-brand-primary/60">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                 </div>
              </div>

              {/* TEXTAREA DESCRITTIVA ALTA */}
              <textarea 
                required
                rows={6}
                placeholder="Descrivici la tua richiesta qui..."
                className="w-full bg-[#DEECFA] text-brand-primary placeholder:text-brand-primary/50 px-6 py-4 rounded-sm outline-none focus:ring-2 focus:ring-[#42649B]/30 transition-all font-medium text-sm border-none resize-none"
              />

              {/* BOTTONED INVIO CENTRATO SOTTO */}
              <div className="pt-4 flex justify-center lg:justify-end xl:justify-center">
                 <button 
                   type="submit"
                   disabled={isSubmitting || isSuccess}
                   /* COLORE FORMA BUTTON: Tinta piatta sbiadita come nel design, stondato leggermente rounded-md */
                   className={`px-12 py-3 rounded-lg text-white font-medium tracking-wide transition-all ${
                     isSuccess ? 'bg-green-500 scale-105' : 
                     isSubmitting ? 'bg-gray-400 cursor-wait' : 
                     'bg-[#B5C7DB] hover:bg-[#9EAFBF] active:scale-95 text-white'
                   }`}
                 >
                   {isSubmitting ? "Invio..." : isSuccess ? "Inviato!" : "Invia"}
                 </button>
              </div>

           </form>
        </motion.div>
      </div>

      {/* ===== IMMAGINE DI CHIUSURA BOTTOM: "LA LEGGE E' UGUALE PER TUTTI" ===== */}
      <div className="w-full h-48 md:h-72 relative border-t-4 border-brand-accent overflow-hidden">
         {/* Al momento usa l'immagine segnaposto. Se l'utente ti passa quella esatta su figma, tu userai /tribunale.jpg ed inserendo fill calzerà magicamente! */}
         <Image 
           src="/italia.webp" 
           alt="La legge è uguale per tutti" 
           fill 
           className="object-cover object-center grayscale opacity-80 mix-blend-multiply" 
           sizes="100vw"
         />
         <div className="absolute inset-0 bg-brand-primary/40" />
         
         {/* Il testo sopra fa le veci dell'immagine se tu volessi caricarne una generica */}
         <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
           <h2 className="text-3xl md:text-5xl font-chillax font-bold text-white tracking-widest drop-shadow-2xl">
              LA LEGGE E' UGUALE PER TUTTI
           </h2>
         </div>
      </div>
    </section>
  );
};
