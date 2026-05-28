'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sprout, Thermometer, Droplets, Sun, ToggleLeft, ToggleRight, PlusCircle, ArrowUpRight, Cpu } from 'lucide-react';
import { apiRequest } from '@/lib/api';

type BatchRow = {
  id: string;
  variety: string;
  phase: string;
  health_status: string;
};

type IotLog = {
  temperature_c: string;
  humidity_percent: string;
  light_lux: string;
};

export default function DashboardPenakar() {
  // State simulasi saklar aktuator IoT
  const [isPumpActive, setIsPumpActive] = useState(false);
  const [isLampActive, setIsLampActive] = useState(true);
  const [apiBatches, setApiBatches] = useState<BatchRow[]>([]);
  const [latestIot, setLatestIot] = useState<IotLog | null>(null);

  useEffect(() => {
    apiRequest<BatchRow[]>('/api/batches')
      .then((response) => setApiBatches(response.data || []))
      .catch(() => setApiBatches([]));

    apiRequest<IotLog[]>('/api/iot/logs?limit=1')
      .then((response) => setLatestIot(response.data?.[0] || null))
      .catch(() => setLatestIot(null));
  }, []);

  // Data dummy batch pemeliharaan untuk keperluan slicing UI hulu
  const activeBatches = [
    { id: 'BATCH-B092', varietas: 'Cabai Rawit Merah', fase: 'Penyemaian (H-12)', suhu: '26.2°C', status: 'Optimal' },
    { id: 'BATCH-B095', varietas: 'Tomat Hibrida F1', fase: 'Pertumbuhan (H-24)', suhu: '25.8°C', status: 'Butuh Nutrisi' },
    { id: 'BATCH-B101', varietas: 'Bawang Merah Lokananta', fase: 'Karantina Aklimatisasi', suhu: '27.1°C', status: 'Optimal' },
  ];

  const displayedBatches = apiBatches.length > 0
    ? apiBatches.map((batch) => ({
        id: batch.id,
        varietas: batch.variety,
        fase: batch.phase,
        status: batch.health_status === 'SEHAT' ? 'Optimal' : batch.health_status,
      }))
    : activeBatches;

  return (
    <div className="space-y-8">
      
      {/* 1. WELCOME BANNER & STATS QUICK ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Selamat Datang, Penakar Benih</h1>
          <p className="text-sm text-slate-400 mt-1">Pantau parameter sirkuit IoT SmartLink dan riwayat batch Anda hari ini.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/produsen/batch/create" className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md shadow-emerald-600/10">
            <PlusCircle className="w-4 h-4" /> Registrasi Batch Baru
          </Link>
        </div>
      </div>

      {/* 2. LIVE MONITORING KARTU SENSOR IOT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* Sensor Suhu */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Suhu Ruang Semai</p>
            <p className="text-2xl font-extrabold text-orange-400 font-mono">{latestIot?.temperature_c || '26.5'} C</p>
            <p className="text-[10px] text-emerald-400 flex items-center gap-0.5">● Status Stabil</p>
          </div>
          <div className="p-3 bg-orange-500/10 rounded-xl text-orange-400"><Thermometer className="w-6 h-6" /></div>
        </div>

        {/* Sensor Kelembapan */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kelembapan Tanah</p>
            <p className="text-2xl font-extrabold text-cyan-400 font-mono">{latestIot?.humidity_percent || '78'} %</p>
            <p className="text-[10px] text-emerald-400 flex items-center gap-0.5">● Kandungan Air Cukup</p>
          </div>
          <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400"><Droplets className="w-6 h-6" /></div>
        </div>

        {/* Sensor Intensitas Cahaya */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Intensitas Cahaya</p>
            <p className="text-2xl font-extrabold text-yellow-400 font-mono">{latestIot?.light_lux || '420'} Lux</p>
            <p className="text-[10px] text-amber-400 flex items-center gap-0.5">● Fotosintesis Aktif</p>
          </div>
          <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-400"><Sun className="w-6 h-6" /></div>
        </div>

      </div>

      {/* 3. GRID TENGAH: KENDALI PERANGKAT JAUH & TABEL BATCH */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* TABEL BATCH (Kolom Kiri Lebar) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Sprout className="w-5 h-5 text-emerald-400" /> Log Batch Pemeliharaan Aktif
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-2">ID / Varietas</th>
                  <th className="py-3 px-2">Fase Tumbuh</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {displayedBatches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 px-2">
                      <p className="font-mono text-emerald-400 font-semibold">{batch.id}</p>
                      <p className="text-xs text-slate-400">{batch.varietas}</p>
                    </td>
                    <td className="py-4 px-2 text-slate-300 font-medium">{batch.fase}</td>
                    <td className="py-4 px-2">
                      <span className={`text-[10px] px-2 py-0.5 font-bold rounded-md border ${
                        batch.status === 'Optimal' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {batch.status}
                      </span>
                    </td>
                    <td className="py-4 px-2 text-right">
                      <Link href={`/produsen/batch/detail`} className="inline-flex items-center gap-0.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors">
                        Detail <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PANEL KONTROL AKTATOR IOT (Kolom Kanan) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Cpu className="w-5 h-5 text-purple-400" /> Kendali Aktuator SmartLink
            </h3>
            <p className="text-xs text-slate-500 mt-1">Tekan saklar untuk otomatisasi perangkat keras fisik lapangan.</p>
          </div>

          <div className="space-y-4">
            {/* Saklar 1: Pompa Irigasi */}
            <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800/80 rounded-xl">
              <div>
                <p className="text-sm font-semibold">Pompa Air Irigasi</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isPumpActive ? 'Status: Menyiram Media Tanam' : 'Status: Non-Aktif'}
                </p>
              </div>
              <button 
                onClick={() => setIsPumpActive(!isPumpActive)} 
                className="text-slate-400 hover:text-white transition-all"
              >
                {isPumpActive ? <ToggleRight className="w-11 h-11 text-emerald-500" /> : <ToggleLeft className="w-11 h-11 text-slate-700" />}
              </button>
            </div>

            {/* Saklar 2: Lampu UV Pembiakan */}
            <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800/80 rounded-xl">
              <div>
                <p className="text-sm font-semibold">Lampu UV Spektrum Tumbuh</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isLampActive ? 'Status: Emit Cahaya Aktif' : 'Status: Non-Aktif'}
                </p>
              </div>
              <button 
                onClick={() => setIsLampActive(!isLampActive)} 
                className="text-slate-400 hover:text-white transition-all"
              >
                {isLampActive ? <ToggleRight className="w-11 h-11 text-emerald-500" /> : <ToggleLeft className="w-11 h-11 text-slate-700" />}
              </button>
            </div>
          </div>
          
          <div className="bg-purple-950/20 border border-purple-500/10 p-3 rounded-xl text-[11px] text-purple-400 leading-relaxed">
            💡 <strong>Rekomendasi AI:</strong> Kelembapan tanah saat ini stabil (78%). Pompa irigasi disarankan tetap mati untuk menghindari pembusukan akar semai.
          </div>
        </div>

      </div>

    </div>
  );
}
