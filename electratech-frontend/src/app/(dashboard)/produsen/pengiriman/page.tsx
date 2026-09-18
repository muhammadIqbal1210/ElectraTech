'use client';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  PackagePlus,
  QrCode,
  Truck,
  PackageCheck,
  Clock,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import FeedbackModal from '@/utils/FeedbackModal';
import Pagination from '@/utils/Pagination';
import type { ShipmentModalData } from '@/components/ShipmentQrModal';

// Lazy load modal QR Code agar halaman pengiriman tetap ringan saat pertama kali di-load
const ShipmentQrModal = dynamic(() => import('@/components/ShipmentQrModal'), {
  ssr: false,
});

type BatchRow = {
  id: string;
  variety: string;
  phase?: string;
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
  createdAt?: string;
  blockchainTxHash?: string | null;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [shipmentBatchId, setShipmentBatchId] = useState('');
  const [destination, setDestination] = useState('');
  const [packageQuantity, setPackageQuantity] = useState('');
  const [shipmentNotes, setShipmentNotes] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State untuk QR Modal
  const [selectedQrShipment, setSelectedQrShipment] = useState<ShipmentModalData | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

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

  // Metrik ringkasan pengiriman
  const metrics = useMemo(() => {
    const totalPackages = shipments.length;
    const totalSeedsShipped = shipments.reduce((acc, s) => acc + (Number(s.packageQuantity) || 0), 0);
    const readyPickup = shipments.filter(
      (s) => s.status === 'READY_FOR_PICKUP' || !s.courierName
    ).length;
    const inTransit = shipments.filter(
      (s) => s.status === 'ACCEPTED_BY_COURIER' || s.status === 'IN_TRANSIT'
    ).length;
    const delivered = shipments.filter((s) => s.status === 'DELIVERED').length;

    return { totalPackages, totalSeedsShipped, readyPickup, inTransit, delivered };
  }, [shipments]);

  // Filter & Search
  const filteredShipments = useMemo(() => {
    return shipments.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.receiptNumber.toLowerCase().includes(q) ||
        s.batchId.toLowerCase().includes(q) ||
        (s.variety && s.variety.toLowerCase().includes(q)) ||
        (s.destination && s.destination.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'READY') return s.status === 'READY_FOR_PICKUP';
      if (statusFilter === 'TRANSIT') return s.status === 'ACCEPTED_BY_COURIER' || s.status === 'IN_TRANSIT';
      if (statusFilter === 'DELIVERED') return s.status === 'DELIVERED';

      return true;
    });
  }, [shipments, searchQuery, statusFilter]);

  // Reset pagination saat search/filter ganti
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredShipments.length / itemsPerPage);
  const paginatedShipments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredShipments.slice(start, start + itemsPerPage);
  }, [filteredShipments, currentPage, itemsPerPage]);

  const handleOpenQr = (shipment: ShipmentRow) => {
    setSelectedQrShipment({
      receiptNumber: shipment.receiptNumber,
      batchId: shipment.batchId,
      variety: shipment.variety,
      generation: shipment.generation,
      destination: shipment.destination,
      packageQuantity: shipment.packageQuantity,
      status: shipment.status,
      courierName: shipment.courierName,
      createdAt: shipment.createdAt,
      blockchainTxHash: shipment.blockchainTxHash,
    });
    setIsQrModalOpen(true);
  };

  const handleCreateShipment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!shipmentBatchId) return;

    setIsSubmitting(true);
    try {
      const response = await apiRequest<{
        receipt_number: string;
        batch_id: number | string;
        destination: string;
        package_quantity: number;
        status: string;
        created_at: string;
      }>('/api/tracking/shipments', {
        method: 'POST',
        body: JSON.stringify({
          batchId: shipmentBatchId,
          destination,
          packageQuantity: Number(packageQuantity),
          notes: shipmentNotes,
        }),
      });

      const matchedBatch = batches.find((b) => b.id === shipmentBatchId);
      const newReceiptNumber = response.data?.receipt_number;

      // Reset form
      setDestination('');
      setPackageQuantity('');
      setShipmentNotes('');

      // Refresh data pengiriman
      await loadShipments();

      // Langsung buka QR Modal untuk paket yang baru saja dibuat
      const createdData = response.data;
      if (createdData?.receipt_number) {
        setSelectedQrShipment({
          receiptNumber: createdData.receipt_number,
          batchId: shipmentBatchId,
          variety: matchedBatch?.variety,
          destination: createdData.destination,
          packageQuantity: createdData.package_quantity,
          status: createdData.status || 'READY_FOR_PICKUP',
          createdAt: createdData.created_at || new Date().toISOString(),
        });
        setIsQrModalOpen(true);
      } else {
        setFeedback({
          type: 'success',
          title: 'Paket Berhasil Dibuat',
          message: 'Paket siap di-pickup oleh kurir dan tercatat dalam ledger pengiriman.',
        });
      }
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
      {/* 1. Header Halaman */}
      <div className="bg-[#0D1123]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">
            Pengiriman Paket Produsen
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manifest penyerahan bibit ke armada kurir dan penempelan QR resi fisik.
          </p>
        </div>
      </div>

      {/* 2. Kartu Metrik Ringkasan Pengiriman */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Paket */}
        <div className="bg-[#0D1123]/90 border border-slate-800/80 rounded-2xl p-6 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">TOTAL MANIFEST PAKET</p>
            <p className="text-2xl font-bold text-white mt-0.5">{metrics.totalPackages}</p>
            <p className="text-xs text-slate-400 mt-1">Paket Pengiriman Terdaftar</p>
          </div>
          <div className="w-11 h-11 rounded-full bg-[#151B33] border border-slate-800 flex items-center justify-center text-purple-400 shrink-0">
            <PackagePlus className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Jumlah Bibit Dikirim */}
        <div className="bg-[#0D1123]/90 border border-slate-800/80 rounded-2xl p-6 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">TOTAL BIBIT TERKIRIM</p>
            <p className="text-2xl font-bold text-white mt-0.5">{metrics.totalSeedsShipped.toLocaleString('id-ID')}</p>
            <p className="text-xs text-slate-400 mt-1">Bibit dalam Sirkulasi Logistik</p>
          </div>
          <div className="w-11 h-11 rounded-full bg-[#151B33] border border-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Menunggu Penjemputan */}
        <div className="bg-[#0D1123]/90 border border-slate-800/80 rounded-2xl p-6 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">SIAP PICKUP / TRANSIT</p>
            <p className="text-2xl font-bold text-white mt-0.5">
              <span className="text-amber-400">{metrics.readyPickup}</span>
              <span className="text-sm font-normal text-slate-500 mx-2">/</span>
              <span className="text-indigo-400">{metrics.inTransit}</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">Menunggu Kurir / Dalam Perjalanan</p>
          </div>
          <div className="w-11 h-11 rounded-full bg-[#151B33] border border-slate-800 flex items-center justify-center text-amber-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Form Serahkan Paket ke Kurir */}
      <div className="bg-[#0D1123]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-purple-400 shrink-0">
            <PackagePlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-base text-white leading-tight">Serahkan Paket ke Kurir</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Buat manifest paket baru. Setelah dibuat, QR Code resi akan langsung muncul otomatis untuk dicetak.
            </p>
          </div>
        </div>

        <form className="space-y-4 text-xs mt-6" onSubmit={handleCreateShipment}>
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
                placeholder="Alamat penerima / hub distribusi / agen"
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
              placeholder="Instruksi penanganan khusus untuk kurir (suhu, kelembaban, penumpukan)"
              rows={3}
              className="w-full bg-[#05070e] text-sm border border-slate-800/90 rounded-xl p-3.5 text-slate-200 focus:outline-none focus:border-purple-500/60 resize-none placeholder:text-slate-600"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !shipmentBatchId}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 font-medium py-3 rounded-xl transition-all text-slate-100 text-sm shadow-lg shadow-purple-600/10 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              'Memproses Manifest Paket...'
            ) : (
              <>
                <PackagePlus className="w-4 h-4" />
                Buat Paket Siap Pickup & Tampilkan QR
              </>
            )}
          </button>
        </form>
      </div>

      {/* 4. Tabel Riwayat Paket & Aksi Lihat QR */}
      <div className="bg-[#0D1123]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <h2 className="font-semibold text-base text-white leading-tight">Paket dari Produsen ke Kurir</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Daftar resi pengiriman aktif. Klik ikon QR pada kolom aksi untuk melihat atau mencetak ulang QR.
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari resi, batch, tujuan..."
                className="w-full bg-[#05070e] text-xs border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-purple-500/60"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-[#05070e] border border-slate-800 rounded-xl p-1 w-full sm:w-auto">
              {[
                { label: 'Semua', value: 'ALL' },
                { label: 'Pickup', value: 'READY' },
                { label: 'Transit', value: 'TRANSIT' },
                { label: 'Selesai', value: 'DELIVERED' },
              ].map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setStatusFilter(filter.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    statusFilter === filter.value
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
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
                <th className="py-3 px-3 text-center">STATUS</th>
                <th className="py-3 px-3 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredShipments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                    Belum ada data pengiriman paket.
                  </td>
                </tr>
              ) : (
                paginatedShipments.map((shipment) => (
                  <tr key={shipment.receiptNumber} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-4 px-3 font-mono text-purple-300 font-semibold">
                      {shipment.receiptNumber}
                    </td>
                    <td className="py-4 px-3">
                      <span className="font-mono text-slate-200">{shipment.batchId}</span>
                      {shipment.variety && (
                        <p className="text-[11px] text-slate-400 mt-0.5">{shipment.variety}</p>
                      )}
                    </td>
                    <td className="py-4 px-3 text-slate-400 max-w-xs truncate" title={shipment.destination}>
                      {shipment.destination}
                    </td>
                    <td className="py-4 px-3 font-mono">
                      {shipment.packageQuantity.toLocaleString('id-ID')} bibit
                    </td>
                    <td className="py-4 px-3 text-slate-400">
                      {shipment.courierName ? (
                        <span className="text-slate-200">{shipment.courierName}</span>
                      ) : (
                        <span className="italic text-slate-500">Belum diterima</span>
                      )}
                    </td>
                    <td className="py-4 px-3 text-center">
                      <span
                        className={`inline-flex items-center rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase ${
                          shipment.status === 'DELIVERED'
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                            : shipment.status === 'IN_TRANSIT' || shipment.status === 'ACCEPTED_BY_COURIER'
                            ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400'
                            : 'border-purple-500/30 bg-purple-500/10 text-purple-300'
                        }`}
                      >
                        {shipment.status.replaceAll('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenQr(shipment)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 hover:text-white transition font-medium text-xs shadow-sm"
                        title="Lihat QR Code Resi"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Lihat QR</span>
                      </button>
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
          totalItems={filteredShipments.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          itemLabel="paket"
        />
      </div>

      {/* Modal QR Code Resi Pengiriman (Lazy Loaded) */}
      <ShipmentQrModal
        open={isQrModalOpen}
        shipment={selectedQrShipment}
        onClose={() => {
          setIsQrModalOpen(false);
          setSelectedQrShipment(null);
        }}
      />

      {/* Feedback Modal untuk error atau pesan umum */}
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

