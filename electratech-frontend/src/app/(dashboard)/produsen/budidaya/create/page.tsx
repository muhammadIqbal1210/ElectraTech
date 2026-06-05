'use client';
import { FormEvent, useEffect, useState } from 'react';
import { PackagePlus, Route, Sprout } from 'lucide-react';
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

export default function BudidayaPage() {
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [toPhase, setToPhase] = useState('PENYEMAIAN');
  const [notes, setNotes] = useState('');
  const [logs, setLogs] = useState<BatchLog[]>([]);
  const [shipments, setShipments] = useState<ShipmentRow[]>([]);
  const [shipmentBatchId, setShipmentBatchId] = useState('');
  const [destination, setDestination] = useState('');
  const [packageQuantity, setPackageQuantity] = useState('');
  const [shipmentNotes, setShipmentNotes] = useState('');
  const [message, setMessage] = useState('');

  const loadBatches = async () => {
    const response = await apiRequest<BatchRow[]>('/api/batches');
    const data = response.data || [];
    setBatches(data);
    setSelectedBatch((current) => current || data[0]?.id || '');
    setShipmentBatchId((current) => current || data[0]?.id || '');
  };

  const loadLogs = async (batchId: string) => {
    if (!batchId) return;
    const response = await apiRequest<BatchLog[]>(`/api/batches/${batchId}/logs`);
    setLogs(response.data || []);
  };

  const loadShipments = async () => {
    try {
      const response = await apiRequest<ShipmentRow[]>('/api/tracking/shipments');
      setShipments(response.data || []);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal memuat paket pengiriman.');
    }
  };

  useEffect(() => {
    void Promise.resolve()
      .then(async () => {
        await loadBatches();
        await loadShipments();
      })
      .catch((err) => setMessage(err instanceof Error ? err.message : 'Gagal memuat data budidaya.'));
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
      setShipmentBatchId('');
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
    <div className="grid grid-cols-4 lg:grid-cols-3 gap-6">
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
          <Route className="w-5 h-5 text-green-400" /> Rekam Jejak Siklus Hidup Bibit
        </h2>
        <div className="overflow-x-auto text-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-xs">
                <th className="pb-2">ID Batch</th>
                <th className="pb-2">Fase Asal</th>
                <th className="pb-2">Fase Baru</th>
                <th className="pb-2">Catatan</th>
                <th className="pb-2">Tanggal Mutasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/10">
                  <td className="py-3 font-mono text-emerald-400">{log.batch_id}</td>
                  <td className="py-3 text-slate-400">{log.from_phase || '-'}</td>
                  <td className="py-3 font-semibold text-emerald-400">{log.to_phase}</td>
                  <td className="py-3 text-slate-400 italic">{log.notes || '-'}</td>
                  <td className="py-3 text-xs text-slate-500 font-mono">{new Date(log.created_at).toLocaleDateString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
      <h2 className="font-bold text-base flex items-center gap-2 text-purple-400">
        <PackagePlus className="w-5 h-5" /> Serahkan Paket ke Kurir
      </h2>
      
      <form className="space-y-4 text-sm" onSubmit={handleCreateShipment}>
        
        {/* Ganti ke grid-cols-12 agar bisa membagi lebar secara fleksibel */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          
          {/* 1. Batch Siap Kirim (Diberi ruang paling besar: 5 dari 12 kolom) */}
          <div className="xl:col-span-3">
            <label className="block text-xs text-slate-400 mb-1">Batch Siap Kirim</label>
            <select value={shipmentBatchId} onChange={(event) => setShipmentBatchId(event.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-purple-500" required>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>{batch.id} - {batch.variety}</option>
              ))}
            </select>
          </div>
          
          {/* 2. Jumlah Bibit (Dibuat ringkas karena hanya angka: 3 dari 12 kolom) */}
          <div className="xl:col-span-2">
            <label className="block text-xs text-slate-400 mb-1">Jumlah Bibit Dalam Paket</label>
            <input value={packageQuantity} onChange={(event) => setPackageQuantity(event.target.value)} type="number" min={1} placeholder="250" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-purple-500" required />
          </div>
          
          {/* 3. Tujuan Pengiriman (Sedang menuju luas: 4 dari 12 kolom) */}
          <div className="xl:col-span-7">
            <label className="block text-xs text-slate-400 mb-1">Tujuan Pengiriman</label>
            <input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Alamat penerima / hub distribusi" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-purple-500" required />
          </div>

        </div>

        <textarea value={shipmentNotes} onChange={(event) => setShipmentNotes(event.target.value)} placeholder="Catatan handling untuk kurir" className="min-h-20 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-purple-500 resize-none" />
        
        <button className="w-full bg-purple-600 hover:bg-purple-500 font-bold py-2.5 rounded-xl transition-all">
          Buat Paket Siap Pickup
        </button>
      </form>
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
