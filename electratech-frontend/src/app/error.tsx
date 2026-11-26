'use client';

import { useEffect } from 'react';
import { House, RefreshCw, ServerCrash } from 'lucide-react';
import StatusPage, { StatusLink, primaryButton } from '@/components/StatusPage';

export default function Error({
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
    <main className="min-h-screen bg-[#0b132b] text-white">
      <title>Terjadi Kesalahan | SmartFarm Electra Tech</title>
      <meta name="robots" content="noindex" />
      <StatusPage
        code="500"
        icon={ServerCrash}
        title="Terjadi kesalahan pada server"
        description="Sistem sedang mengalami gangguan sementara. Silakan coba lagi beberapa saat lagi."
        actions={
          <>
            <button type="button" onClick={() => unstable_retry()} className={primaryButton}>
              <RefreshCw className="h-4 w-4" aria-hidden />
              Coba Lagi
            </button>
            <StatusLink href="/">
              <House className="h-4 w-4" aria-hidden />
              Ke Beranda
            </StatusLink>
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
    </main>
  );
}
