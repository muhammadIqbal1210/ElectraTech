'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 text-white relative overflow-hidden">
      {/* Background Accent Glow */}
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800/80">
          {/* Brand & Description */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logomonocrom.png"
                alt="ElectraTech"
                width={36}
                height={36}
                className="h-auto w-auto"
              />
              <div>
                <h3 className="font-bold text-lg text-white">Electra Tech</h3>
                <p className="text-xs text-slate-500">Intelligent Connectivity</p>
              </div>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Solusi berbasis Blockchain, IoT, dan AI untuk transparansi, pelacakan real-time, dan integritas data rantai pasok benih pertanian masa depan.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-cyan-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              Traceability & Verified Supply Chain Systems
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Navigasi</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link href="/" className="hover:text-cyan-400 transition">Beranda</Link>
              </li>
              <li>
                <Link href="/#layanan" className="hover:text-cyan-400 transition">Layanan & Ekosistem</Link>
              </li>
              <li>
                <Link href="/#fitur" className="hover:text-cyan-400 transition">Fitur Utama</Link>
              </li>
              <li>
                <Link href="/#tracking" className="hover:text-cyan-400 transition">Lacak Produk</Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-cyan-400 transition">Berita & Insights</Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Layanan</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>TraceChain Ledger</li>
              <li>SmartLink IoT Telemetry</li>
              <li>Supply Chain Core</li>
              <li>QR & Ledger Verification</li>
              <li>AI Irrigation Advisory</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Kontak Kami</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span className="text-xs leading-relaxed">Padang, Sumatera Barat, Indonesia</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-xs">info@electratech.id</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-xs">+62 812-3456-7890</span>
              </li>
              <li className="pt-1">
                <Link
                  href="/kontak"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition"
                >
                  Hubungi Formulir Konsultasi
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Electra Tech Indonesia. All Rights Reserved.</p>
          <div className="flex gap-6">
            <Link href="/kontak" className="hover:text-slate-400 transition">Kebijakan Privasi</Link>
            <Link href="/kontak" className="hover:text-slate-400 transition">Syarat & Ketentuan</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
