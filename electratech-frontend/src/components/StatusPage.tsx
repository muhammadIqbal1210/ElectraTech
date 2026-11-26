import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

type StatusPageProps = {
  code: string;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Tombol/aksi utama. */
  actions?: React.ReactNode;
  /** Konten tambahan di bawah aksi (mis. tautan populer, kode referensi). */
  footer?: React.ReactNode;
  /** `full` = memenuhi layar (halaman publik), `inline` = di dalam layout dashboard. */
  variant?: 'full' | 'inline';
};

export default function StatusPage({
  code,
  title,
  description,
  icon: Icon,
  actions,
  footer,
  variant = 'full',
}: StatusPageProps) {
  return (
    <section
      className={`relative flex items-center justify-center overflow-hidden px-6 text-white ${
        variant === 'full' ? 'min-h-[calc(100vh-4rem)] pt-32 pb-24' : 'min-h-[60vh] py-16'
      }`}
    >
      {variant === 'full' && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(34,211,238,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,.6) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      )}

      <div className="relative z-10 mx-auto w-full max-w-xl text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10">
          <Icon className="h-8 w-8 text-cyan-400" aria-hidden />
        </div>

        <p className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-6xl font-bold tracking-tight text-transparent sm:text-7xl">
          {code}
        </p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-slate-400">{description}</p>

        {actions && <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{actions}</div>}
        {footer && <div className="mt-10">{footer}</div>}
      </div>
    </section>
  );
}

const base =
  'inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400';

export const primaryButton = `${base} bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500`;
export const secondaryButton = `${base} border border-slate-700 bg-slate-900/60 text-slate-200 hover:border-cyan-500/50 hover:text-white`;

export function StatusLink({
  href,
  children,
  primary = false,
}: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <Link href={href} className={primary ? primaryButton : secondaryButton}>
      {children}
    </Link>
  );
}
