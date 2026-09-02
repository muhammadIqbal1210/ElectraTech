'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { getStoredUser, getToken, ApiUser } from '@/lib/api';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<ApiUser | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const token = getToken();
    const storedUser = getStoredUser();
    if (token && storedUser) {
      setUser(storedUser);
    } else {
      setUser(null);
    }
  }, []);

  const getDashboardPath = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return '/admin';
      case 'PRODUSEN':
        return '/produsen';
      case 'KURIR':
        return '/kurir';
      default:
        return '/admin';
    }
  };

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
          <Image
            src="/logomonocrom.png"
            alt="ElectraTech"
            width={40}
            height={40}
            className="h-auto w-auto"
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
            href="/"
            className="text-slate-300 hover:text-cyan-400 transition"
          >
            Beranda
          </Link>
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
            href="/blog"
            className="text-slate-300 hover:text-cyan-400 transition"
          >
            Blog
          </Link>
          <Link
            href="/kontak"
            className="text-slate-300 hover:text-cyan-400 transition"
          >
            Kontak
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <Link
              href={getDashboardPath(user.role)}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold transition"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold transition"
            >
              Masuk
            </Link>
          )}
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
            <Link href="/blog">Blog</Link>
            <Link href="/kontak">Kontak</Link>

            {user ? (
              <Link
                href={getDashboardPath(user.role)}
                className="bg-cyan-500 text-slate-900 py-3 rounded-xl text-center font-semibold"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="bg-cyan-500 text-slate-900 py-3 rounded-xl text-center font-semibold"
              >
                Masuk
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}