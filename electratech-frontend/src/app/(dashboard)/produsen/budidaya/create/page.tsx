'use client';
import { Sprout, Route } from 'lucide-react';

export default function BudidayaPage() {
  const budidayaHistory = [
    { id: 'BATCH-B092', asal: 'Penyemaian', menjadi: 'Vegetatif Awal', tgl: '2026-05-25', note: 'Tunas daun kedua tumbuh sehat.' },
    { id: 'BATCH-B080', asal: 'Vegetatif Akhir', menjadi: 'Siap Distribusi', tgl: '2026-05-20', note: 'Lolos uji karantina sirkuit SmartLink.' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Form Log Perubahan Fase */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-base flex items-center gap-2 text-emerald-400">
          <Sprout className="w-5 h-5" /> Update Fase Hidup
        </h2>
        <form className="space-y-4 text-sm" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Pilih ID Batch</label>
            <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 focus:outline-none">
              <option>BATCH-B092 (Cabai Rawit)</option>
              <option>BATCH-B095 (Tomat Hibrida)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Fase Hidup Baru</label>
            <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 focus:outline-none">
              <option>Fase Penyemaian (Seedling)</option>
              <option>Fase Vegetatif (Pertumbuhan Daun/Batang)</option>
              <option>Fase Siap Kemas & Distribusi</option>
            </select>
          </div>
          <button className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold py-2.5 rounded-xl transition-all">
            Simpan Perubahan Fase
          </button>
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
              {budidayaHistory.map((b, i) => (
                <tr key={i} className="hover:bg-slate-800/10">
                  <td className="py-3 font-mono text-emerald-400">{b.id}</td>
                  <td className="py-3 text-slate-400">{b.asal}</td>
                  <td className="py-3 font-semibold text-emerald-400">{b.menjadi}</td>
                  <td className="py-3 text-xs text-slate-500 font-mono">{b.tgl}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}