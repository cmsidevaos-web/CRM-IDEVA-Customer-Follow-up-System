import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Key,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  AlertTriangle,
  Crown,
  Eye,
  EyeOff,
  Phone,
  Briefcase,
  Lock,
  RefreshCw,
  Database,
  Copy,
  Check,
  X,
  Sparkles,
  Sliders,
  Filter,
  UserCheck,
  UserX,
  Upload,
  Camera,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { AppUser, UserPermissions, UserRole, UserStatus } from '../types';
import { DEFAULT_PERMISSIONS } from '../data/defaultUsers';
import { apiClient } from '../services/apiClient';

interface UserManagementViewProps {
  currentUser: AppUser;
  users: AppUser[];
  onUsersUpdated: () => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
];

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  currentUser,
  users,
  onUsersUpdated,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<AppUser>>({
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    name: '',
    email: '',
    position: '',
    department: 'ฝ่ายขาย (Sales)',
    avatarUrl: PRESET_AVATARS[0],
    role: 'SALES',
    status: 'ACTIVE',
    salesOwnerTag: '',
    permissions: DEFAULT_PERMISSIONS.SALES,
  });

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  // Avatar Upload & Link States
  const [avatarTab, setAvatarTab] = useState<'upload' | 'link' | 'preset'>('upload');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarDragOver, setAvatarDragOver] = useState(false);
  const [copiedAvatarLink, setCopiedAvatarLink] = useState(false);
  const [inputAvatarUrl, setInputAvatarUrl] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const avatarFileInputRef = React.useRef<HTMLInputElement>(null);

  // Avatar Upload Handler
  const handleAvatarFile = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showFeedback('กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WEBP, GIF)', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showFeedback('ไฟล์รูปภาพมีขนาดใหญ่เกินไป (สูงสุดไม่เกิน 10MB)', 'error');
      return;
    }

    try {
      setIsUploadingAvatar(true);

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });

      const res = await apiClient.uploadAvatar(dataUrl, file.name);
      if (res && res.success && res.url) {
        setFormData((prev) => ({ ...prev, avatarUrl: res.url }));
        setInputAvatarUrl(res.url);
        showFeedback('อัปโหลดรูปพนักงานจริงและจัดเก็บเป็นลิงก์ URL สำเร็จ');
      } else {
        setFormData((prev) => ({ ...prev, avatarUrl: dataUrl }));
        setInputAvatarUrl(dataUrl);
        showFeedback('จัดเก็บรูปภาพพนักงานเรียบร้อย');
      }
    } catch (err: any) {
      showFeedback(`เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ: ${err.message}`, 'error');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarFileInputRef.current) avatarFileInputRef.current.value = '';
    }
  };

  const handleAvatarDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setAvatarDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAvatarFile(e.dataTransfer.files[0]);
    }
  };

  const handleApplyAvatarUrl = () => {
    const trimmed = inputAvatarUrl.trim();
    if (!trimmed) {
      showFeedback('กรุณากรอกลิงก์รูปภาพ', 'error');
      return;
    }
    setFormData((prev) => ({ ...prev, avatarUrl: trimmed }));
    showFeedback('นำลิงก์รูปภาพไปใช้เรียบร้อย');
  };

  const handleCopyAvatarLink = (url?: string) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedAvatarLink(true);
    showFeedback('คัดลอกลิงก์รูปภาพเรียบร้อยแล้ว');
    setTimeout(() => setCopiedAvatarLink(false), 2500);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingUser(null);
    setAvatarTab('upload');
    setInputAvatarUrl('');
    setCopiedAvatarLink(false);
    setShowPassword(false);
    setFormData({
      id: `USER-${Date.now()}`,
      username: '',
      password: '',
      firstName: '',
      lastName: '',
      name: '',
      email: '',
      phone: '',
      position: 'เจ้าหน้าที่ฝ่ายขาย',
      department: 'ฝ่ายขายและการตลาด (Sales)',
      avatarUrl: PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)],
      role: 'SALES',
      status: 'ACTIVE',
      salesOwnerTag: '',
      permissions: { ...DEFAULT_PERMISSIONS.SALES },
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (user: AppUser) => {
    setEditingUser(user);
    setInputAvatarUrl(user.avatarUrl || '');
    setCopiedAvatarLink(false);
    setShowPassword(false);
    if (user.avatarUrl && (user.avatarUrl.startsWith('/uploads/') || user.avatarUrl.startsWith('data:'))) {
      setAvatarTab('upload');
    } else if (user.avatarUrl && PRESET_AVATARS.includes(user.avatarUrl)) {
      setAvatarTab('preset');
    } else if (user.avatarUrl) {
      setAvatarTab('link');
    } else {
      setAvatarTab('upload');
    }
    setFormData({
      ...user,
      permissions: { ...(user.permissions || DEFAULT_PERMISSIONS[user.role] || DEFAULT_PERMISSIONS.SALES) },
    });
    setIsModalOpen(true);
  };

  // Save User (Create or Update)
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username?.trim()) {
      showFeedback('กรุณากรอก User Login (ชื่อผู้ใช้งาน)', 'error');
      return;
    }

    let finalAvatar = formData.avatarUrl;
    if (avatarTab === 'link' && inputAvatarUrl.trim()) {
      finalAvatar = inputAvatarUrl.trim();
    }
    if (!finalAvatar) {
      finalAvatar = PRESET_AVATARS[0];
    }

    const fullName = (formData.name && formData.name.trim() !== '')
      ? formData.name.trim()
      : `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || formData.username;

    const userToSave: AppUser = {
      id: formData.id || `USER-${Date.now()}`,
      username: formData.username.trim().toLowerCase(),
      password: formData.password || '123456',
      firstName: formData.firstName || '',
      lastName: formData.lastName || '',
      name: fullName,
      email: formData.email || `${formData.username}@ideva.co.th`,
      phone: formData.phone || '',
      position: formData.position || 'เจ้าหน้าที่ฝ่ายขาย',
      department: formData.department || 'ฝ่ายขายและการตลาด (Sales)',
      avatarUrl: finalAvatar,
      role: (formData.role as UserRole) || 'SALES',
      status: (formData.status as UserStatus) || 'ACTIVE',
      salesOwnerTag: formData.salesOwnerTag || (formData.role === 'SALES' ? fullName : 'ALL'),
      permissions: formData.permissions || DEFAULT_PERMISSIONS[formData.role || 'SALES'],
      createdAt: formData.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    try {
      await apiClient.saveUser(userToSave);
      showFeedback(`บันทึกข้อมูลผู้ใช้งาน "${userToSave.name}" สำเร็จ`);
      setIsModalOpen(false);
      onUsersUpdated();
    } catch (err: any) {
      showFeedback(`เกิดข้อผิดพลาดในการบันทึก: ${err.message}`, 'error');
    }
  };

  // Delete User
  const handleDeleteUser = async (user: AppUser) => {
    if (user.id === 'USER-MASTER-ADMIN' || user.role === 'MASTER_ADMIN') {
      showFeedback('ไม่สามารถลบ Master Admin (ผู้ดูแลระบบสูงสุด) ได้', 'error');
      return;
    }

    if (window.confirm(`ยืนยันการลบผู้ใช้งาน "${user.name}" (${user.username})?`)) {
      try {
        await apiClient.deleteUser(user.id);
        showFeedback(`ลบผู้ใช้งาน "${user.name}" เรียบร้อยแล้ว`);
        onUsersUpdated();
      } catch (err: any) {
        showFeedback(`เกิดข้อผิดพลาดในการลบ: ${err.message}`, 'error');
      }
    }
  };

  // Toggle user status (Active / Suspended)
  const handleToggleStatus = async (user: AppUser) => {
    if (user.role === 'MASTER_ADMIN') {
      showFeedback('ไม่สามารถระงับการใช้งาน Master Admin ได้', 'error');
      return;
    }
    const newStatus: UserStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const updated: AppUser = { ...user, status: newStatus };
    await apiClient.saveUser(updated);
    showFeedback(`เปลี่ยนสถานะ "${user.name}" เป็น ${newStatus === 'ACTIVE' ? 'กำลังใช้งาน' : 'ระงับชั่วคราว'}`);
    onUsersUpdated();
  };

  // Auto Sync default users to Supabase
  const handleSyncSupabase = async () => {
    setIsSyncing(true);
    try {
      await apiClient.seedUsers(users);
      showFeedback('ซิงค์ข้อมูลผู้ใช้งานไปยัง Supabase Database สำเร็จเรียบร้อยแล้ว!');
      onUsersUpdated();
    } catch (e: any) {
      showFeedback(`ซิงค์ข้อมูลไม่สำเร็จ: ${e.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.position && u.position.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.department && u.department.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: users.length,
      adminCount: users.filter((u) => u.role === 'MASTER_ADMIN' || u.role === 'ADMIN').length,
      salesCount: users.filter((u) => u.role === 'SALES').length,
      viewerCount: users.filter((u) => u.role === 'VIEWER').length,
    };
  }, [users]);

  const USERS_SQL_SCRIPT = `-- ====================================================================
-- SUPABASE USERS TABLE SQL SCRIPT (สำหรับตารางผู้ใช้งาน & การตั้งค่าสิทธิ์)
-- Copy and run this in Supabase SQL Editor
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    user_login VARCHAR(100),
    password_hash TEXT NOT NULL,
    password TEXT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    full_name TEXT NOT NULL,
    name TEXT,
    email VARCHAR(100),
    position VARCHAR(100),
    department VARCHAR(100),
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'SALES',
    status VARCHAR(50) DEFAULT 'ACTIVE',
    sales_owner_tag VARCHAR(100),
    permissions JSONB DEFAULT '{
      "canViewDashboard": true,
      "canManageCustomers": true,
      "canDeleteCustomers": false,
      "canManageOrders": true,
      "canManageActivities": true,
      "canViewReports": true,
      "canExportData": false,
      "canAccessSettings": false,
      "canManageUsers": false,
      "dataScope": "OWN_ONLY"
    }'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
`;

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Feedback */}
      {feedbackMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-3 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-600" />
          ) : (
            <AlertTriangle size={16} className="text-rose-600" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0B3B8C] via-blue-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-semibold backdrop-blur-md">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>ระบบจัดการผู้ใช้งานและสิทธิ์การเข้าถึง (User Management & RBAC)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              จัดการผู้ใช้งาน & กำหนดสิทธิ์
            </h1>
            <p className="text-xs sm:text-sm text-blue-200 max-w-2xl leading-relaxed">
              เพิ่มฝ่ายขาย, ผู้ดูแลระบบ, หรือผู้ดูข้อมูล กำหนดสถานะและสิทธิ์การเข้าถึงระดับฟังก์ชั่น (ดูทั้งหมด, ลบข้อมูล, สร้างออเดอร์, ดูรายงาน) พร้อมบันทึกตรงสู่ Supabase
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsSqlModalOpen(true)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-2xl border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Database size={15} /> ดู SQL Script
            </button>
            <button
              onClick={handleSyncSupabase}
              disabled={isSyncing}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-2xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={15} className={isSyncing ? 'animate-spin' : ''} />
              <span>ซิงค์กับ Supabase</span>
            </button>
            <button
              onClick={handleOpenCreate}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <UserPlus size={16} />
              <span>+ เพิ่มผู้ใช้งาน (Add User)</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5">
            <div className="text-[11px] text-blue-200 font-medium">ผู้ใช้งานทั้งหมด</div>
            <div className="text-2xl font-black mt-0.5">{stats.total}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5">
            <div className="text-[11px] text-blue-200 font-medium flex items-center gap-1">
              <Crown size={12} className="text-amber-400" /> แอดมิน & บริหาร
            </div>
            <div className="text-2xl font-black mt-0.5 text-amber-300">{stats.adminCount}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5">
            <div className="text-[11px] text-blue-200 font-medium flex items-center gap-1">
              <Briefcase size={12} className="text-blue-300" /> ฝ่ายขาย (Sales)
            </div>
            <div className="text-2xl font-black mt-0.5 text-blue-300">{stats.salesCount}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5">
            <div className="text-[11px] text-blue-200 font-medium flex items-center gap-1">
              <Eye size={12} className="text-slate-300" /> ผู้ดูข้อมูล (Viewer)
            </div>
            <div className="text-2xl font-black mt-0.5 text-slate-200">{stats.viewerCount}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 soft-shadow flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อ, User Login, ตำแหน่ง, แผนก..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
            <Filter size={14} /> กรองบทบาท:
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
          >
            <option value="ALL">ทุกบทบาท (All Roles)</option>
            <option value="MASTER_ADMIN">👑 Master Admin</option>
            <option value="ADMIN">🛡️ Admin</option>
            <option value="SALES">💼 ฝ่ายขาย (Sales)</option>
            <option value="VIEWER">👁️ ผู้ดู (Viewer)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
          >
            <option value="ALL">ทุกสถานะ</option>
            <option value="ACTIVE">🟢 กำลังใช้งาน (Active)</option>
            <option value="SUSPENDED">🔴 ระงับชั่วคราว (Suspended)</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">ผู้ใช้งาน (User Profile)</th>
                <th className="py-3.5 px-4">User Login / รหัสผ่าน</th>
                <th className="py-3.5 px-4">ตำแหน่ง & แผนก</th>
                <th className="py-3.5 px-4">บทบาท (Role)</th>
                <th className="py-3.5 px-4">สิทธิ์การเข้าถึง (Permissions)</th>
                <th className="py-3.5 px-4">สถานะ</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    ไม่พบผู้ใช้งานที่ตรงกับเงื่อนไขการค้นหา
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isMaster = u.role === 'MASTER_ADMIN';
                  const isAdmin = u.role === 'ADMIN';
                  const isSales = u.role === 'SALES';
                  const isViewer = u.role === 'VIEWER';
                  const isActive = u.status === 'ACTIVE';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Avatar & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatarUrl || PRESET_AVATARS[0]}
                            alt={u.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = PRESET_AVATARS[0];
                            }}
                            className="w-10 h-10 rounded-2xl object-cover border border-slate-200 shadow-2xs flex-shrink-0 bg-slate-100"
                          />
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              {u.name}
                              {isMaster && <Crown size={13} className="text-amber-500 fill-amber-500" />}
                              {isAdmin && <Shield size={12} className="text-rose-600" />}
                            </div>
                            <div className="text-[11px] text-slate-400">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Username & Password */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md inline-block">
                          {u.username}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Pass: {u.password ? '••••••••' : '123456'}
                        </div>
                      </td>

                      {/* Position & Department */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{u.position || '-'}</div>
                        <div className="text-[11px] text-slate-400">{u.department || '-'}</div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-xl inline-flex items-center gap-1 ${
                            isMaster
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : isAdmin
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : isSales
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {isMaster && '👑 Master Admin'}
                          {isAdmin && '🛡️ Admin'}
                          {isSales && '💼 Sales'}
                          {isViewer && '👁️ Viewer'}
                        </span>
                      </td>

                      {/* Permissions overview */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {u.permissions?.dataScope === 'ALL' ? (
                            <span className="text-[9px] font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
                              ดูข้อมูลทั้งหมด
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              เฉพาะของตนเอง
                            </span>
                          )}

                          {u.permissions?.canManageCustomers && (
                            <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
                              แก้ไขลูกค้า
                            </span>
                          )}

                          {u.permissions?.canDeleteCustomers && (
                            <span className="text-[9px] font-bold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded">
                              ลบข้อมูลได้
                            </span>
                          )}

                          {u.permissions?.canManageUsers && (
                            <span className="text-[9px] font-bold bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded">
                              จัดการ Users
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          title="คลิกเพื่อสลับสถานะเปิด/ระงับการใช้งาน"
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full cursor-pointer transition-all inline-flex items-center gap-1 ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? 'bg-emerald-600' : 'bg-rose-600'
                            }`}
                          ></span>
                          {isActive ? 'กำลังใช้งาน' : 'ระงับชั่วคราว'}
                        </button>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
                            title="แก้ไขข้อมูล & สิทธิ์"
                          >
                            <Edit2 size={14} />
                          </button>

                          <button
                            onClick={() => handleDeleteUser(u)}
                            disabled={isMaster}
                            className={`p-1.5 rounded-xl transition-colors ${
                              isMaster
                                ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                : 'bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer'
                            }`}
                            title={isMaster ? 'ไม่สามารถลบ Master Admin ได้' : 'ลบผู้ใช้งาน'}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 md:p-6 overflow-hidden animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6 flex-shrink-0 bg-white">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus size={20} className="text-blue-600" />
                  {editingUser ? 'แก้ไขข้อมูลผู้ใช้งาน & สิทธิ์' : 'เพิ่มผู้ใช้งานใหม่ (Add User)'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  กำหนดชื่อผู้ใช้งาน รหัสผ่าน ตำแหน่ง แผนก และสิทธิ์การเข้าถึงระบบ
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Scrollable Form Body */}
            <form onSubmit={handleSaveUser} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 overscroll-contain">
              {/* Account Credentials */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <Key size={14} className="text-blue-600" /> บัญชีเข้าสู่ระบบ (Credentials)
                  </span>
                  <span className="text-[10px] text-slate-500">* ข้อมูลสำหรับใช้ล็อกอินเข้าสู่ระบบ</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700">
                      User Login (ชื่อผู้ใช้งาน) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.username || ''}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="เช่น somchai_sales หรือ sales_01"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block font-semibold text-slate-700">
                        รหัสผ่านเข้าใช้งาน (Password) <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer font-medium"
                      >
                        {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                        {showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password || ''}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="เช่น 123456 หรือ sales1234"
                        className="w-full pl-3 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Info */}
              <div className="space-y-4">
                <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <Users size={14} className="text-blue-600" /> ข้อมูลส่วนตัวและแผนก
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700">ชื่อ (First Name) <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={formData.firstName || ''}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="เช่น สมชาย"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700">นามสกุล (Last Name)</label>
                    <input
                      type="text"
                      value={formData.lastName || ''}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="เช่น ใจดี"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700">เบอร์โทรศัพท์ (Phone)</label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="เช่น 081-234-5678"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700">อีเมล (Email)</label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="somchai@ideva.co.th"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700">ตำแหน่ง (Position)</label>
                    <input
                      type="text"
                      value={formData.position || ''}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      placeholder="เช่น Senior Sales Executive"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700">แผนก (Department)</label>
                    <input
                      type="text"
                      value={formData.department || ''}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="เช่น ฝ่ายขายและการตลาด (Sales)"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="block font-semibold text-slate-700">แท็กฝ่ายขายใน CRM (Sales Owner Tag)</label>
                    <input
                      type="text"
                      value={formData.salesOwnerTag || ''}
                      onChange={(e) => setFormData({ ...formData, salesOwnerTag: e.target.value })}
                      placeholder="เช่น คุณสมชาย (Sales A)"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Avatar Selector & Upload Real Employee Photo & URL Link */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <Camera size={15} className="text-blue-600" />
                    รูปโปรไฟล์ / อวตารพนักงาน (Employee Photo & Avatar)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    อัปโหลดรูปจริง หรือ ระบุลิงก์จัดเก็บ
                  </span>
                </div>

                {/* Current Avatar Preview & URL Link Info */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="relative group">
                      <img
                        src={formData.avatarUrl || PRESET_AVATARS[0]}
                        alt="Current Avatar"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = PRESET_AVATARS[0];
                        }}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-500/30 shadow-xs bg-slate-100 flex-shrink-0"
                      />
                      <button
                        type="button"
                        onClick={() => avatarFileInputRef.current?.click()}
                        title="คลิกเพื่อเปลี่ยนรูปพนักงาน"
                        className="absolute -bottom-1 -right-1 bg-blue-600 hover:bg-blue-700 text-white p-1 rounded-full shadow-md transition-transform active:scale-95 cursor-pointer"
                      >
                        <Camera size={12} />
                      </button>
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {formData.avatarUrl?.startsWith('/uploads/') ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                            <Check size={11} /> รูปพนักงานที่อัปโหลด (จัดเก็บเป็นลิงก์ไฟล์จริง)
                          </span>
                        ) : formData.avatarUrl?.startsWith('data:') ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                            <ImageIcon size={11} /> รูปพนักงานจริง (จัดเก็บรูปภาพในระบบ)
                          </span>
                        ) : formData.avatarUrl && !PRESET_AVATARS.includes(formData.avatarUrl) ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                            <LinkIcon size={11} /> ลิงก์รูปภาพภายนอก (Direct URL Link)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            <ImageIcon size={11} /> รูปอวตารสำเร็จรูป (Preset)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 max-w-full">
                        <span className="text-[10px] text-slate-400 font-semibold flex-shrink-0">ลิงก์จัดเก็บ:</span>
                        <span className="text-[11px] font-mono text-slate-600 truncate bg-slate-50 px-2 py-0.5 rounded border border-slate-200 max-w-[200px] sm:max-w-xs select-all">
                          {formData.avatarUrl || 'ยังไม่ได้กำหนด'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Copy Link & Reset Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                    {formData.avatarUrl && (
                      <button
                        type="button"
                        onClick={() => handleCopyAvatarLink(formData.avatarUrl)}
                        className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                          copiedAvatarLink
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                        title="คัดลอกลิงก์รูปภาพนี้ไปใช้งาน"
                      >
                        {copiedAvatarLink ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        <span>{copiedAvatarLink ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Avatar Source Tabs */}
                <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setAvatarTab('upload')}
                    className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      avatarTab === 'upload'
                        ? 'bg-white text-blue-600 font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Upload size={13} />
                    <span>อัปโหลดรูปพนักงานจริง</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAvatarTab('link')}
                    className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      avatarTab === 'link'
                        ? 'bg-white text-blue-600 font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LinkIcon size={13} />
                    <span>ระบุลิงก์รูปภาพ (URL)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAvatarTab('preset')}
                    className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      avatarTab === 'preset'
                        ? 'bg-white text-blue-600 font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ImageIcon size={13} />
                    <span>เลือกรูปตัวอย่าง</span>
                  </button>
                </div>

                {/* TAB 1: UPLOAD REAL EMPLOYEE PHOTO */}
                {avatarTab === 'upload' && (
                  <div className="space-y-3">
                    <input
                      ref={avatarFileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          handleAvatarFile(files[0]);
                        }
                      }}
                    />

                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setAvatarDragOver(true);
                      }}
                      onDragLeave={() => setAvatarDragOver(false)}
                      onDrop={handleAvatarDrop}
                      onClick={() => !isUploadingAvatar && avatarFileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                        avatarDragOver
                          ? 'border-blue-600 bg-blue-50/60 scale-[1.01]'
                          : 'border-slate-300 hover:border-blue-500 bg-white hover:bg-slate-50/60'
                      }`}
                    >
                      {isUploadingAvatar ? (
                        <div className="py-2 flex flex-col items-center gap-2">
                          <Loader2 size={24} className="text-blue-600 animate-spin" />
                          <div className="text-xs font-bold text-slate-700">กำลังอัปโหลดและจัดเก็บรูปภาพเป็นลิงก์ URL...</div>
                          <div className="text-[11px] text-slate-400">ระบบกำลังประมวลผลไฟล์ภาพพนักงาน</div>
                        </div>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                            <Upload size={18} />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-blue-600 hover:underline">คลิกเพื่อเลือกไฟล์รูปภาพพนักงาน</span>
                            <span className="text-xs text-slate-600"> หรือลากรูปมาวางที่นี่</span>
                          </div>
                          <p className="text-[10px] text-slate-400">
                            รองรับไฟล์ JPG, PNG, WebP ขนาดไม่เกิน 10MB • จัดเก็บเป็นลิงก์ URL ถาวร
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: SPECIFY IMAGE URL LINK */}
                {avatarTab === 'link' && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        วางลิงก์รูปภาพพนักงาน (Image URL)
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="url"
                            value={inputAvatarUrl}
                            onChange={(e) => setInputAvatarUrl(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleApplyAvatarUrl();
                              }
                            }}
                            placeholder="https://example.com/photos/employee.jpg"
                            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleApplyAvatarUrl}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors flex-shrink-0"
                        >
                          นำลิงก์ไปใช้
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        สามารถใช้ลิงก์รูปภาพโดยตรงจากเว็บไซต์บริษัท, Google Drive, Cloudinary, Imgur หรือ CDN ใดๆ
                      </p>
                    </div>
                  </div>
                )}

                {/* TAB 3: PRESET AVATARS */}
                {avatarTab === 'preset' && (
                  <div className="space-y-2">
                    <div className="text-[11px] text-slate-500 font-medium">คลิกเลือกรูปภาพตัวอย่างที่ต้องการ:</div>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 py-1">
                      {PRESET_AVATARS.map((url, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setFormData({ ...formData, avatarUrl: url });
                            setInputAvatarUrl(url);
                          }}
                          className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all p-0.5 ${
                            formData.avatarUrl === url
                              ? 'border-blue-600 scale-105 shadow-md bg-blue-50'
                              : 'border-transparent opacity-70 hover:opacity-100 hover:border-slate-300'
                          }`}
                        >
                          <img
                            src={url}
                            alt={`Preset Avatar ${idx + 1}`}
                            className="w-full h-11 rounded-lg object-cover"
                          />
                          {formData.avatarUrl === url && (
                            <div className="absolute top-1 right-1 bg-blue-600 text-white rounded-full p-0.5 shadow-xs">
                              <Check size={9} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Role & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">บทบาทในระบบ (Role)</label>
                  <select
                    value={formData.role || 'SALES'}
                    onChange={(e) => {
                      const newRole = e.target.value as UserRole;
                      setFormData({
                        ...formData,
                        role: newRole,
                        permissions: { ...(DEFAULT_PERMISSIONS[newRole] || DEFAULT_PERMISSIONS.SALES) },
                      });
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:ring-2 focus:ring-blue-600 cursor-pointer"
                  >
                    <option value="MASTER_ADMIN">👑 Master Admin (เข้าได้ทุกฟังก์ชั่น สิทธิ์สูงสุด)</option>
                    <option value="ADMIN">🛡️ Admin (ผู้ดูแลระบบ)</option>
                    <option value="SALES">💼 ฝ่ายขาย (Sales Representative)</option>
                    <option value="VIEWER">👁️ ผู้ดูข้อมูล (Viewer - ดูได้อย่างเดียว)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">สถานะการใช้งาน (Status)</label>
                  <select
                    value={formData.status || 'ACTIVE'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:ring-2 focus:ring-blue-600 cursor-pointer"
                  >
                    <option value="ACTIVE">🟢 ใช้งานปกติ (Active)</option>
                    <option value="SUSPENDED">🔴 ระงับการใช้งานชั่วคราว (Suspended)</option>
                  </select>
                </div>
              </div>

              {/* Granular Permissions Box */}
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-blue-950 flex items-center gap-1.5">
                    <Sliders size={14} className="text-blue-600" /> ตั้งค่าการเข้าถึงระดับฟังก์ชั่น (Access Restrictions)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const currentRole = formData.role || 'SALES';
                      setFormData({
                        ...formData,
                        permissions: { ...(DEFAULT_PERMISSIONS[currentRole] || DEFAULT_PERMISSIONS.SALES) },
                      });
                    }}
                    className="text-[10px] text-blue-700 hover:underline font-bold"
                  >
                    คืนค่าสิทธิ์เริ่มต้นตามบทบาท
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={formData.permissions?.dataScope === 'ALL'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: {
                            ...(formData.permissions || DEFAULT_PERMISSIONS.SALES),
                            dataScope: e.target.checked ? 'ALL' : 'OWN_ONLY',
                          },
                        })
                      }
                      className="rounded text-blue-600"
                    />
                    <span className="font-semibold text-slate-700">ดูข้อมูลลูกค้าทั้งหมด (ไม่ใช่แค่ตนเอง)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.permissions?.canManageCustomers)}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: {
                            ...(formData.permissions || DEFAULT_PERMISSIONS.SALES),
                            canManageCustomers: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-blue-600"
                    />
                    <span className="font-semibold text-slate-700">สร้าง & แก้ไขข้อมูลลูกค้า</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.permissions?.canDeleteCustomers)}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: {
                            ...(formData.permissions || DEFAULT_PERMISSIONS.SALES),
                            canDeleteCustomers: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-rose-600"
                    />
                    <span className="font-semibold text-rose-700">สิทธิ์ลบข้อมูลลูกค้า (อันตราย)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.permissions?.canManageOrders)}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: {
                            ...(formData.permissions || DEFAULT_PERMISSIONS.SALES),
                            canManageOrders: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-blue-600"
                    />
                    <span className="font-semibold text-slate-700">สร้าง & จัดการคำสั่งซื้อ (Orders)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.permissions?.canExportData)}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: {
                            ...(formData.permissions || DEFAULT_PERMISSIONS.SALES),
                            canExportData: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-blue-600"
                    />
                    <span className="font-semibold text-slate-700">ส่งออกข้อมูล Excel / PDF</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.permissions?.canManageUsers)}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: {
                            ...(formData.permissions || DEFAULT_PERMISSIONS.SALES),
                            canManageUsers: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-blue-600"
                    />
                    <span className="font-semibold text-slate-700">สิทธิ์จัดการผู้ใช้งาน (User Management)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Fixed Footer Buttons */}
            <div className="flex items-center justify-end gap-3 p-4 sm:px-6 bg-slate-50/90 border-t border-slate-100 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 cursor-pointer transition-colors shadow-2xs"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-98"
              >
                {editingUser ? 'บันทึกการแก้ไข' : 'บันทึกและสร้างผู้ใช้งาน'}
              </button>
            </div>
          </form>
        </div>
      </div>
      )}

      {/* SQL SCRIPT MODAL */}
      {isSqlModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-hidden animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 p-5 flex-shrink-0 bg-white">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Database size={18} className="text-blue-600" />
                SQL สร้างตาราง Users ใน Supabase
              </h2>
              <button
                onClick={() => setIsSqlModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 overscroll-contain">
              <p className="text-xs text-slate-500">
                นำคำสั่ง SQL ด้านล่างนี้ไปรันใน <strong>Supabase SQL Editor</strong> เพื่อสร้างตารางสำหรับเก็บข้อมูล Login, รหัสเข้าใช้งาน, ชื่อ, นามสกุล, ตำแหน่ง, แผนก, รูปอวตาร และการตั้งค่าสิทธิ์
              </p>

              <div className="relative">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(USERS_SQL_SCRIPT);
                    setCopiedSql(true);
                    setTimeout(() => setCopiedSql(false), 2000);
                  }}
                  className="absolute right-3 top-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                >
                  {copiedSql ? <Check size={14} /> : <Copy size={14} />}
                  {copiedSql ? 'คัดลอกแล้ว!' : 'คัดลอกคำสั่ง SQL'}
                </button>
                <pre className="p-4 bg-slate-900 text-slate-200 rounded-2xl text-xs font-mono max-h-80 overflow-y-auto leading-relaxed">
                  {USERS_SQL_SCRIPT}
                </pre>
              </div>
            </div>

            <div className="flex items-center justify-end p-4 bg-slate-50 border-t border-slate-100 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsSqlModalOpen(false)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
