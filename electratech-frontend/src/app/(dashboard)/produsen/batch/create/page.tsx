'use client';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { FolderPlus, ClipboardList } from 'lucide-react';
import { apiRequest } from '@/lib/api';

type BatchRow = {
  id: string;
  variety: string;
  generation: string;
  quantity: number;
  seeded_at: string;
};

export default function PendaftaranBatchPage() {
  const [batchHistory, setBatchHistory] = useState<BatchRow[]>([]);
  const [variety, setVariety] = useState('');
  const [generation, setGeneration] = useState('G1');
  const [quantity, setQuantity] = useState('');
  const [message, setMessage] = useState('');

  const loadBatches = useCallback(async () => {
    try {
      const response = await apiRequest<BatchRow[]>('/api/batches');
      setBatchHistory(response.data || []);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal memuat batch.');
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadBatches);
  }, [loadBatches]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');

    try {
      await apiRequest<BatchRow>('/api/batches', {
        method: 'POST',
        body: JSON.stringify({ variety, generation, quantity: Number(quantity) }),
      });
      setVariety('');
      setGeneration('G1');
      setQuantity('');
      setMessage('Batch baru berhasil didaftarkan.');
      await loadBatches();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal mendaftarkan batch.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Kiri: Form Input */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-base flex items-center gap-2 text-emerald-400">
          <FolderPlus className="w-5 h-5" /> Registrasi Batch Benih
        </h2>
        <form className="space-y-4 text-sm" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Varietas Tanaman</label>
            <input value={variety} onChange={(event) => setVariety(event.target.value)} type="text" placeholder="Misal: Cabai Rawit Janger" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500" required />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Generasi Benih</label>
            <input value={generation} onChange={(event) => setGeneration(event.target.value)} type="text" placeholder="Misal: F1, G1, G2" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500" required />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Kuantitas Benih (Butir/Pot)</label>
            <input value={quantity} onChange={(event) => setQuantity(event.target.value)} type="number" placeholder="1000" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500" required min={1} />
          </div>
          <button className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold py-2.5 rounded-xl transition-all">
            Kunci & Daftarkan Batch
          </button>
          {message && <p className="text-xs font-semibold text-emerald-300">{message}</p>}
        </form>
      </div>

      {/* Kanan: History Registrasi */}
      <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="font-bold text-base flex items-center gap-2 text-slate-300 mb-4">
          <ClipboardList className="w-5 h-5 text-purple-400" /> Riwayat Registrasi Hulu
        </h2>
        <div className="overflow-x-auto text-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-xs">
                <th className="pb-2">ID Batch</th>
                <th className="pb-2">Varietas</th>
                <th className="pb-2">Generasi</th>
                <th className="pb-2">Tanggal Masuk</th>
                <th className="pb-2">Kuantitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {batchHistory.map((h) => (
                <tr key={h.id} className="hover:bg-slate-800/10">
                  <td className="py-3 font-mono text-emerald-400">{h.id}</td>
                  <td className="py-3 font-medium">{h.variety}</td>
                  <td className="py-3 font-mono text-xs text-purple-300">{h.generation}</td>
                  <td className="py-3 text-slate-400 text-xs">{new Date(h.seeded_at).toLocaleDateString('id-ID')}</td>
                  <td className="py-3 font-mono text-xs">{h.quantity.toLocaleString('id-ID')} Bibit</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
