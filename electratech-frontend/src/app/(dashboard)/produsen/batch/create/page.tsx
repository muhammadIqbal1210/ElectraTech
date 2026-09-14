'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FolderPlus,
  Layers,
  Sprout,
  RefreshCw,
  Search,
  Eye,
  QrCode,
  MoreVertical,
  X,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import FeedbackModal from '@/utils/FeedbackModal';
import Pagination from '@/utils/Pagination';

type BatchRow = {
  id: string;
  variety: string;
  generation: string;
  quantity: number;
  phase: string;
  health_status: string;
  producer_name?: string;
  seeded_at: string;
  created_at: string;
};

type FeedbackState = {
  type: 'success' | 'error';
  title: string;
  message: string;
} | null;

export default function PendaftaranBatchPage() {
  const [batchHistory, setBatchHistory] = useState<BatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [variety, setVariety] = useState('');
  const [generation, setGeneration] = useState('F1');
  const [quantity, setQuantity] = useState('');
  const [seededAt, setSeededAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLockRef = useRef(false);

  const loadBatches = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiRequest<BatchRow[]>('/api/batches');
      setBatchHistory(response.data || []);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal memuat data batch.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadBatches);
  }, [loadBatches]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submitLockRef.current) return;

    submitLockRef.current = true;
    setIsSubmitting(true);
    setMessage('');
    setFeedback(null);
    setMessage('Sedang menyimpan ke database, lalu mencatat ke blockchain...');

    try {
      await apiRequest<BatchRow>('/api/batches', {
        method: 'POST',
        body: JSON.stringify({
          variety,
          generation,
          quantity: Number(quantity),
          seededAt: seededAt || null,
        }),
      });
      setVariety('');
      setGeneration('F1');
      setQuantity('');
      setSeededAt('');
      setMessage('');
      setFeedback({
        type: 'success',
        title: 'Pendaftaran batch berhasil',
        message: 'Batch berhasil disimpan ke database dan dicatat ke ledger blockchain.',
      });
      setIsModalOpen(false);
      await loadBatches();
    } catch (err) {
      setMessage('');
      setFeedback({
        type: 'error',
        title: 'Pendaftaran batch gagal',
        message: err instanceof Error ? err.message : 'Gagal mendaftarkan batch.',
      });
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  // Metrik akumulasi dinamis dari DB
  const totalAccumulatedBatches = batchHistory.length;
  const totalSeeds = useMemo(() => {
    return batchHistory.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  }, [batchHistory]);

  const latestUpdateDate = useMemo(() => {
    if (batchHistory.length === 0) return 'Belum ada data';
    const latest = batchHistory[0];
    const dateObj = new Date(latest.created_at || latest.seeded_at);
    return isNaN(dateObj.getTime())
      ? 'Belum ada data'
      : dateObj.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }) +
          ' ' +
          dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }, [batchHistory]);

  // Hitung jumlah per fase untuk tab filter
  const phaseCounts = useMemo(() => {
    const counts = {
      ALL: batchHistory.length,
      SEMAIAN: 0,
      VEGETATIF: 0,
      SIAP_DISTRIBUSI: 0,
      GAGAL: 0,
    };

    batchHistory.forEach((b) => {
      const p = (b.phase || '').toUpperCase();
      if (p.includes('SEMAI') || p.includes('SEEDLING')) counts.SEMAIAN++;
      else if (p.includes('VEGETA')) counts.VEGETATIF++;
      else if (p.includes('DISTRIBUSI') || p.includes('PANEN') || p.includes('HARVEST')) counts.SIAP_DISTRIBUSI++;
      else if (p.includes('GAGAL') || p.includes('AFKIR') || p.includes('RUSAK')) counts.GAGAL++;
    });

    return counts;
  }, [batchHistory]);

  // Filter list berdasarkan tab & search query
  const filteredBatches = useMemo(() => {
    return batchHistory.filter((b) => {
      // Search Filter
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        b.id.toLowerCase().includes(q) ||
        b.variety.toLowerCase().includes(q) ||
        (b.generation && b.generation.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // Tab Filter
      if (selectedPhaseFilter === 'ALL') return true;
      const p = (b.phase || '').toUpperCase();
      if (selectedPhaseFilter === 'SEMAIAN') return p.includes('SEMAI') || p.includes('SEEDLING');
      if (selectedPhaseFilter === 'VEGETATIF') return p.includes('VEGETA');
      if (selectedPhaseFilter === 'SIAP_DISTRIBUSI') return p.includes('DISTRIBUSI') || p.includes('PANEN') || p.includes('HARVEST');
      if (selectedPhaseFilter === 'GAGAL') return p.includes('GAGAL') || p.includes('AFKIR') || p.includes('RUSAK');

      return true;
    });
  }, [batchHistory, searchQuery, selectedPhaseFilter]);

  // Reset pagination saat filter/search berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedPhaseFilter]);

  const totalPages = Math.ceil(filteredBatches.length / itemsPerPage);
  const paginatedBatches = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBatches.slice(start, start + itemsPerPage);
  }, [filteredBatches, currentPage, itemsPerPage]);

  const getPhaseBadge = (phase: string) => {
    const p = (phase || '').toUpperCase();
    if (p.includes('SEMAI') || p.includes('SEEDLING')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Semaian
        </span>
      );
    }
    if (p.includes('VEGETA')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-indigo-400 uppercase">
          Vegetatif
        </span>
      );
    }
    if (p.includes('DISTRIBUSI') || p.includes('PANEN') || p.includes('HARVEST')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-indigo-400 uppercase">
          Siap Distribusi
        </span>
      );
    }
    if (p.includes('GAGAL') || p.includes('AFKIR') || p.includes('RUSAK')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          Gagal / Afkir
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-emerald-400">
        {phase || 'Semaian'}
      </span>
    );
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* 1. HEADER TITLE & ACTION BUTTON */}
      <div className="bg-[#0D1123]/90 border border-slate-800/80 rounded-2xl p-6 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">
            Pendaftaran Batch Benih
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Inisiasi siklus budidaya batch tanaman.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-200 font-medium px-5 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-xs shrink-0"
        >
          <FolderPlus className="w-4 h-4" />Registrasi Batch Baru
        </button>
      </div>

      {/* STATUS PROSES */}
      {isSubmitting && message && (
        <div
          className="flex items-center gap-3 rounded-2xl border border-emerald-800/60 bg-emerald-950/40 p-4 text-xs font-medium text-emerald-300 transition-all"
        >
          <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-400" />
          <span>{message}</span>
        </div>
      )}

      {/* 2. METRICS OVERVIEW CARDS (3 COLUMNS GRID) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Akumulasi Batch */}
        <div className="bg-[#0D1123]/90 border border-slate-800/80 rounded-2xl p-6 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase">TOTAL AKUMULASI BATCH</p>
            <p className="text-2xl font-bold text-white mt-0.5">{totalAccumulatedBatches}</p>
            <p className="text-xs text-slate-400 mt-1">Batch</p>
          </div>
          <div className="w-11 h-11 rounded-full bg-[#151B33] border border-slate-800 flex items-center justify-center text-slate-300 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Jumlah Bibit */}
        <div className="bg-[#0D1123]/90 border border-slate-800/80 rounded-2xl p-6 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">JUMLAH BIBIT</p>
            <p className="text-2xl font-bold text-white mt-1">{totalSeeds.toLocaleString('id-ID')}</p>
            <p className="text-xs text-slate-400 mt-1">Bibit Terdaftar</p>
          </div>
          <div className="w-11 h-11 rounded-full bg-[#151B33] border border-slate-800 flex items-center justify-center text-slate-300 shrink-0">
            <Sprout className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Update Terakhir */}
        <div className="bg-[#0D1123]/90 border border-slate-800/80 rounded-2xl p-6 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">UPDATE TERAKHIR</p>
            <p className="text-sm text-white mt-1">{latestUpdateDate}</p>
            <p className="text-xs text-slate-400 mt-1">Sinkronisasi history batch</p>
          </div>
          <div className="w-11 h-11 rounded-full bg-[#151B33] border border-slate-800 flex items-center justify-center text-slate-300 shrink-0">
            <RefreshCw className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. TABLE SECTION (RIWAYAT LENGKAP BATCH & AUDIT LOG) */}
      <div className="bg-[#0D1123]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
        {/* Header & Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Riwayat Lengkap Batch & Audit Log</h2>
            <p className="text-xs text-slate-400 mt-0.5">Arsip terpusat data germinasi bibit dan verifikasi hash ledger terdistribusi.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari ID Batch, varietas, atau nomor..."
                className="w-full bg-[#070913] border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
            <select className="w-full sm:w-auto bg-[#070913] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 focus:outline-none cursor-pointer">
              <option value="newest">Terbaru (Registrasi)</option>
              <option value="oldest">Terlama</option>
            </select>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800/80 pb-3">
          <button
            type="button"
            onClick={() => setSelectedPhaseFilter('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              selectedPhaseFilter === 'ALL'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            Semua ({phaseCounts.ALL})
          </button>
          <button
            type="button"
            onClick={() => setSelectedPhaseFilter('SEMAIAN')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              selectedPhaseFilter === 'SEMAIAN'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            Semaian ({phaseCounts.SEMAIAN})
          </button>
          <button
            type="button"
            onClick={() => setSelectedPhaseFilter('VEGETATIF')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              selectedPhaseFilter === 'VEGETATIF'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            Vegetatif ({phaseCounts.VEGETATIF})
          </button>
          <button
            type="button"
            onClick={() => setSelectedPhaseFilter('SIAP_DISTRIBUSI')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              selectedPhaseFilter === 'SIAP_DISTRIBUSI'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            Siap Distribusi ({phaseCounts.SIAP_DISTRIBUSI})
          </button>
          <button
            type="button"
            onClick={() => setSelectedPhaseFilter('GAGAL')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              selectedPhaseFilter === 'GAGAL'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            Gagal / Afkir ({phaseCounts.GAGAL})
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="py-3 px-3">ID BATCH</th>
                <th className="py-3 px-3">VARIETAS & GENERASI</th>
                <th className="py-3 px-3">JUMLAH BIBIT</th>
                <th className="py-3 px-3">TGL REGISTRASI</th>
                <th className="py-3 px-3">STATUS FASE</th>
                <th className="py-3 px-3 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">Memuat riwayat batch...</td>
                </tr>
              ) : filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Tidak ada batch tanaman yang ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedBatches.map((batch) => {
                  const regDate = new Date(batch.seeded_at || batch.created_at);
                  const dateFormatted = isNaN(regDate.getTime())
                    ? '-'
                    : regDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

                  return (
                    <tr key={batch.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-4 px-3 font-semibold text-white flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                          <Sprout className="w-3.5 h-3.5" />
                        </div>
                        {batch.id}
                      </td>
                      <td className="py-4 px-3">
                        <p className="font-semibold text-slate-100">{batch.variety}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Generasi {batch.generation || 'F1'} • Lot Horti-01
                        </p>
                      </td>
                      <td className="py-4 px-3 font-semibold text-slate-200">
                        {Number(batch.quantity).toLocaleString('id-ID')} pcs
                      </td>
                      <td className="py-4 px-3 text-slate-400">{dateFormatted}</td>
                      <td className="py-4 px-3">{getPhaseBadge(batch.phase)}</td>
                      <td className="py-4 px-3 text-right">
                        <div className="flex items-center justify-end gap-2 text-slate-400">
                          <button
                            type="button"
                            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition"
                            title="Lihat Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition"
                            title="QR Code"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition"
                            title="Opsi Lanjutan"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredBatches.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          itemLabel="batch"
        />
      </div>

      {/* MODAL REGISTRASI BATCH BARU */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0D1123] border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-6 p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-base text-white">Registrasi Batch Benih Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => !isSubmitting && setIsModalOpen(false)}
                disabled={isSubmitting}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Tutup form registrasi"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Varietas Tanaman *</label>
                <input
                  type="text"
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                  placeholder="Misal: Tomat Cherry TCRR / Cabai Rawit CRP"
                  className="w-full bg-[#070913] border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Generasi Benih *</label>
                  <input
                    type="text"
                    value={generation}
                    onChange={(e) => setGeneration(e.target.value)}
                    placeholder="Misal: F1, F2, G1"
                    className="w-full bg-[#070913] border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Kuantitas Bibit (pcs) *</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="1000"
                    min={1}
                    className="w-full bg-[#070913] border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Tanggal Penyemaian</label>
                <input
                  type="date"
                  value={seededAt}
                  onChange={(e) => setSeededAt(e.target.value)}
                  className="w-full bg-[#070913] border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => !isSubmitting && setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 font-semibold hover:text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold transition disabled:cursor-not-allowed disabled:bg-emerald-800 disabled:text-emerald-200 disabled:shadow-none"
                >
                  {isSubmitting ? 'Sedang menyimpan...' : 'Kunci & Daftarkan Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
