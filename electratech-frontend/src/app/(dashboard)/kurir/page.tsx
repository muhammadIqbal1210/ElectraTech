'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock, MapPin, Package, ShieldCheck, Truck } from 'lucide-react';
import { apiRequest } from '@/lib/api';

type ShipmentRow = {
  receiptNumber: string;
  batchId: string;
  variety: string;
  generation: string;
  destination: string;
  packageQuantity: number;
  status: string;
};

export default function DashboardKurir() {
  const [shipments, setShipments] = useState<ShipmentRow[]>([]);
  const [message, setMessage] = useState('');

  const loadShipments = useCallback(async () => {
    try {
      const response = await apiRequest<ShipmentRow[]>('/api/tracking/shipments');
      setShipments(response.data || []);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal memuat data kurir.');
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadShipments);
  }, [loadShipments]);

  const activeShipments = useMemo(
    () => shipments.filter((item) => item.status !== 'READY_FOR_PICKUP'),
    [shipments],
  );

  const stats = useMemo(() => ({
    ready: shipments.filter((item) => item.status === 'READY_FOR_PICKUP').length,
    active: activeShipments.filter((item) => item.status !== 'DELIVERED').length,
    done: shipments.filter((item) => item.status === 'DELIVERED').length,
  }), [activeShipments, shipments]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-purple-600/10 rounded-xl text-purple-400">
              <Truck className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold">Konsol Kurir Logistik</h1>
              <p className="text-xs text-slate-400 mt-0.5">Terima paket dari produsen, lalu lakukan check-in perjalanan.</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-950/30 border border-purple-500/20 px-3 py-1.5 rounded-xl flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <span className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-wider">
            Ledger Sync Active
          </span>
        </div>
      </div>

      {message && <p className="text-sm font-semibold text-purple-300">{message}</p>}

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Siap Diterima</p>
          <p className="text-2xl font-black text-amber-400 font-mono mt-1">{stats.ready}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Dalam Tugas</p>
          <p className="text-2xl font-black text-purple-400 font-mono mt-1">{stats.active}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Selesai</p>
          <p className="text-2xl font-black text-emerald-400 font-mono mt-1">{stats.done}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Package className="w-4 h-4 text-purple-400" /> Paket yang Sudah Diterima
        </h2>

        <div className="space-y-3">
          {activeShipments.map((ship) => (
            <div key={ship.receiptNumber} className="bg-slate-900 border border-purple-500/20 rounded-2xl p-5 transition-all space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-mono font-bold bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-purple-400">
                    {ship.receiptNumber}
                  </span>
                  <span className="text-xs text-slate-500 ml-2 font-mono">({ship.batchId})</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 font-bold rounded-md border bg-amber-500/10 text-amber-400 border-amber-500/20">
                  {ship.status.replaceAll('_', ' ')}
                </span>
              </div>

              <div className="space-y-2">
                <p className="text-base font-bold text-slate-200">{ship.variety} ({ship.generation})</p>
                <p className="text-xs text-slate-500">{ship.packageQuantity.toLocaleString('id-ID')} bibit</p>
                <div className="flex items-start gap-1.5 text-xs text-slate-400 leading-relaxed">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <span>{ship.destination}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Menunggu check-in berikutnya</span>
                </div>
                <Link
                  href={`/kurir/checkin?resi=${ship.receiptNumber}&batch=${ship.batchId}`}
                  className="flex-1 sm:flex-none text-center bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-md shadow-purple-600/10"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Check-in Paket <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {activeShipments.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-400">
            Belum ada paket yang diterima. Buka manifest untuk menerima paket dari produsen.
          </div>
        )}
      </div>
    </div>
  );
}
