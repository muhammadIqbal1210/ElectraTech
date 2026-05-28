'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bot,
  ClipboardList,
  Cpu,
  Database,
  FolderPlus,
  History,
  LayoutDashboard,
  LogOut,
  MapPinned,
  PackageCheck,
  Route,
  ShieldCheck,
  Sprout,
  Users,
} from 'lucide-react';

const menuByRole = {
  produsen: {
    nodeLabel: 'Node: Verified Penakar',
    items: [
      { name: 'Dashboard', href: '/produsen', icon: LayoutDashboard },
      { name: 'SmartIoT Control', href: '/produsen/smartiot', icon: Cpu },
      { name: 'Pendaftaran Batch', href: '/produsen/batch/create', icon: FolderPlus },
      { name: 'Manajemen Budidaya', href: '/produsen/budidaya/create', icon: Sprout },
      { name: 'AI ElectraAgent', href: '/produsen/agen', icon: Bot },
    ],
  },
  kurir: {
    nodeLabel: 'Node: Verified Kurir',
    items: [
      { name: 'Dashboard Kurir', href: '/kurir', icon: LayoutDashboard },
      { name: 'Manifest Pengiriman', href: '/kurir/manifest', icon: ClipboardList },
      { name: 'Check-in Paket', href: '/kurir/checkin', icon: MapPinned },
      { name: 'Riwayat Ledger', href: '/kurir/riwayat', icon: History },
    ],
  },
  admin: {
    nodeLabel: 'Node: System Admin',
    items: [
      { name: 'Dashboard Admin', href: '/admin', icon: LayoutDashboard },
      { name: 'Manajemen User', href: '/admin/users', icon: Users },
      { name: 'Audit TraceChain', href: '/admin/audit', icon: ShieldCheck },
      { name: 'Database Monitor', href: '/admin/database', icon: Database },
    ],
  },
};

function getCurrentRole(pathname: string) {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/kurir')) return 'kurir';
  return 'produsen';
}

function isActivePath(pathname: string, href: string) {
  if (href === '/produsen' || href === '/kurir' || href === '/admin') {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentRole = getCurrentRole(pathname);
  const menu = menuByRole[currentRole];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-5 shrink-0">
        <div className="space-y-6">
          <Link href="/" className="block px-2 py-1">
            <h2 className="text-xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent tracking-tight">
              ELECTRA TECH
            </h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
              Core Ledger & IoT
            </p>
          </Link>

          <nav className="space-y-1.5">
            {menu.items.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4.5 h-4.5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <div className="flex items-center gap-2">
              <PackageCheck className="h-4 w-4 text-cyan-400" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300">
                TraceChain Sync
              </span>
            </div>
          </div>
          <Link
            href="/login"
            className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
            Keluar Sistem
          </Link>
        </div>
      </aside>

      <main className="flex-1 bg-slate-950 overflow-y-auto">
        <header className="h-16 border-b border-slate-800/60 bg-slate-900/20 backdrop-blur-md flex items-center justify-between px-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Route className="h-4 w-4" />
            <span>{pathname}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-semibold text-slate-400">{menu.nodeLabel}</span>
          </div>
        </header>

        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
