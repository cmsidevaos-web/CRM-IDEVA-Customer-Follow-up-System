import { apiClient } from '../services/apiClient';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  Clock,
  Code2,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Key,
  Layers,
  MessageSquare,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Send,
  Settings,
  Shield,
  Smartphone,
  Sparkles,
  Terminal,
  Trash2,
  XCircle,
  Zap
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { TELEGRAM_SQL_SETUP_SCRIPT } from '../data/telegramSqlScripts';
import { buildTelegramCard, defaultTelegramSettings, defaultTelegramTopics } from '../services/telegramService';
import { TelegramNotificationLog, TelegramQueueItem, TelegramRules, TelegramSettings, TelegramTopic } from '../types';

interface TelegramNotificationViewProps {
  onOpenCustomer?: (customerId: string) => void;
}

export const TelegramNotificationView: React.FC<TelegramNotificationViewProps> = () => {
  const [activeTab, setActiveTab] = useState<'SETTINGS' | 'RULES' | 'PREVIEW' | 'LOGS' | 'SQL'>('PREVIEW');
  const [settings, setSettings] = useState<TelegramSettings>(defaultTelegramSettings);
  const [topics, setTopics] = useState<TelegramTopic[]>(defaultTelegramTopics);
  const [logs, setLogs] = useState<TelegramNotificationLog[]>([]);
  const [queue, setQueue] = useState<TelegramQueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Test notification state
  const [testType, setTestType] = useState<string>('FOLLOW_UP');
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<'DARK' | 'LIGHT'>('DARK');

  // Fetch current Telegram config & logs from API
  const fetchTelegramData = async () => {
    try {
      setLoading(true);
      const [sData, lData, qData, tData] = await Promise.all([
        apiClient.getTelegramSettings(),
        apiClient.getTelegramLogs(),
        apiClient.getTelegramQueue(),
        apiClient.getTelegramTopics(),
      ]);

      if (sData && sData.bot_token) setSettings(sData);
      if (Array.isArray(lData)) setLogs(lData);
      if (Array.isArray(qData)) setQueue(qData);
      if (Array.isArray(tData) && tData.length > 0) setTopics(tData);
    } catch (err) {
      console.error('Error fetching Telegram data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelegramData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Save Settings
  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      await apiClient.saveTelegramSettings(settings);
      showToast('✅ บันทึกการตั้งค่า Telegram Bot สำเร็จ');
    } catch (err) {
      showToast('❌ ไม่สามารถบันทึกการตั้งค่าได้');
    } finally {
      setLoading(false);
    }
  };

  // Save Topics
  const handleSaveTopics = async () => {
    try {
      setLoading(true);
      await apiClient.saveTelegramTopics(topics);
      showToast('✅ บันทึกการตั้งค่า Telegram Topics เรียบร้อยแล้ว');
    } catch (err) {
      showToast('❌ ไม่สามารถบันทึก Topics ได้');
    } finally {
      setLoading(false);
    }
  };

  // Toggle Notification Rule
  const handleToggleRule = (ruleKey: keyof TelegramRules) => {
    setSettings((prev) => ({
      ...prev,
      rules: {
        ...prev.rules,
        [ruleKey]: !prev.rules[ruleKey],
      },
    }));
  };

  // Send Test Notification API call
  const handleSendTestNotification = async (typeToTest?: string) => {
    const targetType = typeToTest || testType;
    setTestStatus('กำลังส่งข้อความแจ้งเตือน Rich Card ไปยัง Telegram Group...');
    try {
      const res = await fetch('/api/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: targetType }),
      });
      const data = await res.json();
      if (data.success) {
        setTestStatus(`✅ ส่งการ์ด ${targetType} สำเร็จ! (Message ID: ${data.messageId}, Topic Thread: ${data.topicThreadId || 'General'})`);
        showToast(`🚀 ส่งการ์ด Telegram [${targetType}] เรียบร้อยแล้ว!`);
        fetchTelegramData();
      } else {
        const errMsg = data.response?.description || data.response?.error || 'ส่งข้อความไม่สำเร็จ';
        setTestStatus(`❌ ส่งล้มเหลว: ${errMsg}`);
        showToast(`❌ ส่งไม่สำเร็จ: ${errMsg}`);
      }
    } catch (err: any) {
      setTestStatus(`❌ ข้อผิดพลาดเครือข่าย: ${err.message}`);
    }
  };

  // Trigger Daily Summary
  const handleSendDailySummary = async () => {
    try {
      setTestStatus('กำลังสร้างและส่งรายงานสรุปประจำวัน (Daily Summary)...');
      const res = await fetch('/api/telegram/send-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'DAILY_SUMMARY' }),
      });
      if (res.ok) {
        setTestStatus('✅ ส่ง CRM Daily Summary สำเร็จแล้ว!');
        showToast('📊 ส่งรายงานสรุปประจำวันเข้า Telegram Group สำเร็จ');
        fetchTelegramData();
      }
    } catch (err) {
      showToast('❌ ไม่สามารถส่งรายงานสรุปได้');
    }
  };

  // Process Worker Queue
  const handleProcessQueue = async () => {
    try {
      const res = await fetch('/api/telegram/process-queue', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        showToast(`⚡ ประมวลผล Queue สำเร็จ (${data.processed} รายการ)`);
        fetchTelegramData();
      }
    } catch (err) {
      showToast('❌ เกิดข้อผิดพลาดในการรัน Queue');
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(TELEGRAM_SQL_SETUP_SCRIPT);
    setCopiedSql(true);
    showToast('📋 คัดลอก DDL & Triggers SQL Script เรียบร้อยแล้ว');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  // Current Card Preview for live viewer
  const liveCardPreview = buildTelegramCard(testType, {
    companyName: 'บริษัท เอบีซี อินโนเวชั่น จำกัด',
    contactName: 'คุณสมชาย ใจดี',
    phone: '081-234-5678',
    lineId: 'somchai_abc',
    nextFollowUpDate: '30/07/2026 10:00',
    overdueDays: 4,
    salesOwner: 'คุณอนุชา (Sales Manager)',
    nextAction: 'โทรติดตามใบเสนอราคาเซ็ตครีมกันแดด 500 ชิ้น',
    dealValue: 85000,
    productName: 'ครีมกันแดด SPF50+ PA++++ (1,000 ชิ้น)',
    reorderCycleDays: 60,
    expectedRevenue: 125000,
    orderId: 'ORD-20260730-001',
    totalAmount: 145000,
    closedDate: '30/07/2026',
    reason: 'คู่แข่งให้ส่วนลด 15% พร้อมแถมสินค้าทดลอง',
    competitor: 'Brand X Global',
    customerId: 'CUST-001',
  });

  const ruleLabels: { key: keyof TelegramRules; label: string; desc: string; emoji: string }[] = [
    { key: 'notifyOverdue', label: 'Overdue Follow-up', desc: 'แจ้งเตือนเมื่อเลยกำหนดติดตามลูกค้า (เกิน 1 วันขึ้นไป)', emoji: '🔴' },
    { key: 'notifyFollowUpToday', label: 'Follow-up วันนี้', desc: 'แจ้งเตือนงานติดตามที่ต้องทำในวันนี้ (08:00)', emoji: '🟣' },
    { key: 'notifyWon', label: 'Deal Won (ปิดการขายสำเร็จ)', desc: 'แจ้งเตือนทันทีเมื่อขายได้ ยอดสั่งซื้อ และทีมขาย', emoji: '🟢' },
    { key: 'notifyQuotationSent', label: 'ส่งใบเสนอราคา (Quotation Sent)', desc: 'แจ้งเตือนเมื่อมีการออกและส่งใบเสนอราคาให้ลูกค้า', emoji: '🟠' },
    { key: 'notifyRepeatDue', label: 'Repeat Order Due', desc: 'แจ้งเตือนเมื่อครบรอบสั่งซื้อซ้ำของลูกค้า', emoji: '🟠' },
    { key: 'notifyRepeatOverdue', label: 'Repeat Order Overdue', desc: 'แจ้งเตือนเมื่อลูกค้าเลยกำหนดสั่งซื้อซ้ำ เสี่ยงเปลี่ยนเจ้า', emoji: '🔴' },
    { key: 'notifyRepeatUpcoming', label: 'Repeat Order Upcoming', desc: 'แจ้งเตือนล่วงหน้า 7 วันก่อนครบรอบสั่งซื้อซ้ำ', emoji: '🔵' },
    { key: 'notifyLost', label: 'Deal Lost (เสียโอกาสขาย)', desc: 'แจ้งเตือนดีลที่หลุด พร้อมวิเคราะห์สาเหตุและคู่แข่ง', emoji: '🔴' },
    { key: 'notifyCustomerAtRisk', label: 'Customer At Risk', desc: 'แจ้งเตือนลูกค้ากลุ่มเสี่ยงเลิกซื้อ (ไม่สั่งเกิน 90 วัน)', emoji: '⚠️' },
    { key: 'notifyDailySummary', label: 'Daily Summary (สรุปประจำวัน)', desc: 'ส่งรายงานสรุปยอดขาย การติดตาม และ Overdue ทุก 08:00/18:00', emoji: '📊' },
    { key: 'notifyOrderCreated', label: 'สร้าง Order ใหม่', desc: 'แจ้งเตือนทุกครั้งที่มีการเปิดออเดอร์สินค้าใหม่ใน CRM', emoji: '📦' },
    { key: 'notifyShipped', label: 'จัดส่งสินค้าเรียบร้อย', desc: 'แจ้งเตือนเมื่อมีการเปลี่ยนสถานะ Order เป็นจัดส่งแล้ว', emoji: '🚚' },
    { key: 'notifySaleAssignment', label: 'มอบหมาย Sales คนใหม่', desc: 'แจ้งเตือนไปยังกลุ่มเมื่อมีการโอนย้ายลูกค้าให้ Sale ดูแล', emoji: '👤' },
    { key: 'notifyWeeklySummary', label: 'Weekly Summary (สรุปประจำสัปดาห์)', desc: 'ส่งรายงานวิเคราะห์ Pipeline & Conversion ประจำสัปดาห์', emoji: '📈' },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white font-medium text-xs px-4 py-3 rounded-2xl shadow-2xl border border-slate-800 flex items-center gap-2 animate-bounce">
          <Sparkles size={16} className="text-amber-400" />
          {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.3),transparent_70%)] pointer-events-none" />

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-blue-500/20 text-blue-300 font-bold px-3 py-1 rounded-full text-xs border border-blue-400/30 flex items-center gap-1.5">
                <Send size={13} className="text-blue-400" /> Telegram Group Notification
              </span>
              <span
                className={`font-bold px-3 py-1 rounded-full text-xs flex items-center gap-1 ${
                  settings.is_enabled
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${settings.is_enabled ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                {settings.is_enabled ? 'Bot Active & Listening' : 'Bot Disabled'}
              </span>
            </div>

            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              ระบบแจ้งเตือนกลุ่ม Telegram แบบ Rich Flex Cards (Production-ready)
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl">
              แจ้งเตือนทีมขายเข้ากลุ่ม Telegram / Supergroup / Topics แบบเรียลไทม์ พร้อมการ์ดตกแต่งสวยงาม ธีมสีแยกตามสถานะ
              และปุ่มกด Inline Keyboard เปิด CRM และโทรหาลูกค้าได้ทันที
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleSendTestNotification()}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all flex items-center gap-2 active:scale-95"
            >
              <Zap size={15} /> ทดสอบส่งแจ้งเตือน
            </button>
            <button
              onClick={handleSendDailySummary}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center gap-2 active:scale-95"
            >
              <FileText size={15} /> ส่งสรุปประจำวัน
            </button>
            <button
              onClick={handleProcessQueue}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> รัน Queue Worker
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono text-slate-300">
          <div>
            <span className="text-slate-400 block text-[10px] font-sans">Telegram Bot Chat ID:</span>
            <span className="font-bold text-white">{settings.group_chat_id || 'Not set'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] font-sans">Forum Topic Thread ID:</span>
            <span className="font-bold text-blue-300">{settings.topic_id || 'General (No Topic)'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] font-sans">Notification Queue Pending:</span>
            <span className="font-bold text-amber-300">{queue.filter((q) => q.status === 'PENDING').length} รายการ</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] font-sans">Total Logs Dispatched:</span>
            <span className="font-bold text-emerald-300">{logs.length} ครั้ง</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('PREVIEW')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'PREVIEW'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Smartphone size={16} /> 📲 Live Telegram Flex Card Previewer
        </button>

        <button
          onClick={() => setActiveTab('SETTINGS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'SETTINGS'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Settings size={16} /> ⚙️ ตั้งค่า Bot & Group Chat
        </button>

        <button
          onClick={() => setActiveTab('RULES')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'RULES'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Bell size={16} /> 🎛️ เงื่อนไขการแจ้งเตือน (Rules)
        </button>

        <button
          onClick={() => setActiveTab('LOGS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'LOGS'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock size={16} /> 📜 ประวัติการส่ง & Queue Monitor ({logs.length})
        </button>

        <button
          onClick={() => setActiveTab('SQL')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'SQL'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Terminal size={16} /> 💾 Database DDL & Triggers SQL Script
        </button>
      </div>

      {/* Test Status Bar if active */}
      {testStatus && (
        <div className="p-4 bg-slate-900 text-slate-100 border border-slate-800 rounded-2xl text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal size={16} className="text-blue-400" />
            <span>{testStatus}</span>
          </div>
          <button onClick={() => setTestStatus(null)} className="text-slate-400 hover:text-white font-bold text-xs">
            ปิด
          </button>
        </div>
      )}

      {/* TAB 1: LIVE CARD PREVIEWER */}
      {activeTab === 'PREVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 soft-shadow space-y-5">
            <div>
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Smartphone size={18} className="text-blue-600" /> เลือกประเภทการ์ดแจ้งเตือน (Notification Event Cards)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                คลิกเลือกเหตุการณ์เพื่อดูพรีวิวรูปแบบข้อความ ปุ่ม Inline Keyboard และสีธีมของการ์ด
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">เหตุการณ์การทำงาน (Event Type)</label>
              <select
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
              >
                <option value="FOLLOW_UP">📋 TELEGRAM_TOPIC_FOLLOWUP (Topic ID: 2 - 📋 Follow-up)</option>
                <option value="QUOTATION">💰 TELEGRAM_TOPIC_QUOTATION (Topic ID: 4 - 💰 Quotation)</option>
                <option value="ORDERS">📦 TELEGRAM_TOPIC_ORDERS (Topic ID: 7 - 📦 Orders)</option>
                <option value="REPEAT_ORDERS">🔁 TELEGRAM_TOPIC_REPEAT_ORDERS (Topic ID: 8 - 🔁 Repeat Orders)</option>
                <option value="OVERDUE">🔴 TELEGRAM_TOPIC_OVERDUE (Topic ID: 9 - 🔴 Overdue)</option>
                <option value="WON_DEALS">🏆 TELEGRAM_TOPIC_WON_DEALS (Topic ID: 10 - 🏆 Won Deals)</option>
              </select>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>โหมดแสดงผลหน้าจอ Telegram App:</span>
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
                  <button
                    onClick={() => setPreviewTheme('DARK')}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                      previewTheme === 'DARK' ? 'bg-slate-900 text-white' : 'text-slate-600'
                    }`}
                  >
                    Dark Theme
                  </button>
                  <button
                    onClick={() => setPreviewTheme('LIGHT')}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                      previewTheme === 'LIGHT' ? 'bg-blue-600 text-white' : 'text-slate-600'
                    }`}
                  >
                    Light Theme
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 space-y-1">
                <p>
                  • <b>HTML Parse Mode:</b> ใช้ <code>&lt;b&gt;</code>, <code>&lt;code&gt;</code>, <code>&lt;i&gt;</code>
                </p>
                <p>
                  • <b>Inline Keyboards:</b> ปุ่มกดตอบสนองทันที เปิดหน้า CRM, โทรสายตรง หรือทัก LINE
                </p>
                <p>
                  • <b>Theme Color Bar:</b> แท่งสีด้านบนซ้ายแยกตามระดับความสำคัญ
                </p>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                onClick={() => handleSendTestNotification(testType)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Send size={15} /> ส่งข้อความนี้เข้า Telegram Group จริงทันที
              </button>
            </div>
          </div>

          {/* Telegram Phone Mockup */}
          <div className="lg:col-span-7 flex justify-center">
            <div
              className={`w-full max-w-md rounded-[36px] border-4 ${
                previewTheme === 'DARK' ? 'bg-[#0E1621] border-slate-800 text-white' : 'bg-[#E7EBF0] border-slate-300 text-slate-900'
              } p-4 shadow-2xl space-y-4 font-sans relative`}
            >
              {/* Phone Top Notch / Header */}
              <div
                className={`flex items-center justify-between pb-3 border-b ${
                  previewTheme === 'DARK' ? 'border-slate-800' : 'border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-xs">
                    🤖
                  </div>
                  <div>
                    <h4 className="font-bold text-xs">CRM Sales Group Alerts</h4>
                    <span className="text-[10px] text-blue-400 block">bot, topic #{settings.topic_id || 'General'}</span>
                  </div>
                </div>

                <div className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold border border-blue-400/30">
                  Telegram Forum Topic
                </div>
              </div>

              {/* Message Bubble Container */}
              <div className="space-y-3 py-2 min-h-[380px]">
                {/* Date Divider */}
                <div className="text-center">
                  <span className="bg-black/20 text-slate-300 font-bold text-[10px] px-3 py-0.5 rounded-full">
                    วันนี้ {new Date().toLocaleDateString('th-TH')}
                  </span>
                </div>

                {/* Rich Card Bubble */}
                <div className="flex justify-start">
                  <div
                    className={`max-w-[95%] rounded-2xl p-4 shadow-lg text-xs space-y-3 relative overflow-hidden ${
                      previewTheme === 'DARK' ? 'bg-[#182533] text-slate-100' : 'bg-white text-slate-900 border border-slate-200'
                    }`}
                  >
                    {/* Left Accent Color Strip */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1.5"
                      style={{ backgroundColor: liveCardPreview.headerColor }}
                    />

                    {/* Card Body Text formatted with HTML simulation */}
                    <div
                      className="leading-relaxed font-sans whitespace-pre-wrap pl-1"
                      dangerouslySetInnerHTML={{
                        __html: liveCardPreview.text
                          .replace(/<b>/g, '<strong class="font-black text-blue-300">')
                          .replace(/<\/b>/g, '</strong>')
                          .replace(/<code>/g, '<code class="bg-black/30 text-amber-300 font-mono px-1 py-0.5 rounded text-[11px]">')
                          .replace(/<\/code>/g, '</code>')
                          .replace(/<i>/g, '<em class="text-slate-400 italic">')
                          .replace(/<\/i>/g, '</em>'),
                      }}
                    />

                    {/* Inline Keyboard Buttons */}
                    {liveCardPreview.reply_markup && (
                      <div className="pt-2 border-t border-slate-700/50 space-y-1.5">
                        {liveCardPreview.reply_markup.inline_keyboard.map((row, rIdx) => (
                          <div key={rIdx} className="grid grid-cols-2 gap-1.5">
                            {row.map((btn, bIdx) => (
                              <a
                                key={bIdx}
                                href={btn.url || '#'}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => {
                                  e.preventDefault();
                                  showToast(`👆 กดปุ่ม Inline Keyboard: "${btn.text}"`);
                                }}
                                className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 font-bold text-[11px] py-2 px-2.5 rounded-xl border border-blue-500/30 text-center transition-all flex items-center justify-center gap-1 active:scale-95"
                              >
                                {btn.text}
                              </a>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className="text-[9px] text-slate-400 text-right pt-1">
                      {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} ✓✓
                    </div>
                  </div>
                </div>
              </div>

              {/* Telegram Input Bar */}
              <div
                className={`p-2.5 rounded-2xl flex items-center justify-between text-xs text-slate-400 ${
                  previewTheme === 'DARK' ? 'bg-[#182533]' : 'bg-white border border-slate-200'
                }`}
              >
                <span>พิมพ์ข้อความในกลุ่ม...</span>
                <Send size={16} className="text-blue-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BOT & GROUP SETTINGS */}
      {activeTab === 'SETTINGS' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 soft-shadow space-y-6">
          <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Settings size={20} className="text-blue-600" /> การตั้งค่า Telegram Bot API & Group Credentials
              </h3>
              <p className="text-xs text-slate-500">
                เชื่อมต่อ Telegram Bot, Group Chat ID, Forum Topic ID และ Webhook Secret
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700">สถานะ Bot:</label>
              <button
                onClick={() => setSettings((p) => ({ ...p, is_enabled: !p.is_enabled }))}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                  settings.is_enabled ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                }`}
              >
                {settings.is_enabled ? 'เปิดใช้งาน (Active)' : 'ปิดใช้งาน (Disabled)'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Key size={14} className="text-blue-600" /> Telegram Bot Token
              </label>
              <input
                type="text"
                value={settings.bot_token}
                onChange={(e) => setSettings({ ...settings, bot_token: e.target.value })}
                placeholder="7891234560:AAFx9831aB..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[10px] text-slate-500">
                รับได้จาก Telegram <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-blue-600 underline">@BotFather</a>
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MessageSquare size={14} className="text-blue-600" /> Group Chat ID / Supergroup ID
              </label>
              <input
                type="text"
                value={settings.group_chat_id}
                onChange={(e) => setSettings({ ...settings, group_chat_id: e.target.value })}
                placeholder="-1002345678901"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[10px] text-slate-500">
                ต้องนำ Bot เข้ากลุ่มและตั้งค่าเป็น Admin ก่อน (ขึ้นต้นด้วย -100...)
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Layers size={14} className="text-blue-600" /> Topic ID (สำหรับ Telegram Group Topics/Forum)
              </label>
              <input
                type="text"
                value={settings.topic_id}
                onChange={(e) => setSettings({ ...settings, topic_id: e.target.value })}
                placeholder="12 (เว้นว่างไว้หากไม่ใช้ Topic)"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[10px] text-slate-500">
                เลข Message Thread ID ของห้องย่อยใน Telegram Supergroup
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Shield size={14} className="text-blue-600" /> Webhook Secret Token
              </label>
              <input
                type="text"
                value={settings.webhook_secret}
                onChange={(e) => setSettings({ ...settings, webhook_secret: e.target.value })}
                placeholder="wh_secret_crm_2026_xyz"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[10px] text-slate-500">
                ใช้สำหรับยืนยันความปลอดภัยของ Webhook <code>x-telegram-bot-api-secret-token</code>
              </p>
            </div>
          </div>

          {/* TELEGRAM FORUM TOPICS MAPPING TABLE */}
          <div className="pt-6 border-t border-slate-100 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Layers size={18} className="text-blue-600" /> Telegram Forum Topics Configuration (แยกส่งแจ้งเตือนตาม Topic)
                </h4>
                <p className="text-xs text-slate-500">
                  กำหนด Thread ID ประจำแต่ละ CRM Category เพื่อแยกการแจ้งเตือนเข้า Topic บน Telegram Group โดยอัตโนมัติ
                </p>
              </div>

              <button
                onClick={handleSaveTopics}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 size={14} /> บันทึก Topic IDs
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {topics.map((tp, idx) => (
                <div key={tp.id || tp.topic_key} className="bg-slate-50 border border-slate-200 p-3 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-slate-800">{tp.name}</span>
                    <span className="font-mono text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                      {tp.topic_key}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-bold text-slate-500 w-16">Thread ID:</label>
                    <input
                      type="number"
                      value={tp.thread_id}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setTopics((prev) => prev.map((t, i) => (i === idx ? { ...t, thread_id: val } : t)));
                      }}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono text-xs font-bold text-blue-600 text-center"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">{tp.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              onClick={handleSaveSettings}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <CheckCircle2 size={16} /> บันทึกการตั้งค่าทั้งหมด
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: NOTIFICATION RULES */}
      {activeTab === 'RULES' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 soft-shadow space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Bell size={20} className="text-blue-600" /> เงื่อนไขการส่งแจ้งเตือน (Notification Rules Toggles)
            </h3>
            <p className="text-xs text-slate-500">
              สวิตช์เปิด/ปิดการส่งแจ้งเตือนแต่ละประเภท ระบบจะส่งเฉพาะเหตุการณ์ที่เปิดสวิตช์ไว้เท่านั้น
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ruleLabels.map((rule) => {
              const isChecked = !!settings.rules[rule.key];
              return (
                <div
                  key={rule.key}
                  onClick={() => handleToggleRule(rule.key)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    isChecked
                      ? 'bg-blue-50/50 border-blue-200 shadow-2xs'
                      : 'bg-slate-50/50 border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      <span className="text-base">{rule.emoji}</span>
                      {rule.label}
                    </span>
                    <p className="text-[11px] text-slate-500 leading-snug">{rule.desc}</p>
                  </div>

                  <div
                    className={`w-11 h-6 rounded-full transition-colors flex items-center p-1 ${
                      isChecked ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSaveSettings}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <CheckCircle2 size={16} /> บันทึกเงื่อนไข
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: LOGS & QUEUE MONITOR */}
      {activeTab === 'LOGS' && (
        <div className="space-y-6">
          {/* Notification Queue Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 soft-shadow space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <Clock size={18} className="text-amber-600" /> คิวรอส่งแจ้งเตือน (Notification Queue)
                </h3>
                <p className="text-xs text-slate-500">คิวงานรอการประมวลผลพร้อมระบบ Retry และ Next Retry Timestamp</p>
              </div>

              <button
                onClick={handleProcessQueue}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-2xs"
              >
                <RefreshCw size={14} /> ประมวลผล คิวตอนนี้
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-100 font-bold text-slate-700 border-b">
                    <th className="py-2.5 px-3">Queue ID</th>
                    <th className="py-2.5 px-3">Event Type</th>
                    <th className="py-2.5 px-3">Payload Summary</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Retries</th>
                    <th className="py-2.5 px-3">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {queue.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400 font-sans">
                        ไม่มีคิวค้างอยู่ในระบบ
                      </td>
                    </tr>
                  ) : (
                    queue.map((q) => (
                      <tr key={q.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-800">{q.id}</td>
                        <td className="py-2.5 px-3">
                          <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded text-[10px]">
                            {q.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate font-sans">
                          {q.payload?.companyName || q.payload?.title || JSON.stringify(q.payload)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                              q.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : q.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {q.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{q.retry_count} / 5</td>
                        <td className="py-2.5 px-3 text-slate-500">{q.created_at}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Delivery Logs Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 soft-shadow space-y-4">
            <div>
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <FileText size={18} className="text-blue-600" /> ประวัติการส่งแจ้งเตือน (Telegram Notification Logs)
              </h3>
              <p className="text-xs text-slate-500">บันทึกสถานะการส่งข้อความย้อนหลัง Response จาก Telegram API</p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-100 font-bold text-slate-700 border-b">
                    <th className="py-2.5 px-3">Log ID</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Telegram Chat ID</th>
                    <th className="py-2.5 px-3">Message ID</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-800">{log.id}</td>
                      <td className="py-2.5 px-3">
                        <span className="bg-slate-200 text-slate-800 font-bold px-2 py-0.5 rounded text-[10px]">
                          {log.notification_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{log.telegram_chat_id || '-'}</td>
                      <td className="py-2.5 px-3 font-bold text-blue-600">#{log.telegram_message_id || 'N/A'}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                            log.status === 'SENT' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{log.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DATABASE DDL & TRIGGERS */}
      {activeTab === 'SQL' && (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 text-slate-100 shadow-2xl space-y-4 font-mono text-xs">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800 font-sans">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Terminal size={20} className="text-emerald-400" /> PostgreSQL / Supabase Migration Script
              </h3>
              <p className="text-xs text-slate-400">
                สคริปต์สร้างตาราง <code>telegram_settings</code>, <code>telegram_notification_logs</code>, <code>notification_queue</code>, SQL Functions และ Database Triggers
              </p>
            </div>

            <button
              onClick={handleCopySql}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2"
            >
              {copiedSql ? <Check size={16} /> : <Copy size={16} />}
              {copiedSql ? 'คัดลอกแล้ว!' : 'คัดลอก SQL Script'}
            </button>
          </div>

          <div className="bg-black/50 p-4 rounded-2xl border border-slate-800 overflow-x-auto max-h-[500px]">
            <pre className="text-emerald-400 leading-relaxed text-[11px] whitespace-pre-wrap">
              {TELEGRAM_SQL_SETUP_SCRIPT}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
