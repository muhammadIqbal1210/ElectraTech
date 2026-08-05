'use client';

import { useEffect, useState, useMemo } from 'react';
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

// Helper internal untuk normalisasi data yang toleran terhadap format casing backend
const getComponentType = (log: any) => (log.componentType || log.componenttype || '').trim().toLowerCase();
const getMqttTopic = (log: any) => log.mqttTopic || log.mqtttopic || '';

const getTopicSuffix = (topic: string) => {
  if (!topic) return '';
  const parts = topic.split('/');
  return parts[parts.length - 1];
};

export default function SmartIoTPage() {
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [selectedComponentFilter, setSelectedComponentFilter] = useState<string>('all');
  const [hiddenSensors, setHiddenSensors] = useState<Record<string, boolean>>({});
  const [devices, setDevices] = useState<IotDevice[]>([]);
  const [logs, setLogs] = useState<IotLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actuatorState, setActuatorState] = useState<Record<number, boolean>>({});
  
  // Auto Mode States
  const [actuatorMode, setActuatorMode] = useState<Record<number, 'manual' | 'auto'>>({});
  const [autoConfig, setAutoConfig] = useState<Record<number, Array<{ id: string, sensorId: number | null, threshold: number | '', operator?: 'lebih_dari' | 'kurang_dari' }>>>({});

  // Proteksi Hydration Next.js
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
    const savedMode = localStorage.getItem('actuatorMode');
    const savedConfig = localStorage.getItem('autoConfig');
    if (savedMode) {
      try { setActuatorMode(JSON.parse(savedMode)); } catch(e){}
    }
    if (savedConfig) {
      try { setAutoConfig(JSON.parse(savedConfig)); } catch(e){}
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('actuatorMode', JSON.stringify(actuatorMode));
      localStorage.setItem('autoConfig', JSON.stringify(autoConfig));
    }
  }, [actuatorMode, autoConfig, isMounted]);

  // State untuk Modal Aturan Otomatis
  const [isAutoModalOpen, setIsAutoModalOpen] = useState(false);
  const [activeActuatorForModal, setActiveActuatorForModal] = useState<number | null>(null);

  const selectedDevice = useMemo(() => {
    return devices.find((d) => String(d.id) === String(selectedDeviceId)) ?? null;
  }, [devices, selectedDeviceId]);

  // Ambil data IoT dengan siklus pembaruan berkala
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
        // Update sensor components with latest values from logs
        setDevices((prevDevices) => {
          // Create a map of latest log per component (by recorded_at)
          const latestLogMap: Record<string, any> = {};
          logData
            .slice()
            .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
            .forEach((log) => {
              const compId = log.id; // Assuming log.id corresponds to component ID? If not, use a proper identifier.
              // Use mqttTopic to match component
              latestLogMap[log.mqttTopic] = log;
            });
          return prevDevices.map((device) => ({
            ...device,
            components: device.components.map((comp) => {
              if (getComponentType(comp) === 'sensor') {
                const matchingLog = latestLogMap[getMqttTopic(comp)];
                if (matchingLog) {
                  return { ...comp, lastValue: matchingLog.value, lastRecordedAt: matchingLog.recorded_at };
                }
              }
              return comp;
            })
          }));
        });

        setActuatorState((prev) => {
          const newActuators = { ...prev };
          deviceData.forEach((device) => {
            device.components.forEach((component) => {
              if (getComponentType(component) === 'actuator') {
                newActuators[component.id] = ['1', 'true', 'on', 'onn', 'yes'].includes(
                  (component.lastValue || '').toString().toLowerCase()
                );
              }
            });
          });
          return newActuators;
        });
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

  // Kontrol Aktuator dengan Optimistic Update & Sync Pengaman Polling
  const toggleActuator = async (componentId: number) => {
    const currentState = actuatorState[componentId] || false;
    const nextState = !currentState;

    // 1. Jalankan langkah optimis di UI terlebih dahulu
    setActuatorState((prev) => ({ ...prev, [componentId]: nextState }));

    try {
      await apiRequest(`/api/iot/components/${componentId}/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: nextState ? 'ON' : 'OFF' })
      });

      // 2. Perbarui state devices lokal agar interval fetch berikutnya tidak menimpa status baru
      setDevices((prevDevices) =>
        prevDevices.map((device) => ({
          ...device,
          components: device.components.map((comp) =>
            comp.id === componentId ? { ...comp, lastValue: nextState ? 'ON' : 'OFF' } : comp
          )
        }))
      );
    } catch (err) {
      // Rollback jika terjadi kegagalan transmisi API
      setActuatorState((prev) => ({ ...prev, [componentId]: currentState }));
      console.error('Gagal kontrol aktuator:', err);
      alert('Gagal mengirim perintah kontrol ke perangkat.');
    }
  };

  const handleAutoToggle = async (componentId: number, turnOn: boolean) => {
    setActuatorState((prev) => ({ ...prev, [componentId]: turnOn }));

    try {
      await apiRequest(`/api/iot/components/${componentId}/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: turnOn ? 'ON' : 'OFF' })
      });

      setDevices((prevDevices) =>
        prevDevices.map((device) => ({
          ...device,
          components: device.components.map((comp) =>
            comp.id === componentId ? { ...comp, lastValue: turnOn ? 'ON' : 'OFF' } : comp
          )
        }))
      );
    } catch (err) {
      setActuatorState((prev) => ({ ...prev, [componentId]: !turnOn }));
      console.error('Gagal kontrol otomatis aktuator:', err);
    }
  };

  // Logic untuk kontrol otomatis
  useEffect(() => {
    Object.entries(actuatorMode).forEach(([actuatorIdStr, mode]) => {
      if (mode !== 'auto') return;
      const actuatorId = Number(actuatorIdStr);
      const rules = autoConfig[actuatorId] || [];
      if (rules.length === 0) return;
      
      let shouldBeOn = false;
      let hasValidRule = false;

      for (const rule of rules) {
        if (rule.sensorId === null || rule.threshold === '') continue;
        
        let currentSensorValue: number | null = null;
        for (const device of devices) {
          const sensor = device.components.find(c => c.id === rule.sensorId);
          if (sensor && sensor.lastValue !== null) {
            currentSensorValue = Number(sensor.lastValue);
            break;
          }
        }
        
        if (currentSensorValue === null || isNaN(currentSensorValue)) continue;
        hasValidRule = true;
        
        const thresholdNum = Number(rule.threshold);
        const operator = rule.operator || 'lebih_dari';
        
        if (operator === 'lebih_dari' && currentSensorValue > thresholdNum) {
          shouldBeOn = true;
          break; // Jika salah satu sensor melewati batas, aktuator nyala
        } else if (operator === 'kurang_dari' && currentSensorValue < thresholdNum) {
          shouldBeOn = true;
          break;
        }
      }
      
      if (!hasValidRule) return;
      
      const currentActuatorState = actuatorState[actuatorId] || false;
      
      if (shouldBeOn && !currentActuatorState) {
        void handleAutoToggle(actuatorId, true);
      } else if (!shouldBeOn && currentActuatorState) {
        void handleAutoToggle(actuatorId, false);
      }
    });
  }, [devices, actuatorMode, autoConfig, actuatorState]);

  const filteredLogs = useMemo(() => {
    if (!selectedDevice) return logs;
    return logs.filter(
      (log) => (log.deviceCode || '').trim().toLowerCase() === (selectedDevice.deviceCode || '').trim().toLowerCase()
    );
  }, [logs, selectedDevice]);
  //Jalur data khusus untuk tabel (Hanya mengambil 10 data terakhir/terbaru)
  const tableLogs = useMemo(() => {
    return filteredLogs.slice(0, 10);
  }, [filteredLogs]);

  // Menggunakan useMemo agar referensi array stabil dan tidak memicu efek rekursif
  const availableSensors = useMemo(() => {
    const targetComponents = selectedDevice
      ? selectedDevice.components
      : devices.flatMap((d) => d.components);

    return targetComponents
      .filter((comp) => getComponentType(comp) === 'sensor')
      .map((comp) => ({
        key: getMqttTopic(comp),
        displayName: `${comp.componentName}`
      }));
  }, [devices, selectedDevice]);

  // Sinkronisasi reset filter komponen hanya jika komponen yang dipilih hilang dari daftar pasang
  useEffect(() => {
    if (selectedComponentFilter !== 'all' && !availableSensors.some((s) => s.key === selectedComponentFilter)) {
      setSelectedComponentFilter('all');
    }
  }, [availableSensors, selectedComponentFilter]);

  // Kalkulasi data grafik yang di-memoize untuk efisiensi beban CPU render
  const chartData = useMemo(() => {
    const chartLogSource = filteredLogs.filter((log) => {
      return getComponentType(log) === 'sensor' && (selectedComponentFilter === 'all' || getMqttTopic(log) === selectedComponentFilter);
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

      const topic = getMqttTopic(log);
      groupByTime[timeStr][topic] = isNaN(Number(log.value)) ? 0 : Number(log.value);
    });

    return Object.values(groupByTime);
  }, [filteredLogs, selectedComponentFilter]);

  const deviceCount = devices.length;

  const sensorCount = useMemo(() => {
    return devices.reduce(
      (sum, device) => sum + device.components.filter((comp) => getComponentType(comp) === 'sensor').length,
      0
    );
  }, [devices]);

  const lastSynced = useMemo(() => {
    if (!isMounted || !logs[0]?.recorded_at) return 'Belum ada data';
    const safeStr = logs[0].recorded_at.includes(' ') && !logs[0].recorded_at.includes('T')
      ? logs[0].recorded_at.replace(' ', 'T')
      : logs[0].recorded_at;
    return new Date(safeStr).toLocaleString('id-ID');
  }, [logs, isMounted]);

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
          <div className="flex items-center gap-3 text-slate-300">
            <Wifi className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Perangkat Terkoneksi</span>
          </div>
          <p className="text-3xl font-bold">{deviceCount}</p>
          <p className="text-xs text-slate-400">Total unit IoT yang aktif terdaftar.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-3 text-slate-300">
            <Database className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Parameter Sensor</span>
          </div>
          <p className="text-3xl font-bold">{sensorCount}</p>
          <p className="text-xs text-slate-400">Indikator penakar yang sedang dipantau.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center gap-3 text-slate-300">
            <Cpu className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Pembaruan Terakhir</span>
          </div>
          <p className="text-sm font-medium text-slate-200 mt-2">{lastSynced}</p>
          <p className="text-xs text-slate-500">Sinkronisasi log telemetri terbaru.</p>
        </div>
      </div>

      {/* Selector Pemilihan Perangkat */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <label className="block text-xs font-medium uppercase tracking-wider mb-2 text-slate-400">Pilih Unit Perangkat</label>
        <select
          value={selectedDeviceId ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            setSelectedDeviceId(val === '' ? null : Number(val));
            setSelectedComponentFilter('all');
          }}
          className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-slate-200 font-normal focus:outline-none focus:border-cyan-500 cursor-pointer"
        >
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

        {selectedComponentFilter === 'all' && availableSensors.length > 0 && (
          <div className="flex flex-wrap items-center gap-4 pt-2 pb-2">
            <span className="text-xs text-slate-500 font-medium">Tampilkan:</span>
            {availableSensors.map((sensor) => (
              <label key={sensor.key} className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={!hiddenSensors[sensor.key]}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setHiddenSensors(prev => ({ ...prev, [sensor.key]: !isChecked }));
                  }}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900 cursor-pointer"
                />
                {sensor.displayName}
              </label>
            ))}
          </div>
        )}

        <div className="w-full h-64 min-h-[256px] pt-2">
          {!isMounted || chartData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-xl text-sm text-center p-4">
              {!isMounted
                ? "Menyiapkan area grafik..."
                : "Tidak ada data riwayat aktivitas sensor fungsional yang tersedia untuk dirender pada alat ini."}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minWidth={250}>
              <LineChart key={selectedDeviceId ?? 'all'} data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" style={{ fontSize: '11px' }} />
                <YAxis stroke="#64748b" style={{ fontSize: '11px' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '10px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />

                {selectedComponentFilter === 'all' ? (
                  availableSensors.map((sensor, idx) => {
                    if (hiddenSensors[sensor.key]) return null;
                    return (
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
                    );
                  })
                ) : (
                  <Line
                    type="monotone"
                    dataKey={selectedComponentFilter}
                    name={availableSensors.find((s) => s.key === selectedComponentFilter)?.displayName || selectedComponentFilter}
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

      {/* Detail Informasi & Switch */}
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
          ) : selectedDevice.components.filter((c) => getComponentType(c) === 'sensor').length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 text-center text-sm text-slate-400">
              Tidak ada komponen sensor ukur yang tersemat pada unit ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedDevice.components
                .filter((component) => getComponentType(component) === 'sensor')
                .map((component) => (
                  <div key={component.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex flex-col justify-between space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-medium text-slate-400">Nama Indikator</p>
                        <p className="text-md font-bold text-slate-200 mt-0.5">{component.componentName}</p>
                      </div>
                      <span className="text-xs bg-slate-800 border border-slate-700 px-2 py-0.5 rounded font-medium text-slate-300">
                        {component.unit || component.dataType}
                      </span>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/60 flex items-baseline justify-between">
                      <span className="text-xs text-slate-500">Kondisi Saat Ini:</span>
                      <p className="text-xl font-bold text-emerald-400 tracking-tight">
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

          {!selectedDevice || selectedDevice.components.filter((c) => getComponentType(c) === 'actuator').length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-5 text-center text-xs text-slate-500">
              Pilih perangkat dengan fungsi saklar untuk mengaktifkan panel kendali ini.
            </div>
          ) : (
            <div className="space-y-4">
              {selectedDevice.components
                .filter((component) => getComponentType(component) === 'actuator')
                .map((component) => {
                  const mode = actuatorMode[component.id] || 'manual';
                  const rules = autoConfig[component.id] || [];
                  const validRulesCount = rules.filter(r => r.sensorId !== null && r.threshold !== '').length;
                  
                  return (
                    <div key={component.id} className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-200">{component.componentName}</p>
                          <p className="text-xs text-slate-500">
                            Status: <span className={actuatorState[component.id] ? "text-emerald-400 font-bold" : "text-slate-400 font-bold"}>{actuatorState[component.id] ? "ON" : "OFF"}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setActuatorMode(prev => ({ ...prev, [component.id]: 'manual' }))}
                            className={`px-3 py-2 text-xs font-medium rounded transition-colors ${mode === 'manual' ? 'bg-emerald-600 text-white border border-emerald-500' : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-white hover:border-slate-600'}`}
                          >
                            Manual
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                               setActuatorMode(prev => ({ ...prev, [component.id]: 'auto' }));
                               if (!autoConfig[component.id] || autoConfig[component.id].length === 0) {
                                  setAutoConfig(prev => ({ ...prev, [component.id]: [{ id: Math.random().toString(36).substring(7), sensorId: null, threshold: '', operator: 'lebih_dari' }] }));
                               }
                            }}
                            className={`px-3 py-2 text-xs font-medium rounded transition-colors ${mode === 'auto' ? 'bg-emerald-600 text-white border border-emerald-500' : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-white hover:border-slate-600'}`}
                          >
                            Otomatis
                          </button>
                        </div>
                      </div>

                      {mode === 'manual' ? (
                        <div className="flex items-center justify-between border-t border-slate-800 pt-3 mt-1">
                          <span className="text-xs text-slate-400">Kontrol Manual</span>
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
                      ) : (
                        <div className="flex flex-col gap-3 border-t border-slate-800 pt-3 mt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Aturan Aktif: <strong className="text-slate-200">{validRulesCount} Aturan</strong></span>
                            <button 
                              type="button"
                              onClick={() => {
                                setActiveActuatorForModal(component.id);
                                setIsAutoModalOpen(true);
                              }}
                              className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded font-medium transition-colors shadow-lg shadow-cyan-900/20"
                            >
                              Edit Aturan
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
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
                // 1. Ubah pengecekan dari filteredLogs ke tableLogs
              ) : tableLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-500">
                    Belum ada riwayat aktivitas yang cocok dengan kriteria.
                  </td>
                </tr>
              ) : (
                // 2. Ubah map dari filteredLogs ke tableLogs
                tableLogs.map((log) => {
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

      {/* MODAL ATURAN OTOMATIS */}
      {isAutoModalOpen && activeActuatorForModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {(() => {
              const rules = autoConfig[activeActuatorForModal] || [];
              const actuatorComp = devices.flatMap(d => d.components).find(c => c.id === activeActuatorForModal);
              const deviceForActuator = devices.find(d => d.components.some(c => c.id === activeActuatorForModal));
              const sensors = deviceForActuator ? deviceForActuator.components.filter(c => getComponentType(c) === 'sensor') : [];
              
              const handleAddRule = () => {
                setAutoConfig(prev => ({
                  ...prev,
                  [activeActuatorForModal]: [...(prev[activeActuatorForModal] || []), { id: Math.random().toString(36).substring(7), sensorId: null, threshold: '', operator: 'lebih_dari' }]
                }));
              };
              
              const handleRemoveRule = (ruleId: string) => {
                setAutoConfig(prev => ({
                  ...prev,
                  [activeActuatorForModal]: (prev[activeActuatorForModal] || []).filter(r => r.id !== ruleId)
                }));
              };
              
              const handleUpdateRule = (ruleId: string, updates: Partial<{ sensorId: number | null, threshold: number | '', operator: 'lebih_dari' | 'kurang_dari' }>) => {
                setAutoConfig(prev => ({
                  ...prev,
                  [activeActuatorForModal]: (prev[activeActuatorForModal] || []).map(r => r.id === ruleId ? { ...r, ...updates } : r)
                }));
              };
              
              return (
                <>
                  <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/80">
                    <div>
                      <h3 className="font-bold text-slate-100 text-lg">Aturan Otomatis</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Aktuator: <span className="font-semibold text-slate-300">{actuatorComp?.componentName || 'Tidak diketahui'}</span></p>
                    </div>
                    <button 
                      onClick={() => setIsAutoModalOpen(false)}
                      className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 p-2 rounded-lg transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                  
                  <div className="p-5 overflow-y-auto flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Daftar Aturan</span>
                      <button onClick={handleAddRule} type="button" className="text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-lg transition-colors shadow-lg shadow-cyan-900/20">
                        + Tambah Aturan
                      </button>
                    </div>
                    
                    {rules.length === 0 ? (
                      <div className="text-center p-6 text-sm text-slate-500 border border-dashed border-slate-700 rounded-xl bg-slate-950/50">
                        Belum ada aturan tersimpan.<br/>Silakan tambah aturan baru untuk mengaktifkan fungsi otomatis.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {rules.map((rule, idx) => (
                          <div key={rule.id} className="flex flex-col gap-3 p-4 bg-slate-950 rounded-xl border border-slate-700 relative shadow-sm">
                            <button
                              onClick={() => handleRemoveRule(rule.id)}
                              className="absolute top-3 right-3 text-rose-500 hover:text-white text-xs font-bold bg-rose-500/10 hover:bg-rose-500 w-6 h-6 rounded flex items-center justify-center transition-colors"
                              title="Hapus Aturan"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                            </button>
                            <div>
                              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Sensor Acuan {idx + 1}</label>
                              <select
                                value={rule.sensorId || ''}
                                onChange={(e) => handleUpdateRule(rule.id, { sensorId: e.target.value ? Number(e.target.value) : null })}
                                className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
                              >
                                <option value="">-- Pilih Sensor --</option>
                                {sensors.map(s => (
                                  <option key={s.id} value={s.id}>{s.componentName} {s.unit ? `(${s.unit})` : ''}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Kondisi Pemicu</label>
                              <div className="flex gap-2">
                                <select
                                  value={rule.operator || 'lebih_dari'}
                                  onChange={(e) => handleUpdateRule(rule.id, { operator: e.target.value as 'lebih_dari' | 'kurang_dari' })}
                                  className="w-1/3 rounded-lg border border-slate-700 bg-slate-900 p-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
                                >
                                  <option value="lebih_dari">Lebih dari {'>'}</option>
                                  <option value="kurang_dari">Kurang dari {'<'}</option>
                                </select>
                                <input
                                  type="number"
                                  value={rule.threshold}
                                  onChange={(e) => handleUpdateRule(rule.id, { threshold: e.target.value === '' ? '' : Number(e.target.value) })}
                                  placeholder="Contoh: 30"
                                  className="w-2/3 rounded-lg border border-slate-700 bg-slate-900 p-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 mt-4">
                      <p className="text-xs text-emerald-400 font-medium">Informasi Logika OR:</p>
                      <p className="text-[11px] text-slate-300 mt-1">Aktuator akan menyala (<strong className="text-emerald-400">ON</strong>) secara otomatis jika nilai dari <strong>salah satu</strong> sensor memenuhi kondisi yang ditentukan.</p>
                    </div>
                  </div>
                  
                  <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end">
                    <button 
                      onClick={() => setIsAutoModalOpen(false)}
                      className="text-sm bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold transition-colors shadow-lg shadow-emerald-900/20"
                    >
                      Selesai & Tutup
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}