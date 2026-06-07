'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  QrCode,
  Route,
  ShieldCheck,
  Sprout,
  Users,
} from 'lucide-react';
import { apiRequest, ApiUser, clearSession, getStoredUser, getToken, Role } from '@/lib/api';

const menuByRole = {
  produsen: {
    nodeLabel: 'Node: Verified Penakar',
    items: [
      { name: 'Dashboard', href: '/produsen', icon: LayoutDashboard },
      { name: 'SmartIoT Control', href: '/produsen/smartiot', icon: Cpu },
      { name: 'Pendaftaran Batch', href: '/produsen/batch/create', icon: FolderPlus },
      { name: 'Manajemen Budidaya', href: '/produsen/budidaya/create', icon: Sprout },
      { name: 'Tracking Benih', href: '/produsen/tracking', icon: MapPinned },
      { name: 'QR Distribusi', href: '/produsen/qr', icon: QrCode },
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
      { name: 'Blog', href: '/admin/blog', icon: ClipboardList },
      { name: 'Sensor IoT', href: '/admin/control_iot', icon: Cpu },
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

const roleHome: Record<Role, string> = {
  ADMIN: '/admin',
  PRODUSEN: '/produsen',
  KURIR: '/kurir',
};

const pathRole: Record<ReturnType<typeof getCurrentRole>, Role> = {
  admin: 'ADMIN',
  produsen: 'PRODUSEN',
  kurir: 'KURIR',
};

function isActivePath(pathname: string, href: string) {
  if (href === '/produsen' || href === '/kurir' || href === '/admin') {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const currentRole = getCurrentRole(pathname);
  const menu = menuByRole[currentRole];
  const [user, setUser] = useState<ApiUser | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  useEffect(() => {
    const token = getToken();
    const storedUser = getStoredUser();
    const expectedRole = pathRole[currentRole];

    if (!token || !storedUser) {
      clearSession();
      router.replace('/login');
      return;
    }

    if (storedUser.role !== expectedRole) {
      router.replace(roleHome[storedUser.role]);
      return;
    }

    void Promise.resolve()
      .then(() => apiRequest<never>('/api/auth/me'))
      .then(() => setUser(storedUser))
      .catch(() => {
        clearSession();
        router.replace('/login');
      })
      .finally(() => setIsCheckingAccess(false));
  }, [currentRole, router]);

  const handleLogout = () => {
    clearSession();
    router.push('/login');
  };

  if (isCheckingAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm font-semibold text-slate-400">
        Memverifikasi akses...
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-5 shrink-0">
        <div className="space-y-6">
          <Link href="/" className="block px-2 py-1">
            <img src="/monocromlogo.png" alt="ElectraTech Logo" className="h-10 w-auto" />
            <p className="text-[10px] text-slate-500 tracking-widest mt-2 ps-4">
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
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
            Keluar Sistem
          </button>
        </div>
      </aside>

      <main className="flex-1 h-full bg-slate-950 overflow-y-auto">
        <header className="h-16 border-b border-slate-800/60 bg-slate-900/20 backdrop-blur-md flex items-center justify-between px-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Route className="h-4 w-4" />
            <span>{pathname}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-semibold text-slate-400">
              {user ? `${user.name} - ${user.role}` : menu.nodeLabel}
            </span>
          </div>
        </header>

        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
