'use client';

import Navbar from '@/components/Navbar';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Cpu,
  Truck,
  CalendarDays,
  ArrowRight,
  CheckCircle2,
  ScanLine,
  Database,
  Globe,
} from 'lucide-react';


export default function LandingPage() {
  const [counts, setCounts] = useState({ products: 0, partners: 0, integrity: 0 });

  useEffect(() => {
    const duration = 1800;
    const start = performance.now();

    const animate = (time: number) => {
      const progress = Math.min((time - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setCounts({
        products: Math.round(10 * eased),
        partners: Math.round(250 * eased),
        integrity: Number((99.9 * eased).toFixed(1)),
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="min-h-screen bg-[#0b132b] text-white overflow-x-hidden">
      <Navbar />

      {/* HERO */}
      <section className="relative pt-32 pb-24 min-h-screen flex items-center overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-20 left-20 w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-600/10 blur-[140px] rounded-full" />

        {/* Grid Background */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-2 gap-16 items-center relative z-10">
          {/* LEFT */}
          <div>
            <h1 className="text-5xl lg:text-4xl font-bold leading-tight">
              Building More Transparent 
            </h1>
              <h1 className="typing-text text-5xl lg:text-4xl font-bold block bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Products of the Future
              </h1>

            <p className="mt-6 text-lg text-slate-400 max-w-xl leading-relaxed">
              Electra Tech Indonesia menghadirkan solusi Blockchain, AI,
              dan IoT untuk memastikan setiap produk dapat dilacak,
              diverifikasi, dan dipantau secara real-time.
            </p>

            <div className="flex flex-wrap gap-4 mt-8">
              <a
                href="#layanan"
                className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold transition"
              >
                Explore Solution
              </a>

              <a
                href="#tracking"
                className="px-6 py-3 rounded-xl border border-slate-700 hover:border-cyan-400 transition"
              >
                Verify Product
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-12">
              <div>
                <h3 className="text-3xl font-bold">{counts.products}K+</h3>
                <p className="text-slate-500 text-sm">Products Tracked</p>
              </div>

              <div>
                <h3 className="text-3xl font-bold">{counts.partners}+</h3>
                <p className="text-slate-500 text-sm">Business Partners</p>
              </div>

              <div>
                <h3 className="text-3xl font-bold">{counts.integrity.toFixed(1)}%</h3>
                <p className="text-slate-500 text-sm">Data Integrity</p>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="relative flex justify-center">
            <div className="relative w-full max-w-[520px] rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-6">
              <Image
                src="/preview.png"
                alt="Electra"
                width={700}
                height={700}
                className="w-full h-auto object-contain border border-slate-800 rounded-2xl"
              />

              {/* Floating Card */}
              <div className="absolute -top-6 -left-6 bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl">
                <p className="text-xs text-slate-500">
                  Blockchain Status
                </p>
                <p className="text-emerald-400 font-semibold">
                  Verified
                </p>
              </div>

              <div className="absolute bottom-10 -right-6 bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl">
                <p className="text-xs text-slate-500">
                  Temperature
                </p>
                <p className="text-cyan-400 font-semibold">
                  4.2°C Stable
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx global>{`
        .typing-text {
          display: inline-block;
          overflow: hidden;
          white-space: nowrap;
          border-right: 2px solid rgba(125, 211, 252, 0.95);
          animation: typing 2.2s steps(24, end), blink 0.8s step-end infinite;
        }

        @keyframes typing {
          from { width: 0; }
          to { width: 100%; }
        }

        @keyframes blink {
          50% { border-color: transparent; }
        }
      `}</style>

      {/* TRUSTED BY */}
      <section className="py-10 border-y border-slate-800">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-slate-500 text-sm mb-8 uppercase tracking-widest">
            Trusted by innovative businesses
          </p>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-center text-slate-500 font-semibold">
            <div>AGRO TECH</div>
            <div>SMART FARM</div>
            <div>LOGISTICS ID</div>
            <div>TRACE CORP</div>
            <div>FOODCHAIN</div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="layanan" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-cyan-400 uppercase text-xs tracking-widest">
              Our Ecosystem
            </span>

            <h2 className="text-4xl font-bold mt-3">
              Solusi Digital Terintegrasi
            </h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Featured */}
            <div className="lg:col-span-2 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-3xl p-10">
              <ShieldCheck className="w-12 h-12 text-cyan-400 mb-6" />

              <h3 className="text-3xl font-bold mb-4">
                TraceChain
              </h3>

              <p className="text-slate-400 leading-relaxed mb-8">
                Infrastruktur blockchain yang menjaga integritas
                data rantai pasok dan sertifikasi halal secara
                permanen serta transparan.
              </p>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-slate-900/50 p-4 rounded-xl">
                  Immutable Data
                </div>

                <div className="bg-slate-900/50 p-4 rounded-xl">
                  QR Verification
                </div>

                <div className="bg-slate-900/50 p-4 rounded-xl">
                  Real-Time Tracking
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
                <Cpu className="w-10 h-10 text-cyan-400 mb-4" />
                <h3 className="text-xl font-bold mb-3">
                  SmartLink IoT
                </h3>
                <p className="text-slate-400 text-sm">
                  Monitoring suhu, kelembaban, dan kondisi
                  lingkungan secara real-time.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
                <Truck className="w-10 h-10 text-emerald-400 mb-4" />
                <h3 className="text-xl font-bold mb-3">
                  Supply Chain Core
                </h3>
                <p className="text-slate-400 text-sm">
                  Dashboard AI untuk analisis distribusi dan
                  optimalisasi logistik.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="fitur" className="py-24 bg-slate-900/30">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-center text-4xl font-bold mb-16">
            How It Works
          </h2>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: ScanLine,
                title: 'Register',
                text: 'Produk didaftarkan ke sistem.',
              },
              {
                icon: Database,
                title: 'Blockchain',
                text: 'Data diamankan secara permanen.',
              },
              {
                icon: Globe,
                title: 'Distribution',
                text: 'Produk bergerak melalui rantai pasok.',
              },
              {
                icon: ShieldCheck,
                title: 'Verification',
                text: 'Konsumen memverifikasi keaslian.',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center"
              >
                <item.icon className="mx-auto mb-4 text-cyan-400" />
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRACKING */}
      <section id="tracking" className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Verify Your Product
          </h2>

          <p className="text-slate-400 mb-10">
            Masukkan nomor seri atau ID produk untuk
            melakukan verifikasi.
          </p>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="ETI-2026-00001"
                className="flex-1 bg-slate-800 rounded-xl px-4 py-3 outline-none"
              />

              <button className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold px-6 rounded-xl">
                Lacak Produk
              </button>
            </div>

            <div className="mt-8 text-left bg-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 text-emerald-400 mb-3">
                <CheckCircle2 className="w-5 h-5" />
                Product Verified
              </div>

              <p className="text-slate-300">
                Batch: ETI-2026-00001
              </p>

              <p className="text-slate-300">
                Status: Authentic Product
              </p>

              <p className="text-slate-300">
                Location: Padang Distribution Center
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BLOG */}
      <section id="blog" className="py-24 bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-center text-4xl font-bold mb-16">
            Latest Insights
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((item) => (
              <article
                key={item}
                className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden hover:-translate-y-1 transition"
              >
                <div className="h-48 bg-gradient-to-br from-cyan-500/20 to-blue-500/20" />

                <div className="p-6">
                  <div className="flex items-center gap-2 text-cyan-400 text-sm mb-4">
                    <CalendarDays className="w-4 h-4" />
                    02 Jun 2026
                  </div>

                  <h3 className="font-bold text-xl mb-3">
                    Meningkatkan Transparansi Supply Chain
                  </h3>

                  <p className="text-slate-400 text-sm mb-6">
                    Memahami bagaimana blockchain membantu
                    menjaga integritas data distribusi.
                  </p>

                  <a
                    href="#"
                    className="inline-flex items-center gap-2 text-cyan-400"
                  >
                    Baca Selengkapnya
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="rounded-[32px] bg-gradient-to-r from-cyan-600 to-blue-700 p-12 text-center">
            <h2 className="text-4xl font-bold mb-4">
              Ready to Transform Your Supply Chain?
            </h2>

            <p className="text-cyan-100 mb-8 max-w-2xl mx-auto">
              Tingkatkan transparansi, keamanan data, dan
              efisiensi operasional dengan teknologi Electra
              Tech Indonesia.
            </p>

            <a
              href="#kontak"
              className="inline-block bg-white text-slate-900 px-8 py-4 rounded-xl font-semibold"
            >
              Schedule Consultation
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        id="kontak"
        className="border-t border-slate-800 py-10 text-center text-slate-500"
      >
        <p>
          © {new Date().getFullYear()} Electra Tech Indonesia.
          All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}