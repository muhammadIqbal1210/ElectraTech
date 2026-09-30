'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, RefreshCw, AlertCircle, ShieldAlert, Check } from 'lucide-react';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

export default function QrScannerModal({ isOpen, onClose, onScanSuccess }: QrScannerModalProps) {
  // permissionState: 'idle' (tampilkan dialog izin dulu) | 'requesting' | 'granted' | 'denied'
  const [permissionState, setPermissionState] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isMountedRef = useRef(false);
  const containerId = 'qr-reader-viewport';

  // Reset state ketika modal dibuka atau ditutup
  useEffect(() => {
    if (isOpen) {
      isMountedRef.current = true;
      setPermissionState('idle');
      setErrorMsg(null);
      setIsStarting(false);
    } else {
      isMountedRef.current = false;
      cleanupScanner();
    }
  }, [isOpen]);

  const cleanupScanner = async () => {
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
  };

  const startScanner = async () => {
    setIsStarting(true);
    setErrorMsg(null);

    try {
      await new Promise((r) => setTimeout(r, 200));
      if (!isMountedRef.current) return;

      const html5QrCode = new Html5Qrcode(containerId);
      scannerRef.current = html5QrCode;

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
          // ignore scan frame misses
        }
      );

      if (isMountedRef.current) {
        setIsStarting(false);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setIsStarting(false);
        setErrorMsg(
          err?.message || 'Gagal memulai scanner kamera. Pastikan browser mendukung akses kamera.'
        );
      }
    }
  };

  // Handler saat user klik tombol "Izinkan Akses Kamera"
  const handleRequestPermission = async () => {
    setPermissionState('requesting');
    setErrorMsg(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser Anda tidak mendukung akses kamera.');
      }

      // Minta izin kamera langsung ke browser API
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      // Hentikan stream sementara dari getUserMedia agar tidak lock kamera sebelum Html5Qrcode memulainya
      stream.getTracks().forEach((track) => track.stop());

      if (isMountedRef.current) {
        setPermissionState('granted');
        await startScanner();
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setPermissionState('denied');
        setErrorMsg(
          err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError'
            ? 'Izin kamera ditolak oleh pengguna atau diblokir oleh browser. Silakan izinkan akses kamera di pengaturan browser.'
            : err?.message || 'Gagal meminta izin kamera.'
        );
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-cyan-400" />
            <h3 className="font-medium text-slate-100">Scan QR Code / Barcode</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col items-center">
          {/* TAMPILAN 1: PERMINTAAN IZIN KAMERA */}
          {permissionState === 'idle' && (
            <div className="text-center py-6 px-3 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 shadow-lg shadow-cyan-500/10">
                <Camera className="w-8 h-8" />
              </div>
              <h4 className="text-base font-semibold text-slate-100 mb-2">
                Izinkan Akses Kamera
              </h4>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-6">
                ElectraTech membutuhkan izin kamera untuk memindai QR Code nomor resi atau batch secara otomatis dan real-time.
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
                  <span>Izinkan & Mulai</span>
                </button>
              </div>
            </div>
          )}

          {/* TAMPILAN 2: MEMINTA IZIN DARI BROWSER */}
          {permissionState === 'requesting' && (
            <div className="text-center py-10 px-4 flex flex-col items-center space-y-3">
              <RefreshCw className="h-8 w-8 text-cyan-400 animate-spin" />
              <p className="text-sm font-medium text-slate-200">Menunggu Izin Browser...</p>
              <p className="text-xs text-slate-400 max-w-xs">
                Silakan pilih <b>"Allow"</b> atau <b>"Izinkan"</b> pada prompt izin kamera di browser Anda.
              </p>
            </div>
          )}

          {/* TAMPILAN 3: KAMERA AKTIF SCANNING */}
          {permissionState === 'granted' && (
            <>
              <p className="text-xs text-slate-400 mb-4 text-center">
                Arahkan kamera ke QR Code resi atau batch produk untuk melacak secara otomatis.
              </p>

              <div className="relative w-full aspect-square max-w-[320px] overflow-hidden rounded-xl border border-slate-800 bg-black flex items-center justify-center">
                <div id={containerId} className="w-full h-full" />

                {isStarting && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 text-cyan-400 gap-2">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                    <span className="text-xs text-slate-300">Menghubungkan kamera...</span>
                  </div>
                )}

                {errorMsg && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 p-4 text-center">
                    <AlertCircle className="h-8 w-8 text-rose-500 mb-2" />
                    <p className="text-xs text-rose-300">{errorMsg}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAMPILAN 4: IZIN DITOLAK ATAU ERROR */}
          {permissionState === 'denied' && (
            <div className="text-center py-6 px-3 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h4 className="text-base font-semibold text-slate-100 mb-2">
                Akses Kamera Tidak Diizinkan
              </h4>
              <p className="text-xs text-rose-300/90 max-w-xs leading-relaxed mb-6">
                {errorMsg || 'Akses kamera ditolak. Mohon aktifkan izin kamera pada ikon gembok/setelan browser Anda lalu coba kembali.'}
              </p>
              <div className="flex gap-3 w-full max-w-xs">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-800 bg-slate-950 text-xs font-semibold text-slate-300 hover:border-slate-700 transition"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-xs font-semibold text-slate-950 transition"
                >
                  Coba Lagi
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 flex w-full justify-between items-center text-[11px] text-slate-500">
            <span>Mendukung format QR Code & Barcode standar</span>
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
    </div>
  );
}
