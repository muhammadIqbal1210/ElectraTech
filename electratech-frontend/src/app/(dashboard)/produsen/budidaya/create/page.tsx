'use client';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { BookOpen, History, Check } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import FeedbackModal from '@/utils/FeedbackModal';
import Pagination from '@/utils/Pagination';

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

type FeedbackState = {
  type: 'success' | 'error';
  title: string;
  message: string;
} | null;

export default function BudidayaPage() {
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [toPhase, setToPhase] = useState('PENYEMAIAN');
  const [notes, setNotes] = useState('');
  const [logs, setLogs] = useState<BatchLog[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadBatches = async () => {
    try {
      const response = await apiRequest<BatchRow[]>('/api/batches');
      const data = response.data || [];
      setBatches(data);
      if (data.length > 0) {
        setSelectedBatch((current) => current || data[0].id);
      }
    } catch (err) {
      console.error('Error loading batches:', err);
    }
  };

  const loadLogs = async (batchId: string) => {
    if (!batchId) return;
    try {
      const response = await apiRequest<BatchLog[]>(`/api/batches/${batchId}/logs`);
      setLogs(response.data || []);
    } catch (err) {
      console.error('Error loading batch logs:', err);
    }
  };

  useEffect(() => {
    void loadBatches();
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      setCurrentPage(1);
      void loadLogs(selectedBatch);
    }
  }, [selectedBatch]);

  const totalPages = Math.ceil(logs.length / itemsPerPage);
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return logs.slice(start, start + itemsPerPage);
  }, [logs, currentPage, itemsPerPage]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedBatch) return;

    setIsSubmitting(true);
    try {
      await apiRequest<BatchLog>(`/api/batches/${selectedBatch}/logs`, {
        method: 'POST',
        body: JSON.stringify({ toPhase, notes }),
      });
      setNotes('');
      setFeedback({
        type: 'success',
        title: 'Fase Hidup Berhasil Diperbarui',
        message: 'Perubahan fase hidup telah berhasil dicatat ke ledger.',
      });
      await Promise.all([loadBatches(), loadLogs(selectedBatch)]);
    } catch (err) {
      setFeedback({
        type: 'error',
        title: 'Gagal Memperbarui Fase',
        message: err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan fase baru.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPhaseLabel = (phase: string | null) => {
    if (!phase) return '-';
    const p = phase.toUpperCase();
    if (p.includes('SEMAI')) return 'PENYEMAIAN';
    if (p.includes('VEGETA')) return 'VEGETATIF';
    if (p.includes('GENERA')) return 'GENERATIF';
    if (p.includes('DISTRIBUSI') || p.includes('PANEN')) return 'SIAP DISTRIBUSI';
    return p;
  };

  const getPhaseBadgeStyle = (phase: string | null) => {
    if (!phase) return 'bg-slate-800 text-slate-400 border-slate-700';
    const p = phase.toUpperCase();
    if (p.includes('SEMAI')) return 'bg-cyan-950/60 text-cyan-400 border-cyan-800/60';
    if (p.includes('VEGETA')) return 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60';
    if (p.includes('GENERA')) return 'bg-amber-950/60 text-amber-400 border-amber-800/60';
    return 'bg-indigo-950/60 text-indigo-400 border-indigo-800/60';
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header Halaman */}
      <div className="bg-[#0D1123]/90 border border-slate-800/80 rounded-2xl p-6 shadow-lg">
        <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">
          Manajemen Budidaya
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Update setiap fase hidup tanaman anda
        </p>
      </div>

      {/* Card Form Update Fase Hidup */}
      <div className="bg-[#0D1123]/90 border border-slate-800/80 rounded-2xl p-6 justify-between shadow-lg border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        <div className="flex items-start gap-3 mb-6">
          <div>
            <h2 className="font-semibold text-lg text-white leading-tight">Update Fase Hidup</h2>
            <p className="text-sm text-slate-400 mt-1">Perbarui tahapan pertumbuhan bibit di ledger</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          <div>
            <label className="block text-[11px] font-medium tracking-wider text-slate-400 uppercase mb-2">
              PILIH ID BATCH
            </label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full bg-[#05070e] border border-slate-800/90 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-emerald-500/60 transition"
            >
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.id} ({batch.variety})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium tracking-wider text-slate-400 uppercase mb-2">
              FASE HIDUP BARU
            </label>
            <select
              value={toPhase}
              onChange={(e) => setToPhase(e.target.value)}
              className="w-full bg-[#05070e] border border-slate-800/90 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-emerald-500/60 transition"
            >
              <option value="PENYEMAIAN">Fase Penyemaian (Seedling)</option>
              <option value="VEGETATIF">Fase Vegetatif</option>
              <option value="GENERATIF">Fase Generatif</option>
              <option value="SIAP_DISTRIBUSI">Fase Siap Kemas & Distribusi</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium tracking-wider text-slate-400 uppercase mb-2">
              CATATAN KONDISI
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Tunas sehat, nutrisi cukup, atau catatan inspeksi..."
              className="w-full bg-[#05070e] border border-slate-800/90 rounded-xl p-4 text-slate-200 text-sm focus:outline-none focus:border-emerald-500/60 transition resize-none placeholder:text-slate-600"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !selectedBatch}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs cursor-pointer disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            {isSubmitting ? 'Menyimpan Perubahan...' : 'Simpan Perubahan Fase'}
          </button>
        </form>
      </div>

      {/* Card Table Rekam Jejak Siklus Hidup Bibit */}
      <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="font-semibold text-base text-white leading-tight">Rekam Jejak Siklus Hidup Bibit</h2>
              <p className="text-xs text-slate-400 mt-1">Riwayat audit mutasi fase tanaman berkala</p>
            </div>
          </div>
          <span className="text-[11px] font-medium text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
            Total: {logs.length} Catatan
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-500 text-[10px] uppercase tracking-wider">
                <th className="py-3 px-3">ID BATCH</th>
                <th className="py-3 px-3">FASE ASAL</th>
                <th className="py-3 px-3">FASE BARU</th>
                <th className="py-3 px-3">CATATAN</th>
                <th className="py-3 px-3 text-right">TANGGAL MUTASI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-sans">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                    Belum ada riwayat mutasi fase untuk batch ini.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  const dateObj = new Date(log.created_at);
                  const dateStr = isNaN(dateObj.getTime())
                    ? '-'
                    : `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;

                  return (
                    <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-4 px-3 font-semibold text-slate-400 flex items-center gap-2">
                        {log.batch_id}
                      </td>
                      <td className="py-4 px-3">
                        <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase ${getPhaseBadgeStyle(log.from_phase)}`}>
                          {formatPhaseLabel(log.from_phase)}
                        </span>
                      </td>
                      <td className="py-4 px-3">
                        <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase ${getPhaseBadgeStyle(log.to_phase)}`}>
                          {formatPhaseLabel(log.to_phase)}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-slate-300 max-w-xs truncate">
                        {log.notes || '-'}
                      </td>
                      <td className="py-4 px-3 text-right text-slate-400 font-mono text-[11px]">
                        {dateStr}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={logs.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          itemLabel="catatan"
        />

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
          <div className="flex items-center gap-2 italic">
            <span>* Setiap entri ditandatangani secara kriptografis melalui ledger blockchain</span>
          </div>
        </div>
      </div>

      <FeedbackModal
        open={feedback !== null}
        type={feedback?.type || 'success'}
        title={feedback?.title || ''}
        message={feedback?.message || ''}
        onClose={() => setFeedback(null)}
      />
    </div>
  );
}
