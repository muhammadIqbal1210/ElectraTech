import { ShieldCheck, Sprout, Truck, UserPlus, Users } from 'lucide-react';

const users = [
  ['ADM-001', 'Nadia Admin', 'Admin', 'Aktif'],
  ['PNK-014', 'Greenhouse A3', 'Penakar Benih', 'Aktif'],
  ['DRV-021', 'Ikbal Kurir', 'Kurir', 'Aktif'],
  ['DRV-018', 'Rama Logistik', 'Kurir', 'Ditinjau'],
];

const roleStats = [
  { label: 'Admin', value: '5', icon: ShieldCheck, color: 'text-cyan-400' },
  { label: 'Penakar', value: '12', icon: Sprout, color: 'text-emerald-400' },
  { label: 'Kurir', value: '21', icon: Truck, color: 'text-purple-400' },
];

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Users className="h-6 w-6 text-cyan-400" />
            Manajemen User
          </h1>
          <p className="mt-1 text-sm text-slate-400">Kelola akses admin, penakar benih, dan kurir logistik.</p>
        </div>
        <button className="inline-flex w-fit items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-cyan-500">
          <UserPlus className="h-4 w-4" />
          Tambah User
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {roleStats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div key={stat.label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <Icon className={`h-5 w-5 ${stat.color}`} />
              <p className="mt-4 font-mono text-3xl font-black">{stat.value}</p>
              <p className="text-xs uppercase tracking-wider text-slate-500">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                <th className="pb-3">ID</th>
                <th className="pb-3">Nama</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map(([id, name, role, status]) => (
                <tr key={id} className="hover:bg-slate-800/20">
                  <td className="py-4 font-mono text-xs text-cyan-300">{id}</td>
                  <td className="py-4 font-semibold text-slate-300">{name}</td>
                  <td className="py-4 text-slate-400">{role}</td>
                  <td className="py-4">
                    <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-400">
                      {status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
