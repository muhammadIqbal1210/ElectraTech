'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Cpu,
  Edit3,
  Plus,
  ShieldCheck,
  Trash2,
  UserRound,
  Waves,
  Wifi,
} from 'lucide-react';
import { apiRequest, type ApiUser } from '@/lib/api';

type ComponentType = 'sensor' | 'actuator';
type DataType = 'number' | 'boolean' | 'string';

type ComponentDraft = {
  id: number;
  componentType: ComponentType;
  componentName: string;
  unit: string;
  isActive: boolean;
};

type DeviceComponent = ComponentDraft & {
  id: number;
  dataType: DataType;
  mqttTopic: string;
};

type UserProfile = {
  id: string;
  name: string;
  username: string;
  role: ApiUser['role'];
  status?: 'ACTIVE' | 'REVIEW' | 'DISABLED';
};

type IotDevice = {
  id: number;
  user_id: string;
  device_code: string;
  box_name: string;
  created_at: string;
  components: DeviceComponent[];
};

const emptyComponent = (): ComponentDraft => ({
  id: Date.now(),
  componentType: 'sensor',
  componentName: '',
  unit: '',
  isActive: true,
});

export default function ControlIoTPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [devices, setDevices] = useState<IotDevice[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deviceCode, setDeviceCode] = useState('DEV-IO-001');
  const [boxName, setBoxName] = useState('Box Nursery A3');
  const [components, setComponents] = useState<ComponentDraft[]>([emptyComponent()]);

  useEffect(() => {
    const loadUsers = async () => {
      setLoadingUsers(true);
      setMessage('');

      try {
        const response = await apiRequest<UserProfile[]>('/api/admin/users');
        const data = response.data || [];
        const producers = data.filter((user) => user.role === 'PRODUSEN');

        setUsers(data);
        if (producers.length > 0) {
          setSelectedUserId((current) => current || producers[0].id);
        }
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Gagal memuat data user dari database.');
      } finally {
        setLoadingUsers(false);
      }
    };

    void loadUsers();
  }, []);

  useEffect(() => {
    if (!selectedUserId) return;

    const loadDevices = async () => {
      setLoadingDevices(true);
      setMessage('');

      try {
        const response = await apiRequest<IotDevice[]>(`/api/admin/devices?userId=${encodeURIComponent(selectedUserId)}`);
        setDevices(response.data || []);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Gagal memuat perangkat dari database.');
      } finally {
        setLoadingDevices(false);
      }
    };

    void loadDevices();
  }, [selectedUserId]);

  const penakarUsers = useMemo(() => users.filter((user) => user.role === 'PRODUSEN'), [users]);

  const selectedUser = useMemo(
    () => penakarUsers.find((user) => user.id === selectedUserId) ?? penakarUsers[0] ?? null,
    [penakarUsers, selectedUserId],
  );

  const addComponentField = () => {
    setComponents((prev) => [...prev, { ...emptyComponent(), id: Date.now() + prev.length }]);
  };

  const updateComponentField = (
    id: number,
    field: 'componentType' | 'componentName' | 'unit',
    value: string,
  ) => {
    setComponents((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        if (field === 'componentType') {
          const componentType = value as ComponentType;

          return {
            ...item,
            componentType,
            unit: componentType === 'actuator' ? '' : item.unit,
          };
        }

        return { ...item, [field]: value };
      }),
    );
  };

  const removeComponentField = (id: number) => {
    setComponents((prev) => prev.filter((item) => item.id !== id));
  };

  const resetForm = () => {
    setEditingId(null);
    setDeviceCode('');
    setBoxName('');
    setComponents([emptyComponent()]);
  };

  const buildPayload = () => ({
    userId: selectedUserId,
    deviceCode: deviceCode.trim(),
    boxName: boxName.trim(),
    components: components.map((component) => ({
      componentType: component.componentType,
      componentName: component.componentName.trim(),
      unit: component.componentType === 'sensor' ? component.unit.trim() || null : null,
      isActive: component.isActive,
    })),
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedUserId || !deviceCode.trim() || !boxName.trim()) {
      setMessage('User, device code, dan nama box wajib diisi.');
      return;
    }

    const invalidComponent = components.some((component) => !component.componentName.trim());

    if (invalidComponent) {
      setMessage('Nama komponen wajib diisi.');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const path = editingId ? `/api/admin/devices/${editingId}` : '/api/admin/devices';
      const response = await apiRequest<IotDevice>(path, {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(buildPayload()),
      });

      if (response.data) {
        setDevices((prev) =>
          editingId
            ? prev.map((item) => (item.id === editingId ? response.data as IotDevice : item))
            : [response.data as IotDevice, ...prev],
        );
      }

      resetForm();
      setMessage(editingId ? 'Perangkat berhasil diperbarui.' : 'Perangkat berhasil didaftarkan.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal menyimpan perangkat.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: IotDevice) => {
    setEditingId(item.id);
    setDeviceCode(item.device_code);
    setBoxName(item.box_name);
    setComponents(
      item.components.length > 0
        ? item.components.map((component) => ({
            id: component.id,
            componentType: component.componentType,
            componentName: component.componentName,
            unit: component.unit || '',
            isActive: component.isActive,
          }))
        : [emptyComponent()],
    );
  };

  const handleDelete = async (id: number) => {
    setMessage('');

    try {
      await apiRequest(`/api/admin/devices/${id}`, { method: 'DELETE' });
      setDevices((prev) => prev.filter((item) => item.id !== id));
      if (editingId === id) resetForm();
      setMessage('Perangkat berhasil dihapus.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal menghapus perangkat.');
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.25em] text-cyan-300">
              <Cpu className="h-4 w-4" />
              Admin IoT Control
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">Atur akses perangkat IoT per pengguna</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Pilih user produsen, daftarkan device code dan box, lalu konfigurasi komponen sesuai tabel database.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            <p className="text-[10px] uppercase tracking-[0.25em] text-emerald-300">Status IoT</p>
            <p className="mt-1 font-semibold">{devices.length} perangkat terdaftar</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Konfigurasi akses IoT</p>
            <h2 className="text-xl font-semibold text-slate-100">Perangkat untuk produsen</h2>
            <p className="text-sm text-slate-400">Field form mengikuti tabel devices dan device_components.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-3">
          <label className="space-y-1 text-sm text-slate-300">
            <span>Pilih user produsen</span>
            <select
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none focus:border-cyan-500/50"
              disabled={loadingUsers || saving}
            >
              {penakarUsers.map((user) => (
                <option key={user.id} value={user.id}>{user.name} - {user.role}</option>
              ))}
            </select>
            {loadingUsers && <p className="mt-1 text-xs text-cyan-300">Memuat data user dari database...</p>}
          </label>

          <label className="space-y-1 text-sm text-slate-300">
            <span>Device code</span>
            <input
              value={deviceCode}
              onChange={(event) => setDeviceCode(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-500/50"
              placeholder="DEV-IO-001"
              disabled={saving}
            />
          </label>

          <label className="space-y-1 text-sm text-slate-300">
            <span>Box name</span>
            <input
              value={boxName}
              onChange={(event) => setBoxName(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-500/50"
              placeholder="Box Nursery A3"
              disabled={saving}
            />
          </label>

          <div className="lg:col-span-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-100">Komponen perangkat</h3>
                <p className="text-sm text-slate-400">Data type dan MQTT topic dibuat otomatis saat perangkat disimpan.</p>
              </div>
              <button
                type="button"
                onClick={addComponentField}
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/20"
                disabled={saving}
              >
                <Plus className="h-4 w-4" />
                Tambah komponen
              </button>
            </div>

            <div className="space-y-4">
              {components.map((component, index) => (
                <article key={component.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-100">Komponen #{index + 1}</p>
                    {components.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeComponentField(component.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-100 hover:bg-rose-500/20"
                        disabled={saving}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Hapus
                      </button>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <label className="space-y-1 text-sm text-slate-300">
                      <span>Component type</span>
                      <select
                        value={component.componentType}
                        onChange={(event) => updateComponentField(component.id, 'componentType', event.target.value as ComponentType)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-cyan-500/50"
                        disabled={saving}
                      >
                        <option value="sensor">Sensor</option>
                        <option value="actuator">Actuator</option>
                      </select>
                    </label>

                    <label className="space-y-1 text-sm text-slate-300">
                      <span>Component name</span>
                      <input
                        value={component.componentName}
                        onChange={(event) => updateComponentField(component.id, 'componentName', event.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-cyan-500/50"
                        placeholder={component.componentType === 'sensor' ? 'Sensor Suhu' : 'Pompa Air'}
                        disabled={saving}
                      />
                    </label>

                    <label className="space-y-1 text-sm text-slate-300">
                      <span>Unit</span>
                      <input
                        value={component.unit}
                        onChange={(event) => updateComponentField(component.id, 'unit', event.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none placeholder:text-slate-500 focus:border-cyan-500/50 disabled:text-slate-600"
                        placeholder="C / % / lux"
                        disabled={saving || component.componentType === 'actuator'}
                      />
                    </label>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:col-span-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving}
            >
              <Plus className="h-4 w-4" />
              {saving ? 'Menyimpan...' : editingId ? 'Simpan perubahan' : 'Simpan dan daftarkan perangkat'}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-200"
                disabled={saving}
              >
                Batal edit
              </button>
            ) : null}
            {message && <p className="text-sm text-slate-300">{message}</p>}
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Data perangkat IoT</p>
            <h2 className="text-xl font-semibold text-slate-100">Daftar perangkat aktif untuk {selectedUser?.name ?? 'Produsen'}</h2>
            <p className="text-sm text-slate-400">Data diambil dari tabel devices dan device_components.</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300">
            <span className="font-semibold text-cyan-300">{devices.length}</span> perangkat aktif
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70">
          {loadingDevices ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-6 text-sm text-slate-400">
              Memuat perangkat dari database...
            </div>
          ) : devices.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-6 text-sm text-slate-400">
              Belum ada perangkat IoT yang ditambahkan untuk user ini.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
              <thead className="bg-slate-900/80 text-[11px] uppercase tracking-[0.25em] text-slate-400">
                <tr>
                  <th className="px-4 py-3">Device code</th>
                  <th className="px-4 py-3">Box name</th>
                  <th className="px-4 py-3">Komponen</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-200">
                {devices.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/80">
                    <td className="px-4 py-4 font-mono text-xs text-cyan-300">{item.device_code}</td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-100">{item.box_name}</p>
                      <p className="text-xs text-slate-400">User aktif - {selectedUser?.name ?? 'Produsen'}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-300">
                      <div className="space-y-1">
                        {item.components.map((component) => (
                          <p key={component.id} className="text-xs">
                            <span className="font-semibold text-slate-100">{component.componentName}</span>
                            <span className="text-slate-500"> / {component.componentType} / {component.dataType}</span>
                            <span className="block font-mono text-[11px] text-cyan-300">{component.mqttTopic}</span>
                          </p>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
                        <Wifi className="mr-1 h-3 w-3" />
                        Aktif
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="inline-flex items-center gap-1 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/20"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="inline-flex items-center gap-1 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-100 hover:bg-rose-500/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <UserRound className="h-4 w-4 text-cyan-400" />
            Profil user
          </div>
          <p className="mt-3 text-lg font-semibold text-slate-100">{selectedUser?.name}</p>
          <p className="text-sm text-slate-400">{selectedUser?.role}</p>
        </article>
        <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Keamanan
          </div>
          <p className="mt-3 text-sm text-slate-300">Akses perangkat disimpan memakai relasi user_id pada tabel devices.</p>
        </article>
        <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Waves className="h-4 w-4 text-violet-400" />
            Status perangkat
          </div>
          <p className="mt-3 text-sm text-slate-300">Setiap komponen bisa dipakai untuk telemetri iot_logs lewat component_id.</p>
        </article>
      </section>
    </div>
  );
}
