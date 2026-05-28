// src/components/Navbar.tsx
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            ELECTRA TECH
          </span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <Link href="#layanan" className="hover:text-blue-400 transition">Layanan</Link>
          <Link href="#fitur" className="hover:text-blue-400 transition">Fitur Utama</Link>
          <Link href="#verifikasi" className="hover:text-blue-400 transition">Cek Produk</Link>
        </div>

        <div>
          <Link 
            href="/login" 
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition shadow-lg shadow-blue-600/20"
          >
            Masuk ke Sistem
          </Link>
        </div>
      </div>
    </nav>
  );
}
