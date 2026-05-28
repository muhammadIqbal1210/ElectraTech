'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, Handshake, MapPin, Package, ShieldCheck } from 'lucide-react';
import { apiRequest } from '@/lib/api';

type ShipmentRow = {
  receiptNumber: string;
  batchId: string;
  variety: string;
  generation: string;
  producerName: string;
  courierName: string | null;
  destination: string;
  packageQuantity: number;
  status: string;
  createdAt: string;
};

export default function ManifestKurirPage() {
  const [shipments, setShipments] = useState<ShipmentRow[]>([]);
  const [message, setMessage] = useState('');

  const loadShipments = useCallback(async () => {
    try {
      const response = await apiRequest<ShipmentRow[]>('/api/tracking/shipments');
      setShipments(response.data || []);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal memuat manifest.');
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadShipments);
  }, [loadShipments]);

  const handleAccept = async (receiptNumber: string) => {
    setMessage('');

    try {
      await apiRequest(`/api/tracking/shipments/${receiptNumber}/accept`, { method: 'POST' });
      setMessage(`Paket ${receiptNumber} berhasil diterima. Silakan lanjut check-in.`);
      await loadShipments();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal menerima paket.');
    }
  };

  const summary = useMemo(() => ({
    total: shipments.length,
    ready: shipments.filter((item) => item.status === 'READY_FOR_PICKUP').length,
    active: shipments.filter((item) => ['ACCEPTED_BY_COURIER', 'IN_TRANSIT'].includes(item.status)).length,
  }), [shipments]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manifest Pengiriman</h1>
          <p className="mt-1 text-sm text-slate-400">
            Paket dari produsen harus diterima kurir sebelum bisa check-in perjalanan.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-purple-500/20 bg-purple-950/30 px-3 py-2">
          <ShieldCheck className="h-4 w-4 text-purple-400" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-300">
            Ledger Sync Active
          </span>
        </div>
      </div>

      {message && <p className="text-sm font-semibold text-purple-300">{message}</p>}

      <div className="space-y-3">
        {shipments.map((ship) => (
          <div
            key={ship.receiptNumber}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition-all hover:border-purple-500/30"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-3">
                <div>
                  <span className="rounded bg-slate-950 px-2 py-0.5 font-mono text-[10px] font-bold text-purple-400 ring-1 ring-slate-800">
                    {ship.receiptNumber}
                  </span>
                  <span className="ml-2 font-mono text-xs text-slate-500">({ship.batchId})</span>
                </div>
                <div>
                  <p className="font-bold text-slate-200">{ship.variety} ({ship.generation})</p>
                  <p className="mt-1 text-xs text-slate-500">Produsen: {ship.producerName} - Jumlah: {ship.packageQuantity.toLocaleString('id-ID')} bibit</p>
                  <p className="mt-1 flex items-start gap-1.5 text-xs leading-relaxed text-slate-400">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
                    {ship.destination}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:items-end">
                <span className="w-fit rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                  {ship.status.replaceAll('_', ' ')}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{new Date(ship.createdAt).toLocaleString('id-ID')}</span>
                </div>
                {ship.status === 'READY_FOR_PICKUP' ? (
                  <button
                    onClick={() => handleAccept(ship.receiptNumber)}
                    className="inline-flex items-center gap-1 rounded-xl bg-purple-600 px-3 py-2 text-xs font-bold text-white transition-all hover:bg-purple-500"
                  >
                    <Handshake className="h-3.5 w-3.5" />
                    Terima Paket
                  </button>
                ) : (
                  <Link
                    href={`/kurir/checkin?resi=${ship.receiptNumber}&batch=${ship.batchId}`}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-bold text-slate-300 transition-all hover:bg-slate-800"
                  >
                    Check-in Paket <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
          <Package className="h-4 w-4 text-purple-400" />
          Ringkasan Manifest
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            ['Total Paket', summary.total],
            ['Siap Diterima', summary.ready],
            ['Aktif di Kurir', summary.active],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
              <p className="mt-1 font-mono text-2xl font-black text-emerald-400">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
