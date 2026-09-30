'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, RefreshCw, AlertCircle, ShieldAlert, Check, Upload, Image as ImageIcon } from 'lucide-react';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

export default function QrScannerModal({ isOpen, onClose, onScanSuccess }: QrScannerModalProps) {
  const [activeTab, setActiveTab] = useState<'camera' | 'file'>('camera');
  const [permissionState, setPermissionState] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isFileScanning, setIsFileScanning] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isMountedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const containerId = 'qr-reader-viewport';

  const cleanupScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    if (scanner) {
      scannerRef.current = null;
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
      } catch {
        // ignore stop error
      } finally {
        try {
          scanner.clear();
        } catch { }
      }
    }
  }, []);

  // Reset state ketika modal dibuka atau ditutup
  useEffect(() => {
    if (isOpen) {
      isMountedRef.current = true;
      setActiveTab('camera');
      setPermissionState('idle');
      setErrorMsg(null);
      setIsStarting(false);
      setIsFileScanning(false);
    } else {
      isMountedRef.current = false;
      void cleanupScanner();
    }
  }, [isOpen, cleanupScanner]);

  const startScanner = async () => {
    setIsStarting(true);
    setErrorMsg(null);

    try {
      await new Promise((r) => setTimeout(r, 200));
      if (!isMountedRef.current) return;

      const html5QrCode = new Html5Qrcode(containerId);
      scannerRef.current = html5QrCode;

      // Prioritaskan kamera belakang jika tersedia, fallback ke default jika gagal
      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          if (!isMountedRef.current) return;
          try {
            if (html5QrCode.isScanning) {
              await html5QrCode.stop();
            }
          } catch {
            // ignore
          } finally {
            try {
              html5QrCode.clear();
            } catch { }
            scannerRef.current = null;
            onScanSuccess(decodedText);
            onClose();
          }
        },
        () => {
          // ignore frame scan misses
        }
      );

      if (isMountedRef.current) {
        setIsStarting(false);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setIsStarting(false);
        setErrorMsg(
          err?.message || 'Gagal memulai scanner kamera. Pastikan browser mendukung akses kamera atau gunakan opsi Unggah Gambar QR.'
        );
      }
    }
  };

  // Handler saat user klik tombol "Izinkan Akses Kamera"
  const handleRequestPermission = async () => {
    setPermissionState('requesting');
    setErrorMsg(null);

    try {
      // Langsung jalankan scanner dengan startScanner
      // Html5Qrcode akan otomatis memunculkan prompt izin browser tanpa double getUserMedia
      setPermissionState('granted');
      await startScanner();
    } catch (err: any) {
      if (isMountedRef.current) {
        setPermissionState('denied');
        setErrorMsg(
          err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError'
            ? 'Izin kamera ditolak oleh pengguna atau diblokir oleh browser. Silakan izinkan akses kamera di ikon gembok bilah URL browser Anda.'
            : err?.message || 'Gagal mengakses kamera.'
        );
      }
    }
  };

  // Handler saat user memilih file gambar QR Code dari komputer/HP
  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsFileScanning(true);
    setErrorMsg(null);

    try {
      // Buat instance scanner temporer untuk membaca file gambar
      const html5QrCode = new Html5Qrcode('file-scanner-temp-container');
      const decodedText = await html5QrCode.scanFile(file, true);
      
      try {
        html5QrCode.clear();
      } catch { }

      onScanSuccess(decodedText);
      onClose();
    } catch {
      setErrorMsg(
        'QR Code tidak terbaca dari gambar ini. Pastikan gambar jelas, fokus, dan tidak terpotong.'
      );
    } finally {
      setIsFileScanning(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      {/* Hidden container untuk file scanner */}
      <div id="file-scanner-temp-container" className="hidden" />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-cyan-400" />
            <h3 className="font-medium text-slate-100">Scan QR Code Produk</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            aria-label="Tutup Modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher: Kamera Langsung vs Unggah Gambar */}
        <div className="grid grid-cols-2 p-1.5 m-4 mb-2 bg-slate-950 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setActiveTab('camera');
              setErrorMsg(null);
            }}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'camera'
                ? 'bg-slate-800 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Kamera Live</span>
          </button>
          <button
            type="button"
            onClick={() => {
              void cleanupScanner();
              setActiveTab('file');
              setErrorMsg(null);
            }}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'file'
                ? 'bg-slate-800 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Unggah Foto QR</span>
          </button>
        </div>

        {/* Content Tab 1: Kamera Live */}
        {activeTab === 'camera' && (
          <div className="p-5 pt-3 flex flex-col items-center">
            {/* TAMPILAN 1.1: KONFIRMASI IZIN AWAL */}
            {permissionState === 'idle' && (
              <div className="text-center py-6 px-3 flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 shadow-lg shadow-cyan-500/10">
                  <Camera className="w-8 h-8" />
                </div>
                <h4 className="text-base font-semibold text-slate-100 mb-2">
                  Aktifkan Kamera untuk Scan
                </h4>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-6">
                  Arahkan kamera perangkat Anda ke QR Code pada sertifikat atau kemasan benih untuk verifikasi instan.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-800 bg-slate-950 text-xs font-medium text-slate-300 hover:border-slate-700 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleRequestPermission}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-xs font-medium text-slate-950 transition flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Mulai Kamera</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAMPILAN 1.2: MEMINTA IZIN BROWSER */}
            {permissionState === 'requesting' && (
              <div className="text-center py-10 px-4 flex flex-col items-center space-y-3">
                <RefreshCw className="h-8 w-8 text-cyan-400 animate-spin" />
                <p className="text-sm font-medium text-slate-200">Menghubungkan ke Kamera...</p>
                <p className="text-xs text-slate-400 max-w-xs">
                  Silakan pilih <b>&quot;Allow&quot;</b> atau <b>&quot;Izinkan&quot;</b> pada prompt izin kamera browser Anda.
                </p>
              </div>
            )}

            {/* TAMPILAN 1.3: LIVE VIEWPORT */}
            {permissionState === 'granted' && (
              <>
                <p className="text-xs text-slate-400 mb-4 text-center">
                  Posisikan QR Code di dalam kotak hijau untuk memindai otomatis.
                </p>

                <div className="relative w-full aspect-square max-w-[300px] overflow-hidden rounded-xl border border-slate-800 bg-black flex items-center justify-center">
                  <div id={containerId} className="w-full h-full" />

                  {isStarting && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 text-cyan-400 gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin" />
                      <span className="text-xs text-slate-300">Menyalakan kamera...</span>
                    </div>
                  )}

                  {errorMsg && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 p-4 text-center">
                      <AlertCircle className="h-8 w-8 text-rose-500 mb-2" />
                      <p className="text-xs text-rose-300 mb-3">{errorMsg}</p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('file')}
                        className="text-xs px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition"
                      >
                        Gunakan Opsi Unggah Foto QR
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* TAMPILAN 1.4: IZIN DITOLAK ATAU ERROR */}
            {permissionState === 'denied' && (
              <div className="text-center py-6 px-3 flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h4 className="text-base font-semibold text-slate-100 mb-2">
                  Akses Kamera Terhalang
                </h4>
                <p className="text-xs text-rose-300/90 max-w-xs leading-relaxed mb-4">
                  {errorMsg || 'Akses kamera diblokir. Pastikan Anda mengizinkan akses kamera di setelan browser atau gunakan fitur upload gambar.'}
                </p>
                <div className="flex gap-2.5 w-full max-w-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab('file')}
                    className="flex-1 py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-xs font-semibold text-slate-950 transition"
                  >
                    Unggah Gambar QR
                  </button>
                  <button
                    type="button"
                    onClick={handleRequestPermission}
                    className="py-2 px-3 rounded-xl border border-slate-800 bg-slate-950 text-xs font-semibold text-slate-300 hover:border-slate-700 transition"
                  >
                    Coba Lagi
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content Tab 2: Unggah Foto Gambar QR */}
        {activeTab === 'file' && (
          <div className="p-5 pt-3 flex flex-col items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileScan}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-video max-w-[320px] rounded-2xl border-2 border-dashed border-slate-700 hover:border-cyan-400/80 bg-slate-950/60 hover:bg-slate-950 transition-all cursor-pointer flex flex-col items-center justify-center p-6 text-center group"
            >
              {isFileScanning ? (
                <div className="flex flex-col items-center gap-2 text-cyan-400">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                  <span className="text-xs text-slate-300 font-medium">Menganalisis QR Code dari gambar...</span>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-200 mb-1">
                    Pilih File Gambar QR Code
                  </p>
                  <p className="text-xs text-slate-400 max-w-[220px]">
                    Klik untuk memilih foto dari galeri HP atau dokumen laptop (PNG, JPG, WEBP)
                  </p>
                </>
              )}
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2 max-w-[320px]">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800/80 flex justify-between items-center text-[11px] text-slate-500">
          <span>Otomatis memverifikasi setelah QR terbaca</span>
          <button
            type="button"
            onClick={onClose}
            className="text-cyan-400 hover:underline"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
