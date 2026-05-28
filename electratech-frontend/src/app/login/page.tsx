'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, Sprout, Truck, ShieldAlert, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<'PRODUSEN' | 'KURIR' | 'ADMIN'>('PRODUSEN');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Skenario Simulasi Autentikasi Sementara sebelum integrasi API Backend
    alert(`Login berhasil sebagai ${role}!`);
    
    if (role === 'PRODUSEN') {
      router.push('/produsen');
    } else if (role === 'KURIR') {
      router.push('/kurir');
    } else {
      router.push('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-white">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl shadow-black/40">
        
        {/* Header Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent tracking-tight">
            ELECTRA TECH
          </h1>
          <p className="text-xs text-slate-400 mt-2 tracking-wide uppercase">
            Seed Supply Chain & IoT System
          </p>
        </div>

        {/* Tab Pilihan Role */}
        <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800/80 mb-6">
          <button
            type="button"
            onClick={() => setRole('PRODUSEN')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
              role === 'PRODUSEN'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sprout className="w-4 h-4" /> Penakar Benih
          </button>
          <button
            type="button"
            onClick={() => setRole('KURIR')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
              role === 'KURIR'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Truck className="w-4 h-4" /> Kurir Logistik
          </button>
          <button
            type="button"
            onClick={() => setRole('ADMIN')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
              role === 'ADMIN'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Admin
          </button>
        </div>

        {/* Form Input */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username Anda"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
                required
              />
            </div>
          </div>

          {/* Tombol Submit */}
          <button
            type="submit"
            className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all shadow-lg mt-4 ${
              role === 'PRODUSEN'
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/10'
                : role === 'KURIR'
                  ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/10'
                  : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/10'
            }`}
          >
            Masuk ke Dashboard
          </button>
        </form>

        {/* Footer Notice */}
        <div className="mt-6 pt-4 border-t border-slate-800/60 text-center text-[10px] text-slate-500 flex items-center justify-center gap-1">
          <ShieldAlert className="w-3 h-3" /> Hak akses dipantau oleh TraceChain Ledger.
        </div>

      </div>
    </div>
  );
}
