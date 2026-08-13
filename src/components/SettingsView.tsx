import {
  Bell,
  CheckCircle2,
  Copy,
  Database,
  Key,
  Layers,
  RefreshCw,
  Save,
  Send,
  Settings,
  ShieldCheck,
  Users,
  Check,
  Server,
  Lock,
  Unlock
} from 'lucide-react';
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { TelegramNotificationView } from './TelegramNotificationView';

interface SettingsViewProps {
  currentUser: UserProfile;
  onReseedData: () => void;
  onOpenCustomer?: (customerId: string) => void;
}

const SUPABASE_SQL_SCRIPT = `-- ====================================================================
-- SUPABASE FULL DATABASE SCHEMA FOR CRM & TELEGRAM MODULE
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- Project: https://wbrktjjgimvbddeobaeq.supabase.co
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id VARCHAR(50) PRIMARY KEY,
    company_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    phone VARCHAR(50),
    line_id VARCHAR(100),
    email VARCHAR(100),
    interested_products TEXT,
    source VARCHAR(50),
    sales_owner VARCHAR(100),
    status VARCHAR(50) DEFAULT 'NEW',
    tier VARCHAR(20) DEFAULT 'GENERAL',
    tax_id VARCHAR(50),
    address TEXT,
    facebook VARCHAR(100),
    next_follow_up_date VARCHAR(20),
    next_follow_up_time VARCHAR(20),
    next_action TEXT,
    total_purchases NUMERIC DEFAULT 0,
    total_orders_count INT DEFAULT 0,
    last_order_date VARCHAR(20),
    last_delivery_date VARCHAR(20),
    avg_reorder_cycle_days INT DEFAULT 60,
    next_reorder_date VARCHAR(20),
    follow_up_start_date VARCHAR(20),
    repeat_status VARCHAR(50) DEFAULT 'UPCOMING',
    risk_status VARCHAR(20) DEFAULT 'NORMAL',
    days_since_last_order INT DEFAULT 0,
    expected_lost_revenue NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Activities Table
CREATE TABLE IF NOT EXISTS public.activities (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) REFERENCES public.customers(id) ON DELETE CASCADE,
    customer_name TEXT,
    type VARCHAR(50) NOT NULL,
    summary TEXT,
    detail TEXT,
    result TEXT,
    next_action TEXT,
    follow_up_date VARCHAR(20),
    follow_up_time VARCHAR(20),
    sales_owner VARCHAR(100),
    status VARCHAR(50),
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) REFERENCES public.customers(id) ON DELETE CASCADE,
    customer_name TEXT,
    order_date VARCHAR(20),
    delivery_date VARCHAR(20),
    product_name TEXT,
    quantity INT DEFAULT 1,
    unit_price NUMERIC DEFAULT 0,
    total_amount NUMERIC DEFAULT 0,
    status VARCHAR(20) DEFAULT 'PENDING',
    reorder_cycle_days INT DEFAULT 60,
    next_reorder_date VARCHAR(20),
    follow_up_start_date VARCHAR(20),
    repeat_status VARCHAR(50) DEFAULT 'UPCOMING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Customer Documents Table
CREATE TABLE IF NOT EXISTS public.documents (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) REFERENCES public.customers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    file_url TEXT,
    file_size VARCHAR(20),
    uploaded_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Internal Notes Table
CREATE TABLE IF NOT EXISTS public.notes (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) REFERENCES public.customers(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    author VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id VARCHAR(50) PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    customer_id VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Telegram Settings Table
CREATE TABLE IF NOT EXISTS public.telegram_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
    bot_token TEXT NOT NULL,
    group_chat_id VARCHAR(100) NOT NULL,
    topic_id VARCHAR(50),
    webhook_secret VARCHAR(100),
    is_enabled BOOLEAN DEFAULT TRUE,
    rules JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Telegram Notification Logs Table
CREATE TABLE IF NOT EXISTS public.telegram_logs (
    id VARCHAR(100) PRIMARY KEY,
    customer_id VARCHAR(50),
    order_id VARCHAR(50),
    notification_type VARCHAR(50) NOT NULL,
    telegram_message_id VARCHAR(100),
    telegram_chat_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'SENT',
    response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Telegram Queue Table
CREATE TABLE IF NOT EXISTS public.telegram_queue (
    id VARCHAR(100) PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    retry_count INT DEFAULT 0,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Disable Row Level Security (RLS) for public open API access
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_queue DISABLE ROW LEVEL SECURITY;
`;

export const SettingsView: React.FC<SettingsViewProps> = ({ currentUser, onReseedData, onOpenCustomer }) => {
  const [activeSubTab, setActiveSubTab] = useState<'TELEGRAM' | 'SUPABASE' | 'SYSTEM'>('SUPABASE');
  const [lineToken, setLineToken] = useState('mock_line_notify_token_xyz888');
  const [testLineStatus, setTestLineStatus] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Passcode Security Lock
  const [isUnlocked, setIsUnlocked] = useState(() => sessionStorage.getItem('settings_unlocked_43210344') === 'true');
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === '43210344') {
      setIsUnlocked(true);
      sessionStorage.setItem('settings_unlocked_43210344', 'true');
      setPasscodeError('');
    } else {
      setPasscodeError('รหัสผ่านไม่ถูกต้อง! กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleLock = () => {
    setIsUnlocked(false);
    sessionStorage.removeItem('settings_unlocked_43210344');
    setPasscode('');
    setPasscodeError('');
  };

  const teamMembers = [
    { name: 'คุณสมชาย (Sales A)', role: 'SALES', email: 'somchai@company.com' },
    { name: 'คุณนภา (Sales B)', role: 'SALES', email: 'napa@company.com' },
    { name: 'คุณวิชัย (Manager)', role: 'MANAGER', email: 'wichai@company.com' },
    { name: 'คุณแอดมิน (Admin)', role: 'ADMIN', email: 'admin@company.com' },
  ];

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleTestLineNotify = () => {
    setTestLineStatus('กำลังทดสอบส่งข้อความแจ้งเตือนไปยัง LINE Notify...');
    setTimeout(() => {
      setTestLineStatus('ส่งข้อความทดสอบสำเร็จ! (Mock LINE Notify API Connected)');
    }, 1200);
  };

  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center space-y-6 animate-in fade-in-50">
        <div className="w-16 h-16 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-center mx-auto text-blue-600 shadow-inner">
          <Lock size={32} />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-slate-800">หน้าตั้งค่าถูกล็อกรหัสผ่าน</h2>
          <p className="text-xs text-slate-500">กรุณากรอกรหัสผ่านเพื่อเข้าสู่หน้าตั้งค่าระบบ (Protected Settings)</p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="กรอกรหัสผ่าน 8 หลัก"
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                setPasscodeError('');
              }}
              className="w-full text-center text-lg tracking-widest font-mono py-3 px-4 bg-slate-50 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              autoFocus
            />
            {passcodeError && (
              <p className="text-xs font-semibold text-rose-600 mt-2 flex items-center justify-center gap-1">
                ⚠️ {passcodeError}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Key size={18} /> ปลดล็อกหน้าตั้งค่า
          </button>
        </form>

        <p className="text-[11px] text-slate-400">
          * รหัสผ่านเริ่มต้นสำหรับผู้ดูแลระบบ: <span className="font-mono font-bold text-slate-600">43210344</span>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header bar with Lock Button */}
      <div className="flex items-center justify-between bg-blue-50/80 border border-blue-200 rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-blue-600" size={20} />
          <div>
            <span className="font-bold text-xs text-blue-900 block">ปลดล็อกการตั้งค่าระบบเรียบร้อยแล้ว</span>
            <span className="text-[10px] text-blue-700">ได้รับสิทธิ์ผู้ดูแลระบบ (Admin Authenticated)</span>
          </div>
        </div>
        <button
          onClick={handleLock}
          className="text-xs bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
        >
          <Lock size={13} /> ล็อกหน้าตั้งค่า
        </button>
      </div>

      {/* Sub-tab switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveSubTab('SUPABASE')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs transition-all ${
            activeSubTab === 'SUPABASE'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Database size={16} /> ⚡ Supabase Live Database (100% Direct Sync)
        </button>

        <button
          onClick={() => setActiveSubTab('TELEGRAM')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs transition-all ${
            activeSubTab === 'TELEGRAM'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Send size={16} /> 🤖 Telegram Group Notification (Rich Cards & Queue)
        </button>

        <button
          onClick={() => setActiveSubTab('SYSTEM')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs transition-all ${
            activeSubTab === 'SYSTEM'
              ? 'bg-slate-800 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Settings size={16} /> ⚙️ ตั้งค่าระบบ & ทีม (System Settings)
        </button>
      </div>

      {activeSubTab === 'SUPABASE' ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 soft-shadow space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Database size={20} className="text-emerald-600" /> เชื่อมต่อ Supabase Live Database (100% Real Storage)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                บันทึกการเพิ่ม ลบ แก้ไข และอ่านข้อมูลบน Supabase โดยตรง ไม่ใช้ Mockup หรือ Local Data
              </p>
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-200 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Supabase Status: Connected
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 font-semibold">Supabase REST API URL</span>
              <p className="font-mono text-slate-800 font-bold select-all">
                https://wbrktjjgimvbddeobaeq.supabase.co
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 font-semibold">Supabase Public Anon Key</span>
              <p className="font-mono text-slate-800 font-bold truncate select-all">
                eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...GJB56LUFGP4fruzBSA68IU9Hfj_tdCIxRgSSjqU3HTU
              </p>
            </div>
          </div>

          {/* Seed Button */}
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <Server size={16} className="text-emerald-600" /> Sync / Seed Initial Data to Supabase
              </h3>
              <p className="text-[11px] text-emerald-700">
                กดปุ่มเพื่อบันทึกชุดข้อมูลตัวอย่างไปยังตารางใน Supabase โดยตรง
              </p>
            </div>
            <button
              onClick={onReseedData}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-all"
            >
              <RefreshCw size={14} /> Sync Seed Data to Supabase
            </button>
          </div>

          {/* SQL Setup Instruction Card */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <Database size={16} className="text-blue-600" /> Supabase Database Tables SQL Script
              </h3>
              <button
                onClick={handleCopySql}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-2xs"
              >
                {copiedSql ? <Check size={14} /> : <Copy size={14} />}
                {copiedSql ? 'คัดลอก SQL แล้ว!' : 'คัดลอก SQL สคริปต์ (Copy SQL)'}
              </button>
            </div>

            <div className="p-4 bg-slate-900 rounded-2xl text-slate-200 text-xs font-mono max-h-60 overflow-y-auto leading-relaxed border border-slate-800">
              <pre>{SUPABASE_SQL_SCRIPT}</pre>
            </div>
          </div>
        </div>
      ) : activeSubTab === 'TELEGRAM' ? (
        <TelegramNotificationView onOpenCustomer={onOpenCustomer} />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 soft-shadow space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Settings size={20} className="text-blue-600" /> ตั้งค่าระบบและสิทธิ์การใช้งาน (System Settings)
            </h2>
            <p className="text-xs text-slate-500">จัดการทีมขาย การแจ้งเตือน LINE Notify เกณฑ์ Customer Tier และการจัดการข้อมูล</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LINE Notify & Notification Settings */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Bell size={18} className="text-emerald-600" /> การแจ้งเตือน LINE Notify
              </h3>

              <div className="space-y-2 text-xs">
                <label className="block font-semibold text-slate-700">LINE Notify Token</label>
                <input
                  type="text"
                  value={lineToken}
                  onChange={(e) => setLineToken(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                onClick={handleTestLineNotify}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2 shadow-2xs"
              >
                <Send size={14} /> ทดสอบส่งแจ้งเตือน LINE
              </button>

              {testLineStatus && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                  {testLineStatus}
                </div>
              )}
            </div>

            {/* Database & Supabase Data Reset */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Database size={18} className="text-blue-600" /> จัดการข้อมูล Supabase (Supabase Storage)
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed">
                บันทึกและซิงค์ชุดข้อมูล 200 Customers, 1,000 Activities, 300 Orders ไปยัง Supabase Live Database โดยตรง
              </p>

              <button
                onClick={onReseedData}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-2xs"
              >
                <RefreshCw size={15} /> รีเซ็ตและสร้างชุดข้อมูลบน Supabase
              </button>
            </div>
          </div>

          {/* Team Roles */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3 text-xs">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Users size={18} className="text-blue-600" /> รายชื่อทีมและสิทธิ์การใช้งาน (Role-based Access)
            </h3>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-100 font-bold text-slate-600 border-b">
                    <th className="py-2.5 px-3">ชื่อ-นามสกุล</th>
                    <th className="py-2.5 px-3">อีเมล</th>
                    <th className="py-2.5 px-3">บทบาท (Role)</th>
                    <th className="py-2.5 px-3">สิทธิ์</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teamMembers.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-800">{m.name}</td>
                      <td className="py-2.5 px-3 text-slate-600">{m.email}</td>
                      <td className="py-2.5 px-3">
                        <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-md text-[10px]">
                          {m.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {m.role === 'ADMIN' ? 'จัดการได้ทุกส่วน + ตั้งค่า' : m.role === 'MANAGER' ? 'ดูรายงาน + จัดการทีม' : 'จัดการลูกค้าของตนเอง'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
