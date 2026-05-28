import { History, Link2, MapPin } from 'lucide-react';

const logs = [
  { time: '09:15', resi: 'TRK-9901', event: 'Dalam perjalanan menuju titik sortir Bandung', hash: '0x7f41...19aa' },
  { time: '08:05', resi: 'TRK-9901', event: 'Suhu kontainer stabil 18.5 C', hash: '0x91bc...42ed' },
  { time: '07:20', resi: 'TRK-9901', event: 'Paket diterima dari greenhouse A3', hash: '0x25aa...bc10' },
  { time: '16:30', resi: 'TRK-9875', event: 'Paket diserahkan ke penerima', hash: '0x88de...0c43' },
];

export default function RiwayatKurirPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <History className="h-6 w-6 text-purple-400" />
          Riwayat Ledger Kurir
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Rekam jejak check-in paket yang sudah disinkronkan ke TraceChain.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                <th className="pb-3">Waktu</th>
                <th className="pb-3">Resi</th>
                <th className="pb-3">Event</th>
                <th className="pb-3">Hash Ledger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {logs.map((log) => (
                <tr key={`${log.time}-${log.hash}`} className="hover:bg-slate-800/20">
                  <td className="py-4 font-mono text-xs text-purple-300">{log.time}</td>
                  <td className="py-4 font-mono text-xs text-slate-300">{log.resi}</td>
                  <td className="py-4">
                    <span className="flex items-center gap-2 text-slate-300">
                      <MapPin className="h-3.5 w-3.5 text-rose-400" />
                      {log.event}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 font-mono text-xs text-emerald-400">
                      <Link2 className="h-3 w-3" />
                      {log.hash}
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
