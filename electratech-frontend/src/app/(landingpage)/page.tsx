'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/api';
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
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  Copy,
  AlertTriangle,
  ExternalLink,
  Layers,
  Sparkles,
  Activity,
  FileText,
  Bot,
  QrCode,
} from 'lucide-react';

const members = [
  {
    name: "Ari Kurniawan S.T, M.T",
    role: "Direktur Utama",
    image: "/team_ari.png"
  },
  {
    name: "Dr. Kiki Yulianto ",
    role: "Komisaris Utama",
    image: "/team_kiki.png"
  },
  {
    name: "Muhammad Iqbal",
    role: "Programmer",
    image: "/iqbal.png"
  }
];
function LandingBlogCards() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLatest() {
      try {
        const res = await fetch(`${API_URL}/api/blogs?limit=3`);
        const json = await res.json();
        if (json.ok && json.data) {
          setBlogs(json.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchLatest();
  }, []);

  if (loading) {
    return <p className="text-slate-400 text-sm col-span-3 text-center py-8">Memuat berita terbaru...</p>;
  }

  if (blogs.length === 0) {
    return <p className="text-slate-500 text-sm col-span-3 text-center py-8">Belum ada berita dipublikasikan.</p>;
  }

  return (
    <>
      {blogs.map((blog) => (
        <article
          key={blog.id}
          className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden hover:border-cyan-500/40 transition flex flex-col group"
        >
          <div className="relative h-48 bg-slate-950 overflow-hidden">
            <Image
              src={blog.thumbnail || 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?q=80&w=800'}
              alt={blog.title}
              fill
              unoptimized
              className="object-cover group-hover:scale-105 transition duration-500"
            />
            <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md border border-slate-800 text-cyan-400 text-[11px] font-semibold px-3 py-1 rounded-full">
              {blog.category}
            </div>
          </div>

          <div className="p-6 flex flex-col flex-1">
            <div className="flex items-center gap-2 text-cyan-400 text-xs mb-3">
              <CalendarDays className="w-3.5 h-3.5" />
              {new Date(blog.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </div>

            <h3 className="font-bold text-lg mb-3 text-white line-clamp-2 group-hover:text-cyan-400 transition">
              {blog.title}
            </h3>

            <p className="text-slate-400 text-xs line-clamp-3 mb-6 flex-1">
              {blog.content.replace(/<[^>]+>/g, '').substring(0, 120)}...
            </p>

            <Link
              href={`/blog/${blog.slug}`}
              className="inline-flex items-center gap-2 text-cyan-400 text-sm font-semibold hover:text-cyan-300 transition mt-auto"
            >
              Baca Selengkapnya
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </article>
      ))}
    </>
  );
}


export default function LandingPage() {
  const [counts, setCounts] = useState({ products: 0, partners: 0, integrity: 0 });
  const partners = [
    "/insightpoll.webp",
    "/dikti.webp",
    "/pemprovsumbar.webp",
    "/logoelectra.png",
    "/kemendikbud.webp",
    "/pbmbt.webp"
  ];

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

              <Link
                href="/verify"
                className="px-6 py-3 rounded-xl border border-slate-700 hover:border-cyan-400 transition"
              >
                Verify Product
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-8 mt-12">
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold">{counts.products}K+</h3>
                <p className="text-slate-500 text-xs sm:text-sm">Products Tracked</p>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-bold">{counts.partners}+</h3>
                <p className="text-slate-500 text-xs sm:text-sm">Business Partners</p>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-bold">{counts.integrity.toFixed(1)}%</h3>
                <p className="text-slate-500 text-xs sm:text-sm">Data Integrity</p>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="relative flex justify-center">
              <Image
                src="/mock.webp"
                alt="Electra"
                width={700}
                height={700}
                priority
                style={{ height: 'auto' }}
              />

              {/* Floating Card
              <div className="absolute -top-6 -left-2 sm:-left-6 bg-slate-950 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl">
                <p className="text-[10px] sm:text-xs text-slate-500">
                  Blockchain Status
                </p>
                <p className="text-xs sm:text-sm text-emerald-400 font-semibold">
                  Verified
                </p>
              </div> */}

              {/* <div className="absolute bottom-10 -right-2 sm:-right-6 bg-slate-950 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl">
                <p className="text-[10px] sm:text-xs text-slate-500">
                  Temperature
                </p>
                <p className="text-xs sm:text-sm text-cyan-400 font-semibold">
                  4.2°C Stable
                </p>
              </div> */}
          </div>
        </div>
      </section>

      <style jsx global>{`
        .typing-text {
          display: inline-block;
          max-width: 100%;
          overflow: hidden;
          white-space: nowrap;
          border-right: 2px solid rgba(125, 211, 252, 0.95);
          animation: typing 2.2s steps(24, end), blink 0.8s step-end infinite;
        }

        @media (max-width: 640px) {
          .typing-text {
            white-space: normal;
            border-right: none;
            animation: none;
          }
        }

        @keyframes typing {
          from { width: 0; }
          to { width: 100%; }
        }

        @keyframes blink {
          50% { border-color: transparent; }
        }

        @keyframes slideStep {
          0%, 16% { transform: translateX(0); }
          20%, 36% { transform: translateX(-10%); }
          40%, 56% { transform: translateX(-20%); }
          60%, 76% { transform: translateX(-30%); }
          80%, 96% { transform: translateX(-40%); }
          100% { transform: translateX(-50%); }
        }

        .animate-slide-step {
          animation: slideStep 10s infinite;
        }
      `}</style>

      {/* TRUSTED BY */}
      <section className="py-4 bg-[#0b132b] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-8">

          {/* Teks Sejajar di Samping */}
          <p className="text-slate-500 text-sm uppercase tracking-widest font-medium whitespace-nowrap shrink-0">
            Telah dipercaya oleh:
          </p>

          {/* Marquee Container (Logo Bergeser) */}
          <div className="relative flex overflow-hidden w-full [mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)]">
            <div className="flex gap-24 animate-slide-step w-max">
              {[...partners, ...partners].map((logo, index) => (
                <div
                  key={`${logo}-${index}`}
                  className="w-[80px] h-[80px] flex items-center justify-center shrink-0"
                >
                  <Image
                    src={logo}
                    alt="Partner Logo"
                    width={80}
                    height={80}
                    className="w-auto h-auto object-contain opacity-50 hover:opacity-100 transition-opacity"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MAIN FEATURES (SESUAI REFERENSI LAYOUT TAPI TETAP DENGAN GAYA ELEGAN ELECTRA TECH) */}
      <section id="layanan" className="py-20 relative">
        {/* Ambient Glow */}
        <div className="absolute top-1/3 left-10 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-6">
          {/* Header Section: Di tengah (Centered) */}
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <span className="text-cyan-400 uppercase text-xs tracking-widest block mb-2 font-medium">
              Features
            </span>
            <h2 className="text-3xl sm:text-3xl font-bold text-white mb-3">
              Main Features of Electra Tech
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">
              Solusi terintegrasi yang menggabungkan TraceChain Blockchain, telemetri SmartLink IoT, dan AI otomatisasi untuk rantai pasok agrikultur yang transparan dan akuntabel.
            </p>
          </div>

          {/* 4 Kolom Cards Grid persis referensi dengan style Electra Tech */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
            {[
              {
                icon: ShieldCheck,
                title: 'TraceChain Blockchain',
                desc: 'Pencatatan riwayat siklus benih dan mutasi fase secara tamper-proof pada smart contract Polygon Network.',
              },
              {
                icon: Cpu,
                title: 'SmartLink IoT Telemetry',
                desc: 'Monitoring telemetri sensor lingkungan real-time (suhu, kelembaban, pH) serta kontrol aktuator via MQTT.',
              },
              {
                icon: Layers,
                title: 'Lifecycle & Logistics',
                desc: 'Pelacakan siklus hidup varietas dan distribusi rantai dingin dengan validasi checkpoint terverifikasi.',
              },
              {
                icon: QrCode,
                title: 'Instant QR Verification',
                desc: 'Verifikasi instan keaslian fisik kemasan benih dan riwayat sertifikasi batch hanya dengan memindai QR Code.',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col items-start group"
              >
                {/* Rounded Icon Container dengan background yang sama seperti process flow */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-500 text-slate-950 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)] group-hover:scale-105 group-hover:shadow-[0_0_25px_rgba(6,182,212,0.7)] transition-all duration-300 ring-3 ring-[#0b132b] mb-6">
                  <item.icon className="w-8 h-8 stroke-[2]" />
                </div>

                {/* Feature Title */}
                <h3 className="text-lg font-bold text-white mb-2.5 group-hover:text-cyan-300 transition-colors">
                  {item.title}
                </h3>

                {/* Feature Description */}
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS / PROCESS FLOW (VERTICAL ALTERNATING TIMELINE) */}
      <section id="fitur" className="py-24 bg-slate-900/40 border-y border-slate-800/60 relative overflow-hidden">
        {/* Ambient Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/5 blur-[160px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-20">
            <span className="text-cyan-400 uppercase text-xs tracking-widest block mb-2 font-medium">
              Process Flow
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Alur Kerja Electra Tech
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">
              5 tahapan komprehensif dari hulu ke hilir untuk menjamin integritas data, ketertelusuran benih, dan transparansi rantai pasok.
            </p>
          </div>

          <div className="relative">
            {/* Garis Vertikal Glowing di Tengah (Desktop) / Sisi Kiri (Mobile) */}
            <div className="absolute top-6 bottom-6 left-6 md:left-1/2 md:-translate-x-1/2 w-0.5 bg-gradient-to-b from-cyan-500 via-blue-500 to-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.6)]" />

            <div className="space-y-12 md:space-y-16">
              {[
                {
                  step: '01',
                  icon: ScanLine,
                  title: 'Digital Registration',
                  text: 'Batch produk didaftarkan ke sistem dan diberi QR Code / ID digital unik berstandar GS1 untuk mengunci identitas asal sejak awal persemaian.',
                  tag: 'Inisialisasi',
                },
                {
                  step: '02',
                  icon: Cpu,
                  title: 'IoT Telemetry Monitoring',
                  text: 'Sensor SmartLink IoT memantau variabel iklim mikro (suhu udara, kelembaban, pH tanah) secara kontinu dan memicu otomasi aktuator via MQTT.',
                  tag: 'Monitoring',
                },
                {
                  step: '03',
                  icon: Database,
                  title: 'Blockchain Data Immutability',
                  text: 'Data telemetri berkala dan log perpindahan fase benih dicatat ke smart contract Polygon Network, menciptakan audit trail permanen yang anti-manipulasi.',
                  tag: 'TraceChain Ledger',
                },
                {
                  step: '04',
                  icon: Truck,
                  title: 'Cold-Chain Distribution',
                  text: 'Armada logistik mendistribusikan benih dengan pemantauan suhu kontainer live dan verifikasi serah-terima di setiap checkpoint rantai pasok.',
                  tag: 'Logistik',
                },
                {
                  step: '05',
                  icon: ShieldCheck,
                  title: 'Public QR Verification',
                  text: 'Konsumen, mitra petani, maupun regulator dapat memindai QR Code fisik untuk memverifikasi sertifikasi, keaslian, dan riwayat perjalanan produk secara instan.',
                  tag: 'Verifikasi',
                },
              ].map((item, idx) => {
                const isEven = idx % 2 === 1; // Item genap (02, 04) di kanan pada desktop, ganjil (01, 03, 05) di kiri
                return (
                  <div
                    key={idx}
                    className={`relative flex items-center md:justify-between ${
                      isEven ? 'md:flex-row-reverse' : 'md:flex-row'
                    }`}
                  >
                    {/* Kolom Konten Kartu */}
                    <div className="ml-14 md:ml-0 md:w-[44%]">
                      <div className="p-6 sm:p-7 rounded-2xl border border-slate-800 bg-[#0B132B]/80 backdrop-blur-md shadow-xl hover:border-cyan-500/40 hover:shadow-cyan-500/10 transition-all duration-300 group">
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <span className="font-mono text-xs font-medium text-slate-500 group-hover:text-cyan-400 transition-colors">
                            TAHAP {item.step}
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                          {item.title}
                        </h3>

                        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                          {item.text}
                        </p>
                      </div>
                    </div>

                    {/* Node Ikon di Tengah Garis Timeline */}
                    <div className="absolute left-6 md:left-1/2 -translate-x-1/2 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 text-slate-950 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.5)] ring-4 ring-[#070D1E] z-10 transition-transform duration-300 hover:scale-110">
                        <item.icon className="w-5 h-5 stroke-[2.4]" />
                      </div>
                    </div>

                    {/* Kolom Kosong Penyeimbang untuk Sisi Lawan pada Desktop */}
                    <div className="hidden md:block md:w-[44%]" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* BLOG */}
      <section id="blog" className="py-24 bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-16">
            <div>
              <span className="text-cyan-400 uppercase text-xs tracking-widest font-medium block mb-2">
                Insights & Updates
              </span>
              <h2 className="text-3xl font-bold">
                Kabar & Berita Terbaru
              </h2>
            </div>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-cyan-400 font-semibold hover:text-cyan-300 transition text-sm"
            >
              Lihat Semua Berita
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <LandingBlogCards />
          </div>
        </div>
      </section>

      {/*Our Team */}
      <section className='py-24 bg-slate-800/50 border-y border-slate-800/50'>
        <div className="max-w-7xl mx-auto px-6">
          <div className='flex flex-col items-center justify-center'>
            <span className="text-cyan-400 uppercase text-xs tracking-widest font-medium block mb-2 text-center">
              Our Team
            </span>
            <h2 className="text-3xl font-bold text-center">
              Tim Kami
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-16">
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {members.map((members) => (
              <div key={members.name} className='flex flex-col items-center'>
                <Image
                  src={members.image} className="rounded-full object-cover w-60 h-60 border border-cyan-500/20 hover:border-cyan-400/60 transition"
                  alt={members.name}
                  width={200}
                  height={200}
                />
                <h3 className='mt-5 text-xl font-bold'>{members.name}</h3>
                <p className='text-sm text-slate-400'>{members.role}</p>
              </div>
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

            <Link
              href="/kontak"
              className="inline-block bg-white text-slate-900 px-8 py-4 rounded-xl font-semibold hover:bg-slate-100 transition"
            >
              Schedule Consultation
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}