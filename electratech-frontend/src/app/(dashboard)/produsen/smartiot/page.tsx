'use client';
import { useState } from 'react';
import { ToggleLeft, ToggleRight, History, Activity } from 'lucide-react';

export default function SmartIoTPage() {
  const [pump, setPump] = useState(false);
  const [lamp, setLamp] = useState(true);

  // Simulasi riwayat trigger IoT
  const iotLogs = [
    { time: '08:15:22', device: 'Lampu UV', action: 'ON', trigger: 'Sistem Otomatis (Pagi)' },
    { time: '07:30:10', device: 'Pompa Air', action: 'OFF', trigger: 'Manual oleh Penakar' },
    { time: '06:00:00', device: 'Pompa Air', action: 'ON', trigger: 'AI Agent Recommendation' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">SmartIoT Control & Monitor</h1>
        <p className="text-sm text-slate-400 mt-1">Pantau grafik telemetri dan kendalikan aktuator sirkuit SmartLink.</p>
      </div>

      {/* Grid Grafik & Kontrol */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sisi Kiri: Monitor & Grafik Simulasi */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" /> Real-time Telemetry Graph Simulator
          </h3>
          {/* Box Simulasi Area Grafik */}
          <div className="h-64 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_2rem] opacity-20"></div>
            <span className="text-xs text-slate-500 font-mono">[ Grafik Perubahan Sensor Suhu & Kelembapan 24 Jam Terakhir ]</span>
          </div>
        </div>

        {/* Sisi Kanan: Panel Saklar Kontrol */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400">Aktuator Saklar</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl">
              <div>
                <p className="text-sm font-semibold">Pompa Irigasi</p>
                <p className="text-xs text-slate-500 mt-0.5">{pump ? 'Status: Menyiram' : 'Status: Mati'}</p>
              </div>
              <button onClick={() => setPump(!pump)}>{pump ? <ToggleRight className="w-10 h-10 text-emerald-500" /> : <ToggleLeft className="w-10 h-10 text-slate-700" />}</button>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl">
              <div>
                <p className="text-sm font-semibold">Lampu Spektrum UV</p>
                <p className="text-xs text-slate-500 mt-0.5">{lamp ? 'Status: Menyala' : 'Status: Mati'}</p>
              </div>
              <button onClick={() => setLamp(!lamp)}>{lamp ? <ToggleRight className="w-10 h-10 text-emerald-500" /> : <ToggleLeft className="w-10 h-10 text-slate-700" />}</button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Log Riwayat */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <History className="w-4 h-4 text-purple-400" /> Riwayat Log Aktivitas Perangkat
        </h3>
        <div className="overflow-x-auto text-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase">
                <th className="pb-3">Waktu</th>
                <th className="pb-3">Perangkat Perangkat</th>
                <th className="pb-3">Aksi</th>
                <th className="pb-3">Dicuat Oleh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {iotLogs.map((log, i) => (
                <tr key={i} className="hover:bg-slate-800/10">
                  <td className="py-3 font-mono text-xs">{log.time}</td>
                  <td className="py-3 font-semibold">{log.device}</td>
                  <td className="py-3">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${log.action === 'ON' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>{log.action}</span>
                  </td>
                  <td className="py-3 text-slate-400 text-xs">{log.trigger}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
