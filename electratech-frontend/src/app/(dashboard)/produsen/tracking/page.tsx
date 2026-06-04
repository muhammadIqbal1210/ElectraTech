'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  MapPin,
  Package,
  RefreshCcw,
  Route,
  Search,
  Thermometer,
  Truck,
} from 'lucide-react';
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
  notes: string | null;
  createdAt: string;
  acceptedAt: string | null;
  deliveredAt: string | null;
};

type TrackingLog = {
  id: number;
  receipt_number: string;
  batch_id: string;
  courier_name: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  cargo_condition: string;
  container_temperature_c: number | null;
  notes: string | null;
  recorded_at: string;
};

const statusLabels: Record<string, string> = {
  READY_FOR_PICKUP: 'Menunggu Pickup',
  ACCEPTED_BY_COURIER: 'Diterima Kurir',
  IN_TRANSIT: 'Dalam Perjalanan',
  DELIVERED: 'Terkirim',
};

function formatStatus(status: string) {
  return statusLabels[status] || status.replaceAll('_', ' ');
}

function statusTone(status: string) {
  if (status === 'DELIVERED') return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300';
  if (status === 'IN_TRANSIT') return 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300';
  if (status === 'ACCEPTED_BY_COURIER') return 'border-purple-500/20 bg-purple-500/10 text-purple-300';
  return 'border-amber-500/20 bg-amber-500/10 text-amber-300';
}

function progressPercent(status: string) {
  if (status === 'DELIVERED') return 100;
  if (status === 'IN_TRANSIT') return 66;
  if (status === 'ACCEPTED_BY_COURIER') return 38;
  return 12;
}

export default function TrackingBenihProdusenPage() {
  const [shipments, setShipments] = useState<ShipmentRow[]>([]);
  const [logs, setLogs] = useState<TrackingLog[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState('');
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const selectedShipment = useMemo(
    () => shipments.find((shipment) => shipment.receiptNumber === selectedReceipt) || shipments[0],
    [selectedReceipt, shipments],
  );

  const loadShipments = useCallback(async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const response = await apiRequest<ShipmentRow[]>('/api/tracking/shipments');
      const data = response.data || [];
      setShipments(data);
      setSelectedReceipt((current) => current || data[0]?.receiptNumber || '');
      setLastSync(new Date());
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal memuat paket benih.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadLogs = useCallback(async (receiptNumber: string) => {
    if (!receiptNumber) {
      setLogs([]);
      return;
    }

    try {
      const response = await apiRequest<TrackingLog[]>(`/api/tracking?receiptNumber=${encodeURIComponent(receiptNumber)}`);
      setLogs(response.data || []);
      setLastSync(new Date());
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal memuat update perjalanan.');
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadShipments);
  }, [loadShipments]);

  useEffect(() => {
    if (!selectedShipment) return;

    void Promise.resolve().then(() => loadLogs(selectedShipment.receiptNumber));
    const intervalId = window.setInterval(() => {
      void loadShipments();
      void loadLogs(selectedShipment.receiptNumber);
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [loadLogs, loadShipments, selectedShipment]);

  const filteredShipments = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return shipments;

    return shipments.filter((shipment) => (
      shipment.receiptNumber.toLowerCase().includes(keyword)
      || shipment.batchId.toLowerCase().includes(keyword)
      || shipment.variety.toLowerCase().includes(keyword)
      || shipment.destination.toLowerCase().includes(keyword)
    ));
  }, [query, shipments]);

  const latestLog = logs[0];
  const summary = useMemo(() => ({
    total: shipments.length,
    active: shipments.filter((shipment) => ['ACCEPTED_BY_COURIER', 'IN_TRANSIT'].includes(shipment.status)).length,
    delivered: shipments.filter((shipment) => shipment.status === 'DELIVERED').length,
  }), [shipments]);

  const handleRefresh = () => {
    void loadShipments();
    if (selectedShipment) {
      void loadLogs(selectedShipment.receiptNumber);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-300">
            <Route className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tracking Benih</h1>
            <p className="mt-1 text-sm text-slate-400">
              Pantau posisi, kondisi muatan, suhu kontainer, dan status paket benih dari update kurir.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2.5 text-xs font-bold text-cyan-300 transition-all hover:bg-cyan-500/15"
        >
          <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {message && <p className="text-sm font-semibold text-amber-300">{message}</p>}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ['Total Paket', summary.total, 'text-cyan-300'],
          ['Sedang Berjalan', summary.active, 'text-purple-300'],
          ['Sudah Terkirim', summary.delivered, 'text-emerald-300'],
        ].map(([label, value, color]) => (
          <div key={label} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
            <p className={`mt-1 font-mono text-2xl font-black ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari resi, batch, varietas, tujuan"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-cyan-500"
            />
          </div>

          <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
            {filteredShipments.map((shipment) => {
              const isSelected = selectedShipment?.receiptNumber === shipment.receiptNumber;

              return (
                <button
                  key={shipment.receiptNumber}
                  type="button"
                  onClick={() => setSelectedReceipt(shipment.receiptNumber)}
                  className={`w-full rounded-xl border p-4 text-left transition-all ${
                    isSelected
                      ? 'border-cyan-500/40 bg-cyan-500/10'
                      : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs font-bold text-cyan-300">{shipment.receiptNumber}</p>
                      <p className="mt-1 text-sm font-bold text-slate-200">{shipment.variety}</p>
                      <p className="mt-0.5 font-mono text-xs text-slate-500">{shipment.batchId} - {shipment.generation}</p>
                    </div>
                    <span className={`shrink-0 rounded-md border px-2 py-1 text-[10px] font-bold ${statusTone(shipment.status)}`}>
                      {formatStatus(shipment.status)}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-500">{shipment.destination}</p>
                </button>
              );
            })}

            {filteredShipments.length === 0 && (
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">
                Belum ada paket yang cocok dengan pencarian.
              </div>
            )}
          </div>
        </section>

        <section className="space-y-5">
          {selectedShipment ? (
            <>
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-slate-950 px-2 py-1 font-mono text-xs font-bold text-cyan-300 ring-1 ring-slate-800">
                        {selectedShipment.receiptNumber}
                      </span>
                      <span className={`rounded-md border px-2 py-1 text-[10px] font-bold ${statusTone(selectedShipment.status)}`}>
                        {formatStatus(selectedShipment.status)}
                      </span>
                    </div>
                    <h2 className="mt-4 text-xl font-bold text-slate-100">
                      {selectedShipment.variety} ({selectedShipment.generation})
                    </h2>
                    <p className="mt-1 font-mono text-xs text-slate-500">{selectedShipment.batchId}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:w-[360px]">
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Jumlah Bibit</p>
                      <p className="mt-1 font-mono text-lg font-black text-emerald-300">
                        {selectedShipment.packageQuantity.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Kurir</p>
                      <p className="mt-1 truncate text-sm font-bold text-slate-200">
                        {selectedShipment.courierName || 'Belum diterima'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="h-2 rounded-full bg-slate-800">
                    <div
                      className="h-2 rounded-full bg-cyan-400 transition-all"
                      style={{ width: `${progressPercent(selectedShipment.status)}%` }}
                    />
                  </div>
                  <div className="mt-2 grid grid-cols-4 gap-2 text-[10px] font-bold uppercase text-slate-500">
                    <span>Dibuat</span>
                    <span>Diterima</span>
                    <span>Transit</span>
                    <span className="text-right">Terkirim</span>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <MapPin className="h-4 w-4 text-rose-400" />
                      Tujuan
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">{selectedShipment.destination}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <Clock className="h-4 w-4 text-cyan-300" />
                      Sinkronisasi
                    </p>
                    <p className="mt-2 text-sm text-slate-300">
                      {lastSync ? lastSync.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Menunggu data'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Auto-refresh setiap 10 detik.</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                  <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                    <Truck className="h-4 w-4 text-cyan-300" />
                    Update Perjalanan
                  </h2>

                  <div className="mt-5 space-y-4">
                    {logs.map((log) => (
                      <div key={log.id} className="relative border-l border-slate-800 pl-5">
                        <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border border-cyan-400 bg-slate-900" />
                        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="font-bold text-slate-200">{log.status}</p>
                              <p className="mt-1 text-xs text-slate-500">
                                {new Date(log.recorded_at).toLocaleString('id-ID')} oleh {log.courier_name}
                              </p>
                            </div>
                            <span className="w-fit rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-300">
                              {log.cargo_condition}
                            </span>
                          </div>
                          <div className="mt-3 grid gap-3 text-xs text-slate-400 sm:grid-cols-2">
                            <span className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-rose-400" />
                              {log.latitude && log.longitude ? `${log.latitude}, ${log.longitude}` : 'Lokasi belum tersedia'}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Thermometer className="h-3.5 w-3.5 text-orange-300" />
                              {log.container_temperature_c ? `${log.container_temperature_c} C` : 'Suhu belum tersedia'}
                            </span>
                          </div>
                          {log.notes && <p className="mt-3 text-sm leading-relaxed text-slate-300">{log.notes}</p>}
                        </div>
                      </div>
                    ))}

                    {logs.length === 0 && (
                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-400">
                        Belum ada check-in dari kurir untuk resi ini.
                      </div>
                    )}
                  </div>
                </div>

                <aside className="space-y-4">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                    <h2 className="flex items-center gap-2 text-sm font-bold text-slate-300">
                      <Package className="h-4 w-4 text-cyan-300" />
                      Kondisi Terakhir
                    </h2>
                    <p className="mt-4 text-2xl font-black text-emerald-300">
                      {latestLog?.cargo_condition || 'Menunggu'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {latestLog ? latestLog.status : 'Paket belum memiliki update kurir.'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                    <h2 className="flex items-center gap-2 text-sm font-bold text-slate-300">
                      <Thermometer className="h-4 w-4 text-orange-300" />
                      Suhu Kontainer
                    </h2>
                    <p className="mt-4 font-mono text-3xl font-black text-orange-300">
                      {latestLog?.container_temperature_c ? `${latestLog.container_temperature_c} C` : '--'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Data dari check-in terakhir.</p>
                  </div>

                  <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    Data tersinkron dengan TraceChain
                  </div>
                </aside>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-sm text-slate-400">
              Belum ada paket benih yang dibuat. Buat paket dari halaman Pendaftaran Batch terlebih dahulu.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
