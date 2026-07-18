"use client";

import { motion } from 'framer-motion';
import { Menu, X, ChevronDown, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { logoutAction } from '@/app/actions/auth-actions';

interface CurrentUser {
  id: number;
  nomeCognome: string;
  email: string;
  username: string;
  ruoli: string[];
  areaIds: number[];
}

export const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));
  }, []);

  const handleLogout = async () => {
    const res = await logoutAction();
    if (res?.success) {
      setUser(null);
      setShowDropdown(false);
      window.location.href = "/";
    }
  };

  // LOGICA E DATI: Cambia i nomi qui per modificare i link della navigazione
  const links = [
    { name: 'Home', href: '/' },
    { name: 'Chi Siamo', href: '/chi-siamo' },
    { name: 'Dove siamo', href: '/dove-siamo' },
    { name: 'Contatti', href: '/contatti' },
    { name: 'News', href: '/news' },
  ];

  return (
    /* FORMA COMPONENTE NAVBAR: "absolute" permette all'header di sedersi SOPRA la sezione Hero sottostante */
    <header className="absolute top-0 left-0 right-0 z-50 py-5 px-6 md:px-12 flex items-center justify-between">
      
      {/* FORMA E LOGO: Il logo fluttua a sinistra all'avvio. */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center"
      >
        <Link href="/">
          <Image 
            src="/imecon logo.png" 
            alt="I.Me.Con Logo" 
            width={220}
            height={60}
            priority
            /* DIMENSIONE LOGO: h-10 su mobile, h-14 su desktop. */
            className="h-10 md:h-14 w-auto object-contain cursor-pointer"
          />
        </Link>
      </motion.div>

      {/* BLOCCO MENU DESKTOP */}
      <motion.nav 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        /* COLORE SFONDO BARRA: bg-white/10 aggiunge bianco trasparente per isolarsi ma vedere dietro (effetto vetro con backdrop-blur-md) */
        className="hidden lg:flex items-center gap-7 bg-white/10 backdrop-blur-md rounded-full px-8 py-3 border border-white/15 shadow-lg"
      >
        {links.map((link, i) => (
          /* COLORE E FONT LINK: text-contrast/90, hover:text-brand-accent, font-sans ad alta leggibilità */
          <a key={i} href={link.href} className="text-contrast/90 hover:text-brand-accent text-sm font-sans font-medium transition-colors hover:underline underline-offset-4 tracking-wide">
            {link.name}
          </a>
        ))}
      </motion.nav>

      {/* BLOCCO LOG IN (Visibile solo nel desktop) */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }} // Appare da destra
        animate={{ opacity: 1, x: 0 }}
        className="hidden md:block relative"
      >
        {user ? (
          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md border border-white/20 text-contrast rounded-full px-5 py-2.5 hover:bg-white/20 transition-all font-sans font-medium text-sm cursor-pointer shadow-sm"
            >
              <span>Ciao, {user.nomeCognome.split(" ")[0]}</span>
              <ChevronDown size={16} className={`transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showDropdown && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 mt-3 w-56 bg-brand-primary/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl p-2.5 z-50 text-sm font-sans"
              >
                <div className="px-3.5 py-2.5 border-b border-white/10 text-xs text-contrast/70">
                  Ruolo: <span className="font-semibold text-brand-accent ml-1">{user.ruoli[0] || "Utente"}</span>
                </div>
                {(user.ruoli.includes("Amministratore") || user.ruoli.includes("Mediatore") || user.ruoli.includes("Segreteria")) && (
                  <>
                    <Link href="/gestionale">
                      <span className="w-full flex items-center gap-2 px-3.5 py-2.5 mt-1.5 text-contrast hover:bg-white/10 rounded-xl text-left transition-colors cursor-pointer block font-medium">
                        Vai al gestionale
                      </span>
                    </Link>
                    <Link href="/gestionale/calendario">
                      <span className="w-full flex items-center gap-2 px-3.5 py-2.5 mt-1 text-contrast hover:bg-white/10 rounded-xl text-left transition-colors cursor-pointer block font-medium">
                        Calendario scadenze
                      </span>
                    </Link>
                  </>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 mt-1.5 text-red-300 hover:bg-red-950/40 rounded-xl text-left transition-colors cursor-pointer font-medium"
                >
                  <LogOut size={16} />
                  <span>Disconnetti</span>
                </button>
              </motion.div>
            )}
          </div>
        ) : (
          <Link href="/login">
            <Button variant="primary" className="text-sm px-6 py-2.5 rounded-xl">Accedi</Button>
          </Link>
        )}
      </motion.div>

      {/* ICONA MENU MOBILE (Le lineette "Hamburger") */}
      <button className="lg:hidden text-contrast z-50 relative p-2 focus:outline-none" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={28} className="text-contrast" /> : <Menu size={28} />}
      </button>

      {/* MENU A TENDINA MOBILE ESPANDIBILE */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          /* COLORE PANNELLO MOBILE: bg-brand-primary/95 con backdrop-blur-xl. Scende sopra a tutto con shadow-2xl */
          className="absolute top-full left-0 right-0 bg-brand-primary/95 backdrop-blur-xl border-b border-white/15 p-6 flex flex-col gap-3 shadow-2xl z-40 lg:hidden font-sans"
        >
          {links.map((link, i) => (
            <a key={i} href={link.href} className="text-contrast font-medium text-base hover:text-brand-accent hover:bg-white/5 px-4 py-3 rounded-xl transition-colors">
              {link.name}
            </a>
          ))}
          {user ? (
            <div className="flex flex-col gap-2.5 mt-2 border-t border-white/15 pt-4">
              <div className="text-contrast/80 text-sm px-2 mb-1 font-medium">
                Ciao, <span className="font-semibold text-contrast">{user.nomeCognome}</span> ({user.ruoli[0] || "Utente"})
              </div>
              {(user.ruoli.includes("Amministratore") || user.ruoli.includes("Mediatore") || user.ruoli.includes("Segreteria")) && (
                <div className="flex flex-col gap-2">
                  <Link href="/gestionale">
                    <Button variant="secondary" className="w-full justify-center gap-2">
                      Vai al gestionale
                    </Button>
                  </Link>
                  <Link href="/gestionale/calendario">
                    <Button variant="secondary" className="w-full justify-center gap-2">
                      Calendario scadenze
                    </Button>
                  </Link>
                </div>
              )}
              <Button variant="secondary" onClick={handleLogout} className="w-full justify-center gap-2 !bg-red-950/40 hover:!bg-red-950/60 !text-red-200 border border-red-900/40">
                <LogOut size={18} />
                Disconnetti
              </Button>
            </div>
          ) : (
            <Link href="/login" className="mt-2">
              <Button variant="primary" className="w-full justify-center">Accedi all&apos;Area Riservata</Button>
            </Link>
          )}
        </motion.div>
      )}
    </header>
  );
};

