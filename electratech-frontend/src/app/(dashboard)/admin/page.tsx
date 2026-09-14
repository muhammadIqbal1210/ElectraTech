'use client';

import { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Boxes,
  Cpu,
  Database,
  Newspaper,
  Truck,
  Users,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

type DashboardData = {
  metrics: {
    totalUsers: number;
    usersDetail: string;
    totalBatches: number;
    totalShipments: number;
    totalBlogs: number;
    totalDevices: number;
  };
  activities: Array<{
    time: string;
    actor: string;
    event: string;
    status: string;
  }>;
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const res = await apiRequest<DashboardData>('/api/admin/dashboard-stats');
        if (res.ok && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Error fetching admin dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const metrics = [
    {
      label: 'Total User Aktif',
      value: data?.metrics.totalUsers ?? 0,
      note: data?.metrics.usersDetail || 'Memuat...',
      icon: Users,
      color: 'text-cyan-400',
    },
    {
      label: 'Batch Terdaftar',
      value: data?.metrics.totalBatches ?? 0,
      note: 'Terdaftar di TraceChain',
      icon: Boxes,
      color: 'text-emerald-400',
    },
    {
      label: 'Pengiriman Rantai Pasok',
      value: data?.metrics.totalShipments ?? 0,
      note: 'Total resi pengiriman',
      icon: Truck,
      color: 'text-purple-400',
    },
    {
      label: 'Artikel & Berita',
      value: data?.metrics.totalBlogs ?? 0,
      note: 'Total berita terpublikasi/draft',
      icon: Newspaper,
      color: 'text-blue-400',
    },
  ];

  const systemHealth = [
    ['PostgreSQL Core', 'Online', 'Connected'],
    ['TraceChain Ledger', 'Synced', 'Active'],
    ['SmartLink Gateway', 'Online', `${data?.metrics.totalDevices ?? 0} devices`],
    ['AI Agent Service', 'Standby', '2 models'],
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard Admin Electra Tech</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Pantau operasional lintas role, status ledger, perangkat IoT, dan aktivitas audit rantai pasok.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <div key={metric.label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{metric.label}</p>
                <Icon className={`h-5 w-5 ${metric.color}`} />
              </div>
              <p className="mt-4 font-mono text-3xl font-black text-slate-100">
                {loading ? '...' : metric.value}
              </p>
              <p className="mt-1 text-xs text-slate-400">{metric.note}</p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
              <Activity className="h-4 w-4 text-cyan-400" />
              Aktivitas Audit & Log Terbaru
            </h2>
            <span className="rounded-md border border-slate-800 bg-slate-950 px-2 py-1 font-mono text-[10px] text-slate-500">
              Real-time Feed
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                  <th className="pb-3">Waktu</th>
                  <th className="pb-3">Aktor</th>
                  <th className="pb-3">Event</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-slate-400 text-center">Memuat aktivitas...</td>
                  </tr>
                ) : !data?.activities || data.activities.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-slate-400 text-center">Belum ada aktivitas log tercatat.</td>
                  </tr>
                ) : (
                  data.activities.map((activity, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/20">
                      <td className="py-4 font-mono text-xs text-cyan-300">{activity.time}</td>
                      <td className="py-4 font-semibold text-slate-300">{activity.actor}</td>
                      <td className="py-4 text-slate-400">{activity.event}</td>
                      <td className="py-4">
                        <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-400">
                          {activity.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
              <Database className="h-4 w-4 text-blue-400" />
              Health Check System
            </h2>
            <div className="space-y-3">
              {systemHealth.map(([name, status, detail]) => (
                <div key={name} className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-300">{name}</p>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      {status}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-slate-500">{detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              Perhatian Admin
            </h2>
            <p className="mt-3 text-xs leading-relaxed text-slate-300">
              Selalu tinjau verifikasi logistik & pengiriman terkini sebelum log dikunci di ledger secara permanen.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
              <Cpu className="h-4 w-4 text-purple-400" />
              Ringkasan Perangkat IoT
            </h2>
            <div className="flex items-center justify-between rounded-xl bg-slate-950 p-3">
              <span className="text-xs text-slate-400">Device Terdaftar</span>
              <span className="font-mono text-sm font-bold text-emerald-400">
                {data?.metrics.totalDevices ?? 0} Device
              </span>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
