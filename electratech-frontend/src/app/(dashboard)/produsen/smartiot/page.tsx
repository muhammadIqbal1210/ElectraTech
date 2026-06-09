'use client';
import { useEffect, useState } from 'react';
import { ToggleLeft, ToggleRight, History, Activity, Cpu, Wifi, Database } from 'lucide-react';
import { apiRequest } from '@/lib/api';

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
  const [devices, setDevices] = useState<IotDevice[]>([]);
  const [logs, setLogs] = useState<IotLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actuatorState, setActuatorState] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const loadIoTData = async () => {
      try {
        const [deviceResponse, logResponse] = await Promise.all([
          apiRequest<IotDevice[]>('/api/iot/devices'),
          apiRequest<IotLog[]>('/api/iot/logs?limit=6'),
        ]);

        const deviceData = deviceResponse.data || [];
        const logData = logResponse.data || [];

        setDevices(deviceData);
        setLogs(logData);

        const newActuators: Record<number, boolean> = {};
        deviceData.forEach((device) => {
          device.components.forEach((component) => {
            if (component.componentType === 'actuator') {
              newActuators[component.id] = ['1', 'true', 'on', 'ON'].includes((component.lastValue || '').toString().toLowerCase());
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
  }, []);

  const deviceCount = devices.length;
  const sensorCount = devices.reduce((sum, device) => sum + device.components.filter((comp) => comp.componentType === 'sensor').length, 0);
  const actuatorCount = devices.reduce((sum, device) => sum + device.components.filter((comp) => comp.componentType === 'actuator').length, 0);
  const lastSynced = logs[0]?.recorded_at ? new Date(logs[0].recorded_at).toLocaleString('id-ID') : 'Belum ada data MQTT';

  const toggleActuator = (componentId: number) => {
    setActuatorState((prev) => ({ ...prev, [componentId]: !prev[componentId] }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">SmartIoT Control & Monitor</h1>
        <p className="text-sm text-slate-400 mt-1">Pantau perangkat yang sudah didaftarkan admin dan tampilkan telemetri langsung dari MQTT.</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-950/40 p-4 text-rose-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-3 text-emerald-400">
            <Wifi className="w-5 h-5" />
            <span className="text-xs uppercase tracking-[0.2em]">Telemetri MQTT</span>
          </div>
          <p className="text-3xl font-bold">{deviceCount}</p>
          <p className="text-sm text-slate-400">Perangkat terdaftar dari konfigurasi admin.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-3 text-cyan-400">
            <Database className="w-5 h-5" />
            <span className="text-xs uppercase tracking-[0.2em]">Komponen IoT</span>
          </div>
          <p className="text-3xl font-bold">{sensorCount + actuatorCount}</p>
          <p className="text-sm text-slate-400">{sensorCount} sensor dan {actuatorCount} aktuator aktif.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-3 text-purple-400">
            <Cpu className="w-5 h-5" />
            <span className="text-xs uppercase tracking-[0.2em]">Sinkronisasi</span>
          </div>
          <p className="text-sm text-slate-200">{lastSynced}</p>
          <p className="text-xs text-slate-500">Waktu log terakhir diterima dari broker MQTT.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold">Detail Perangkat</h2>
              <p className="text-xs text-slate-500">Data perangkat berasal dari tabel devices dan device_components.</p>
            </div>
            <div className="text-xs text-slate-400">{loading ? 'Memuat...' : `${deviceCount} device`}</div>
          </div>

          {devices.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-slate-400">
              Belum ada perangkat IoT yang dikonfigurasi oleh admin untuk akun ini.
            </div>
          ) : (
            <div className="space-y-4">
              {devices.map((device) => (
                <div key={device.id} className="rounded-3xl border border-slate-800 bg-slate-950 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-100">{device.deviceCode}</p>
                      <p className="text-xs text-slate-500">{device.boxName || 'Box belum diisi'}</p>
                    </div>
                    <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{device.components.length} komponen</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    {device.components.map((component) => (
                      <div key={component.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-100">{component.componentName}</p>
                            <p className="text-xs text-slate-500">{component.componentType.toUpperCase()}</p>
                          </div>
                          <div className="text-[11px] text-slate-400">{component.unit || component.dataType}</div>
                        </div>
                        <p className="mt-3 text-slate-300 text-[13px]">Topic: <span className="font-mono text-[11px] text-cyan-300 break-all">{component.mqttTopic}</span></p>
                        <p className="mt-2 text-slate-200 text-sm">Nilai terakhir: <span className="font-semibold">{component.lastValue ?? '-'}</span></p>
                        {component.lastRecordedAt && (
                          <p className="mt-1 text-[11px] text-slate-500">Diperbarui: {new Date(component.lastRecordedAt).toLocaleString('id-ID')}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold">Kontrol Aktuator</h2>
            <p className="text-xs text-slate-500">Tampilan status diambil dari konfigurasi perangkat yang dibuat oleh admin.</p>
          </div>
          {devices.flatMap((device) => device.components.filter((component) => component.componentType === 'actuator')).length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-slate-400">
              Tidak ada aktuator terdaftar untuk perangkat ini.
            </div>
          ) : (
            <div className="space-y-3">
              {devices.flatMap((device) => device.components)
                .filter((component) => component.componentType === 'actuator')
                .map((component) => (
                  <div key={component.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{component.componentName}</p>
                      <p className="text-xs text-slate-500">{component.mqttTopic}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleActuator(component.id)}
                      className="rounded-full border border-slate-700 bg-slate-900 p-2"
                    >
                      {actuatorState[component.id] ? <ToggleRight className="w-10 h-10 text-emerald-400" /> : <ToggleLeft className="w-10 h-10 text-slate-500" />}
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4 text-slate-300">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-sm uppercase tracking-wider">Riwayat Telemetri Terakhir</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase">
                <th className="py-3 px-2">Waktu</th>
                <th className="py-3 px-2">Perangkat</th>
                <th className="py-3 px-2">Komponen</th>
                <th className="py-3 px-2">Nilai</th>
                <th className="py-3 px-2">Topic</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">Memuat data log...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">Belum ada log MQTT tersedia.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/10">
                    <td className="py-3 px-2 font-mono text-xs">{new Date(log.recorded_at).toLocaleTimeString('id-ID')}</td>
                    <td className="py-3 px-2 font-semibold text-slate-100">{log.deviceCode}</td>
                    <td className="py-3 px-2">{log.componentName}</td>
                    <td className="py-3 px-2 text-cyan-300">{log.value}</td>
                    <td className="py-3 px-2 font-mono text-[11px] text-slate-500">{log.mqttTopic}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
