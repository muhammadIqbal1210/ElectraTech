import {
  Activity,
  AlertTriangle,
  Boxes,
  Cpu,
  Database,
  ShieldCheck,
  Truck,
  Users,
} from 'lucide-react';

const metrics = [
  {
    label: 'Total User Aktif',
    value: '38',
    note: '12 penakar, 21 kurir, 5 admin',
    icon: Users,
    color: 'text-cyan-400',
  },
  {
    label: 'Batch Terdaftar',
    value: '126',
    note: '24 batch sedang aktif',
    icon: Boxes,
    color: 'text-emerald-400',
  },
  {
    label: 'Pengiriman Hari Ini',
    value: '17',
    note: '3 paket butuh inspeksi',
    icon: Truck,
    color: 'text-purple-400',
  },
  {
    label: 'Ledger Event',
    value: '4.812',
    note: 'Sinkronisasi normal',
    icon: ShieldCheck,
    color: 'text-blue-400',
  },
];

const activities = [
  {
    time: '09:22',
    actor: 'Penakar Benih - Greenhouse A3',
    event: 'Mendaftarkan BATCH-B101 ke TraceChain',
    status: 'Terverifikasi',
  },
  {
    time: '09:15',
    actor: 'Kurir DRV-IKBAL01',
    event: 'Check-in TRK-9901 pada koordinat -6.9175, 107.6191',
    status: 'Terverifikasi',
  },
  {
    time: '08:58',
    actor: 'SmartLink IoT',
    event: 'Mengirim telemetri suhu kontainer 18.5 C',
    status: 'Normal',
  },
  {
    time: '08:31',
    actor: 'ElectraAgent',
    event: 'Memberikan rekomendasi irigasi BATCH-B092',
    status: 'Info',
  },
];

const systemHealth = [
  ['PostgreSQL Core', 'Online', '99.98%'],
  ['TraceChain Ledger', 'Synced', '4 node'],
  ['SmartLink Gateway', 'Online', '18 device'],
  ['AI Agent Service', 'Standby', '2 model'],
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-cyan-300">
              <ShieldCheck className="h-4 w-4" />
              Admin Control Plane
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard Admin Electra Tech</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Pantau operasional lintas role, status ledger, perangkat IoT, dan aktivitas audit rantai pasok.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">System Status</p>
            <p className="mt-1 text-sm font-semibold text-slate-100">Semua layanan inti aktif</p>
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
              <p className="mt-4 font-mono text-3xl font-black text-slate-100">{metric.value}</p>
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
              Aktivitas Audit Terbaru
            </h2>
            <span className="rounded-md border border-slate-800 bg-slate-950 px-2 py-1 font-mono text-[10px] text-slate-500">
              Live Feed
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
                {activities.map((activity) => (
                  <tr key={`${activity.time}-${activity.event}`} className="hover:bg-slate-800/20">
                    <td className="py-4 font-mono text-xs text-cyan-300">{activity.time}</td>
                    <td className="py-4 font-semibold text-slate-300">{activity.actor}</td>
                    <td className="py-4 text-slate-400">{activity.event}</td>
                    <td className="py-4">
                      <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-400">
                        {activity.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
              <Database className="h-4 w-4 text-blue-400" />
              Health Check
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
              Ada 3 pengiriman dengan kondisi &quot;Perlu Inspeksi&quot;. Prioritaskan verifikasi bukti foto sebelum ledger dikunci permanen.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
              <Cpu className="h-4 w-4 text-purple-400" />
              Ringkasan IoT
            </h2>
            <div className="flex items-center justify-between rounded-xl bg-slate-950 p-3">
              <span className="text-xs text-slate-400">Device online</span>
              <span className="font-mono text-sm font-bold text-emerald-400">18/20</span>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
