'use client';

import { useEffect, useState } from 'react';
import { History, Link2, MapPin } from 'lucide-react';
import { apiRequest } from '@/lib/api';

type TrackingLog = {
  id: number;
  receipt_number: string;
  batch_id: string;
  status: string;
  cargo_condition: string;
  recorded_at: string;
};

export default function RiwayatKurirPage() {
  const [logs, setLogs] = useState<TrackingLog[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    apiRequest<TrackingLog[]>('/api/tracking')
      .then((response) => setLogs(response.data || []))
      .catch((err) => setMessage(err instanceof Error ? err.message : 'Gagal memuat riwayat tracking.'));
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {message && <p className="text-sm font-semibold text-purple-300">{message}</p>}

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
                <tr key={log.id} className="hover:bg-slate-800/20">
                  <td className="py-4 font-mono text-xs text-purple-300">
                    {new Date(log.recorded_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-4 font-mono text-xs text-slate-300">{log.receipt_number}</td>
                  <td className="py-4">
                    <span className="flex items-center gap-2 text-slate-300">
                      <MapPin className="h-3.5 w-3.5 text-rose-400" />
                      {log.status} - {log.batch_id} - {log.cargo_condition}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 font-mono text-xs text-emerald-400">
                      <Link2 className="h-3 w-3" />
                      TRK-{String(log.id).padStart(6, '0')}
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
