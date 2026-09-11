import React, { useState } from 'react';
import {
  Shield,
  Lock,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  Users,
  Briefcase,
  Eye as EyeIcon,
  Crown,
  KeyRound,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { AppUser } from '../types';
import { INITIAL_USERS } from '../data/defaultUsers';
import { apiClient } from '../services/apiClient';

interface LoginPageProps {
  onLoginSuccess: (user: AppUser) => void;
  availableUsers?: AppUser[];
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, availableUsers = INITIAL_USERS }) => {
  const [username, setUsername] = useState('master_admin');
  const [password, setPassword] = useState('admin8888');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'LOGIN' | 'QUICK_ACCOUNTS'>('LOGIN');

  // Quick select user to prefill
  const handleSelectQuickUser = (user: AppUser) => {
    setUsername(user.username);
    setPassword(user.password || '123456');
    setErrorMessage('');
    // Auto login for seamless testing experience
    handleDoLogin(user.username, user.password || '123456');
  };

  const handleDoLogin = async (loginUser: string, loginPass: string) => {
    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await apiClient.login(loginUser.trim(), loginPass.trim());
      if (res.success && res.user) {
        // Save to localStorage for persistent session
        localStorage.setItem('ideva_crm_current_user', JSON.stringify(res.user));
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err: any) {
      // Fallback: match in local available users
      const matched = availableUsers.find(
        (u) => u.username.toLowerCase() === loginUser.trim().toLowerCase()
      );
      if (matched) {
        if (matched.status === 'SUSPENDED') {
          setErrorMessage('บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ');
        } else if (matched.password && matched.password !== loginPass.trim()) {
          setErrorMessage('รหัสผ่านไม่ถูกต้อง');
        } else {
          localStorage.setItem('ideva_crm_current_user', JSON.stringify(matched));
          onLoginSuccess(matched);
          return;
        }
      } else {
        setErrorMessage('ไม่พบบัญชีผู้ใช้งานนี้ในระบบ');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMessage('กรุณาระบุชื่อผู้ใช้งาน (User Login)');
      return;
    }
    handleDoLogin(username, password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0B3B8C] to-slate-900 flex items-center justify-center p-4 selection:bg-blue-500 selection:text-white">
      {/* Ambient background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden p-6 sm:p-10 transition-all">
        {/* Brand Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0B3B8C] to-blue-600 text-white shadow-lg shadow-blue-900/30 mb-2">
            <span className="font-extrabold text-2xl tracking-wider">CRM</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            IDEVA OS Enterprise
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            ระบบบริหารลูกค้าสัมพันธ์ & ติดตามคำสั่งซื้อ (Customer Lifecycle & RBAC)
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('LOGIN')}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'LOGIN'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock size={14} /> เข้าสู่ระบบด้วยรหัสผ่าน
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('QUICK_ACCOUNTS')}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'QUICK_ACCOUNTS'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles size={14} className="text-amber-500" /> บัญชีทดสอบระบบ (1-Click Roles)
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs font-semibold animate-shake">
            <AlertCircle size={18} className="flex-shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {activeTab === 'LOGIN' ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username / User Login */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                ชื่อผู้ใช้งาน (User Login / Username)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="เช่น master_admin, sales_a, admin"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">
                  รหัสเข้าใช้งาน (Password)
                </label>
                <span className="text-[11px] text-blue-600 hover:underline cursor-pointer">
                  เริ่มต้น: admin8888, sales1234
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านของคุณ"
                  className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-6 bg-[#0B3B8C] hover:bg-blue-800 active:scale-[0.99] text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>เข้าสู่ระบบ (Sign In to CRM)</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 mb-2">
              คลิกเพื่อเข้าสู่ระบบตามสิทธิ์ที่ต้องการทดสอบทันที:
            </p>

            <div className="grid grid-cols-1 gap-2.5 max-h-96 overflow-y-auto pr-1">
              {availableUsers.map((u) => {
                const isMaster = u.role === 'MASTER_ADMIN';
                const isAdmin = u.role === 'ADMIN';
                const isSales = u.role === 'SALES';
                const isViewer = u.role === 'VIEWER';

                return (
                  <div
                    key={u.id}
                    onClick={() => handleSelectQuickUser(u)}
                    className="p-3 bg-slate-50 hover:bg-blue-50/80 border border-slate-200 hover:border-blue-300 rounded-2xl transition-all cursor-pointer flex items-center justify-between group shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt={u.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
                        }}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 bg-slate-100 flex-shrink-0"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          {u.name}
                          {isMaster && <Crown size={14} className="text-amber-500 fill-amber-500" />}
                          {isAdmin && <Shield size={13} className="text-rose-600" />}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {u.position} • {u.department}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          User: <strong className="text-slate-600">{u.username}</strong> | Pass: {u.password || 'admin8888'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                          isMaster
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : isAdmin
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : isSales
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {u.role}
                      </span>
                      <div className="text-[10px] text-blue-600 font-bold group-hover:translate-x-0.5 transition-transform mt-1 flex items-center gap-0.5 justify-end">
                        เข้าสู่ระบบ <ArrowRight size={11} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Roles explainer footer */}
        <div className="mt-8 pt-5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px] text-slate-500">
          <div className="p-2 rounded-xl bg-amber-50/60 border border-amber-100">
            <span className="font-bold text-amber-900 block">👑 Master Admin</span>
            <span>เข้าได้ทุกฟังก์ชั่น 100%</span>
          </div>
          <div className="p-2 rounded-xl bg-rose-50/60 border border-rose-100">
            <span className="font-bold text-rose-900 block">🛡️ Admin</span>
            <span>จัดการระบบ & ลูกค้า</span>
          </div>
          <div className="p-2 rounded-xl bg-blue-50/60 border border-blue-100">
            <span className="font-bold text-blue-900 block">💼 Sales</span>
            <span>ลูกค้าของตนเอง</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-100 border border-slate-200">
            <span className="font-bold text-slate-800 block">👁️ Viewer</span>
            <span>ดูข้อมูลอย่างเดียว</span>
          </div>
        </div>
      </div>
    </div>
  );
};
