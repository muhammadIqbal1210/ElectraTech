'use client';
import { FolderPlus, ClipboardList } from 'lucide-react';

export default function PendaftaranBatchPage() {
  const batchHistory = [
    { id: 'BATCH-B092', nama: 'Cabai Rawit Merah', tgl: '2026-05-10', jumlah: '1,200 Bibit' },
    { id: 'BATCH-B095', nama: 'Tomat Hibrida F1', tgl: '2026-05-18', jumlah: '850 Bibit' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Kiri: Form Input */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-base flex items-center gap-2 text-emerald-400">
          <FolderPlus className="w-5 h-5" /> Registrasi Batch Benih
        </h2>
        <form className="space-y-4 text-sm" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Varietas Tanaman</label>
            <input type="text" placeholder="Misal: Cabai Rawit Janger" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Kuantitas Benih (Butir/Pot)</label>
            <input type="number" placeholder="1000" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500" />
          </div>
          <button className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold py-2.5 rounded-xl transition-all">
            Kunci & Daftarkan Batch
          </button>
        </form>
      </div>

      {/* Kanan: History Registrasi */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="font-bold text-base flex items-center gap-2 text-slate-300 mb-4">
          <ClipboardList className="w-5 h-5 text-purple-400" /> Riwayat Registrasi Hulu
        </h2>
        <div className="overflow-x-auto text-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-xs">
                <th className="pb-2">ID Batch</th>
                <th className="pb-2">Varietas</th>
                <th className="pb-2">Tanggal Masuk</th>
                <th className="pb-2">Kuantitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {batchHistory.map((h) => (
                <tr key={h.id} className="hover:bg-slate-800/10">
                  <td className="py-3 font-mono text-emerald-400">{h.id}</td>
                  <td className="py-3 font-medium">{h.nama}</td>
                  <td className="py-3 text-slate-400 text-xs">{h.tgl}</td>
                  <td className="py-3 font-mono text-xs">{h.jumlah}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}