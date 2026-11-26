'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, RefreshCw, TriangleAlert } from 'lucide-react';
import StatusPage, { StatusLink, primaryButton } from '@/components/StatusPage';

function dashboardHome(pathname: string) {
  if (pathname.startsWith('/admin')) return '/admin';
  if (pathname.startsWith('/kurir')) return '/kurir';
  return '/produsen';
}

/** Error di dalam dashboard: tampil di dalam layout (sidebar tetap ada). */
export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const pathname = usePathname();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusPage
      variant="inline"
      code="500"
      icon={TriangleAlert}
      title="Halaman gagal dimuat"
      description="Terjadi kesalahan saat memuat data. Periksa koneksi Anda lalu coba lagi."
      actions={
        <>
          <button type="button" onClick={() => unstable_retry()} className={primaryButton}>
            <RefreshCw className="h-4 w-4" aria-hidden />
            Coba Lagi
          </button>
          <StatusLink href={dashboardHome(pathname)}>
            <LayoutDashboard className="h-4 w-4" aria-hidden />
            Ke Dashboard
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
  );
}
