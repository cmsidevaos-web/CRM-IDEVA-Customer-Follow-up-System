import {
  CheckCircle2,
  Headphones,
  Heart,
  MessageCircle,
  MessageSquare,
  Smile,
  Star,
  ThumbsUp
} from 'lucide-react';
import React from 'react';
import { Customer } from '../types';

interface AfterSalesViewProps {
  customers?: Customer[];
  onSelectCustomer?: (customer: Customer) => void;
  onOpenCreateActivity?: () => void;
}

export const AfterSalesView: React.FC<AfterSalesViewProps> = ({
  customers = [],
  onSelectCustomer = (_c: Customer) => {},
  onOpenCreateActivity = () => {},
}) => {
  const safeCustomers = customers || [];
  const wonCustomers = safeCustomers.filter((c) => c.status === 'WON' || (c.totalOrdersCount && c.totalOrdersCount > 0));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 soft-shadow space-y-5">
      <div>
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Headphones size={20} className="text-blue-600" /> บริการหลังการขาย (After Sales Service)
        </h2>
        <p className="text-xs text-slate-500">ดูแลความพึงพอใจลูกค้า ติดตามการใช้งาน สอบถาม Feedback และกระตุ้นการสั่งซื้อซ้ำ</p>
      </div>

      {/* Grid of Won Customers for After Sales Care */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wonCustomers.slice(0, 12).map((cust) => (
          <div
            key={cust.id}
            className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all space-y-3 bg-slate-50/50"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                จัดส่งเรียบร้อยแล้ว
              </span>
              <span className="text-xs font-bold text-slate-500">Tier: {cust.tier}</span>
            </div>

            <div>
              <div
                onClick={() => onSelectCustomer(cust)}
                className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer text-sm"
              >
                {cust.companyName}
              </div>
              <div className="text-xs text-slate-500">ผู้ติดต่อ: {cust.contactName} ({cust.phone})</div>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="text-slate-500">สินค้าหลัก: <span className="font-semibold text-slate-800">{cust.interestedProducts}</span></div>
              <div className="text-slate-500">รอบซื้อซ้ำ: <span className="font-bold text-blue-700">{cust.avgReorderCycleDays} วัน</span> (คาดว่า: {cust.nextReorderDate || '09/10/2026'})</div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={onOpenCreateActivity}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-2xs"
              >
                <Smile size={14} /> โทรสอบถามความพึงพอใจ
              </button>
              <button
                onClick={() => onSelectCustomer(cust)}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                ดู Profile →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
