// src/app/page.tsx
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import { ShieldCheck, Cpu, Truck, Search, CalendarDays, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0b132b] text-white font-sans antialiased scroll-smooth selection:bg-cyan-500 selection:text-slate-900">
      <Navbar />

      {/* 1. HERO SECTION  */}
      <section id="home" className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden flex items-center min-h-[90vh]">
        {/* Ornamen Gradasi Latar Belakang */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -z-10"></div>
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] -z-10"></div>

        <div className="max-w-7xl mx-auto px-6 w-full grid md:grid-cols-12 gap-12 items-center">
          
          {/* Kolom Teks Kiri */}
          <div className="space-y-6 md:col-span-7 z-10 text-left">
            <span className="text-[#48cae4] font-semibold uppercase tracking-widest text-sm block">
              Electra Tech Indonesia
            </span>
            
            <h1 className="text-4xl md:text-5xl lg:text-5xl font-extrabold tracking-tight leading-[1.15]">
              Empowering the Future with <br />
              <span className="bg-gradient-to-r from-[#48cae4] to-[#0077b6] bg-clip-text text-transparent">
                Intelligent Connectivity
              </span>
            </h1>
            
            <p className="text-base md:text-lg text-slate-400 max-w-xl leading-relaxed">
              Electra Tech Indonesia is an innovation-driven technology company focused on developing smart digital solutions based on Blockchain, Artificial Intelligence (AI) and the Internet of Things (IoT).
            </p>

            {/* Tombol Aksi Utama Sesuai Web */}
            <div className="flex flex-wrap gap-4 pt-2">
              <a href="#layanan" className="px-6 py-3 bg-[#0077b6] hover:bg-[#0096c7] text-white font-medium rounded-lg transition-all shadow-lg shadow-[#0077b6]/20">
                Find Solution
              </a>
              <a href="#kontak" className="px-6 py-3 border border-slate-700 hover:border-[#48cae4] hover:text-[#48cae4] font-medium rounded-lg transition-all">
                Lets Talk
              </a>
            </div>

            {/* Kolom Fitur Lacak QR Anda (Diintegrasikan dengan rapi di bawah tombol) */}
            <div className="max-w-md bg-slate-900/80 backdrop-blur border border-slate-800/80 p-1.5 rounded-xl flex items-center shadow-xl focus-within:border-[#48cae4] transition mt-8">
              <div className="flex items-center gap-2 pl-2 text-slate-500">
                <Search className="w-4 h-4" />
              </div>
              <input 
                type="text" 
                placeholder="Lacak ID Produk / Serial Number..." 
                className="w-full bg-transparent px-2 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none"
              />
              <button className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition">
                Lacak
              </button>
            </div>

            {/* Sosial Media Sesuai Gambar Web */}
            <div className="flex items-center gap-3 pt-8">
              {['f', '📷', 'in', '📹'].map((icon, idx) => (
                <a key={idx} href="#" className="w-9 h-9 rounded-full border border-slate-700 flex items-center justify-center text-sm text-slate-400 hover:border-[#48cae4] hover:text-[#48cae4] transition-all">
                  {icon === '📷' ? '📸' : icon === '📹' ? '📺' : icon}
                </a>
              ))}
            </div>
          </div>

          {/* Kolom Ilustrasi Kanan */}
          <div className="md:col-span-5 flex justify-center md:justify-end relative select-none">
            <div className="relative w-full max-w-[420px] aspect-square rounded-full flex items-center justify-center p-8">
              <Image
                src="/logoelectra.png"
                alt="Cyborg Head"
                width={840}
                height={840}
                priority
                className="h-full w-full object-contain"
              />
              
              {/* Ornamen Node Jaringan Samping */}
              <div className="absolute top-10 left-10 w-3 h-3 bg-[#48cae4] rounded-full shadow-[0_0_12px_#48cae4]"></div>
              <div className="absolute bottom-20 left-4 w-4 h-4 bg-[#0077b6] rounded-full shadow-[0_0_12px_#0077b6]"></div>
              <div className="absolute top-1/2 -right-2 w-2 h-2 bg-cyan-400 rounded-full"></div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. SERVICES SECTION (Menjaga Integrasi 3 Pilar Anda Dengan Warna Web Asli) */}
      <section id="layanan" className="py-24 bg-[#1c2541]/30 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 space-y-3">
            <span className="text-[#48cae4] text-xs font-mono tracking-widest uppercase">Our Ecosystem</span>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Layanan Ekosistem Digital</h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base">
              Tiga pilar teknologi mandiri yang bekerja bersama mengamankan rantai pasok perusahaan Anda.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Kartu 1: TraceChain */}
            <div className="bg-[#1c2541]/60 border border-slate-800 p-8 rounded-2xl hover:border-[#48cae4]/40 transition duration-300 group">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-[#48cae4] mb-6 border border-blue-500/20 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">TraceChain</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Infrastruktur Permissioned Blockchain tingkat tinggi yang mengunci riwayat pergerakan produk (Supply Chain & Halal) secara permanen tanpa celah manipulasi.
              </p>
            </div>

            {/* Kartu 2: IoT */}
            <div className="bg-[#1c2541]/60 border border-slate-800 p-8 rounded-2xl hover:border-[#48cae4]/40 transition duration-300 group">
              <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400 mb-6 border border-cyan-500/20 group-hover:scale-110 transition-transform">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">SmartLink IoT</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Integrasi perangkat keras pintar untuk sistem otomatisasi kandang ayam, kolam perikanan, serta pelacakan suhu kontainer logistik secara real-time.
              </p>
            </div>

            {/* Kartu 3: Supply Chain */}
            <div className="bg-[#1c2541]/60 border border-slate-800 p-8 rounded-2xl hover:border-[#48cae4]/40 transition duration-300 group">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 mb-6 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Supply Chain Core</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Dashboard analitik berbasis kecerdasan buatan (AI Insight) untuk memfasilitasi visualisasi alur distribusi komoditas dari hulu ke hilir.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. BLOG SECTION */}
      <section id="blog" className="py-24 bg-[#0b132b] border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col gap-4 text-center mb-12">
            <span className="text-[#48cae4] text-xs font-mono tracking-widest uppercase">From the Blog</span>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Inspirasi & Insight Terkini</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base">
              Jelajahi artikel seputar inovasi, pertanian cerdas, dan teknologi rantai pasok yang membantu bisnis tumbuh lebih transparan.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: 'Meningkatkan Keamanan Produk dengan TraceChain',
                category: 'Blockchain',
                date: '02 Jun 2026',
                excerpt: 'Bagaimana pemantauan jejak produk membantu menjaga integritas data di setiap titik distribusi.',
              },
              {
                title: 'Smart IoT untuk Monitoring Kualitas Benih',
                category: 'IoT',
                date: '27 Mei 2026',
                excerpt: 'Solusi sensor cerdas yang membantu tim produksi menyesuaikan kondisi lingkungan dengan lebih akurat.',
              },
              {
                title: 'Membangun Rantai Pasok yang Transparan',
                category: 'Supply Chain',
                date: '18 Mei 2026',
                excerpt: 'Kenapa transparansi data menjadi fondasi penting untuk efisiensi logistik dan kepercayaan mitra.',
              },
            ].map((post, index) => (
              <article key={index} className="group rounded-3xl border border-slate-800 bg-[#111827]/90 p-6 shadow-2xl shadow-black/20 transition hover:-translate-y-1 hover:border-cyan-400/40">
                <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-cyan-300/90">
                  <span>{post.category}</span>
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-[10px]">Featured</span>
                </div>
                <h3 className="text-xl font-semibold text-white">{post.title}</h3>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">{post.excerpt}</p>
                <div className="mt-6 flex items-center justify-between text-sm text-slate-300">
                  <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-cyan-300" /> {post.date}</span>
                  <a href="#kontak" className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200">Baca lebih lanjut <ArrowRight className="h-4 w-4" /></a>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-10 text-center">
            <a href="/admin/blog" className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-cyan-400 hover:text-cyan-200">
              Lihat panel manajemen blog
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* 4. FOOTER (Sesuai Hak Cipta Asli) */}
      <footer id="kontak" className="border-t border-slate-900 py-8 text-center text-xs text-slate-500 bg-[#0b132b]">
        <p>Copyright &copy; {new Date().getFullYear()} by Electra Tech Indonesia. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
