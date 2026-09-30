'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';
import {
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ScanLine,
  Loader2,
  AlertCircle,
  Globe,
  CheckCircle2,
  Copy,
  ExternalLink,
  AlertTriangle,
  Database,
  Camera,
  QrCode,
} from 'lucide-react';
import QrScannerModal from '@/components/QrScannerModal';

export default function VerifyPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const verifyImages = ['/verify1.png', '/verify2.png', '/verify3.png'];

  // Database verification state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % verifyImages.length);
    }, 3500);
    return () => clearInterval(slideTimer);
  }, [verifyImages.length]);

  const handleCopyUrl = (url: string) => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const triggerVerify = async (queryInput: string) => {
    const query = queryInput.trim();
    if (!query) {
      setSearchError('Silakan masukkan ID Batch atau Nomor Resi untuk melacak produk.');
      setVerifyResult(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const res = await fetch(`${API_URL}/api/verify/${encodeURIComponent(query)}`);
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

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await triggerVerify(searchQuery);
  };

  const handleScanSuccess = (decodedText: string) => {
    let cleanText = decodedText.trim();
    try {
      if (cleanText.includes('http://') || cleanText.includes('https://')) {
        const url = new URL(cleanText);
        const idParam = url.searchParams.get('id');
        if (idParam) {
          cleanText = idParam;
        } else {
          const parts = url.pathname.split('/').filter(Boolean);
          if (parts.length > 0) {
            cleanText = parts[parts.length - 1];
          }
        }
      } else if (cleanText.includes('\n')) {
        const lines = cleanText.split('\n');
        for (const line of lines) {
          if (line.toLowerCase().includes('batch:') || line.toLowerCase().includes('batch id:')) {
            cleanText = line.split(':')[1].trim();
            break;
          } else if (line.toLowerCase().includes('resi:') || line.toLowerCase().includes('nomor resi:')) {
            cleanText = line.split(':')[1].trim();
            break;
          }
        }
      }
    } catch {
      // fallback
    }

    setSearchQuery(cleanText);
    void triggerVerify(cleanText);
  };

  return (
    <div className="min-h-screen bg-[#0b132b] text-white">
      <Navbar />

      <main className="pt-32 pb-24 max-w-7xl mx-auto px-6">
        {/* Page Title & Subtitle */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-cyan-400 uppercase text-xs tracking-widest font-medium block mb-2">
            Blockchain & Supply Chain Verification
          </span>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-white">
            Verifikasi Keaslian Produk
          </h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            Lacak rekam jejak, asal-usul benih, data lingkungan budidaya IoT, dan integritas ledger blockchain secara transparan dan akurat.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* KIRI: Image Slider (Slide demi slide verify 1, 2, 3) */}
          <div className="relative overflow-hidden group">
            {/* Radial glow background */}
            <div className="absolute -top-20 -left-20 w-60 h-60 blur-3xl bg-cyan-500/10" />
            <div className="absolute -bottom-20 -right-20 w-60 h-60 blur-3xl bg-blue-500/10" />

            <div className="relative w-full h-[320px] sm:h-[460px] md:h-[560px] overflow-hidden flex items-center justify-center">
              {verifyImages.map((src, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 p-3 flex items-center justify-center transition-all duration-700 ease-in-out ${
                    index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
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
                    className={`h-2 rounded-full transition-all duration-300 ${
                      idx === currentSlide ? 'w-6 bg-cyan-400' : 'w-2 bg-slate-600 hover:bg-slate-400'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* KANAN: Form & Verifikasi Data */}
          <div>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
              <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Masukkan ID Batch atau Nomor Resi..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-11 py-3.5 text-white placeholder:text-slate-500 focus:border-cyan-400 outline-none transition text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    title="Pindai QR Code / Barcode Produk"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-900 font-medium px-6 py-3.5 rounded-xl transition shrink-0 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
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
                          <span
                            className="text-cyan-300 font-mono text-[11px] bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 truncate"
                            title={
                              verifyResult.batch.contractAddress ||
                              verifyResult.verificationAudit?.contractAddress ||
                              '0x2AF90cD2b5c73dEbe72d707DF6c3a60e94566A1F'
                            }
                          >
                            {verifyResult.batch.contractAddress ||
                              verifyResult.verificationAudit?.contractAddress ||
                              '0x2AF90cD2b5c73dEbe72d707DF6c3a60e94566A1F'}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyUrl(
                                verifyResult.batch.contractAddress ||
                                  verifyResult.verificationAudit?.contractAddress ||
                                  '0x2AF90cD2b5c73dEbe72d707DF6c3a60e94566A1F'
                              )
                            }
                            className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition text-xs flex items-center gap-1 shrink-0"
                            title="Salin Alamat Smart Contract"
                          >
                            {copiedUrl ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span className="text-[10px] font-medium">{copiedUrl ? 'Tersalin' : 'Salin'}</span>
                          </button>
                          <a
                            href={
                              verifyResult.batch.blockchainExplorerUrl ||
                              verifyResult.verificationAudit?.blockchainExplorerUrl ||
                              `https://polygonscan.com/address/${
                                verifyResult.batch.contractAddress || '0x2AF90cD2b5c73dEbe72d707DF6c3a60e94566A1F'
                              }`
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
                          <span
                            className="text-cyan-300 font-mono text-[11px] bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 truncate"
                            title={
                              verifyResult.batch.contractAddress ||
                              verifyResult.verificationAudit?.contractAddress ||
                              '0x2AF90cD2b5c73dEbe72d707DF6c3a60e94566A1F'
                            }
                          >
                            {verifyResult.batch.contractAddress ||
                              verifyResult.verificationAudit?.contractAddress ||
                              '0x2AF90cD2b5c73dEbe72d707DF6c3a60e94566A1F'}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyUrl(
                                verifyResult.batch.contractAddress ||
                                  verifyResult.verificationAudit?.contractAddress ||
                                  '0x2AF90cD2b5c73dEbe72d707DF6c3a60e94566A1F'
                              )
                            }
                            className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition text-xs flex items-center gap-1 shrink-0"
                            title="Salin Alamat Smart Contract"
                          >
                            {copiedUrl ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span className="text-[10px] font-medium">{copiedUrl ? 'Tersalin' : 'Salin'}</span>
                          </button>
                          <a
                            href={
                              verifyResult.batch.blockchainExplorerUrl ||
                              verifyResult.verificationAudit?.blockchainExplorerUrl ||
                              `https://polygonscan.com/address/${
                                verifyResult.batch.contractAddress || '0x2AF90cD2b5c73dEbe72d707DF6c3a60e94566A1F'
                              }`
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
                              className={`relative group p-4 rounded-xl transition ${
                                isStepTampered
                                  ? 'bg-red-950/40 border border-red-500/60 shadow-md shadow-red-950/30'
                                  : 'bg-slate-900/60 border border-slate-800/70 hover:border-cyan-500/40'
                              }`}
                            >
                              {/* Node Circle */}
                              <div
                                className={`absolute -left-[33px] top-4 w-4 h-4 rounded-full ring-4 ring-slate-950 ${
                                  isStepTampered
                                    ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.7)]'
                                    : 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]'
                                }`}
                              />

                              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                                <span
                                  className={`font-bold text-xs flex items-center gap-2 ${
                                    isStepTampered ? 'text-red-400' : 'text-cyan-300'
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
      </main>

      <Footer />

      {/* QR Scanner Modal */}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
}
