'use client';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { PackagePlus } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import FeedbackModal from '@/utils/FeedbackModal';
import Pagination from '@/utils/Pagination';

type BatchRow = {
  id: string;
  variety: string;
};

type ShipmentRow = {
  receiptNumber: string;
  batchId: string;
  variety: string;
  generation: string;
  destination: string;
  packageQuantity: number;
  status: string;
  courierName: string | null;
};

type FeedbackState = {
  type: 'success' | 'error';
  title: string;
  message: string;
} | null;

export default function PengirimanPage() {
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [shipments, setShipments] = useState<ShipmentRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [shipmentBatchId, setShipmentBatchId] = useState('');
  const [destination, setDestination] = useState('');
  const [packageQuantity, setPackageQuantity] = useState('');
  const [shipmentNotes, setShipmentNotes] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadBatches = async () => {
    try {
      const response = await apiRequest<BatchRow[]>('/api/batches');
      const data = response.data || [];
      setBatches(data);
      if (data.length > 0) {
        setShipmentBatchId((current) => current || data[0].id);
      }
    } catch (err) {
      console.error('Gagal memuat batch:', err);
    }
  };

  const loadShipments = async () => {
    try {
      const response = await apiRequest<ShipmentRow[]>('/api/tracking/shipments');
      setShipments(response.data || []);
    } catch (err) {
      console.error('Gagal memuat paket pengiriman:', err);
    }
  };

  useEffect(() => {
    void loadBatches();
    void loadShipments();
  }, []);

  const totalPages = Math.ceil(shipments.length / itemsPerPage);
  const paginatedShipments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return shipments.slice(start, start + itemsPerPage);
  }, [shipments, currentPage, itemsPerPage]);

  const handleCreateShipment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!shipmentBatchId) return;

    setIsSubmitting(true);
    try {
      await apiRequest('/api/tracking/shipments', {
        method: 'POST',
        body: JSON.stringify({
          batchId: shipmentBatchId,
          destination,
          packageQuantity: Number(packageQuantity),
          notes: shipmentNotes,
        }),
      });
      setDestination('');
      setPackageQuantity('');
      setShipmentNotes('');
      setFeedback({
        type: 'success',
        title: 'Paket Berhasil Dibuat',
        message: 'Paket siap di-pickup oleh kurir dan tercatat dalam ledger pengiriman.',
      });
      await loadShipments();
    } catch (err) {
      setFeedback({
        type: 'error',
        title: 'Gagal Membuat Paket',
        message: err instanceof Error ? err.message : 'Terjadi kesalahan saat membuat paket pengiriman.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header Halaman */}
      <div className="bg-[#0D1123]/90 border border-slate-800/80 rounded-2xl p-6 justify-between shadow-lg border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">
          Pengiriman Paket Produsen
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Kelola penyerahan paket hasil budidaya ke kurir logistik
        </p>
      </div>

      {/* Form Serahkan Paket ke Kurir */}
      <div className="bg-[#0D1123]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-purple-400 shrink-0">
            <PackagePlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-base text-white leading-tight">Serahkan Paket ke Kurir</h2>
            <p className="text-xs text-slate-400 mt-1">Buat manifest paket baru untuk penjemputan armada kurir</p>
          </div>
        </div>

        <form className="space-y-4 text-xs mt-8" onSubmit={handleCreateShipment}>
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <div className="xl:col-span-3">
              <label className="block text-[11px] font-medium tracking-wider text-slate-400 uppercase mb-1.5">
                BATCH SIAP KIRIM
              </label>
              <select
                value={shipmentBatchId}
                onChange={(event) => setShipmentBatchId(event.target.value)}
                className="w-full bg-[#05070e] text-sm border border-slate-800/90 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-purple-500/60"
                required
              >
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.id} - {batch.variety}
                  </option>
                ))}
              </select>
            </div>

            <div className="xl:col-span-2">
              <label className="block text-[11px] font-medium tracking-wider text-slate-400 uppercase mb-1.5">
                JUMLAH BIBIT
              </label>
              <input
                value={packageQuantity}
                onChange={(event) => setPackageQuantity(event.target.value)}
                type="number"
                min={1}
                placeholder="250"
                className="w-full bg-[#05070e] text-sm border border-slate-800/90 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-purple-500/60"
                required
              />
            </div>

            <div className="xl:col-span-7">
              <label className="block text-[11px] font-medium tracking-wider text-slate-400 uppercase mb-1.5">
                TUJUAN PENGIRIMAN
              </label>
              <input
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                placeholder="Alamat penerima / hub distribusi"
                className="w-full bg-[#05070e] text-sm border border-slate-800/90 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-purple-500/60"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium tracking-wider text-slate-400 uppercase mb-1.5">
              CATATAN HANDLING
            </label>
            <textarea
              value={shipmentNotes}
              onChange={(event) => setShipmentNotes(event.target.value)}
              placeholder="Catatan handling untuk kurir"
              rows={3}
              className="w-full bg-[#05070e] text-sm border border-slate-800/90 rounded-xl p-3.5 text-slate-200 focus:outline-none focus:border-purple-500/60 resize-none placeholder:text-slate-600"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !shipmentBatchId}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 font-medium py-3 rounded-xl transition-all text-slate-100 text-sm shadow-lg shadow-purple-600/10 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Memproses Paket...' : 'Buat Paket Siap Pickup'}
          </button>
        </form>
      </div>

      {/* Tabel Paket dari Produsen ke Kurir */}
      <div className="bg-[#0D1123]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-purple-400 shrink-0">
            <PackagePlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-base text-white leading-tight">Paket dari Produsen ke Kurir</h2>
            <p className="text-xs text-slate-400 mt-0.5">Daftar resi pengiriman aktif dan riwayat status pickup</p>
          </div>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 text-[11px] font-medium uppercase tracking-wider">
                <th className="py-3 px-3">RESI</th>
                <th className="py-3 px-3">BATCH</th>
                <th className="py-3 px-3">TUJUAN</th>
                <th className="py-3 px-3">JUMLAH</th>
                <th className="py-3 px-3">KURIR</th>
                <th className="py-3 px-3 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {shipments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                    Belum ada data pengiriman paket.
                  </td>
                </tr>
              ) : (
                paginatedShipments.map((shipment) => (
                  <tr key={shipment.receiptNumber} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-4 px-3 font-mono text-purple-300 font-semibold">{shipment.receiptNumber}</td>
                    <td className="py-4 px-3">
                      {shipment.batchId} - {shipment.variety}
                    </td>
                    <td className="py-4 px-3 text-slate-400">{shipment.destination}</td>
                    <td className="py-4 px-3 font-mono">{shipment.packageQuantity.toLocaleString('id-ID')}</td>
                    <td className="py-4 px-3 text-slate-400">{shipment.courierName || 'Belum diterima'}</td>
                    <td className="py-4 px-3 text-right">
                      <span className="inline-flex items-center rounded-md border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-[10px] font-bold text-purple-300 uppercase">
                        {shipment.status.replaceAll('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={shipments.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          itemLabel="paket"
        />
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
