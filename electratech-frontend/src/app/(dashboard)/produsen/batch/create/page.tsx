'use client';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { FolderPlus, ClipboardList, PackagePlus } from 'lucide-react';
import { apiRequest } from '@/lib/api';

type BatchRow = {
  id: string;
  variety: string;
  generation: string;
  quantity: number;
  seeded_at: string;
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

export default function PendaftaranBatchPage() {
  const [batchHistory, setBatchHistory] = useState<BatchRow[]>([]);
  const [shipments, setShipments] = useState<ShipmentRow[]>([]);
  const [variety, setVariety] = useState('');
  const [generation, setGeneration] = useState('G1');
  const [quantity, setQuantity] = useState('');
  const [shipmentBatchId, setShipmentBatchId] = useState('');
  const [destination, setDestination] = useState('');
  const [packageQuantity, setPackageQuantity] = useState('');
  const [shipmentNotes, setShipmentNotes] = useState('');
  const [message, setMessage] = useState('');

  const loadBatches = useCallback(async () => {
    try {
      const response = await apiRequest<BatchRow[]>('/api/batches');
      const data = response.data || [];
      setBatchHistory(data);
      setShipmentBatchId((current) => current || data[0]?.id || '');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal memuat batch.');
    }
  }, []);

  const loadShipments = useCallback(async () => {
    try {
      const response = await apiRequest<ShipmentRow[]>('/api/tracking/shipments');
      setShipments(response.data || []);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal memuat paket pengiriman.');
    }
  }, []);

  useEffect(() => {
    void Promise.resolve()
      .then(loadBatches)
      .then(loadShipments);
  }, [loadBatches, loadShipments]);

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

  const handleCreateShipment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');

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
      setMessage('Paket berhasil dibuat dan siap diterima kurir.');
      await loadShipments();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal membuat paket pengiriman.');
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

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-base flex items-center gap-2 text-purple-400">
          <PackagePlus className="w-5 h-5" /> Serahkan Paket ke Kurir
        </h2>
        <form className="space-y-4 text-sm" onSubmit={handleCreateShipment}>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Batch Siap Kirim</label>
            <select value={shipmentBatchId} onChange={(event) => setShipmentBatchId(event.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-purple-500" required>
              {batchHistory.map((batch) => (
                <option key={batch.id} value={batch.id}>{batch.id} - {batch.variety} ({batch.generation})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Jumlah Bibit Dalam Paket</label>
            <input value={packageQuantity} onChange={(event) => setPackageQuantity(event.target.value)} type="number" min={1} placeholder="250" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-purple-500" required />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Tujuan Pengiriman</label>
            <input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Alamat penerima / hub distribusi" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-purple-500" required />
          </div>
          <textarea value={shipmentNotes} onChange={(event) => setShipmentNotes(event.target.value)} placeholder="Catatan handling untuk kurir" className="min-h-20 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-purple-500" />
          <button className="w-full bg-purple-600 hover:bg-purple-500 font-bold py-2.5 rounded-xl transition-all">
            Buat Paket Siap Pickup
          </button>
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

      <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="font-bold text-base flex items-center gap-2 text-slate-300 mb-4">
          <PackagePlus className="w-5 h-5 text-purple-400" /> Paket dari Produsen ke Kurir
        </h2>
        <div className="overflow-x-auto text-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-xs">
                <th className="pb-2">Resi</th>
                <th className="pb-2">Batch</th>
                <th className="pb-2">Tujuan</th>
                <th className="pb-2">Jumlah</th>
                <th className="pb-2">Kurir</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {shipments.map((shipment) => (
                <tr key={shipment.receiptNumber} className="hover:bg-slate-800/10">
                  <td className="py-3 font-mono text-purple-300">{shipment.receiptNumber}</td>
                  <td className="py-3">{shipment.batchId} - {shipment.variety}</td>
                  <td className="py-3 text-xs text-slate-400">{shipment.destination}</td>
                  <td className="py-3 font-mono text-xs">{shipment.packageQuantity.toLocaleString('id-ID')}</td>
                  <td className="py-3 text-xs text-slate-400">{shipment.courierName || 'Belum diterima'}</td>
                  <td className="py-3">
                    <span className="rounded-md border border-purple-500/20 bg-purple-500/10 px-2 py-1 text-[10px] font-bold text-purple-300">
                      {shipment.status.replaceAll('_', ' ')}
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
