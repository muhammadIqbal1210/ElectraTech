'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';
import { loginUser } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedUsername = localStorage.getItem('electra_remember_username');
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const trimmedInput = username.trim();
      // Support username directly or stripped from email if entered
      const normalizedUsername = trimmedInput.includes('@')
        ? trimmedInput.split('@')[0]
        : trimmedInput;

      let user;
      try {
        user = await loginUser(normalizedUsername, password);
      } catch (err) {
        if (trimmedInput !== normalizedUsername) {
          user = await loginUser(trimmedInput, password);
        } else {
          throw err;
        }
      }

      if (rememberMe) {
        localStorage.setItem('electra_remember_username', username);
      } else {
        localStorage.removeItem('electra_remember_username');
      }

      if (user.role === 'PRODUSEN') {
        router.push('/produsen');
      } else if (user.role === 'KURIR') {
        router.push('/kurir');
      } else {
        router.push('/admin');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal. Periksa kembali username dan password Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#070b14] flex items-center justify-center p-4 relative overflow-hidden font-sans text-slate-100">
      {/* Background ambient radial glow matching design */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-emerald-500/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-[420px] bg-[#0e1626]/95 border border-slate-800/80 rounded-[28px] p-7 sm:p-9 shadow-2xl shadow-black/80 backdrop-blur-xl">
        
        {/* Header with Electra Logo & Brand */}
        <div className="flex items-center justify-center gap-2.5 mb-5">
          <div>
            <Image
              src="/logoelectra.png"
              alt="Electra Logo"
              width={48}
              height={48}
              className="w-full h-full object-contain"
              priority
            />
          </div>
        </div>

        {/* Title and Subtitle */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-medium text-white tracking-tight">
            Log in to your account
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
            Welcome back! Please enter your details.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email Field */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-200 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full bg-[#131d2e] border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/80 transition-all"
              required
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-200 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#131d2e] border border-slate-700/60 rounded-xl px-4 py-3 pr-11 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/80 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-slate-400" />
                ) : (
                  <Eye className="w-4 h-4 text-slate-400" />
                )}
              </button>
            </div>
          </div>

          {/* Remember me & Forgot password */}
          <div className="flex items-center justify-between text-xs sm:text-sm pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-400 hover:text-slate-300 transition-colors">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-[#131d2e] text-emerald-500 focus:ring-0 focus:ring-offset-0 accent-emerald-500 cursor-pointer"
              />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => alert('Fitur reset password dapat menghubungi administrator sistem Electra.')}
              className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              Forgot password?
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs font-medium text-rose-300 animate-fadeIn">
              {error}
            </div>
          )}

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-[#22c55e] hover:bg-[#16a34a] text-slate-100 font-medium rounded-xl text-sm transition-all shadow-lg shadow-emerald-950/20 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-7 text-center text-xs sm:text-sm text-slate-400">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            onClick={() => alert('Pendaftaran akun baru dikelola oleh administrator Electra.')}
            className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors inline-block"
          >
            Sign up
          </button>
        </div>

      </div>
    </div>
  );
}
