'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-slate-950/90 backdrop-blur-xl border-b border-slate-800 shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <img
            src="/logomonocrom.png"
            alt="ElectraTech"
            className="h-10 w-auto"
          />

          <div className="hidden sm:block">
            <h3 className="font-bold text-white">
              Electra Tech
            </h3>
            <p className="text-xs text-slate-500">
              Intelligent Connectivity
            </p>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link
            href="#layanan"
            className="text-slate-300 hover:text-cyan-400 transition"
          >
            Layanan
          </Link>

          <Link
            href="#fitur"
            className="text-slate-300 hover:text-cyan-400 transition"
          >
            Fitur
          </Link>

          <Link
            href="#tracking"
            className="text-slate-300 hover:text-cyan-400 transition"
          >
            Tracking
          </Link>

          <Link
            href="#blog"
            className="text-slate-300 hover:text-cyan-400 transition"
          >
            Blog
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold transition"
          >
            Dashboard
          </Link>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-white"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-slate-950 border-t border-slate-800">
          <div className="flex flex-col p-6 gap-5">
            <Link href="#layanan">Layanan</Link>
            <Link href="#fitur">Fitur</Link>
            <Link href="#tracking">Tracking</Link>
            <Link href="#blog">Blog</Link>

            <Link
              href="/login"
              className="bg-cyan-500 text-slate-900 py-3 rounded-xl text-center font-semibold"
            >
              Dashboard
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}