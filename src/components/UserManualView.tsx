import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  ChevronRight,
  CheckCircle2,
  ArrowRight,
  Database,
  Users,
  FileText,
  Clock,
  ShoppingBag,
  Repeat,
  Send,
  Lock,
  BarChart3,
  HelpCircle,
  Sparkles,
  Upload,
  Calendar,
  UserPlus,
  Headphones,
  Zap,
  Info
} from 'lucide-react';
import { ViewTab } from '../types';

interface UserManualViewProps {
  onNavigate: (tab: ViewTab) => void;
}

interface ProcessStep {
  stepNumber: number;
  title: string;
  description: string;
  details: string[];
  tip?: string;
  badge?: string;
}

interface WorkflowSection {
  id: string;
  title: string;
  category: string;
  icon: React.ElementType;
  badgeColor: string;
  targetTab?: ViewTab;
  summary: string;
  steps: ProcessStep[];
}

export const UserManualView: React.FC<UserManualViewProps> = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [expandedSection, setExpandedSection] = useState<string | null>('sec-1');

  const sections: WorkflowSection[] = [
    {
      id: 'sec-1',
      title: '1. การเริ่มต้นระบบและการซิงค์ Supabase Database',
      category: 'SYSTEM',
      icon: Database,
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      targetTab: 'SETTINGS',
      summary: 'ขั้นตอนการเชื่อมต่อฐานข้อมูล Supabase และการซิงค์ข้อมูลเริ่มต้น (Seed Data) โดยไม่ใช้ Mock Data',
      steps: [
        {
          stepNumber: 1,
          title: 'ตรวจสอบสถานะการเชื่อมต่อ Supabase',
          description: 'ระบบตั้งค่าให้เชื่อมต่อกับ Supabase Live Database โดยตรง',
          details: [
            'สังเกตสัญลักษณ์ "ระบบออนไลน์" และ "Supabase Connected" ที่แถบเมนูด้านซ้ายและในหน้าตั้งค่า',
            'ทุกการกดเพิ่ม ลบ หรือแก้ไขข้อมูลจะทำการส่งไปยัง REST API ของ Supabase โดยอัตโนมัติ'
          ],
          tip: 'หากพบข้อผิดพลาดเกี่ยวกับ Table Not Found ให้ไปที่หน้าตั้งค่าแล้วคัดลอก SQL Script ไปรันใน Supabase SQL Editor'
        },
        {
          stepNumber: 2,
          title: 'สร้างและเตรียมโครงสร้างตาราง (Database DDL Script)',
          description: 'สร้างตารางที่จำเป็นครบทั้ง 9 ตารางใน Supabase',
          details: [
            'เข้าไปที่ "หน้าตั้งค่า (Settings)" -> แท็บ "⚡ Supabase Live Database"',
            'กดปุ่ม "คัดลอก SQL สคริปต์ (Copy SQL)"',
            'นำ SQL ไปวางที่ https://supabase.com/dashboard/project/wbrktjjgimvbddeobaeq/sql/new แล้วกด RUN'
          ],
          badge: 'SQL DDL'
        },
        {
          stepNumber: 3,
          title: 'การซิงค์ชุดข้อมูลตัวอย่าง (Sync & Seed Initial Data)',
          description: 'เติมข้อมูลตั้งต้นสำหรับทดสอบการทำงานของระบบ CRM',
          details: [
            'ในหน้าตั้งค่า แท็บ Supabase กดปุ่ม "Sync Seed Data to Supabase"',
            'ระบบจะสร้างลูกค้า, กิจกรรม, และคำสั่งซื้อตัวอย่างบันทึกลง Supabase โดยตรง'
          ]
        }
      ]
    },
    {
      id: 'sec-2',
      title: '2. ขั้นตอนการบริหารจัดการลูกค้า (Customer CRM Workflow)',
      category: 'CUSTOMER',
      icon: Users,
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      targetTab: 'CUSTOMERS',
      summary: 'กระบวนการเพิ่มรายชื่อลูกค้า การจัดกลุ่มตามสถานะ Lifecycle และการดูโปรไฟล์แบบ 360 องศา',
      steps: [
        {
          stepNumber: 1,
          title: 'การเพิ่มลูกค้ารายใหม่ (Create New Customer)',
          description: 'กดปุ่ม "+ ลูกค้าใหม่" ที่มุมขวาบนของแถบ Header',
          details: [
            'กรอกชื่อบริษัท/องค์กร, ผู้ติดต่อหลัก, เบอร์โทรศัพท์, LINE ID, อีเมล',
            'ระบุสินค้าที่สนใจ, ช่องทางที่ได้ลูกค้า (Source), และผู้ดูแล (Sales Owner)',
            'กำหนดเกณฑ์ประเภทลูกค้า (Platinum, Gold, Silver, General)',
            'กด "บันทึกข้อมูลลูกค้า" ข้อมูลจะลงตาราง customers ใน Supabase ทันที'
          ]
        },
        {
          stepNumber: 2,
          title: 'การเปลี่ยนสถานะการขาย (Customer Lifecycle Status)',
          description: 'ย้ายสถานะลูกค้าตามความก้าวหน้าของการขาย',
          details: [
            'สถานะ NEW -> CONTACTED -> FOLLOW_UP -> QUOTATION_SENT -> NEGOTIATION -> WON / LOST',
            'สามารถกดเปลี่ยนสถานะได้ทั้งในหน้า Customer List, Leads Kanban Board, และ Customer Profile'
          ]
        },
        {
          stepNumber: 3,
          title: 'การดูโปรไฟล์ลูกค้าเชิงลึก (Customer Profile 360°)',
          description: 'คลิกที่ชื่อลูกค้าเพื่อเข้าสู่หน้า Customer Profile',
          details: [
            'รวมประวัติคำสั่งซื้อทั้งหมด (Orders History)',
            'รวมไทม์ไลน์กิจกรรมการติดต่อ (Activities Timeline)',
            'รวมคลังเอกสารแนบประจำตัวลูกค้า (Documents)',
            'รวมระบบโน้ตภายในและการปักหมุดข่าวสาร (Internal Notes)'
          ]
        }
      ]
    },
    {
      id: 'sec-3',
      title: '3. ขั้นตอนการอัปโหลดและจัดการเอกสารประจำตัวลูกค้า (Document Management)',
      category: 'DOCUMENT',
      icon: FileText,
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      targetTab: 'CUSTOMERS',
      summary: 'ระบบการแนบไฟล์ ใบเสนอราคา ข้อเสนอโครงการ ใบแจ้งหนี้ และสัญญาลง Supabase',
      steps: [
        {
          stepNumber: 1,
          title: 'เปิดหน้าโปรไฟล์ลูกค้าที่ต้องการแนบไฟล์',
          description: 'เข้าไปที่เมนู Customers -> เลือกรายชื่อลูกค้า -> เลื่อนลงมาที่กล่อง "เอกสารที่เกี่ยวข้อง"',
          details: [
            'สังเกตการแสดงผลจำนวนเอกสารย่อยที่มีอยู่ในปัจจุบัน'
          ]
        },
        {
          stepNumber: 2,
          title: 'การเลือกประเภทเอกสารและการอัปโหลด',
          description: 'สามารถเลือกประเภท: ใบเสนอราคา, ข้อเสนอโครงการ, ใบแจ้งหนี้, สัญญา, เอกสารทั่วไป',
          details: [
            'กดปุ่ม "อัปโหลดเอกสาร" หรือลากไฟล์มาวางในพื้นที่ Drop Zone (Drag & Drop)',
            'รองรับไฟล์ PDF, รูปภาพ (PNG, JPG), Word, Excel ฯลฯ',
            'ระบบแปลงเป็น DataURL / Binary บันทึกลงตาราง documents ใน Supabase โดยตรง'
          ],
          tip: 'ชื่อประเภทเอกสารจะแสดงป้าย Tag สีจำแนกชัดเจน (เช่น ใบเสนอราคา = สีส้ม, สัญญา = สีเขียว)'
        },
        {
          stepNumber: 3,
          title: 'การดูพรีวิว ดาวน์โหลด และลบเอกสาร',
          description: 'จัดการไฟล์เอกสารในระบบ',
          details: [
            'กดรูปดวงตา 👁️ เพื่อเปิดพรีวิวดูตัวอย่างเอกสารทันทีใน Pop-up Modal',
            'กดปุ่มดาวน์โหลด 📥 เพื่อเซฟไฟล์ลงเครื่องคอมพิวเตอร์',
            'กดปุ่มถังขยะ 🗑️ เพื่อยืนยันการลบเอกสารออกจาก Supabase'
          ]
        }
      ]
    },
    {
      id: 'sec-4',
      title: '4. ขั้นตอนการบันทึกกิจกรรมและการนัดหมายติดตาม (Activities & Calendar)',
      category: 'ACTIVITY',
      icon: Clock,
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
      targetTab: 'ACTIVITIES',
      summary: 'กระบวนการลงบันทึกการโทร LINE เข้าพบ และนัดหมายในปฏิทิน',
      steps: [
        {
          stepNumber: 1,
          title: 'การสร้างกิจกรรมใหม่ (Create Activity)',
          description: 'กดปุ่ม "+ บันทึกการติดต่อ" บน Header หรือในหน้า Activities',
          details: [
            'เลือกประเภทกิจกรรม: โทรศัพท์, LINE, อีเมล, เข้าพบลูกค้า, ประชุม, นำเสนอสินค้า',
            'เลือกลูกค้าที่เกี่ยวข้อง และเขียนรายละเอียดผลการพูดคุย',
            'กำหนด "วัน-เวลาติดตามครั้งถัดไป (Next Follow-up Date/Time)"'
          ]
        },
        {
          stepNumber: 2,
          title: 'การแจ้งเตือนงานเกินกำหนด (Overdue Follow-ups)',
          description: 'ระบบจะตรวจจับกิจกรรมที่ถึงกำหนดหรือเกินกำหนด',
          details: [
            'แสดงป้ายตัวเลขสีแดงบนเมนู Activities และ Dashboard',
            'สามารถเลือกกรองเฉพาะงานที่เกินกำหนดเพื่อรีบโทรติดตามลูกค้าได้ทันที'
          ]
        },
        {
          stepNumber: 3,
          title: 'การดูนัดหมายในรูปแบบ Calendar View',
          description: 'เข้าเมนู Calendar เพื่อดูภาพรวมตารางงานตลอดทั้งเดือน',
          details: [
            'คลิกเลือกวันที่ในปฏิทินเพื่อดูรายการนัดหมายและโทรติดตามของวันนั้นๆ'
          ]
        }
      ]
    },
    {
      id: 'sec-5',
      title: '5. ขั้นตอนการสร้างคำสั่งซื้อและการออกใบเสนอราคา (Orders Management)',
      category: 'ORDER',
      icon: ShoppingBag,
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      targetTab: 'ORDERS',
      summary: 'การบันทึกประวัติการซื้อ ยอดขาย สินค้า และสถานะการชำระเงิน/จัดส่ง',
      steps: [
        {
          stepNumber: 1,
          title: 'เปิดหน้าสร้างคำสั่งซื้อใหม่',
          description: 'เข้าเมนู Orders แล้วกด "+ สร้างคำสั่งซื้อใหม่"',
          details: [
            'เลือกลูกค้า และระบุรายการสินค้า จำนวน และราคาต่อหน่วย',
            'ระบบคำนวณราคารวม ส่วนลด และภาษีมูลค่าเพิ่มให้อัตโนมัติ'
          ]
        },
        {
          stepNumber: 2,
          title: 'การอัปเดตสถานะการชำระเงินและการจัดส่ง',
          description: 'ระบุสถานะ Payment Status (PAID / PENDING / OVERDUE) และ Delivery Status',
          details: [
            'เมื่อคำสั่งซื้อสำเร็จ ยอดซื้อสะสม (Total Purchases) และจำนวนออเดอร์ของลูกค้าจะถูกอัปเดตบน Supabase ทันที'
          ]
        }
      ]
    },
    {
      id: 'sec-6',
      title: '6. ขั้นตอนการติดตามการซื้อซ้ำอัตโนมัติ (Repeat Order CRM Workflow)',
      category: 'REPEAT',
      icon: Repeat,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      targetTab: 'REPEAT_ORDERS',
      summary: 'อัลกอริทึมคำนวณรอบการซื้อซ้ำของลูกค้าแต่ละราย เพื่อกระตุ้นยอดขายกลับมาอีกครั้ง',
      steps: [
        {
          stepNumber: 1,
          title: 'ความเข้าใจรอบการซื้อซ้ำ (Avg Reorder Cycle Days)',
          description: 'ระบบคำนวณจากระยะห่างของการสั่งซื้อครั้งก่อนๆ ของลูกค้า (เช่น ทุกๆ 30 วัน หรือ 60 วัน)',
          details: [
            'นำวันที่สั่งซื้อล่าสุด (Last Order Date) + รอบการสั่งซื้อ = วันที่คาดว่าจะสั่งซื้อซ้ำครั้งถัดไป (Next Reorder Date)'
          ]
        },
        {
          stepNumber: 2,
          title: 'การจำแนกสถานะการซื้อซ้ำ (Repeat Order Status)',
          description: 'แบ่งตามความกระชั้นชิดของเวลา:',
          details: [
            '🟡 UPCOMING: ใกล้ถึงกำหนดสั่งซ้ำ (ภายใน 7-14 วันข้างหน้า)',
            '🟠 DUE: ถึงกำหนดสั่งซ้ำในวันนี้',
            '🔴 OVERDUE: เกินกำหนดสั่งซ้ำแล้ว (ควรเร่งโทร/ส่งไลน์ติดตาม)',
            '🟢 REORDERED: ลูกค้ากลับมาสั่งซื้อซ้ำเรียบร้อยแล้ว'
          ]
        },
        {
          stepNumber: 3,
          title: 'การกดกระตุ้นการสั่งซื้อซ้ำ',
          description: 'เข้าหน้า Repeat Orders -> เลือกกลุ่มลูกค้าที่ถึงกำหนด -> กดส่งข้อความทักทาย หรือสร้างการติดตามใหม่',
          details: [
            'ช่วยให้ทีมขายไม่พลาดโอกาสปิดการขายซ้ำกับลูกค้าเก่า'
          ]
        }
      ]
    },
    {
      id: 'sec-7',
      title: '7. ขั้นตอนการตั้งค่า Telegram Bot แจ้งเตือนเข้ากลุ่มทีมขาย (Telegram Bot Integration)',
      category: 'TELEGRAM',
      icon: Send,
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
      targetTab: 'SETTINGS',
      summary: 'การเชื่อมต่อบอท Telegram สำหรับเด้งการแจ้งเตือนงานและคำสั่งซื้อใหม่เข้ากลุ่มไลน์/Telegram',
      steps: [
        {
          stepNumber: 1,
          title: 'สร้าง Telegram Bot และรับ Token',
          description: 'ทักทาย @BotFather ใน Telegram แล้วพิมพ์ /newbot เพื่อสร้างบอทใหม่',
          details: [
            'คัดลอก HTTP API Token เช่น 8119284210:AAEt56... นำมาวางในหน้าตั้งค่า'
          ]
        },
        {
          stepNumber: 2,
          title: 'ดึง Chat ID ของกลุ่ม Telegram',
          description: 'ดึงบอทเข้ากลุ่มทีมขาย แล้วพิมพ์ข้อความ เช่น /start',
          details: [
            'เข้า URL https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates เพื่อดู chat_id (เช่น -10023456789)'
          ]
        },
        {
          stepNumber: 3,
          title: 'การเปิดระบบตารางคิวและทริกเกอร์แจ้งเตือน (Notification Queue & Triggers)',
          description: 'รัน SQL Script ในหน้าตั้งค่า -> แท็บ Telegram',
          details: [
            'เมื่อมีการสร้างออเดอร์ใหม่ หรือกิจกรรมใหม่ ทริกเกอร์ของ PostgreSQL จะเพิ่มคิวเข้า notification_queue',
            'ระบบ Background Service จะส่งการ์ดแจ้งเตือนรูปสวยงามเข้ากลุ่ม Telegram อัตโนมัติ'
          ]
        }
      ]
    },
    {
      id: 'sec-8',
      title: '8. ขั้นตอนการล็อกรหัสผ่านหน้าตั้งค่าและความปลอดภัย (Settings Security Lock)',
      category: 'SECURITY',
      icon: Lock,
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
      targetTab: 'SETTINGS',
      summary: 'การป้องกันผู้ไม่เกี่ยวข้องปรับเปลี่ยนโครงสร้างฐานข้อมูลด้วยรหัสผ่านความปลอดภัย',
      steps: [
        {
          stepNumber: 1,
          title: 'รหัสผ่านเข้าหน้าตั้งค่าระบบ',
          description: 'เมื่อคลิกเมนู Settings (ตั้งค่า) ระบบจะแสดงหน้าล็อกความปลอดภัย',
          details: [
            'รหัสผ่านเริ่มต้นของผู้ดูแลระบบคือ: 43210344',
            'เมื่อกรอกรหัสถูกต้อง ระบบจะอนุญาตให้เข้าถึงการตั้งค่า Supabase, Telegram และสิทธิ์ทีม'
          ],
          tip: 'รหัสผ่านคือ 43210344'
        },
        {
          stepNumber: 2,
          title: 'การล็อกหน้าตั้งค่ากลับคืน',
          description: 'เมื่อใช้งานตั้งค่าเสร็จแล้ว สามารถกดปุ่ม "🔒 ล็อกหน้าตั้งค่า" ที่มุมขวาบน',
          details: [
            'ระบบจะลบเซสชันและล็อกหน้าตั้งค่าใหม่อัตโนมัติเพื่อความปลอดภัย'
          ]
        }
      ]
    }
  ];

  const filteredSections = sections.filter((sec) => {
    const matchesCategory = activeCategory === 'ALL' || sec.category === activeCategory;
    const matchesSearch =
      sec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sec.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sec.steps.some(
        (s) =>
          s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.details.some((d) => d.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0B3B8C] via-blue-800 to-indigo-900 rounded-3xl p-6 lg:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/30 border border-blue-400/30 text-blue-200 text-xs font-semibold backdrop-blur-xs">
            <Sparkles size={14} className="text-amber-300 animate-pulse" /> คู่มือการใช้งานระบบ CRM & Repeat Sales
          </div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight leading-tight">
            ขั้นตอนกระบวนการทำงานแบบละเอียด (Step-by-Step Operating Guide)
          </h1>
          <p className="text-xs lg:text-sm text-blue-100/90 leading-relaxed">
            คู่มือแนะนำการใช้งานระบบ CRM ครบทุกขั้นตอน ตั้งแต่การซิงค์ฐานข้อมูล Supabase, การจัดการรายชื่อลูกค้า, อัปโหลดเอกสาร, ออกใบเสนอราคา, ติดตามการซื้อซ้ำ, จนถึงการตั้งค่าบอท Telegram
          </p>
        </div>

        {/* Search Input Bar */}
        <div className="mt-6 relative max-w-2xl">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาขั้นตอนการทำงาน (เช่น อัปโหลดเอกสาร, รหัสผ่านตั้งค่า, ซื้อซ้ำ, Telegram)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white/95 text-slate-800 font-medium text-xs rounded-2xl border border-white/20 shadow-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold bg-slate-200 px-2 py-0.5 rounded-lg"
            >
              ล้าง
            </button>
          )}
        </div>
      </div>

      {/* Filter Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'ALL', label: 'กระบวนการทั้งหมด', icon: BookOpen },
          { id: 'SYSTEM', label: 'เริ่มต้นระบบ & Supabase', icon: Database },
          { id: 'CUSTOMER', label: 'จัดการลูกค้า & สถานะ', icon: Users },
          { id: 'DOCUMENT', label: 'อัปโหลด & เอกสาร', icon: FileText },
          { id: 'ACTIVITY', label: 'กิจกรรม & ปฏิทิน', icon: Clock },
          { id: 'ORDER', label: 'คำสั่งซื้อ & ออกบิล', icon: ShoppingBag },
          { id: 'REPEAT', label: 'ระบบการซื้อซ้ำ', icon: Repeat },
          { id: 'TELEGRAM', label: 'บอท Telegram', icon: Send },
          { id: 'SECURITY', label: 'รหัสผ่านตั้งค่า', icon: Lock },
        ].map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex-shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon size={14} /> {cat.label}
            </button>
          );
        })}
      </div>

      {/* Workflow Sections List */}
      <div className="space-y-4">
        {filteredSections.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <HelpCircle size={48} className="mx-auto text-slate-300" />
            <h3 className="font-bold text-slate-800 text-sm">ไม่พบขั้นตอนที่ตรงกับคำค้นหา "{searchTerm}"</h3>
            <p className="text-xs text-slate-500">ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่ "กระบวนการทั้งหมด"</p>
          </div>
        ) : (
          filteredSections.map((sec) => {
            const Icon = sec.icon;
            const isExpanded = expandedSection === sec.id;

            return (
              <div
                key={sec.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden transition-all duration-200 hover:border-blue-300"
              >
                {/* Section Header */}
                <div
                  onClick={() => setExpandedSection(isExpanded ? null : sec.id)}
                  className="p-5 flex items-center justify-between cursor-pointer select-none bg-white hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0 pr-4">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0 shadow-xs">
                      <Icon size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-bold text-slate-900 text-base">{sec.title}</h2>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${sec.badgeColor}`}>
                          {sec.steps.length} ขั้นตอน
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{sec.summary}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {sec.targetTab && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate(sec.targetTab!);
                        }}
                        className="hidden sm:flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition-all cursor-pointer"
                      >
                        เปิดใช้งานหน้านี้ <ArrowRight size={13} />
                      </button>
                    )}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-slate-400 bg-slate-100 transition-transform duration-200 ${
                        isExpanded ? 'rotate-90 text-blue-600 bg-blue-50' : ''
                      }`}
                    >
                      <ChevronRight size={18} />
                    </div>
                  </div>
                </div>

                {/* Section Content Steps */}
                {isExpanded && (
                  <div className="p-6 bg-slate-50/50 border-t border-slate-100 space-y-6 animate-in fade-in-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {sec.steps.map((s) => (
                        <div
                          key={s.stepNumber}
                          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 relative group"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="w-7 h-7 rounded-xl bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                                {s.stepNumber}
                              </span>
                              {s.badge && (
                                <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-bold text-[10px]">
                                  {s.badge}
                                </span>
                              )}
                            </div>

                            <h3 className="font-bold text-slate-900 text-sm">{s.title}</h3>
                            <p className="text-xs text-slate-600 font-medium leading-relaxed">{s.description}</p>

                            <ul className="space-y-1.5 pt-1 text-xs text-slate-600">
                              {s.details.map((d, idx) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                  <span>{d}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {s.tip && (
                            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 font-semibold flex items-start gap-1.5 mt-2">
                              <Info size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                              <span>{s.tip}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {sec.targetTab && (
                      <div className="flex justify-end pt-2">
                        <button
                          onClick={() => onNavigate(sec.targetTab!)}
                          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-bold rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                        >
                          ไปที่ {sec.title.split(' ')[1] || 'หน้าระบบ'} <ArrowRight size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* FAQ Quick Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <HelpCircle size={20} className="text-blue-600" /> คำถามที่พบบ่อย (FAQ & Tips)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800 text-xs block">🔑 รหัสผ่านปลดล็อกหน้าตั้งค่าคืออะไร?</span>
            <p className="text-slate-600 leading-relaxed">
              รหัสผ่านตั้งต้นสำหรับเข้าหน้าตั้งค่าคือ <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">43210344</span> ซึ่งช่วยป้องกันการกดลบหรือรีเซ็ตฐานข้อมูลโดยไม่ตั้งใจ
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800 text-xs block">📂 อัปโหลดไฟล์เอกสารได้ประเภทใดบ้าง?</span>
            <p className="text-slate-600 leading-relaxed">
              รองรับไฟล์ PDF, รูปภาพ (PNG, JPG), Word, Excel ฯลฯ โดยสามารถเลือกหมวดหมู่เอกสาร เช่น ใบเสนอราคา, สัญญา, ใบแจ้งหนี้ เพื่อให้ค้นหาง่ายขึ้น
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800 text-xs block">⚡ ข้อมูลทั้งหมดบันทึกที่ไหน?</span>
            <p className="text-slate-600 leading-relaxed">
              ข้อมูล 100% บันทึกตรงไปยัง Supabase Cloud Live Database (<span className="font-mono">wbrktjjgimvbddeobaeq.supabase.co</span>) ไม่มีการเก็บใน Local Storage ชั่วคราว
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800 text-xs block">🤖 บอท Telegram แจ้งเตือนอะไรบ้าง?</span>
            <p className="text-slate-600 leading-relaxed">
              แจ้งเตือนเมื่อมีการสร้างคำสั่งซื้อใหม่, ลูกค้าใหม่, กิจกรรมการติดตามเกินกำหนด, และการแจ้งเตือนการสั่งซื้อซ้ำ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
