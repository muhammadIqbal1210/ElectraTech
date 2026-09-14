'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, ShieldCheck, Sprout, Truck, UserPlus, Users, X } from 'lucide-react';
import { apiRequest, Role } from '@/lib/api';

type UserRow = {
  id: string;
  name: string;
  username: string;
  role: Role;
  status: 'ACTIVE' | 'REVIEW' | 'DISABLED';
};

const roleLabel: Record<Role, string> = {
  ADMIN: 'Admin',
  PRODUSEN: 'Penakar Benih',
  KURIR: 'Kurir',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('PRODUSEN');
  const [status, setStatus] = useState<'ACTIVE' | 'REVIEW' | 'DISABLED'>('ACTIVE');
  const [editingUserId, setEditingUserId] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const roleStats = useMemo(() => [
    { label: 'Admin', value: users.filter((user) => user.role === 'ADMIN').length, icon: ShieldCheck, color: 'text-cyan-400' },
    { label: 'Penakar', value: users.filter((user) => user.role === 'PRODUSEN').length, icon: Sprout, color: 'text-emerald-400' },
    { label: 'Kurir', value: users.filter((user) => user.role === 'KURIR').length, icon: Truck, color: 'text-purple-400' },
  ], [users]);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await apiRequest<UserRow[]>('/api/admin/users');
      setUsers(response.data || []);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal mengambil data user.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadUsers);
  }, [loadUsers]);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUserId('');
    setName('');
    setUsername('');
    setPassword('');
    setRole('PRODUSEN');
    setStatus('ACTIVE');
  };

  const openAddModal = () => {
    closeModal();
    setIsModalOpen(true);
  };

  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');

    try {
      await apiRequest<UserRow>('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({ name, username, password, role }),
      });
      closeModal();
      setMessage('User baru berhasil dibuat.');
      await loadUsers();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal membuat user.');
    }
  };

  const startEdit = (user: UserRow) => {
    setEditingUserId(user.id);
    setName(user.name);
    setUsername(user.username);
    setPassword('');
    setRole(user.role);
    setStatus(user.status);
    setIsModalOpen(true);
  };

  const handleUpdateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');

    try {
      await apiRequest<UserRow>(`/api/admin/users/${editingUserId}`, {
        method: 'PUT',
        body: JSON.stringify({ name, username, password: password || undefined, role, status }),
      });
      closeModal();
      setMessage('User berhasil diperbarui.');
      await loadUsers();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal memperbarui user.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white">
            Manajemen User
          </h1>
          <p className="mt-1 text-sm text-slate-400">Kelola akses admin, penakar benih, dan kurir logistik.</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-500"
        >
          <UserPlus className="h-4 w-4" />
          Tambah User
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {roleStats.map((stat) => {
          return (
            <div key={stat.label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="mt-4 text-3xl font-semibold text-white">{stat.value}</p>
              <p className="text-xs uppercase tracking-wider text-slate-500">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {message && <p className="text-sm font-semibold text-cyan-300 bg-slate-900 border border-slate-800 p-3 rounded-xl">{message}</p>}

      {/* Modal Form Tambah / Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {editingUserId ? <Pencil className="h-5 w-5 text-cyan-400" /> : <UserPlus className="h-5 w-5 text-cyan-400" />}
                {editingUserId ? 'Edit Data User' : 'Tambah User Baru'}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-white transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={editingUserId ? handleUpdateUser : handleCreateUser} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Nama Lengkap</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
                  placeholder="Contoh: Ahmad Rizki"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Username</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
                  placeholder="ahmad123"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
                  >
                    <option value="PRODUSEN">Penakar Benih</option>
                    <option value="KURIR">Kurir</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'REVIEW' | 'DISABLED')}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
                  >
                    <option value="ACTIVE">Aktif</option>
                    <option value="REVIEW">Ditinjau</option>
                    <option value="DISABLED">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">
                  {editingUserId ? 'Password Baru (Kosongkan jika tidak diubah)' : 'Password'}
                </label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
                  placeholder="******"
                  required={!editingUserId}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-cyan-500"
                >
                  {editingUserId ? 'Simpan' : 'Tambah User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                <th className="pb-3">ID</th>
                <th className="pb-3">Nama</th>
                <th className="pb-3">Username</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading && (
                <tr>
                  <td className="py-4 text-slate-400" colSpan={6}>Memuat data user...</td>
                </tr>
              )}
              {!isLoading && users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-800/20">
                  <td className="py-4 font-mono text-xs text-cyan-300">{user.id}</td>
                  <td className="py-4 font-semibold text-slate-300">{user.name}</td>
                  <td className="py-4 font-mono text-xs text-slate-400">{user.username}</td>
                  <td className="py-4 text-slate-400">{roleLabel[user.role]}</td>
                  <td className="py-4">
                    <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-400">
                      {user.status}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <button onClick={() => startEdit(user)} className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-bold text-cyan-300 transition hover:bg-slate-800">
                      <Pencil className="h-3 w-3" />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
