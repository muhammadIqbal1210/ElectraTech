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

type ComponentType = 'SENSOR' | 'AKTUATOR';

type ComponentDraft = {
  id: number;
  type: ComponentType;
  name: string;
  unit: string;
  pin: string;
};

type UserProfile = {
  id: string;
  name: string;
  username: string;
  role: ApiUser['role'];
  email?: string;
  area?: string;
  status?: 'Aktif' | 'Review' | 'Pending';
};

type IotAccess = {
  id: number;
  userId: string;
  deviceName: string;
  deviceType: string;
  location: string;
};

const initialAssignments: IotAccess[] = [
  {
    id: 101,
    userId: '1',
    deviceName: 'SmartLink Sensor A3',
    deviceType: 'Sensor Suhu & Kelembaban',
    location: 'Greenhouse A3',
  },
  {
    id: 102,
    userId: '1',
    deviceName: 'Pompa UV Nursery',
    deviceType: 'Aktuator Pompa',
    location: 'Blok Nursery',
  },
  {
    id: 103,
    userId: '2',
    deviceName: 'Gateway Distribusi 07',
    deviceType: 'Gateway Logistik',
    location: 'Rute Timur',
  },
];


export default function ControlIoTPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [iotAssignments, setIotAssignments] = useState(initialAssignments);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deviceId, setDeviceId] = useState('DEV-IO-001');
  const [boxName, setBoxName] = useState('Box Nursery A3');
  const [components, setComponents] = useState<ComponentDraft[]>([
    { id: 1, type: 'SENSOR', name: '', unit: '', pin: '' },
  ]);
  const [form, setForm] = useState({
    deviceName: 'SmartLink Sensor A3',
    deviceType: 'Sensor Suhu & Kelembaban',
    location: 'Greenhouse A3',
  });

  useEffect(() => {
    const loadUsers = async () => {
      setLoadingUsers(true);
      setMessage('');

      try {
        const response = await apiRequest<UserProfile[]>('/api/admin/users');
        const data: UserProfile[] = (response.data || []).map((user) => ({
          ...user,
          area: user.username ? `User ${user.username}` : 'Penakar',
          status: 'Aktif' as UserProfile['status'],
        }));

        setUsers(data);
        if (data.length > 0) {
          setSelectedUserId((current) => current || data[0].id);
        }
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Gagal memuat data user dari database.');
      } finally {
        setLoadingUsers(false);
      }
    };

    void loadUsers();
  }, []);

  const penakarUsers = useMemo(() => users.filter((user) => user.role === 'PRODUSEN'), [users]);

  const selectedUser = useMemo(
    () => penakarUsers.find((user) => user.id === selectedUserId) ?? penakarUsers[0] ?? null,
    [penakarUsers, selectedUserId],
  );

  const userAssignments = useMemo(
    () => iotAssignments.filter((item) => item.userId === selectedUserId),
    [iotAssignments, selectedUserId],
  );

  const addComponentField = () => {
    setComponents((prev) => [
      ...prev,
      { id: Date.now() + prev.length, type: 'SENSOR', name: '', unit: '', pin: '' },
    ]);
  };

  const updateComponentField = (id: number, field: keyof ComponentDraft, value: string) => {
    setComponents((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  };

  const removeComponentField = (id: number) => {
    setComponents((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.deviceName.trim() || !form.deviceType.trim()) {
      return;
    }

    if (editingId) {
      setIotAssignments((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? { ...item, ...form, userId: selectedUserId }
            : item,
        ),
      );
    } else {
      const newDevice: IotAccess = {
        id: Date.now(),
        userId: selectedUserId,
        ...form,
      };

      setIotAssignments((prev) => [newDevice, ...prev]);
    }

    setEditingId(null);
    setForm({
      deviceName: '',
      deviceType: '',
      location: '',
    });
  };

  const handleEdit = (item: IotAccess) => {
    setEditingId(item.id);
    setForm({
      deviceName: item.deviceName,
      deviceType: item.deviceType,
      location: item.location,
    });
  };

  const handleDelete = (id: number) => {
    setIotAssignments((prev) => prev.filter((item) => item.id !== id));
    if (editingId === id) {
      setEditingId(null);
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
              Pilih user dari data admin, konfigurasi perangkat yang bisa diakses, lalu lihat daftar IoT yang aktif untuk tiap user di bawah ini.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            <p className="text-[10px] uppercase tracking-[0.25em] text-emerald-300">Status IoT</p>
            <p className="mt-1 font-semibold">{iotAssignments.length} perangkat terdaftar</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-1">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Konfigurasi akses IoT</p>
                <h2 className="text-xl font-semibold text-slate-100">Perangkat untuk penakar</h2>
                <p className="text-sm text-slate-400">Pilih user penakar, isi device ID, nama box/lokasi, lalu tambahkan komponen sensor atau aktuator di bawahnya.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-3">
              <label className="space-y-1 text-sm text-slate-300 lg:col-span-1">
                <span>Pilih user penakar</span>
                <select
                  value={selectedUserId}
                  onChange={(event) => setSelectedUserId(event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none focus:border-cyan-500/50"
                  disabled={loadingUsers}
                >
                  {penakarUsers.map((user) => (
                    <option key={user.id} value={user.id}>{user.name} — {user.role}</option>
                  ))}
                </select>
                {loadingUsers && <p className="mt-1 text-xs text-cyan-300">Memuat data user dari database...</p>}
                {message && <p className="mt-1 text-xs text-rose-300">{message}</p>}
              </label>

              <label className="space-y-1 text-sm text-slate-300">
                <span>Device ID</span>
                <input
                  value={deviceId}  
                  onChange={(event) => setDeviceId(event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-500/50"
                  placeholder="DEV-IO-001"
                />
              </label>

              <label className="space-y-1 text-sm text-slate-300">
                <span>Nama box / lokasi</span>
                <input
                  value={boxName}
                  onChange={(event) => setBoxName(event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-500/50"
                  placeholder="Box Nursery A3"
                />
              </label>

              <div className="lg:col-span-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-100">Tambah komponen</h3>
                    <p className="text-sm text-slate-400">Sensor menampilkan unit, aktuator tidak memakai satuan.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addComponentField}
                    className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/20"
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
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Hapus
                          </button>
                        )}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <label className="space-y-1 text-sm text-slate-300">
                          <span>Tipe komponen</span>
                          <select
                            value={component.type}
                            onChange={(event) => updateComponentField(component.id, 'type', event.target.value as ComponentType)}
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-cyan-500/50"
                          >
                            <option value="SENSOR">Sensor</option>
                            <option value="AKTUATOR">Aktuator</option>
                          </select>
                        </label>

                        <label className="space-y-1 text-sm text-slate-300">
                          <span>{component.type === 'SENSOR' ? 'Nama alat / sensor' : 'Nama alat / aktuator'}</span>
                          <input
                            value={component.name}
                            onChange={(event) => updateComponentField(component.id, 'name', event.target.value)}
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-cyan-500/50"
                            placeholder={component.type === 'SENSOR' ? 'Contoh: Sensor Suhu' : 'Contoh: Pompa Air'}
                          />
                        </label>

                        {component.type === 'SENSOR' ? (
                          <label className="space-y-1 text-sm text-slate-300">
                            <span>Satuan / unit</span>
                            <input
                              value={component.unit}
                              onChange={(event) => updateComponentField(component.id, 'unit', event.target.value)}
                              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-cyan-500/50"
                              placeholder="°C / % / lux"
                            />
                          </label>
                        ) : null}

                        <label className="space-y-1 text-sm text-slate-300">
                          <span>Konfigurasi pin</span>
                          <input
                            value={component.pin}
                            onChange={(event) => updateComponentField(component.id, 'pin', event.target.value)}
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-cyan-500/50"
                            placeholder="D4 / A0 / GPIO17"
                          />
                        </label>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 lg:col-span-3">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                >
                  <Plus className="h-4 w-4" />
                  {editingId ? 'Simpan perubahan' : 'Simpan dan daftarkan perangkat'}
                </button>
                {editingId ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setForm({
                        deviceName: '',
                        deviceType: '',
                        location: '',
                      });
                    }}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-200"
                  >
                    Batal edit
                  </button>
                ) : null}
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Data user & IoT yang bisa diakses</p>
                <h2 className="text-xl font-semibold text-slate-100">Daftar perangkat aktif untuk {selectedUser?.name ?? 'Penakar'}</h2>
                <p className="text-sm text-slate-400">Di bawah ini adalah daftar perangkat yang sudah diizinkan untuk user terpilih, lengkap dengan tombol edit dan hapus.</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300">
                <span className="font-semibold text-cyan-300">{userAssignments.length}</span> perangkat aktif
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70">
              {userAssignments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-6 text-sm text-slate-400">
                  Belum ada perangkat IoT yang ditambahkan untuk user ini.
                </div>
              ) : (
                <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
                  <thead className="bg-slate-900/80 text-[11px] uppercase tracking-[0.25em] text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Device ID</th>
                      <th className="px-4 py-3">Nama perangkat</th>
                      <th className="px-4 py-3">Jenis</th>
                      <th className="px-4 py-3">Lokasi</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-200">
                    {userAssignments.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-900/80">
                        <td className="px-4 py-4 font-mono text-xs text-cyan-300">#{item.id}</td>
                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-100">{item.deviceName}</p>
                          <p className="text-xs text-slate-400">User aktif • {selectedUser?.name ?? 'Penakar'}</p>
                        </td>
                        <td className="px-4 py-4 text-slate-300">{item.deviceType}</td>
                        <td className="px-4 py-4 text-slate-300">{item.location}</td>
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
              <p className="mt-3 text-sm text-slate-300">Akses dibuat berdasarkan role dan area operasional yang dipilih oleh admin.</p>
            </article>
            <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Waves className="h-4 w-4 text-violet-400" />
                Status perangkat
              </div>
              <p className="mt-3 text-sm text-slate-300">Semua perangkat menampilkan status real-time untuk memudahkan monitoring admin.</p>
            </article>
          </section>
        </div>
      </section>
    </div>
  );
}
