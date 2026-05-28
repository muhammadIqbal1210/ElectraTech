import { Database, Server, TableProperties } from 'lucide-react';

const tables = [
  ['users', '38 rows', 'RBAC akun internal'],
  ['batches', '126 rows', 'Data batch perbenihan'],
  ['iot_logs', '12.480 rows', 'Telemetri SmartLink'],
  ['package_tracking', '934 rows', 'Riwayat logistik kurir'],
];

export default function AdminDatabasePage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Database className="h-6 w-6 text-cyan-400" />
          Database Monitor
        </h1>
        <p className="mt-1 text-sm text-slate-400">Simulasi pemantauan tabel inti PostgreSQL.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ['Connection', 'Healthy'],
          ['Latency', '18 ms'],
          ['Backup', '02:00 WIB'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <Server className="h-5 w-5 text-cyan-400" />
            <p className="mt-4 text-sm text-slate-500">{label}</p>
            <p className="mt-1 font-mono text-2xl font-black text-slate-100">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {tables.map(([name, rows, desc]) => (
          <div key={name} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center gap-2">
              <TableProperties className="h-5 w-5 text-emerald-400" />
              <span className="font-mono text-sm font-bold text-slate-200">{name}</span>
            </div>
            <p className="mt-3 font-mono text-xl font-black text-cyan-300">{rows}</p>
            <p className="mt-1 text-xs text-slate-500">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
