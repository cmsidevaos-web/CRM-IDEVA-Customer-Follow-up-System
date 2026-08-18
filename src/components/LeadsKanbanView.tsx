import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  DollarSign,
  Plus,
  UserCheck,
  UserPlus
} from 'lucide-react';
import React from 'react';
import { Customer, CustomerStatus } from '../types';

interface LeadsKanbanViewProps {
  customers?: Customer[];
  onSelectCustomer?: (customer: Customer) => void;
  onUpdateStatus?: (customer: Customer, newStatus: CustomerStatus) => void;
  onOpenCreateCustomer?: () => void;
}

export const LeadsKanbanView: React.FC<LeadsKanbanViewProps> = ({
  customers = [],
  onSelectCustomer = (_c: Customer) => {},
  onUpdateStatus = (_c: Customer, _s: CustomerStatus) => {},
  onOpenCreateCustomer = () => {},
}) => {
  const safeCustomers = customers || [];
  const columns: { status: CustomerStatus; title: string; color: string }[] = [
    { status: 'NEW', title: 'Lead (ลูกค้าใหม่)', color: 'bg-blue-600' },
    { status: 'EXISTING', title: 'Existing (ลูกค้าเก่า)', color: 'bg-teal-600' },
    { status: 'CONTACTED', title: 'Contacted (ติดต่อแล้ว)', color: 'bg-indigo-600' },
    { status: 'FOLLOW_UP', title: 'Follow-up (กำลังติดตาม)', color: 'bg-sky-600' },
    { status: 'QUOTATION_SENT', title: 'Quotation (ส่งใบเสนอราคา)', color: 'bg-purple-600' },
    { status: 'NEGOTIATION', title: 'Negotiation (เจรจาต่อรอง)', color: 'bg-amber-600' },
    { status: 'WON', title: 'Won (ปิดการขาย)', color: 'bg-emerald-600' },
    { status: 'LOST', title: 'Lost (ยกเลิก/ไม่สนใจ)', color: 'bg-rose-600' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 soft-shadow space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <UserPlus size={20} className="text-blue-600" /> Leads Pipeline Kanban
          </h2>
          <p className="text-xs text-slate-500">บริหารจัดการโอกาสขายแบบ Kanban Board แยกตามขั้นตอน</p>
        </div>

        <button
          onClick={onOpenCreateCustomer}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-2xs"
        >
          <Plus size={15} /> + สร้าง Lead ใหม่
        </button>
      </div>

      {/* Kanban Board Container */}
      <div className="overflow-x-auto pb-4">
        <div className="flex space-x-4 min-w-max">
          {columns.map((col) => {
            const colCustomers = safeCustomers.filter((c) => c.status === col.status);
            const totalVal = colCustomers.reduce((sum, c) => sum + (c.totalPurchases || 50000), 0);

            return (
              <div
                key={col.status}
                className="w-72 bg-slate-50 rounded-2xl border border-slate-200 p-3.5 flex flex-col max-h-[680px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                  <div className="flex items-center space-x-2">
                    <span className={`w-3 h-3 rounded-full ${col.color}`} />
                    <h3 className="font-bold text-xs text-slate-800">{col.title}</h3>
                  </div>
                  <span className="text-[11px] font-bold bg-white text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
                    {colCustomers.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                  {colCustomers.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-xs italic">ไม่มีรายการ</div>
                  ) : (
                    colCustomers.map((cust) => (
                      <div
                        key={cust.id}
                        onClick={() => onSelectCustomer(cust)}
                        className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer space-y-2 group"
                      >
                        <div className="font-bold text-xs text-slate-900 group-hover:text-blue-700">
                          {cust.companyName}
                        </div>
                        <div className="text-[11px] text-slate-500">ผู้ติดต่อ: {cust.contactName}</div>

                        <div className="bg-slate-50 p-2 rounded-lg text-[10px] text-slate-600">
                          <span className="font-semibold text-slate-700">Next Action:</span> {cust.nextAction}
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                          <span>{cust.nextFollowUpDate}</span>
                          <span className="font-semibold text-slate-700">{cust.salesOwner.split(' ')[0]}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
