'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Cpu,
  Radio,
  Sprout,
  Truck,
  Bot,
  Activity,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

type BatchRow = {
  id: string;
  variety: string;
  generation?: string;
  quantity?: number;
  phase: string;
  health_status: string;
  created_at: string;
  seeded_at?: string;
};

type DeviceComponent = {
  id: number;
  componentType: string;
  componentName: string;
  unit: string | null;
  lastValue: string | null;
};

type IotDevice = {
  id: number;
  deviceCode: string;
  boxName: string;
  components: DeviceComponent[];
};

type IotLog = {
  id: number;
  deviceCode: string;
  boxName?: string;
  componentType?: string;
  componentName?: string;
  value: string;
  recorded_at: string;
};

type ActuatorCommand = {
  id: number;
  deviceCode: string;
  boxName?: string;
  componentName?: string;
  componentType: string;
  value: string;
  status: string;
  recordedAt: string;
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
  destination: string;
  packageQuantity: number;
  status: string;
  createdAt: string;
  acceptedAt: string | null;
  deliveredAt: string | null;
};

type TrackingLog = {
  id: number;
  receipt_number: string;
  batch_id: string;
  status: string;
  cargo_condition: string;
  recorded_at: string;
};

type ActivityItem = {
  id: string;
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
  initial: string;
  initialBg: string;
  timestamp: Date;
};

export default function DashboardPenakar() {
  const [apiBatches, setApiBatches] = useState<BatchRow[]>([]);
  const [devices, setDevices] = useState<IotDevice[]>([]);
  const [iotLogs, setIotLogs] = useState<IotLog[]>([]);
  const [actuatorCommands, setActuatorCommands] = useState<ActuatorCommand[]>([]);
  const [batchLogs, setBatchLogs] = useState<BatchLog[]>([]);
  const [shipments, setShipments] = useState<ShipmentRow[]>([]);
  const [trackingLogs, setTrackingLogs] = useState<TrackingLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [batchRes, deviceRes, logRes, commandRes, shipmentRes, trackingRes] = await Promise.allSettled([
          apiRequest<BatchRow[]>('/api/batches'),
          apiRequest<IotDevice[]>('/api/iot/devices'),
          apiRequest<IotLog[]>('/api/iot/logs?limit=20'),
          apiRequest<ActuatorCommand[]>('/api/iot/commands?limit=20'),
          apiRequest<ShipmentRow[]>('/api/tracking/shipments'),
          apiRequest<TrackingLog[]>('/api/tracking'),
        ]);

        const batches = batchRes.status === 'fulfilled' ? batchRes.value.data || [] : [];

        if (batchRes.status === 'fulfilled') {
          setApiBatches(batches);
        }
        if (deviceRes.status === 'fulfilled') {
          setDevices(deviceRes.value.data || []);
        }
        if (logRes.status === 'fulfilled') {
          setIotLogs(logRes.value.data || []);
        }
        if (commandRes.status === 'fulfilled') {
          setActuatorCommands(commandRes.value.data || []);
        }
        if (shipmentRes.status === 'fulfilled') {
          setShipments(shipmentRes.value.data || []);
        }
        if (trackingRes.status === 'fulfilled') {
          setTrackingLogs(trackingRes.value.data || []);
        }

        const batchLogResults = await Promise.allSettled(
          batches.slice(0, 20).map((batch) => apiRequest<BatchLog[]>(`/api/batches/${batch.id}/logs`)),
        );
        setBatchLogs(
          batchLogResults.flatMap((result) => result.status === 'fulfilled' ? result.value.data || [] : []),
        );
      } catch (err) {
        console.error('Error loading dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

  // Hitung metrik asli dari Database
  const totalDevicesCount = devices.length;

  const totalSensorsCount = useMemo(() => {
    return devices.reduce((sum, dev) => {
      const sensors = (dev.components || []).filter(
        (c) => (c.componentType || '').toLowerCase() === 'sensor'
      );
      return sum + sensors.length;
    }, 0);
  }, [devices]);

  const totalBatchesCount = apiBatches.length;

  const shipmentBatchesCount = useMemo(() => {
    return apiBatches.filter((b) => {
      const p = (b.phase || '').toUpperCase();
      return p.includes('DISTRIBUSI') || p.includes('KIRIM') || p.includes('PANEN') || p.includes('HARVEST');
    }).length;
  }, [apiBatches]);

  // Ekstrak Log Aktivitas Terbaru dari DB
  const recentActivities = useMemo<ActivityItem[]>(() => {
    const activities: ActivityItem[] = [];

    const toDate = (value: string | null | undefined) => {
      const date = new Date(value || 0);
      return isNaN(date.getTime()) ? new Date(0) : date;
    };

    // 1. Tambah aktivitas dari Batch Terbaru
    apiBatches.slice(0, 5).forEach((b) => {
      const dateObj = toDate(b.created_at || b.seeded_at);
      const p = (b.phase || '').toUpperCase();
      let badge = 'Berjalan';
      let badgeColor = 'text-emerald-400';

      if (p.includes('SEMAI')) {
        badge = 'Fase Semaian';
        badgeColor = 'text-emerald-400';
      } else if (p.includes('VEGETA')) {
        badge = 'Fase Vegetatif';
        badgeColor = 'text-indigo-400';
      } else if (p.includes('DISTRIBUSI') || p.includes('PANEN')) {
        badge = 'Siap Distribusi';
        badgeColor = 'text-cyan-400';
      }

      activities.push({
        id: `batch-${b.id}`,
        title: `Batch ${b.id} - ${b.variety}`,
        description: `Status kesehatan ${b.health_status || 'SEHAT'} (${b.quantity ? `${b.quantity} bibit` : 'Terdaftar'})`,
        badge,
        badgeColor,
        initial: b.id.replace('BATCH-', '').substring(0, 2).toUpperCase() || 'B1',
        initialBg: 'bg-emerald-600 text-white shadow-emerald-600/30',
        timestamp: dateObj,
      });
    });

    // 2. Tambah aktivitas perubahan fase budidaya batch
    batchLogs.forEach((log) => {
      activities.push({
        id: `batch-log-${log.id}`,
        title: `Fase batch ${log.batch_id} diperbarui`,
        description: `${log.from_phase || 'Registrasi'} -> ${log.to_phase}${log.notes ? `: ${log.notes}` : ''}`,
        badge: 'Budidaya',
        badgeColor: 'text-indigo-400',
        initial: 'BF',
        initialBg: 'bg-indigo-600 text-white shadow-indigo-600/30',
        timestamp: toDate(log.created_at),
      });
    });

    // 3. Tambah aktivitas pembuatan dan perkembangan pengiriman
    shipments.forEach((shipment) => {
      activities.push({
        id: `shipment-created-${shipment.receiptNumber}`,
        title: `Pengiriman ${shipment.receiptNumber} dibuat`,
        description: `${shipment.packageQuantity} bibit menuju ${shipment.destination}`,
        badge: 'Pengiriman',
        badgeColor: 'text-cyan-400',
        initial: 'PK',
        initialBg: 'bg-cyan-600 text-white shadow-cyan-600/30',
        timestamp: toDate(shipment.createdAt),
      });

      if (shipment.acceptedAt) {
        activities.push({
          id: `shipment-accepted-${shipment.receiptNumber}`,
          title: `Paket ${shipment.receiptNumber} diterima kurir`,
          description: `Pengiriman batch ${shipment.batchId} mulai diproses kurir.`,
          badge: 'Logistik',
          badgeColor: 'text-amber-400',
          initial: 'KR',
          initialBg: 'bg-amber-600 text-white shadow-amber-600/30',
          timestamp: toDate(shipment.acceptedAt),
        });
      }

      if (shipment.deliveredAt) {
        activities.push({
          id: `shipment-delivered-${shipment.receiptNumber}`,
          title: `Paket ${shipment.receiptNumber} terkirim`,
          description: `Pengiriman batch ${shipment.batchId} telah sampai di tujuan.`,
          badge: 'Terkirim',
          badgeColor: 'text-emerald-400',
          initial: 'OK',
          initialBg: 'bg-emerald-600 text-white shadow-emerald-600/30',
          timestamp: toDate(shipment.deliveredAt),
        });
      }
    });

    // 4. Tambah aktivitas check-in kurir
    trackingLogs.forEach((log) => {
      activities.push({
        id: `tracking-${log.id}`,
        title: `Update perjalanan ${log.receipt_number}`,
        description: `${log.status} - kondisi muatan ${log.cargo_condition}`,
        badge: 'Tracking',
        badgeColor: 'text-amber-300',
        initial: 'TR',
        initialBg: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
        timestamp: toDate(log.recorded_at),
      });
    });

    // 5. Hanya tampilkan riwayat kontrol actuator ON/OFF, bukan pembacaan sensor
    actuatorCommands.forEach((command) => {
      activities.push({
        id: `actuator-${command.id}`,
        title: `${command.componentName || 'Actuator'} - ${command.boxName || command.deviceCode}`,
        description: `Perintah actuator ${command.value.toUpperCase()} (${command.status})`,
        badge: 'Actuator',
        badgeColor: command.value.toUpperCase() === 'ON' ? 'text-emerald-400' : 'text-rose-400',
        initial: command.value.toUpperCase(),
        initialBg: command.value.toUpperCase() === 'ON'
          ? 'bg-emerald-600 text-white shadow-emerald-600/30'
          : 'bg-rose-600 text-white shadow-rose-600/30',
        timestamp: toDate(command.recordedAt),
      });
    });

    // Urutkan berdasarkan waktu paling baru
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 4);
  }, [apiBatches, batchLogs, shipments, trackingLogs, actuatorCommands]);

  // Pembacaan Telemetri Terbaru untuk Rekomendasi AI
  const latestMoistureLog = useMemo(() => {
    return iotLogs.find((l) =>
      (l.componentName || '').toLowerCase().includes('lembap') ||
      (l.componentName || '').toLowerCase().includes('moisture') ||
      (l.componentName || '').toLowerCase().includes('tanah')
    );
  }, [iotLogs]);

  const latestTempLog = useMemo(() => {
    return iotLogs.find((l) =>
      (l.componentName || '').toLowerCase().includes('suhu') ||
      (l.componentName || '').toLowerCase().includes('temp')
    );
  }, [iotLogs]);

  return (
    <div className="space-y-6">
      {/* 1. WELCOME HEADER CARD */}
      <div className="bg-[#0D1123]/90 border border-slate-800/80 rounded-2xl p-6 shadow-lg">
        <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">
          Selamat Datang, Penakar Benih
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Pantau ringkasan metrik dan aktivitas sistem Anda hari ini secara real-time dari database.
        </p>
      </div>

      {/* 2. METRICS OVERVIEW CARDS (4 COLUMNS GRID) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Perangkat Terdaftar */}
        <div className="bg-[#0D1123]/90 border border-slate-800/80 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:border-slate-700/80 transition-all">
          <div className="w-11 h-11 rounded-full bg-[#151B33] border border-slate-800 flex items-center justify-center text-slate-300 shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase">Total Perangkat Terdaftar</p>
            <p className="text-xl font-bold text-white mt-0.5">
              {loading ? '...' : `${totalDevicesCount} Unit`}
            </p>
            <p className="text-[10px] font-semibold text-emerald-400 mt-0.5">
              {totalDevicesCount > 0 ? 'Terkoneksi Database' : 'Belum ada perangkat'}
            </p>
          </div>
        </div>

        {/* Card 2: Total Sensor Terdaftar */}
        <div className="bg-[#0D1123]/90 border border-slate-800/80 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:border-slate-700/80 transition-all">
          <div className="w-11 h-11 rounded-full bg-[#151B33] border border-slate-800 flex items-center justify-center text-slate-300 shrink-0">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase">Total Sensor Terdaftar</p>
            <p className="text-xl font-bold text-white mt-0.5">
              {loading ? '...' : `${totalSensorsCount} Sensor`}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Modul Aktif Pemantauan</p>
          </div>
        </div>

        {/* Card 3: Total Batch / Tanaman */}
        <div className="bg-[#0D1123]/90 border border-slate-800/80 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:border-slate-700/80 transition-all">
          <div className="w-11 h-11 rounded-full bg-[#151B33] border border-slate-800 flex items-center justify-center text-slate-300 shrink-0">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase">Total Batch / Tanaman</p>
            <p className="text-xl font-bold text-white mt-0.5">
              {loading ? '...' : `${totalBatchesCount} Batch`}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Dalam Perawatan & Ledger</p>
          </div>
        </div>

        {/* Card 4: Batch Dalam Pengiriman */}
        <div className="bg-[#0D1123]/90 border border-slate-800/80 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:border-slate-700/80 transition-all">
          <div className="w-11 h-11 rounded-full bg-[#151B33] border border-slate-800 flex items-center justify-center text-slate-300 shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase">Batch Dalam Pengiriman</p>
            <p className="text-xl font-bold text-white mt-0.5">
              {loading ? '...' : `${shipmentBatchesCount} Batch`}
            </p>
            <p className="text-[10px] font-semibold text-emerald-400 mt-0.5">
              {shipmentBatchesCount > 0 ? 'Siap / Sedang dikirim' : 'Tidak ada pengiriman'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. MAIN CONTENT GRID (LEFT: AKTIVITAS TERBARU, RIGHT: REKOMENDASI AI) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: AKTIVITAS TERBARU (2/3 Width) */}
        <div className="lg:col-span-2 bg-[#0D1123]/90 border border-slate-800/80 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Aktivitas Terbaru</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Catatan aktivitas batch, logistik, tracking, dan kontrol actuator.
                </p>
              </div>
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="p-8 text-center text-slate-500 text-xs font-medium">
                  Memuat data aktivitas terbaru...
                </div>
              ) : recentActivities.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs font-medium border border-dashed border-slate-800 rounded-xl">
                  Belum ada aktivitas batch, logistik, tracking, atau kontrol actuator yang terekam di database.
                </div>
              ) : (
                recentActivities.map((act) => (
                  <div
                    key={act.id}
                    className="flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-900/60 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-full font-bold text-xs flex items-center justify-center shrink-0 shadow-md ${act.initialBg}`}
                      >
                        {act.initial}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white">{act.title}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{act.description}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold ${act.badgeColor}`}>
                      {act.badge}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: REKOMENDASI AI CARD (1/3 Width) */}
        <div className="bg-gradient-to-b from-[#2A33A8] via-[#1E237A] to-[#121652] border border-indigo-500/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-xl min-h-[360px]">
          <div className="absolute -top-12 -right-12 w-44 h-44 bg-indigo-400/10 blur-3xl rounded-full pointer-events-none" />

          {/* AI Circle Icon */}
          <div className="w-14 h-14 rounded-full bg-[#0A0D23]/90 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-xl mb-5">
            <Bot className="w-7 h-7 text-indigo-300" />
          </div>

          <h3 className="text-lg font-extrabold text-white mb-2 tracking-tight">Rekomendasi AI</h3>
          <p className="text-xs text-indigo-100/90 leading-relaxed max-w-xs mb-8">
            {latestMoistureLog
              ? `Kelembapan tanah saat ini terpantau (${latestMoistureLog.value}). ${
                  Number(latestMoistureLog.value.replace(/[^0-9.]/g, '')) < 60
                    ? 'Pompa irigasi disarankan diaktifkan untuk menjaga kelembapan optimal bibit.'
                    : 'Pompa irigasi disarankan tetap mati untuk menghindari pembusukan akar semai.'
                }`
              : latestTempLog
              ? `Suhu area penakaran terpantau (${latestTempLog.value}). Lingkungan tumbuh dalam batas toleransi normal.`
              : 'Kelembapan dan parameter lingkungan tanah stabil. Sistem AI memantau kondisi bibit secara berkala dari telemetri database.'}
          </p>

          <Link
            href="/produsen/agen"
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-2.5 rounded-full text-xs font-semibold backdrop-blur-md transition-all shadow-md hover:scale-105"
          >
            Lihat selengkapnya
          </Link>
        </div>
      </div>
    </div>
  );
}

