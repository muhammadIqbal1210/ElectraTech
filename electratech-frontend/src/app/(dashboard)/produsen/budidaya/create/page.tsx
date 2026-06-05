'use client';
import { FormEvent, useEffect, useState } from 'react';
import { Sprout, Route } from 'lucide-react';
import { apiRequest } from '@/lib/api';

type BatchRow = {
  id: string;
  variety: string;
  phase: string;
};

type BatchLog = {
  id: number;
  batch_id: string;
  from_phase: string | null;
  to_phase: string;
  notes: string | null;
  created_at: string;
};

export default function BudidayaPage() {
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [toPhase, setToPhase] = useState('PENYEMAIAN');
  const [notes, setNotes] = useState('');
  const [logs, setLogs] = useState<BatchLog[]>([]);
  const [message, setMessage] = useState('');

  const loadBatches = async () => {
    const response = await apiRequest<BatchRow[]>('/api/batches');
    const data = response.data || [];
    setBatches(data);
    setSelectedBatch((current) => current || data[0]?.id || '');
  };

  const loadLogs = async (batchId: string) => {
    if (!batchId) return;
    const response = await apiRequest<BatchLog[]>(`/api/batches/${batchId}/logs`);
    setLogs(response.data || []);
  };

  useEffect(() => {
    void Promise.resolve()
      .then(loadBatches)
      .catch((err) => setMessage(err instanceof Error ? err.message : 'Gagal memuat batch.'));
  }, []);

  useEffect(() => {
    void Promise.resolve()
      .then(() => loadLogs(selectedBatch))
      .catch((err) => setMessage(err instanceof Error ? err.message : 'Gagal memuat log fase.'));
  }, [selectedBatch]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');

    try {
      await apiRequest<BatchLog>(`/api/batches/${selectedBatch}/logs`, {
        method: 'POST',
        body: JSON.stringify({ toPhase, notes }),
      });
      setNotes('');
      setMessage('Perubahan fase berhasil disimpan.');
      await Promise.all([loadBatches(), loadLogs(selectedBatch)]);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal menyimpan perubahan fase.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Form Log Perubahan Fase */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-base flex items-center gap-2 text-emerald-400">
          <Sprout className="w-5 h-5" /> Update Fase Hidup
        </h2>
        <form className="space-y-4 text-sm" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Pilih ID Batch</label>
            <select value={selectedBatch} onChange={(event) => setSelectedBatch(event.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 focus:outline-none">
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>{batch.id} ({batch.variety})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Fase Hidup Baru</label>
            <select value={toPhase} onChange={(event) => setToPhase(event.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 focus:outline-none">
              <option value="PENYEMAIAN">Fase Penyemaian (Seedling)</option>
              <option value="VEGETATIF">Fase Vegetatif</option>
              <option value="GENERATIF">Fase Generatif</option>
              <option value="SIAP_DISTRIBUSI">Fase Siap Kemas & Distribusi</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Catatan Kondisi</label>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="min-h-24 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500" placeholder="Tunas sehat, nutrisi cukup, atau catatan inspeksi." />
          </div>
          <button className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold py-2.5 rounded-xl transition-all">
            Simpan Perubahan Fase
          </button>
          {message && <p className="text-xs font-semibold text-emerald-300">{message}</p>}
        </form>
      </div>

      {/* History Log Perubahan Fase */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="font-bold text-base flex items-center gap-2 text-slate-300 mb-4">
          <Route className="w-5 h-5 text-purple-400" /> Rekam Jejak Siklus Hidup Bibit
        </h2>
        <div className="overflow-x-auto text-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-xs">
                <th className="pb-2">ID Batch</th>
                <th className="pb-2">Fase Asal</th>
                <th className="pb-2">Fase Baru</th>
                <th className="pb-2">Tanggal Mutasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/10">
                  <td className="py-3 font-mono text-emerald-400">{log.batch_id}</td>
                  <td className="py-3 text-slate-400">{log.from_phase || '-'}</td>
                  <td className="py-3 font-semibold text-emerald-400">{log.to_phase}</td>
                  <td className="py-3 text-xs text-slate-500 font-mono">{new Date(log.created_at).toLocaleDateString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
