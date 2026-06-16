'use client';
import { useEffect, useState } from 'react';
import { ToggleLeft, ToggleRight, Activity, Cpu, Wifi, Database, LineChart as ChartIcon, Layers } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

type DeviceComponent = {
  id: number;
  componentType: 'sensor' | 'actuator' | string;
  componentName: string;
  unit: string | null;
  dataType: string;
  mqttTopic: string;
  isActive: boolean;
  lastValue: string | null;
  lastRecordedAt: string | null;
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
  boxName: string;
  componentType: string;
  componentName: string;
  mqttTopic: string;
  value: string;
  recorded_at: string;
};

export default function SmartIoTPage() {
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [selectedComponentFilter, setSelectedComponentFilter] = useState<string>('all');
  const [devices, setDevices] = useState<IotDevice[]>([]);
  const [logs, setLogs] = useState<IotLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actuatorState, setActuatorState] = useState<Record<number, boolean>>({});
  
  // SOLUSI ERROR 1: Hanya pasang mounted state SEKALI saja saat inisialisasi browser
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const selectedDevice = devices.find((d) => String(d.id) === String(selectedDeviceId)) ?? null;

  // Ambil data IoT dengan data log tersinkronisasi berdasarkan device yang aktif
  useEffect(() => {
    const loadIoTData = async () => {
      try {
        const deviceResponse = await apiRequest<IotDevice[]>('/api/iot/devices');
        const deviceData = deviceResponse.data || [];
        setDevices(deviceData);

        let activeDeviceId = selectedDeviceId;
        if (deviceData.length > 0 && activeDeviceId === null) {
          activeDeviceId = Number(deviceData[0].id);
          setSelectedDeviceId(activeDeviceId);
        }

        const activeDevice = deviceData.find((d) => String(d.id) === String(activeDeviceId));
        const logsUrl = activeDevice
          ? `/api/iot/logs?deviceCode=${encodeURIComponent(activeDevice.deviceCode)}&limit=100`
          : '/api/iot/logs?limit=100';

        const logResponse = await apiRequest<IotLog[]>(logsUrl);
        const logData = logResponse.data || [];
        setLogs(logData);

        const newActuators: Record<number, boolean> = {};
        deviceData.forEach((device) => {
          device.components.forEach((component) => {
            if ((component.componentType || '').trim().toLowerCase() === 'actuator') {
              newActuators[component.id] = ['1', 'true', 'on', 'onn', 'yes'].includes((component.lastValue || '').toString().toLowerCase());
            }
          });
        });

        setActuatorState(newActuators);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memuat data IoT.');
      } finally {
        setLoading(false);
      }
    };

    void loadIoTData();
    const interval = setInterval(loadIoTData, 5000);
    return () => clearInterval(interval);
  }, [selectedDeviceId]);

  const toggleActuator = async (componentId: number) => {
    const currentState = actuatorState[componentId] || false;
    const nextState = !currentState;

    setActuatorState((prev) => ({ ...prev, [componentId]: nextState }));

    try {
      await apiRequest(`/api/iot/components/${componentId}/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: nextState ? 'ON' : 'OFF' })
      });
    } catch (err) {
      setActuatorState((prev) => ({ ...prev, [componentId]: currentState }));
      console.error('Gagal kontrol aktuator:', err);
      alert('Gagal mengirim perintah kontrol ke perangkat.');
    }
  };

  const filteredLogs = selectedDevice 
    ? logs.filter((log) => (log.deviceCode || '').trim().toLowerCase() === (selectedDevice.deviceCode || '').trim().toLowerCase())
    : logs;

  // Helper untuk mengekstrak akhiran topik MQTT untuk membedakan sensor dengan nama sama
  const getTopicSuffix = (topic: string) => {
    if (!topic) return '';
    const parts = topic.split('/');
    return parts[parts.length - 1];
  };

  const availableSensors = selectedDevice
    ? selectedDevice.components
        .filter((comp) => (comp.componentType || '').trim().toLowerCase() === 'sensor')
        .map((comp) => ({
          key: comp.mqttTopic,
          displayName: `${comp.componentName} (${getTopicSuffix(comp.mqttTopic)})`
        }))
    : devices.flatMap((d) =>
        d.components
          .filter((comp) => (comp.componentType || '').trim().toLowerCase() === 'sensor')
          .map((comp) => ({
            key: comp.mqttTopic,
            displayName: `${comp.componentName} (${getTopicSuffix(comp.mqttTopic)})`
          }))
      );

  // Reset filter komponen jika komponen yang sedang dipilih tidak ada di perangkat yang baru dipilih
  useEffect(() => {
    if (selectedComponentFilter !== 'all' && !availableSensors.some(s => s.key === selectedComponentFilter)) {
      setSelectedComponentFilter('all');
    }
  }, [availableSensors, selectedComponentFilter]);

  const generateChartData = () => {
    const chartLogSource = filteredLogs.filter(log => {
      const type = (log.componentType || (log as any).componenttype || '').trim().toLowerCase();
      const topic = log.mqttTopic || (log as any).mqtttopic || '';
      return type === 'sensor' && (selectedComponentFilter === 'all' || topic === selectedComponentFilter);
    });

    const chronologicalLogs = [...chartLogSource].reverse();
    const groupByTime: Record<string, Record<string, string | number>> = {};

    chronologicalLogs.forEach((log) => {
      const safeDateStr = log.recorded_at.includes(' ') && !log.recorded_at.includes('T')
        ? log.recorded_at.replace(' ', 'T')
        : log.recorded_at;

      const dateObj = new Date(safeDateStr);
      if (isNaN(dateObj.getTime())) return;

      const timeStr = dateObj.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });

      if (!groupByTime[timeStr]) {
        groupByTime[timeStr] = { time: timeStr };
      }
      
      const topic = log.mqttTopic || (log as any).mqtttopic || '';
      groupByTime[timeStr][topic] = isNaN(Number(log.value)) ? 0 : Number(log.value);
    });

    return Object.values(groupByTime);
  };

  const chartData = generateChartData();
  const deviceCount = devices.length;
  const sensorCount = devices.reduce((sum, device) => sum + device.components.filter((comp) => (comp.componentType || '').trim().toLowerCase() === 'sensor').length, 0);
  const lastSynced = logs[0]?.recorded_at ? new Date(logs[0].recorded_at.includes(' ') && !logs[0].recorded_at.includes('T') ? logs[0].recorded_at.replace(' ', 'T') : logs[0].recorded_at).toLocaleString('id-ID') : 'Belum ada data';

  return (
    <div className="space-y-6 text-slate-100">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">SmartIoT Control & Monitor</h1>
        <p className="text-sm text-slate-400 mt-1">Pantau parameter sensor alat penakar dan kendalikan aktuator secara langsung.</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-950/40 p-4 text-rose-300">
          {error}
        </div>
      )}

      {/* Ringkasan Informasi Utama */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-3 text-emerald-400">
            <Wifi className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Perangkat Terkoneksi</span>
          </div>
          <p className="text-3xl font-bold">{deviceCount}</p>
          <p className="text-xs text-slate-400">Total unit IoT yang aktif terdaftar.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-3 text-cyan-400">
            <Database className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Parameter Sensor</span>
          </div>
          <p className="text-3xl font-bold">{sensorCount}</p>
          <p className="text-xs text-slate-400">Indikator penakar yang sedang dipantau.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-3 text-purple-400">
            <Cpu className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Pembaruan Terakhir</span>
          </div>
          <p className="text-sm font-medium text-slate-200 mt-2">{lastSynced}</p>
          <p className="text-xs text-slate-500">Sinkronisasi log telemetri terbaru.</p>
        </div>
      </div>

      {/* Selector Pemilihan Perangkat */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">Pilih Unit Perangkat</label>
        <select
          value={selectedDeviceId ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            setSelectedDeviceId(val === '' ? null : Number(val));
            setSelectedComponentFilter('all'); 
          }}
          className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-slate-200 font-medium focus:outline-none focus:border-cyan-500"
        >
          <option value="">-- Tampilkan Semua Perangkat --</option>
          {devices.map((device) => (
            <option key={device.id} value={device.id}>
              {device.deviceCode} ({device.boxName || 'Tanpa Nama Unit'})
            </option>
          ))}
        </select>
      </div>

      {/* PANEL GRAFIK MONITORING */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <ChartIcon className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider">Grafik Riwayat Pengukuran Sensor</h3>
              <p className="text-xs text-slate-400">Analisis tren fluktuasi nilai indikator penakar.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-400" />
            <select
              value={selectedComponentFilter}
              onChange={(e) => setSelectedComponentFilter(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">Tampilkan Semua Sensor</option>
              {availableSensors.map((sensor) => (
                <option key={sensor.key} value={sensor.key}>
                  Fokus: {sensor.displayName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="w-full h-64 pt-2">
          {!isMounted || chartData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-xl text-sm text-center p-4">
              {!isMounted 
                ? "Menyiapkan area grafik..." 
                : "Tidak ada data riwayat aktivitas sensor fungsional yang tersedia untuk dirender pada alat ini."}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {/* SOLUSI ERROR 2: Berikan 'key' unik berbasis ID device agar Recharts merender ulang struktur garis baru */}
              <LineChart key={selectedDeviceId ?? 'all'} data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" style={{ fontSize: '11px' }} />
                <YAxis stroke="#64748b" style={{ fontSize: '11px' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '10px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                
                {/* SOLUSI ERROR 2: Ditambahkan `connectNulls={true}` agar garis sensor tidak patah/hilang akibat jeda transmisi log */}
                {selectedComponentFilter === 'all' ? (
                  availableSensors.map((sensor, idx) => (
                    <Line
                      key={sensor.key}
                      type="monotone"
                      dataKey={sensor.key}
                      name={sensor.displayName}
                      connectNulls={true}
                      stroke={idx % 3 === 0 ? '#06b6d4' : idx % 3 === 1 ? '#10b981' : '#f59e0b'}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))
                ) : (
                  <Line
                    type="monotone"
                    dataKey={selectedComponentFilter}
                    name={availableSensors.find(s => s.key === selectedComponentFilter)?.displayName || selectedComponentFilter}
                    connectNulls={true}
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    dot={{ r: 2 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bagian Kompartemen Detail Informasi & Switch */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold">Status Indikator Penakar</h2>
            <p className="text-xs text-slate-400">Nilai metrik aktual yang sedang dibaca oleh modul sensor terpasang.</p>
          </div>

          {!selectedDevice ? (
            <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-6 text-center text-sm text-slate-400">
              Silakan pilih unit perangkat di bagian atas untuk melihat kondisi detail parameter sensor secara berkala.
            </div>
          ) : selectedDevice.components.filter((c) => (c.componentType || '').trim().toLowerCase() === 'sensor').length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 text-center text-sm text-slate-400">
              Tidak ada komponen sensor ukur yang tersemat pada unit ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedDevice.components
                .filter((component) => (component.componentType || '').trim().toLowerCase() === 'sensor')
                .map((component) => (
                  <div key={component.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex flex-col justify-between space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nama Indikator</p>
                        <p className="text-sm font-bold text-slate-200 mt-0.5">{component.componentName}</p>
                      </div>
                      <span className="text-xs bg-slate-800 border border-slate-700 px-2 py-0.5 rounded font-medium text-slate-300">
                        {component.unit || component.dataType}
                      </span>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/60 flex items-baseline justify-between">
                      <span className="text-xs text-slate-500">Kondisi Saat Ini:</span>
                      <p className="text-xl font-black text-emerald-400 tracking-tight">
                        {component.lastValue ?? '-'} <span className="text-xs font-normal text-slate-400">{component.unit || ''}</span>
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold">Saklar Kendali</h2>
            <p className="text-xs text-slate-400">Tombol operasional untuk memicu status on/off perangkat keras.</p>
          </div>
          
          {!selectedDevice || selectedDevice.components.filter((c) => (c.componentType || '').trim().toLowerCase() === 'actuator').length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-5 text-center text-xs text-slate-500">
              Pilih perangkat dengan fungsi saklar untuk mengaktifkan panel kendali ini.
            </div>
          ) : (
            <div className="space-y-2">
              {selectedDevice.components
                .filter((component) => (component.componentType || '').trim().toLowerCase() === 'actuator')
                .map((component) => (
                  <div key={component.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950 p-3.5 pl-4">
                    <div>
                      <p className="text-sm font-bold text-slate-200">{component.componentName}</p>
                      <p className="text-xs text-slate-500">Tipe Kontrol: Saklar Berkelanjutan</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleActuator(component.id)}
                      className="rounded-full transition-transform active:scale-95 focus:outline-none"
                    >
                      {actuatorState[component.id] ? (
                        <ToggleRight className="w-12 h-12 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="w-12 h-12 text-slate-600" />
                      )}
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* TABEL RIWAYAT LOG TELEMETRI */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-slate-300">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm uppercase tracking-wider">Tabel Riwayat Aktivitas Penakaran</h3>
          </div>
          <span className="text-xs font-mono bg-slate-950 px-2 py-1 rounded text-slate-400">
            {selectedDevice ? `Unit: ${selectedDevice.deviceCode}` : 'Semua Unit'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider">
                <th className="py-2.5 px-2">Waktu Catat</th>
                <th className="py-2.5 px-2">Kode Alat</th>
                <th className="py-2.5 px-2">Nama Indikator</th>
                <th className="py-2.5 px-2 text-right">Nilai Ukur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-500">Memuat log telemetri...</td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-500">
                    Belum ada riwayat aktivitas yang cocok dengan kriteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const safeLogDate = log.recorded_at.includes(' ') && !log.recorded_at.includes('T')
                    ? log.recorded_at.replace(' ', 'T')
                    : log.recorded_at;
                  return (
                    <tr key={log.id} className="hover:bg-slate-800/10 transition-colors">
                      <td className="py-2.5 px-2 font-mono text-xs text-slate-400">
                        {new Date(safeLogDate).toLocaleDateString('id-ID')} {new Date(safeLogDate).toLocaleTimeString('id-ID')}
                      </td>
                      <td className="py-2.5 px-2 font-semibold text-slate-200">{log.deviceCode}</td>
                      <td className="py-2.5 px-2 text-slate-400">{log.componentName}</td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-cyan-400">{log.value}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}