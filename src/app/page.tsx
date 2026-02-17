'use client';

import { useState, useEffect } from 'react';
import apiClient from '../lib/api';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2, Eye, EyeOff, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    setCaptchaCode(code);
    setCaptchaInput('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (captchaInput.toUpperCase() !== captchaCode) {
      setError('Captcha belum sesuai.');
      generateCaptcha();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response: any = await apiClient.post('/login', {
        username,
        password,
        device_model: 'Admin Web',
      });

      if (response && response.token) {
        localStorage.setItem('patrol_token', response.token);
        localStorage.setItem('patrol_user', JSON.stringify(response.data));
        router.push('/dashboard');
      } else {
        setError('Login gagal. Coba lagi.');
      }
    } catch (err: any) {
      if (err.response) {
        setError(err.response.data?.detail || 'Terjadi kesalahan pada server.');
      } else {
        setError('Gagal menghubungi server. Pastikan backend aktif.');
      }
      generateCaptcha(); // Refresh captcha on failure
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white border border-gray-200 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col lg:flex-row w-full overflow-hidden h-screen">

        {/* Left Side - Hero / Illustration */}
        <div className="hidden lg:flex w-full lg:w-1/2 flex-col justify-center items-center bg-brand-500/5 dark:bg-brand-500/10 p-12 relative overflow-hidden">

          {/* Gradient Orbs for background effect */}
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-500/20 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="relative z-10 text-center max-w-lg">
            <div className="mb-8 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white shadow-lg text-brand-500">
              <ShieldCheck size={48} />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              K3Guard System Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
              Kelola patroli keamanan, absensi personel, dan laporan insiden dalam satu platform terintegrasi yang cerdas dan efisien.
            </p>

            <div className="mt-12 grid grid-cols-2 gap-4 text-left">
              <div className="bg-white/80 dark:bg-black/20 backdrop-blur-sm p-4 rounded-xl border border-white/50 dark:border-white/10 shadow-sm">
                <div className="font-bold text-gray-900 dark:text-white mb-1">Real-time Monitoring</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Pantau pergerakan tim patroli secara langsung</div>
              </div>
              <div className="bg-white/80 dark:bg-black/20 backdrop-blur-sm p-4 rounded-xl border border-white/50 dark:border-white/10 shadow-sm">
                <div className="font-bold text-gray-900 dark:text-white mb-1">Laporan Akurat</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Data absensi dan insiden tersaji lengkap</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-4 sm:p-12 bg-white dark:bg-gray-900">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center lg:text-left">
              <div className="lg:hidden inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-50 dark:bg-white/10 text-brand-500 mb-4">
                <ShieldCheck size={28} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                Sign In to K3Guard
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Masukkan kredensial Anda untuk mengakses dashboard admin.
              </p>
            </div>

            {error && (
              <div className="p-4 rounded-lg bg-red-50 text-red-600 border border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 text-sm">
                {error}
              </div>
            )}

            <form className="mt-8 space-y-6" onSubmit={handleLogin}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Username atau Email
                  </label>
                  <div className="relative">
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      autoFocus
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-5 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none transition-colors"
                      placeholder="Masukkan username"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-5 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none transition-colors"
                      placeholder="Masukkan password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Captcha Verification
                  </label>
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        required
                        value={captchaInput}
                        onChange={(e) => setCaptchaInput(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-5 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none transition-colors uppercase"
                        placeholder="Input kode"
                      />
                    </div>
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-4 border border-gray-200 dark:border-gray-700 min-w-[140px] justify-between">
                      <span className="font-mono text-lg font-bold tracking-widest text-gray-800 dark:text-gray-200 select-none">
                        {captchaCode}
                      </span>
                      <button
                        type="button"
                        onClick={generateCaptcha}
                        className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                        title="Refresh Captcha"
                      >
                        <RefreshCw size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Ingat saya
                  </label>
                </div>
                {/* <div className="text-sm">
                  <a href="#" className="font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400">
                    Lupa password?
                  </a>
                </div> */}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative flex w-full justify-center rounded-lg bg-brand-500 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:bg-brand-400 transition-all shadow-lg shadow-brand-500/20"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Memproses...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </div>
            </form>

            {/* <div className="text-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Belum punya akun?</span>{' '}
                <Link href="#" className="font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-400 transition-colors">
                    Hubungi Admin
                </Link>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}
