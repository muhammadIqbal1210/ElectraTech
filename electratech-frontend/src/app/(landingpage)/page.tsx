'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
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
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  Copy,
  AlertTriangle,
  ExternalLink,
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
        const res = await fetch('http://localhost:4000/api/blogs?limit=3');
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
  const [currentSlide, setCurrentSlide] = useState(0);
  const verifyImages = ['/verify1.png', '/verify2.png', '/verify3.png'];
  const partners = [
    "/logoelectra.png",
    "/agrotech.png",
    "/eratani.png",
    "/habibigarden.png",
    "/logomonocrom.png",
  ];

  // Database verification state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleCopyUrl = (url: string) => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      setSearchError('Silakan masukkan ID Batch atau Nomor Resi untuk melacak produk.');
      setVerifyResult(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const res = await fetch(`http://localhost:4000/api/verify/${encodeURIComponent(query)}`);
      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.message || json.error || 'Produk tidak ditemukan dalam database ElectraTech.');
      }

      setVerifyResult(json.data);
    } catch (err: any) {
      setVerifyResult(null);
      setSearchError(err.message || 'Gagal melakukan verifikasi database.');
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % verifyImages.length);
    }, 3500);
    return () => clearInterval(slideTimer);
  }, [verifyImages.length]);

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
            <div className="relative w-full max-w-[520px] rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-4 sm:p-6">
              <Image
                src="/preview.png"
                alt="Electra"
                width={700}
                height={700}
                priority
                style={{ height: 'auto' }}
                className="w-full h-auto object-contain border border-slate-800 rounded-2xl"
              />

              {/* Floating Card */}
              <div className="absolute -top-6 -left-2 sm:-left-6 bg-slate-950 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl">
                <p className="text-[10px] sm:text-xs text-slate-500">
                  Blockchain Status
                </p>
                <p className="text-xs sm:text-sm text-emerald-400 font-semibold">
                  Verified
                </p>
              </div>

              <div className="absolute bottom-10 -right-2 sm:-right-6 bg-slate-950 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl">
                <p className="text-[10px] sm:text-xs text-slate-500">
                  Temperature
                </p>
                <p className="text-xs sm:text-sm text-cyan-400 font-semibold">
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

      {/* SERVICES */}
      <section id="layanan" className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-cyan-400 uppercase text-xs tracking-widest">
              Our Ecosystem
            </span>

            <h2 className="text-5xl lg:text-3xl font-bold leading-tight">
              Solusi Digital Terintegrasi
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* TraceChain */}
            <div className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 group relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 blur-3xl rounded-full group-hover:bg-cyan-500/20 transition-all" />
              <div>
                {/* Tambahkan 'p-0' agar tidak ada padding dalam box */}
                <div className="relative w-full h-40 bg-slate-950/60 rounded-2xl flex items-center justify-center border border-slate-800/80 mb-6 group-hover:border-cyan-500/30 transition-colors overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-60 z-10" />
                  {/* Menggunakan fill & object-cover */}
                  <Image
                    src="/trace.png"
                    alt="TraceChain Logo Electra"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-2xl font-bold">TraceChain</h3>
                </div>

                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Infrastruktur blockchain yang menjaga integritas data rantai pasok secara permanen serta transparan.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-800/80">
                <span className="text-xs bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">Immutable Data</span>
                <span className="text-xs bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">QR Verification</span>
                <span className="text-xs bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">Real-Time Tracking</span>
              </div>
            </div>

            {/* SmartLink IoT */}
            <div className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 group relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 blur-3xl rounded-full group-hover:bg-blue-500/20 transition-all" />
              <div>
                <div className="relative w-full h-40 bg-slate-950/60 rounded-2xl flex items-center justify-center border border-slate-800/80 mb-6 group-hover:border-cyan-500/30 transition-colors overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-60 z-10" />
                  <Image
                    src="/iot.jpg"
                    alt="SmartLink IoT Logo Electra"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-2xl font-bold">SmartLink IoT</h3>
                </div>

                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Monitoring suhu, kelembaban, dan kondisi lingkungan secara real-time untuk menjamin kualitas produk sepanjang rantai pasok.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-800/80">
                <span className="text-xs bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">Live Sensors</span>
                <span className="text-xs bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">Telemetry</span>
                <span className="text-xs bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">Auto Alert</span>
              </div>
            </div>

            {/* Supply Chain Core */}
            <div className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 group relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 blur-3xl rounded-full group-hover:bg-emerald-500/20 transition-all" />
              <div>
                <div className="relative w-full h-40 bg-slate-950/60 rounded-2xl flex items-center justify-center border border-slate-800/80 mb-6 group-hover:border-cyan-500/30 transition-colors overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-60 z-10" />
                  <Image
                    src="/supply.png"
                    alt="Supply Chain Core Logo Electra"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-2xl font-bold">Supply Chain Core</h3>
                </div>

                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Dashboard untuk analisis distribusi, optimalisasi rute logistik, dan transparansi pengiriman dari hulu ke hilir.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-800/80">
                <span className="text-xs bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">Analytics</span>
                <span className="text-xs bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">Route Optimization</span>
                <span className="text-xs bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">End-to-End</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="fitur" className="py-12 bg-slate-800/30 border-y border-slate-800/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-cyan-400 uppercase text-xs tracking-widest block mb-2 font-medium">
              Process Flow
            </span>
            <h2 className="text-3xl sm:text-3xl font-bold">
              Alur Kerja Electra Tech
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto mt-3 text-sm">
              Terdapat 5 tahap utama yang dilalui produk untuk menjamin transparansi dan integritas data dari hulu ke hilir.
            </p>
          </div>

          <div className="relative max-w-5xl mx-auto">
            {/* Connecting Line across nodes (visible on md screens and up) */}
            <div className="hidden md:block absolute top-7 left-[8%] right-[8%] h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 rounded-full z-0 opacity-70" />

            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative z-10">
              {[
                {
                  icon: ScanLine,
                  title: 'Register',
                  text: 'Produk didaftarkan ke sistem dan diberi QR/ID digital unik.',
                },
                {
                  icon: Cpu,
                  title: 'IoT Monitoring',
                  text: 'Sensor IoT mencatat suhu, kelembaban, dan kondisi lingkungan.',
                },
                {
                  icon: Database,
                  title: 'Blockchain',
                  text: 'Data telemetri & transaksi dikunci secara permanen di ledger.',
                },
                {
                  icon: Truck,
                  title: 'Distribution',
                  text: 'Produk bergerak terpantau secara real-time sepanjang rantai pasok.',
                },
                {
                  icon: ShieldCheck,
                  title: 'Verification',
                  text: 'Konsumen & mitra memverifikasi keaslian via scan QR code.',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center text-center group"
                >
                  {/* Glowing Circular Node */}
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 text-slate-950 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)] group-hover:scale-110 group-hover:shadow-[0_0_25px_rgba(6,182,212,0.7)] transition-all duration-300 ring-4 ring-[#0b132b] mb-6 relative z-10 shrink-0">
                    <item.icon className="w-6 h-6 stroke-[2.5]" />
                  </div>

                  <h3 className="font-bold text-base mb-2 text-white group-hover:text-cyan-400 transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed max-w-[180px]">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TRACKING */}
      <section id="tracking" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* KIRI: Image Slider (Slide demi slide verify 1, 2, 3) */}
            <div className="relative overflow-hidden group">
              {/* Radial glow background */}
              <div className="absolute -top-20 -left-20 w-60 h-60 blur-3xl" />
              <div className="absolute -bottom-20 -right-20 w-60 h-60  blur-3xl" />

              <div className="relative w-full h-[320px] sm:h-[460px] md:h-[560px] overflow-hidden flex items-center justify-center">
                {verifyImages.map((src, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 p-3 flex items-center justify-center transition-all duration-700 ease-in-out ${index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
                      }`}
                  >
                    <Image
                      src={src}
                      alt={`Verification Slide ${index + 1}`}
                      fill
                      loading={index === 0 ? 'eager' : 'lazy'}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-contain rounded-lg p-2 drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]"
                    />
                  </div>
                ))}

                {/* Left & Right Arrow Controls */}
                <button
                  onClick={() => setCurrentSlide((prev) => (prev === 0 ? verifyImages.length - 1 : prev - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950/80 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 flex items-center justify-center backdrop-blur-md transition-all z-20 opacity-80 group-hover:opacity-100"
                  aria-label="Previous Slide"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentSlide((prev) => (prev + 1) % verifyImages.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950/80 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 flex items-center justify-center backdrop-blur-md transition-all z-20 opacity-80 group-hover:opacity-100"
                  aria-label="Next Slide"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Slide Indicators Dots */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20 bg-slate-950/70 backdrop-blur-md px-3.5 py-2 rounded-full border border-slate-800">
                  {verifyImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-2 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-6 bg-cyan-400' : 'w-2 bg-slate-600 hover:bg-slate-400'
                        }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* KANAN: Form & Verifikasi Data */}
            <div>
              <span className="text-cyan-400 uppercase text-xs tracking-widest font-medium block mb-2">
                Live Verification
              </span>
              <h2 className="text-3xl md:text-3xl font-bold mb-4">
                Verify Your Product
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-8 ">
                Masukkan nomor seri atau ID produk untuk melakukan verifikasi keaslian dan status rantai pasok secara real-time.
              </p>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
                <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Masukkan ID Batch atau Nomor Resi"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-500 focus:border-cyan-400 outline-none transition text-sm"
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-semibold px-6 py-3.5 rounded-xl transition shrink-0 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                  >
                    <span>{isSearching ? 'Memeriksa...' : 'Lacak Produk'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {/* State 1: Tampilan Default Kosong */}
                {!verifyResult && !searchError && !isSearching && (
                  <div className="mt-8 text-center py-10 px-6 bg-slate-950/50 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent opacity-50 group-hover:opacity-100 transition duration-500 pointer-events-none" />
                    <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 shadow-lg shadow-cyan-500/5 transition group-hover:scale-105">
                      <ScanLine className="w-7 h-7" />
                    </div>
                    <h4 className="text-base font-semibold text-slate-200 mb-1.5">
                      Belum Ada Produk Ditampilkan
                    </h4>
                    <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-4">
                      Silakan ketik Kode ID Batch (contoh: <span className="text-cyan-300 font-mono font-medium">BATCH-B092</span>) atau Nomor Resi pada kolom pencarian di atas untuk memverifikasi keaslian produk.
                    </p>
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                      Data Terverifikasi dan Terdistribusi di Jaringan Blockchain
                    </div>
                  </div>
                )}

                {/* State 2: Searching Indicator */}
                {isSearching && (
                  <div className="mt-8 text-center py-12 px-6 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center space-y-3">
                    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                    <p className="text-xs md:text-sm font-medium text-cyan-300">Memeriksa Database & Ledger Blockchain...</p>
                    <p className="text-[11px] text-slate-500">Mencari data keaslian dan rantai pasok produk</p>
                  </div>
                )}

                {/* State 3: Search Error */}
                {searchError && !isSearching && (
                  <div className="mt-6 p-4 bg-red-950/40 border border-red-800/60 rounded-2xl text-red-300 text-xs md:text-sm flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-200">Verifikasi Gagal</p>
                      <p className="mt-0.5 text-red-300/80">{searchError}</p>
                    </div>
                  </div>
                )}

                {/* State 4: Verified Result */}
                {verifyResult && !isSearching && (
                  <div className="mt-8 space-y-6">
                    {/* Header Verified / Authenticity Status Card */}
                    {verifyResult.verificationAudit?.isAuthentic || verifyResult.latestStatus?.isAuthentic ? (
                      <div className="text-left bg-gradient-to-r from-emerald-950/80 via-slate-950 to-slate-950 border border-emerald-500/50 rounded-2xl p-6 relative overflow-hidden shadow-xl shadow-emerald-950/30">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/15 blur-3xl rounded-full pointer-events-none" />
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-emerald-500/20">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-md shadow-emerald-500/20">
                              <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500 text-slate-950 uppercase tracking-wide">
                                  DATA TERVERIFIKASI ASLI
                                </span>
                                <span className="text-[11px] text-emerald-400 font-mono">100% Otentik</span>
                              </div>
                              <p className="text-xs text-slate-300 mt-1 font-medium">
                                Produk ini terverifikasi 100% otentik dan terlindungi dari manipulasi data.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 text-xs md:text-sm">
                          <div className="flex justify-between items-center py-0.5">
                            <span className="text-slate-400">Batch Serial ID:</span>
                            <span className="text-cyan-300 font-mono font-medium px-2.5 py-1 rounded-lg text-xs bg-slate-900 border border-slate-800">
                              {verifyResult.batch.id}
                            </span>
                          </div>

                          {/* Alamat Verifikasi Kebenaran Data (Smart Contract Blockchain) */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-t border-slate-900/80 pt-2.5 bg-slate-900/60 px-3.5 rounded-xl border border-slate-800/80">
                            <span className="text-slate-400 text-xs font-medium flex items-center gap-1.5 shrink-0">
                              <Globe className="w-3.5 h-3.5 text-cyan-400" />
                              Alamat Verifikasi Kebenaran Data (Smart Contract):
                            </span>
                          </div>
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="text-cyan-300 font-mono text-[11px] bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 truncate" title={verifyResult.batch.contractAddress || verifyResult.verificationAudit?.contractAddress || '0x2AF90cD2b5c73dEbe72d707DF6c3a60e94566A1F'}>
                              {verifyResult.batch.contractAddress || verifyResult.verificationAudit?.contractAddress || '0x2AF90cD2b5c73dEbe72d707DF6c3a60e94566A1F'}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyUrl(
                                  verifyResult.batch.contractAddress || verifyResult.verificationAudit?.contractAddress || '0x2AF90cD2b5c73dEbe72d707DF6c3a60e94566A1F'
                                )
                              }
                              className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition text-xs flex items-center gap-1 shrink-0"
                              title="Salin Alamat Smart Contract"
                            >
                              {copiedUrl ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              <span className="text-[10px] font-medium">{copiedUrl ? 'Tersalin' : 'Salin'}</span>
                            </button>
                            <a
                              href={
                                verifyResult.batch.blockchainExplorerUrl ||
                                verifyResult.verificationAudit?.blockchainExplorerUrl ||
                                `https://polygonscan.com/address/${verifyResult.batch.contractAddress || '0x2AF90cD2b5c73dEbe72d707DF6c3a60e94566A1F'}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition text-xs flex items-center gap-1 shrink-0"
                              title="Buka di Explorer Blockchain"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-medium">Explorer</span>
                            </a>
                          </div>

                          <div className="flex justify-between items-center py-0.5 border-t border-slate-900/80 pt-2.5">
                            <span className="text-slate-400">Varietas & Generasi:</span>
                            <span className="text-slate-200 font-medium">
                              {verifyResult.batch.variety} ({verifyResult.batch.generation})
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-0.5 border-t border-slate-900/80 pt-2.5">
                            <span className="text-slate-400">Produsen / Petani:</span>
                            <span className="text-slate-200 font-medium">{verifyResult.batch.producerName}</span>
                          </div>
                          <div className="flex justify-between items-center py-0.5 border-t border-slate-900/80 pt-2.5">
                            <span className="text-slate-400">Status & Fase Terakhir:</span>
                            <span className="text-emerald-400 font-semibold px-2.5 py-0.5 rounded-full text-xs bg-emerald-500/10 border border-emerald-500/30">
                              {verifyResult.batch.phase}
                            </span>
                          </div>
                          {verifyResult.latestStatus?.location && (
                            <div className="flex justify-between items-center py-0.5 border-t border-slate-900/80 pt-2.5">
                              <span className="text-slate-400">Lokasi / Tujuan Terakhir:</span>
                              <span className="text-slate-200 font-medium">{verifyResult.latestStatus.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-left bg-gradient-to-r from-red-950/90 via-slate-950 to-slate-950 border border-red-500/60 rounded-2xl p-6 relative overflow-hidden shadow-xl shadow-red-950/40 space-y-4">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/10 blur-3xl rounded-full pointer-events-none" />
                        <div className="flex items-start gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0 shadow-md">
                            <AlertTriangle className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-red-200 uppercase tracking-wide">
                              PERINGATAN: INDIKASI MANIPULASI DATA DITEMUKAN
                            </h4>
                            <p className="text-xs text-red-300/90 mt-1 leading-relaxed">
                              Data produk ini terindikasi tidak otentik atau telah mengalami inkonsistensi/manipulasi pada beberapa tahapan riwayat.
                            </p>
                          </div>
                        </div>

                        {/* Metadata Ringkas & Alamat Verifikasi */}
                        <div className="space-y-3 text-xs md:text-sm pt-4 border-t border-red-900/40">
                          <div className="flex justify-between items-center py-0.5">
                            <span className="text-slate-400">Batch Serial ID:</span>
                            <span className="text-red-300 font-mono font-medium px-2.5 py-1 rounded-lg text-xs bg-slate-900 border border-red-900/50">
                              {verifyResult.batch.id}
                            </span>
                          </div>

                          {/* Alamat Verifikasi Kebenaran Data (Smart Contract Blockchain) */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-t border-slate-900/80 pt-2.5 bg-slate-900/60 px-3.5 rounded-xl border border-slate-800/80">
                            <span className="text-slate-400 text-xs font-medium flex items-center gap-1.5 shrink-0">
                              <Globe className="w-3.5 h-3.5 text-cyan-400" />
                              Alamat Verifikasi Kebenaran Data (Smart Contract):
                            </span>
                          </div>
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="text-cyan-300 font-mono text-[11px] bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 truncate" title={verifyResult.batch.contractAddress || verifyResult.verificationAudit?.contractAddress || '0x2AF90cD2b5c73dEbe72d707DF6c3a60e94566A1F'}>
                              {verifyResult.batch.contractAddress || verifyResult.verificationAudit?.contractAddress || '0x2AF90cD2b5c73dEbe72d707DF6c3a60e94566A1F'}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyUrl(
                                  verifyResult.batch.contractAddress || verifyResult.verificationAudit?.contractAddress || '0x2AF90cD2b5c73dEbe72d707DF6c3a60e94566A1F'
                                )
                              }
                              className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition text-xs flex items-center gap-1 shrink-0"
                              title="Salin Alamat Smart Contract"
                            >
                              {copiedUrl ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              <span className="text-[10px] font-medium">{copiedUrl ? 'Tersalin' : 'Salin'}</span>
                            </button>
                            <a
                              href={
                                verifyResult.batch.blockchainExplorerUrl ||
                                verifyResult.verificationAudit?.blockchainExplorerUrl ||
                                `https://polygonscan.com/address/${verifyResult.batch.contractAddress || '0x2AF90cD2b5c73dEbe72d707DF6c3a60e94566A1F'}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition text-xs flex items-center gap-1 shrink-0"
                              title="Buka di Explorer Blockchain"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-medium">Explorer</span>
                            </a>
                          </div>
                        </div>

                        {/* Indikasi Bagian Terindikasi Palsu */}
                        {(() => {
                          const tamperedLogs =
                            verifyResult.verificationAudit?.auditLogs?.filter((a: any) => !a.isAuthentic) || [];
                          return (
                            <div className="pt-4 border-t border-red-800/50">
                              <h5 className="text-xs font-bold text-red-200 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-400" />
                                Bagian / Tahapan yang Terindikasi Palsu:
                              </h5>
                              {tamperedLogs.length > 0 ? (
                                <div className="space-y-2.5">
                                  {tamperedLogs.map((audit: any, idx: number) => (
                                    <div
                                      key={idx}
                                      className="bg-red-950/60 border border-red-800/80 rounded-xl p-3.5 text-xs text-red-200 shadow-sm"
                                    >
                                      <div className="flex items-center justify-between font-semibold text-red-300 pb-1.5 border-b border-red-900/50 mb-1.5">
                                        <span>⚠️ {audit.event}</span>
                                        <span className="text-[10px] font-bold text-red-300 bg-red-900/80 px-2 py-0.5 rounded border border-red-700">
                                          TERINDIKASI PALSU
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-red-300/80 leading-relaxed">
                                        Terdeteksi inkonsistensi data pada tahapan ini. Catatan fisik tidak sesuai dengan verifikasi otentik awal.
                                      </p>
                                      <p className="text-[10px] text-slate-400 mt-1.5 font-mono">
                                        Waktu Catatan: {new Date(audit.timestamp).toLocaleString('id-ID')}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="bg-red-950/60 border border-red-800/80 rounded-xl p-3 text-xs text-red-300">
                                  ⚠️ Terdeteksi inkonsistensi pada riwayat data produk.
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Timeline Alur Produk */}
                    {verifyResult.timeline && verifyResult.timeline.length > 0 && (
                      <div className="text-left bg-slate-950/80 border border-slate-800/80 rounded-2xl p-6 shadow-lg">
                        <h4 className="text-sm font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-800/80 pb-3">
                          <Database className="w-4 h-4 text-cyan-400" />
                          Alur Perjalanan Produk (Traceability Stream)
                        </h4>

                        <div className="relative pl-6 border-l-2 border-cyan-500/30 space-y-5">
                          {verifyResult.timeline.map((step: any, index: number) => {
                            const isStepTampered = verifyResult.verificationAudit?.auditLogs?.some(
                              (audit: any) =>
                                !audit.isAuthentic &&
                                (audit.event?.toLowerCase().includes(step.title?.toLowerCase()) ||
                                  step.title?.toLowerCase().includes(audit.event?.toLowerCase()) ||
                                  (audit.event?.includes('Perubahan Fase') && step.stage === 'PERKEMBANGAN_FASE') ||
                                  (audit.event?.includes('Logistik') && step.stage?.includes('PENGIRIMAN')))
                            );

                            return (
                              <div
                                key={index}
                                className={`relative group p-4 rounded-xl transition ${isStepTampered
                                    ? 'bg-red-950/40 border border-red-500/60 shadow-md shadow-red-950/30'
                                    : 'bg-slate-900/60 border border-slate-800/70 hover:border-cyan-500/40'
                                  }`}
                              >
                                {/* Node Circle */}
                                <div
                                  className={`absolute -left-[33px] top-4 w-4 h-4 rounded-full ring-4 ring-slate-950 ${isStepTampered
                                      ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.7)]'
                                      : 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]'
                                    }`}
                                />

                                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                                  <span
                                    className={`font-bold text-xs flex items-center gap-2 ${isStepTampered ? 'text-red-400' : 'text-cyan-300'
                                      }`}
                                  >
                                    {step.title}
                                    {isStepTampered && (
                                      <span className="text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-full">
                                        ⚠️ Terindikasi Data Palsu
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono bg-slate-950 border border-slate-800 px-2 py-0.5 rounded">
                                    {new Date(step.timestamp).toLocaleString('id-ID', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>

                                <p className="text-xs text-slate-300 leading-relaxed">{step.description}</p>

                                {step.by && (
                                  <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                                    <span className="text-slate-500">Oleh:</span>
                                    <span className="text-slate-300 font-medium">{step.by}</span>
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
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