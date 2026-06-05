'use client';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { FolderPlus, ClipboardList, CheckCircle2, AlertCircle } from 'lucide-react';
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
  const [isError, setIsError] = useState(false); // Tambahan state untuk membedakan warna pesan sukses/gagal

  const loadBatches = useCallback(async () => {
    try {
      const response = await apiRequest<BatchRow[]>('/api/batches');
      setBatchHistory(response.data || []);
    } catch (err) {
      setIsError(true);
      setMessage(err instanceof Error ? err.message : 'Gagal memuat batch.');
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadBatches);
  }, [loadBatches]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setIsError(false);

    try {
      await apiRequest<BatchRow>('/api/batches', {
        method: 'POST',
        body: JSON.stringify({ variety, generation, quantity: Number(quantity) }),
      });
      setVariety('');
      setGeneration('G1');
      setQuantity('');
      setIsError(false);
      setMessage('Batch baru berhasil didaftarkan.');
      await loadBatches();
    } catch (err) {
      setIsError(true);
      setMessage(err instanceof Error ? err.message : 'Gagal mendaftarkan batch.');
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Atas: Form Input */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-base flex items-center gap-2 text-emerald-400">
          <FolderPlus className="w-5 h-5" /> Registrasi Batch Benih
        </h2>
        
        {/* Kontainer form utama */}
        <div className="space-y-4">
          <form className="flex flex-col lg:flex-row lg:items-end gap-4 text-sm" onSubmit={handleSubmit}>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-slate-400 mb-1">Varietas Tanaman</label>
              <input value={variety} onChange={(event) => setVariety(event.target.value)} type="text" placeholder="Misal: Cabai Rawit Janger" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500" required />
            </div>
            
            <div className="w-full lg:w-48">
              <label className="block text-xs text-slate-400 mb-1">Generasi Benih</label>
              <input value={generation} onChange={(event) => setGeneration(event.target.value)} type="text" placeholder="Misal: F1, G1, G2" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500" required />
            </div>
            
            <div className="w-full lg:w-48">
              <label className="block text-xs text-slate-400 mb-1">Kuantitas Benih (Butir/Pot)</label>
              <input value={quantity} onChange={(event) => setQuantity(event.target.value)} type="number" placeholder="1000" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500" required min={1} />
            </div>
            
            <div className="w-full lg:w-auto flex-shrink-0">
              <button className="w-full lg:w-auto bg-emerald-600 hover:bg-emerald-500 font-bold py-2.5 px-6 rounded-xl transition-all whitespace-nowrap">
                Kunci & Daftarkan Batch
              </button>
            </div>
          </form>

          {/* Pesan Notifikasi ditaruh di luar baris form agar tidak merusak layout grid/flex */}
          {message && (
            <div className={`flex items-center gap-2 p-3 rounded-xl text-xs font-medium transition-all ${
              isError 
                ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400' 
                : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
            }`}>
              {isError ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
              <span>{message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bawah: History Registrasi */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
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
