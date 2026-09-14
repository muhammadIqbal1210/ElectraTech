'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  Bot,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Cpu,
  Database,
  FolderPlus,
  History,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Menu,
  PackageCheck,
  QrCode,
  ListIndentIncrease,
  ListIndentDecrease,
  Route,
  Settings,
  ShieldCheck,
  Sprout,
  User,
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
      { name: 'Serahkan Pengiriman', href: '/produsen/pengiriman', icon: PackageCheck },
      { name: 'QR Distribusi', href: '/produsen/qr', icon: QrCode },
      { name: 'Tracking Benih', href: '/produsen/tracking', icon: MapPinned },
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#user-profile-menu-container')) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const savedState = localStorage.getItem('sidebar_collapsed');
    if (savedState !== null) {
      setIsCollapsed(savedState === 'true');
    }
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const newState = !prev;
      localStorage.setItem('sidebar_collapsed', String(newState));
      return newState;
    });
  };

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
  const getInitial = (name: string | undefined) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#070913] text-slate-100 font-sans">
      {/* Sidebar Navigation (Left) */}
      <aside
        className={`${
          isCollapsed ? 'w-20 p-3' : 'w-64 p-5'
        } bg-[#0A0D1B] border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none transition-all duration-300 relative group/sidebar`}
      >
        <div className="space-y-6">
          {/* Electra Tech Brand Header & Toggle Button */}
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 px-1 py-1 group overflow-hidden">
              <div className="w-10 h-10 rounded-xl p-0.5 group-hover:scale-105 transition-transform shrink-0">
                <div className="w-full h-full rounded-[10px] flex items-center justify-center">
                  <img src="/logoelectra.png" alt="Electra Logo" className="w-8 h-8 object-contain opacity-90" />
                </div>
              </div>
              {!isCollapsed && (
                <div className="whitespace-nowrap transition-opacity duration-300">
                  <h1 className="font-semibold text-base tracking-tight text-white leading-tight">Electra Tech</h1>
                  <p className="text-[10px] text-slate-400 font-medium tracking-wide">Core Ledger & IoT</p>
                </div>
              )}
            </Link>
          </div>

          {/* Main Navigation Items */}
          <nav className="space-y-1.5">
            {menu.items.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={isCollapsed ? item.name : undefined}
                  className={`flex items-center gap-3.5 ${
                    isCollapsed ? 'justify-center px-0 py-3' : 'px-4 py-3'
                  } rounded-xl text-sm font-normal transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white font-medium'
                      : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Navigation Items */}
        <div className="space-y-1.5 pt-4 border-t border-slate-800/80">
          {/* <button
            type="button"
            title={isCollapsed ? 'Greenhouse A3' : undefined}
            className={`w-full flex items-center gap-3.5 ${
              isCollapsed ? 'justify-center px-0 py-3' : 'px-4 py-3'
            } rounded-xl text-sm font-semibold text-slate-400 hover:bg-slate-900/80 hover:text-slate-200 transition-all text-left`}
          >
          </button> */}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#070913]">
        {/* Top Header Bar */}
        <header className="h-16 px-6 flex items-center justify-between gap-4 bg-[#070913]/80 border-b border-slate-800/40 shrink-0">
          {/* Toggle Sidebar Icon in Header */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 rounded-xl transition"
            title={isCollapsed ? 'Buka Sidebar' : 'Tutup Sidebar'}
          >
            {isCollapsed ? (
              <ListIndentIncrease className="w-5 h-5" />
            ) : (
              <ListIndentDecrease className="w-5 h-5" />
            )}
          </button>

          <div className="flex items-center gap-4">
            <button
              type="button"
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 rounded-xl transition"
              title="Notifikasi"
            >
              <Bell className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 rounded-xl transition"
              title="Pengaturan"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Profile Avatar & Dropdown Menu */}
            <div id="user-profile-menu-container" className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="w-9 h-9 rounded-full bg-gradient-to-r from-emerald-500 to-indigo-600 p-0.5 shadow-md shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                title="Profil Pengguna"
              >
                <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center overflow-hidden">
                  <span className="text-xs font-bold text-white">{getInitial(user?.name)}</span>
                </div>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[#0A0D1B] border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2.5 border-b border-slate-800/80">
                    <p className="text-xs font-semibold text-white truncate">{user?.name || 'Pengguna'}</p>
                    <span className="inline-block mt-1.5 px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {user?.role || currentRole}
                    </span>
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4 text-rose-400" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}