import {
  AlertCircle,
  ArrowRight,
  BellRing,
  CalendarCheck,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileText,
  ListOrdered,
  PlusCircle,
  Repeat,
  RotateCcw,
  ShoppingBag,
  UserCheck,
  UserPlus,
  XCircle
} from 'lucide-react';
import React, { useState } from 'react';

export const WorkflowBanner: React.FC = () => {
  const [expanded, setExpanded] = useState(false);

  const steps = [
    { step: 1, title: 'Lead เข้า', desc: 'ลูกค้าทักผ่านช่องทางต่างๆ (FB, LINE, Web)', icon: UserPlus, color: 'bg-blue-50 text-blue-600 border-blue-200' },
    { step: 2, title: 'สร้าง Customer', desc: 'บันทึกข้อมูลลูกค้าใหม่ในระบบ CRM', icon: PlusCircle, color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
    { step: 3, title: 'Assign Sale', desc: 'มอบหมายลูกค้าให้พนักงานขาย', icon: UserCheck, color: 'bg-cyan-50 text-cyan-600 border-cyan-200' },
    { step: 4, title: 'Sale ติดต่อ', desc: 'โทร / LINE / Email ติดต่อลูกค้า', icon: Clock, color: 'bg-sky-50 text-sky-600 border-sky-200' },
    { step: 5, title: 'บันทึก Activity', desc: 'บันทึกการติดต่อและรายละเอียดพูดคุย', icon: FileText, color: 'bg-amber-50 text-amber-600 border-amber-200' },
    { step: 6, title: 'เลือก Status', desc: 'เลือกสถานะลูกค้าปัจจุบัน', icon: ListOrdered, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    { step: 7, title: 'กำหนด Next Action', desc: 'กำหนดสิ่งที่ต้องทำในครั้งถัดไป', icon: CalendarCheck, color: 'bg-violet-50 text-violet-600 border-violet-200' },
    { step: 8, title: 'กำหนด Follow-up Date', desc: 'เลือกวัน เวลา และผู้รับผิดชอบ', icon: Clock, color: 'bg-purple-50 text-purple-600 border-purple-200' },
    { step: 9, title: 'แจ้งเตือน', desc: 'ระบบแจ้งเตือนอัตโนมัติก่อนถึงวัน', icon: BellRing, color: 'bg-rose-50 text-rose-600 border-rose-200' },
    { step: 10, title: 'Sale Follow-up', desc: 'พนักงานขายติดตามลูกค้าตามกำหนด', icon: UserCheck, color: 'bg-blue-50 text-blue-600 border-blue-200' },
    { step: 11, title: 'บันทึกผล', desc: 'บันทึกผลการติดตามหลังติดต่อ', icon: FileCheck2, color: 'bg-teal-50 text-teal-600 border-teal-200' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 soft-shadow mb-6">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold">
            <Repeat size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              WORKFLOW ระบบติดตามลูกค้าและติดตามซื้อซ้ำ
              <span className="text-xs font-normal bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                12 ขั้นตอนมาตรฐาน
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              กระบวนการบริหารจัดการโอกาสขาย การติดตามงานอัตโนมัติ และระบบคำนวณรอบการซื้อซ้ำ
            </p>
          </div>
        </div>
        <button className="text-xs text-blue-600 font-semibold hover:underline">
          {expanded ? 'ย่อไดอะแกรม ▲' : 'ดูขั้นตอน Workflow ทั้งหมด ▼'}
        </button>
      </div>

      {expanded && (
        <div className="mt-5 pt-4 border-t border-slate-100 animate-in fade-in">
          {/* Main 11 Steps horizontal scroll */}
          <div className="overflow-x-auto pb-4">
            <div className="flex items-center min-w-max space-x-2">
              {steps.map((st, idx) => {
                const Icon = st.icon;
                return (
                  <React.Fragment key={st.step}>
                    <div className={`p-3 rounded-xl border ${st.color} w-36 flex-shrink-0 text-center shadow-2xs`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-white shadow-2xs border border-slate-200">
                          {st.step}
                        </span>
                        <Icon size={16} />
                      </div>
                      <div className="font-bold text-xs text-slate-800 truncate mb-1">{st.title}</div>
                      <div className="text-[10px] text-slate-500 line-clamp-2 leading-tight">{st.desc}</div>
                    </div>
                    {idx < steps.length - 1 && (
                      <ArrowRight size={14} className="text-slate-300 flex-shrink-0" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Outcome Branching Diagrams */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
            {/* WON Branch */}
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 flex items-start space-x-3">
              <CheckCircle2 size={24} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-xs text-emerald-900 mb-1">
                  12. Won (ปิดการขายสำเร็จ) → Create Order & Customer After Sales
                </h4>
                <p className="text-[11px] text-emerald-800 leading-relaxed mb-2">
                  เมื่อปิดการขายได้ ระบบจะสร้าง Order พร้อมคำนวณรอบซื้อซ้ำอัตโนมัติ: <br />
                  <span className="font-semibold text-emerald-950">Next Reorder Date = Delivery Date + Reorder Cycle</span>
                </p>
                <div className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-[11px] px-2.5 py-1 rounded-lg font-medium">
                  <Repeat size={12} /> เข้าสู่ระบบติดตามซื้อซ้ำ (Repeat Order CRM)
                </div>
              </div>
            </div>

            {/* LOST Branch */}
            <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-4 flex items-start space-x-3">
              <XCircle size={24} className="text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-xs text-rose-900 mb-1">
                  Lost (ไม่สามารถปิดการขายได้) → บันทึกเหตุผล Lost
                </h4>
                <p className="text-[11px] text-rose-800 leading-relaxed mb-2">
                  ลูกค้าไม่สนใจ / เลือกคู่แข่ง / ยกเลิกโครงการ บันทึกเหตุผลเพื่อใช้วิเคราะห์ปรับปรุงกลยุทธ์ทีมขายในอนาคต
                </p>
                <div className="inline-flex items-center gap-1.5 bg-rose-600 text-white text-[11px] px-2.5 py-1 rounded-lg font-medium">
                  <AlertCircle size={12} /> บันทึกสถิติ Lost Analysis Report
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
