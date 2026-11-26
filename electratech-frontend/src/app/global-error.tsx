'use client';

import { useEffect } from 'react';
import { RefreshCw, ServerCrash } from 'lucide-react';
import StatusPage, { primaryButton } from '@/components/StatusPage';
import './globals.css';

/** Menangani error di root layout. Menggantikan seluruh dokumen, jadi wajib punya <html> & <body>. */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="id">
      <body className="min-h-screen bg-[#0b132b] text-white">
        <title>Terjadi Kesalahan | SmartFarm Electra Tech</title>
        <meta name="robots" content="noindex" />
        <StatusPage
          code="500"
          icon={ServerCrash}
          title="Terjadi kesalahan"
          description="Aplikasi tidak dapat dimuat. Silakan muat ulang halaman atau coba lagi nanti."
          actions={
            <>
              <button type="button" onClick={() => unstable_retry()} className={primaryButton}>
                <RefreshCw className="h-4 w-4" aria-hidden />
                Coba Lagi
              </button>
              {/* <a> biasa (bukan Link): reload penuh agar root layout dimuat ulang dari awal */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/" className="text-sm font-semibold text-cyan-400 hover:text-cyan-300">
                Ke Beranda
              </a>
            </>
          }
          footer={
            error.digest && (
              <p className="text-xs text-slate-500">
                Kode referensi: <code className="font-mono text-slate-400">{error.digest}</code>
              </p>
            )
          }
        />
      </body>
    </html>
  );
}
