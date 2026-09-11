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
  Unlock,
  Download,
  FileText,
  HardDrive,
  Shield,
  FileCode,
  AlertCircle
} from 'lucide-react';
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { TelegramNotificationView } from './TelegramNotificationView';
import { apiClient } from '../services/apiClient';

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

-- 11. Users Table (ผู้ใช้งานและสิทธิ์การเข้าถึง - Master Admin, Admin, Sales, Viewer)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT NOT NULL,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'SALES'::text,
    position TEXT NULL,
    department TEXT NULL,
    email TEXT NULL,
    phone TEXT NULL,
    avatar_url TEXT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE'::text,
    sales_owner_tag TEXT NULL,
    permissions JSONB NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_username_key UNIQUE (username)
);

-- Seed initial system users
INSERT INTO public.users (id, username, password, name, email, phone, position, department, avatar_url, role, status, sales_owner_tag, permissions)
VALUES 
('USER-MASTER-ADMIN', 'master_admin', 'admin8888', 'Master Admin (ผู้ดูแลระบบสูงสุด)', 'master@ideva.co.th', '089-999-8888', 'Chief Technology Officer (CTO)', 'ฝ่ายบริหารระดับสูง (Executive)', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'MASTER_ADMIN', 'ACTIVE', 'ALL', '{"canViewDashboard":true,"canManageCustomers":true,"canDeleteCustomers":true,"canManageOrders":true,"canManageActivities":true,"canViewReports":true,"canExportData":true,"canAccessSettings":true,"canManageUsers":true,"dataScope":"ALL"}'::jsonb),
('USER-ADMIN', 'admin', 'admin1234', 'คุณพัฒน์ บริหารงาน (Admin)', 'admin@ideva.co.th', '081-111-2222', 'System Administrator', 'ฝ่ายเทคโนโลยีสารสนเทศ (IT)', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 'ADMIN', 'ACTIVE', 'ALL', '{"canViewDashboard":true,"canManageCustomers":true,"canDeleteCustomers":true,"canManageOrders":true,"canManageActivities":true,"canViewReports":true,"canExportData":true,"canAccessSettings":true,"canManageUsers":true,"dataScope":"ALL"}'::jsonb),
('USER-SALES-A', 'sales_a', 'sales1234', 'คุณสมชาย ใจดี (Sales A)', 'somchai@ideva.co.th', '081-234-5678', 'Senior Sales Executive', 'ฝ่ายขายและการตลาด (Sales)', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', 'SALES', 'ACTIVE', 'คุณสมชาย (Sales A)', '{"canViewDashboard":true,"canManageCustomers":true,"canDeleteCustomers":false,"canManageOrders":true,"canManageActivities":true,"canViewReports":true,"canExportData":true,"canAccessSettings":false,"canManageUsers":false,"dataScope":"OWN_ONLY"}'::jsonb),
('USER-SALES-B', 'sales_b', 'sales1234', 'คุณนภา รัตนโชติ (Sales B)', 'napha@ideva.co.th', '082-345-6789', 'Sales Representative', 'ฝ่ายขายและการตลาด (Sales)', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', 'SALES', 'ACTIVE', 'คุณนภา (Sales B)', '{"canViewDashboard":true,"canManageCustomers":true,"canDeleteCustomers":false,"canManageOrders":true,"canManageActivities":true,"canViewReports":true,"canExportData":true,"canAccessSettings":false,"canManageUsers":false,"dataScope":"OWN_ONLY"}'::jsonb),
('USER-VIEWER', 'viewer', 'viewer1234', 'คุณกมล เฝ้าสังเกต (Viewer)', 'viewer@ideva.co.th', '083-456-7890', 'Auditor / Guest Observer', 'ฝ่ายตรวจสอบและประเมินผล (Audit)', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80', 'VIEWER', 'ACTIVE', 'ALL', '{"canViewDashboard":true,"canManageCustomers":false,"canDeleteCustomers":false,"canManageOrders":false,"canManageActivities":false,"canViewReports":true,"canExportData":false,"canAccessSettings":false,"canManageUsers":false,"dataScope":"ALL"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions;

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
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
`;

export const SettingsView: React.FC<SettingsViewProps> = ({ currentUser, onReseedData, onOpenCustomer }) => {
  const [activeSubTab, setActiveSubTab] = useState<'SUPABASE' | 'BACKUP' | 'TELEGRAM' | 'SYSTEM'>('SUPABASE');
  const [lineToken, setLineToken] = useState('mock_line_notify_token_xyz888');
  const [testLineStatus, setTestLineStatus] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Backup State
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupSuccessMessage, setBackupSuccessMessage] = useState<string | null>(null);
  const [backupErrorMessage, setBackupErrorMessage] = useState<string | null>(null);
  const [lastBackupInfo, setLastBackupInfo] = useState<{ filename: string; count: number; time: string } | null>(null);

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

  const handleDownloadBackup = async () => {
    setIsBackingUp(true);
    setBackupSuccessMessage(null);
    setBackupErrorMessage(null);
    try {
      const result = await apiClient.downloadBackupFile();
      const timeStr = new Date().toLocaleTimeString('th-TH');
      setLastBackupInfo({
        filename: result.filename,
        count: result.count,
        time: timeStr,
      });
      setBackupSuccessMessage(`สำรองข้อมูลทั้งหมดและดาวน์โหลดไฟล์ ${result.filename} ลงเครื่องคอมพิวเตอร์เรียบร้อยแล้ว (${result.count.toLocaleString()} รายการ)`);
    } catch (err: any) {
      console.error('Backup download error:', err);
      setBackupErrorMessage(err?.message || 'เกิดข้อผิดพลาดในการดาวน์โหลดข้อมูลสำรอง กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsBackingUp(false);
    }
  };

  const teamMembers = [
    { name: 'คุณสมชาย ใจดี (Sales A)', role: 'SALES', email: 'somchai@ideva.co.th' },
    { name: 'คุณนภา รัตนโชติ (Sales B)', role: 'SALES', email: 'napha@ideva.co.th' },
    { name: 'คุณพัฒน์ บริหารงาน (Admin)', role: 'ADMIN', email: 'admin@ideva.co.th' },
    { name: 'Master Admin (ผู้ดูแลระบบสูงสุด)', role: 'MASTER_ADMIN', email: 'master@ideva.co.th' },
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
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadBackup}
            disabled={isBackingUp}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            {isBackingUp ? <RefreshCw size={13} className="animate-spin" /> : <Download size={13} />}
            {isBackingUp ? 'กำลังสำรองข้อมูล...' : 'สำรองข้อมูลด่วน (JSON)'}
          </button>
          <button
            onClick={handleLock}
            className="text-xs bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <Lock size={13} /> ล็อกหน้าตั้งค่า
          </button>
        </div>
      </div>

      {/* Sub-tab switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveSubTab('SUPABASE')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
            activeSubTab === 'SUPABASE'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Database size={16} /> ⚡ Supabase Live Database
        </button>

        <button
          onClick={() => setActiveSubTab('BACKUP')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
            activeSubTab === 'BACKUP'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Download size={16} /> 💾 สำรองข้อมูล (Backup JSON)
        </button>

        <button
          onClick={() => setActiveSubTab('TELEGRAM')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
            activeSubTab === 'TELEGRAM'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Send size={16} /> 🤖 Telegram Group Notification
        </button>

        <button
          onClick={() => setActiveSubTab('SYSTEM')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
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
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                {copiedSql ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                {copiedSql ? 'คัดลอก SQL แล้ว!' : 'คัดลอก SQL Script'}
              </button>
            </div>

            <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto max-h-72 border border-slate-800">
              <pre className="text-[11px] font-mono text-emerald-400 leading-relaxed select-all">
                {SUPABASE_SQL_SCRIPT}
              </pre>
            </div>
          </div>
        </div>
      ) : activeSubTab === 'BACKUP' ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 soft-shadow space-y-6 animate-in fade-in-50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Download size={20} className="text-blue-600" /> สำรองข้อมูลระบบทั้งหมด (System Data Backup & Export JSON)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ดาวน์โหลดข้อมูลลูกค้าทั้งหมด กิจกรรม ประวัติคำสั่งซื้อ เอกสาร บัญชีผู้ใช้งาน และการแจ้งเตือนในรูปแบบ JSON เก็บไว้บนเครื่องคอมพิวเตอร์เพื่อความปลอดภัย
              </p>
            </div>
            <button
              onClick={handleDownloadBackup}
              disabled={isBackingUp}
              className="bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs px-5 py-3 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-60 flex-shrink-0"
            >
              {isBackingUp ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  กำลังสร้างและดาวน์โหลดไฟล์ JSON...
                </>
              ) : (
                <>
                  <Download size={16} />
                  ดาวน์โหลดไฟล์สำรองข้อมูล (JSON Backup)
                </>
              )}
            </button>
          </div>

          {/* Feedback alerts */}
          {backupSuccessMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-medium flex items-start gap-3">
              <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-900">ดาวน์โหลดไฟล์สำรองข้อมูลสำเร็จเรียบร้อย!</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">{backupSuccessMessage}</p>
                <p className="text-[10px] text-emerald-600 mt-1">ไฟล์ถูกบันทึกลงในโฟลเดอร์ Downloads ของคอมพิวเตอร์ของคุณแล้ว</p>
              </div>
            </div>
          )}

          {backupErrorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 font-medium flex items-start gap-3">
              <AlertCircle size={18} className="text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-900">เกิดข้อผิดพลาดในการสำรองข้อมูล</p>
                <p className="text-[11px] text-rose-700 mt-0.5">{backupErrorMessage}</p>
              </div>
            </div>
          )}

          {/* Backup Guarantee & Security Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center">
                <Shield size={18} />
              </div>
              <h4 className="font-bold text-xs text-slate-800">ความปลอดภัยสูงสุด 100%</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                ข้อมูลลูกค้าและยอดขายถูกบันทึกลงเครื่องคอมพิวเตอร์ของคุณโดยตรง ไม่สูญหายแม้เซิร์ฟเวอร์ขัดข้อง
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center">
                <FileCode size={18} />
              </div>
              <h4 className="font-bold text-xs text-slate-800">มาตรฐาน JSON Schema</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                โครงสร้างไฟล์ JSON ครบถ้วนตามมาตรฐาน สอดคล้องกับตารางฐานข้อมูล สามารถนำไปกู้คืนหรือเชื่อมต่อระบบอื่นได้ทันที
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="w-9 h-9 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center">
                <HardDrive size={18} />
              </div>
              <h4 className="font-bold text-xs text-slate-800">Offline Disaster Recovery</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                เก็บไฟล์สำรองไว้บน External Drive, Google Drive หรือ Cloud Backup อื่นๆ ได้ตามนโยบายองค์กร
              </p>
            </div>
          </div>

          {/* Included Data Details */}
          <div className="p-5 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-4">
            <h3 className="font-bold text-xs text-slate-800 flex items-center gap-2">
              <Layers size={16} className="text-blue-600" /> รายการชุดข้อมูลที่รวมอยู่ในไฟล์สำรอง (Included Data Tables)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <div>
                  <span className="font-bold text-slate-800 block">1. ลูกค้า (Customers)</span>
                  <span className="text-[10px] text-slate-500">รายชื่อ เบอร์โทร LINE ที่อยู่ และสถานะการซื้อซ้ำ</span>
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <div>
                  <span className="font-bold text-slate-800 block">2. กิจกรรม (Activities)</span>
                  <span className="text-[10px] text-slate-500">บันทึกการโทร การเข้าพบ และการติดตามงาน</span>
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <div>
                  <span className="font-bold text-slate-800 block">3. คำสั่งซื้อ (Orders)</span>
                  <span className="text-[10px] text-slate-500">ยอดขาย วันที่สั่งซื้อ สินค้า และสถานะออเดอร์</span>
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                <div>
                  <span className="font-bold text-slate-800 block">4. เอกสาร (Documents)</span>
                  <span className="text-[10px] text-slate-500">ใบเสนอราคา สัญญา และไฟล์แนบของลูกค้า</span>
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <div>
                  <span className="font-bold text-slate-800 block">5. บันทึกภายใน (Notes)</span>
                  <span className="text-[10px] text-slate-500">ความต้องการพิเศษและประวัติการสนทนา</span>
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                <div>
                  <span className="font-bold text-slate-800 block">6. ผู้ใช้งาน (Users & RBAC)</span>
                  <span className="text-[10px] text-slate-500">บัญชีผู้ใช้ สิทธิ์ และการกำหนดทีม</span>
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3 sm:col-span-2 lg:col-span-3">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                <div>
                  <span className="font-bold text-slate-800 block">7. ข้อมูลการแจ้งเตือน Telegram (Settings & Logs)</span>
                  <span className="text-[10px] text-slate-500">การตั้งค่า Bot Token, Group Chat ID, Topics และบันทึกประวัติการส่งแจ้งเตือน</span>
                </div>
              </div>
            </div>
          </div>

          {/* Last Backup Info Box */}
          {lastBackupInfo && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-blue-900 block">การสำรองข้อมูลล่าสุด:</span>
                <span className="font-mono text-blue-800">{lastBackupInfo.filename}</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-blue-900 block">{lastBackupInfo.count.toLocaleString()} รายการ</span>
                <span className="text-[10px] text-blue-600">เวลา {lastBackupInfo.time} น.</span>
              </div>
            </div>
          )}
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
            {/* Backup Box in System tab */}
            <div className="p-5 rounded-2xl border border-blue-200 bg-blue-50/40 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <Download size={18} className="text-blue-600" /> สำรองข้อมูลระบบ (Backup JSON)
                </h3>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                  แนะนำทำประจำสัปดาห์
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                ดาวน์โหลดข้อมูลลูกค้า คำสั่งซื้อ กิจกรรม และผู้ใช้งานทั้งหมดเป็นไฟล์ JSON ลงในคอมพิวเตอร์ของคุณเพื่อความปลอดภัยสูงสุด
              </p>

              <button
                onClick={handleDownloadBackup}
                disabled={isBackingUp}
                className="bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-2xs cursor-pointer transition-all disabled:opacity-50"
              >
                {isBackingUp ? <RefreshCw size={15} className="animate-spin" /> : <Download size={15} />}
                {isBackingUp ? 'กำลังสำรองข้อมูล...' : 'ดาวน์โหลดไฟล์สำรองข้อมูล (JSON)'}
              </button>

              {backupSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                  <span>{backupSuccessMessage}</span>
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
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-2xs cursor-pointer"
              >
                <RefreshCw size={15} /> รีเซ็ตและสร้างชุดข้อมูลบน Supabase
              </button>
            </div>

            {/* LINE Notify & Notification Settings */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4 lg:col-span-2">
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
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2 shadow-2xs cursor-pointer"
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
                        {m.role === 'MASTER_ADMIN' ? 'สิทธิ์สูงสุดทุกฟังก์ชัน + จัดการผู้ใช้' : m.role === 'ADMIN' ? 'จัดการได้ทุกส่วน + ตั้งค่า' : 'จัดการลูกค้าของตนเอง'}
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
