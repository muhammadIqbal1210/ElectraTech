import type { Metadata } from 'next';
import Link from 'next/link';
import { House, Newspaper, SearchX, ShieldCheck } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StatusPage, { StatusLink } from '@/components/StatusPage';

export const metadata: Metadata = {
  title: 'Halaman Tidak Ditemukan',
  robots: { index: false, follow: true },
};

const popularLinks = [
  { href: '/blog', label: 'Blog & Berita', icon: Newspaper },
  { href: '/verify', label: 'Verifikasi Produk', icon: ShieldCheck },
  { href: '/kontak', label: 'Kontak Kami', icon: House },
];

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0b132b] text-white">
      <Navbar />
      <main>
        <StatusPage
          code="404"
          icon={SearchX}
          title="Halaman tidak ditemukan"
          description="Maaf, halaman yang Anda cari tidak ada, sudah dipindahkan, atau alamatnya salah ketik."
          actions={
            <StatusLink href="/" primary>
              <House className="h-4 w-4" aria-hidden />
              Kembali ke Beranda
            </StatusLink>
          }
          footer={
            <nav aria-label="Halaman populer">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Halaman populer</p>
              <ul className="flex flex-wrap justify-center gap-2">
                {popularLinks.map(({ href, label, icon: Icon }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-300 transition hover:border-cyan-500/50 hover:text-cyan-300"
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          }
        />
      </main>
      <Footer />
    </div>
  );
}
