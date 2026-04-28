"use client";

import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';

export const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  // LOGICA E DATI: Cambia i nomi qui per modficare i link della navigazione
  const links = [
    { name: 'Home', href: '/' },
    { name: 'Chi Siamo', href: '/chi-siamo' },
    { name: 'Dove siamo', href: '/dove-siamo' },
    { name: 'Contatti', href: '/contatti' },
    { name: 'News', href: '/news' },
    { name: 'Corsi di Aggiornamento', href: '#' }
  ];

  return (
    /* FORMA COMPONENTE NAVBAR: "absolute" permette all'header di sedersi SOPRA la sezione Hero sottostante */
    <header className="absolute top-0 left-0 right-0 z-50 p-6 md:px-12 flex items-center justify-between">
      
      {/* FORMA E LOGO: Il logo fluttua a sinistra all'avvio. */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center"
      >
        <Image 
          src="/logo.png" 
          alt="I.Me.Con Logo" 
          width={220}
          height={60}
          priority
          /* DIMENSIONE LOGO: h-10 su mobile, h-14 su desktop. */
          className="h-10 md:h-14 w-auto object-contain"
        />
      </motion.div>

      {/* BLOCCO MENU DESKTOP */}
      <motion.nav 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        /* COLORE SFONDO BARRA: bg-white/10 aggiunge bianco trasparente per isolarsi ma vedere dietro (effetto vetro con backdrop-blur-md) */
        className="hidden lg:flex items-center gap-6 bg-white/10 backdrop-blur-md rounded-full px-6 py-3 border border-white/10 shadow-sm"
      >
        {links.map((link, i) => (
          /* COLORE LINK: text-contrast/90 (Bianco opaco), hover:text-brand-accent (Diventa arancio al passaggio del mouse!) */
          <a key={i} href={link.href} className="text-contrast/90 hover:text-brand-accent text-sm transition-colors hover:underline underline-offset-4 font-medium">
            {link.name}
          </a>
        ))}
      </motion.nav>

      {/* BLOCCO LOG IN (Visibile solo nel desktop) */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }} // Appare da destra
        animate={{ opacity: 1, x: 0 }}
        className="hidden md:block"
      >
        {/* COMPONENTE: Richiama il Button arancione "primary" */}
        <Button variant="primary" className="text-sm px-5 py-2 rounded-full !text-base">Log In Page</Button>
      </motion.div>

      {/* ICONA MENU MOBILE (Le lineette "Hamburger") */}
      <button className="lg:hidden text-contrast z-50 relative" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={28} className="text-contrast" /> : <Menu size={28} />}
      </button>

      {/* MENU A TENDINA MOBILE ESPANDIBILE */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          /* COLORE PANNELLO MOBILE: bg-brand-primary (#064789). Scende sopra a tutto con la shadow-xl */
          className="absolute top-full left-0 right-0 bg-brand-primary p-6 flex flex-col gap-4 shadow-xl z-40 lg:hidden"
        >
          {links.map((link, i) => (
            <a key={i} href={link.href} className="text-contrast text-lg hover:bg-brand-secondary p-2 rounded">
              {link.name}
            </a>
          ))}
          <Button variant="secondary" className="w-full mt-2 !text-lg">Log In Page</Button>
        </motion.div>
      )}
    </header>
  );
};
