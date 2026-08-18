import {
  Calendar,
  Clock,
  Filter,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Users
} from 'lucide-react';
import React, { useState } from 'react';
import { Activity, ActivityType, Customer } from '../types';

interface ActivitiesViewProps {
  activities?: Activity[];
  customers?: Customer[];
  onOpenCreateActivity?: () => void;
  onSelectCustomer?: (customer: Customer) => void;
}

export const ActivitiesView: React.FC<ActivitiesViewProps> = ({
  activities = [],
  customers = [],
  onOpenCreateActivity = () => {},
  onSelectCustomer = (_c: Customer) => {},
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const safeActivities = activities || [];

  const filtered = safeActivities.filter((act) => {
    const matchesSearch =
      act.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.salesOwner.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedType === 'ALL' || act.type === selectedType;
    return matchesSearch && matchesType;
  });

  const renderTypeBadge = (type: ActivityType) => {
    switch (type) {
      case 'CALL':
        return <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-[11px]">โทรศัพท์ (Call)</span>;
      case 'LINE':
        return <span className="bg-emerald-500 text-white font-bold px-2.5 py-0.5 rounded-full text-[11px]">LINE Chat</span>;
      case 'FACEBOOK':
        return <span className="bg-blue-600 text-white font-bold px-2.5 py-0.5 rounded-full text-[11px]">Facebook</span>;
      case 'EMAIL':
        return <span className="bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full text-[11px]">Email</span>;
      case 'MEETING':
        return <span className="bg-purple-100 text-purple-800 font-bold px-2.5 py-0.5 rounded-full text-[11px]">ประชุม (Meeting)</span>;
      case 'SITE_VISIT':
        return <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full text-[11px]">เยี่ยมชมหน้างาน</span>;
      case 'DEMO':
        return <span className="bg-indigo-100 text-indigo-800 font-bold px-2.5 py-0.5 rounded-full text-[11px]">สาธิตสินค้า</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 font-bold px-2.5 py-0.5 rounded-full text-[11px]">{type}</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 soft-shadow space-y-5">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Clock size={20} className="text-blue-600" /> ประวัติกิจกรรมและการติดตาม (Activities Log)
          </h2>
          <p className="text-xs text-slate-500">บันทึกการติดต่อ โทรศัพท์ LINE อีเมล และการประชุมกับลูกค้าทั้งหมด</p>
        </div>

        <button
          onClick={onOpenCreateActivity}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-2xs transition-all"
        >
          <Plus size={16} /> + บันทึก Activity ใหม่
        </button>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหากิจกรรม ชื่อลูกค้า ผู้รับผิดชอบ..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white"
          />
        </div>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none"
        >
          <option value="ALL">ประเภทกิจกรรม: ทั้งหมด</option>
          <option value="CALL">โทรศัพท์ (Call)</option>
          <option value="LINE">LINE Chat</option>
          <option value="FACEBOOK">Facebook</option>
          <option value="EMAIL">Email</option>
          <option value="MEETING">ประชุม (Meeting)</option>
          <option value="SITE_VISIT">เยี่ยมชมหน้างาน</option>
          <option value="DEMO">สาธิตสินค้า</option>
        </select>
      </div>

      {/* Activities Timeline */}
      <div className="space-y-3 pt-2">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">ไม่พบข้อมูลกิจกรรมตามเงื่อนไขที่ค้นหา</div>
        ) : (
          filtered.map((act) => {
            const matchedCust = customers.find((c) => c.id === act.customerId);
            return (
              <div
                key={act.id}
                className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all bg-slate-50/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-2">
                    {renderTypeBadge(act.type)}
                    <span
                      onClick={() => matchedCust && onSelectCustomer(matchedCust)}
                      className="font-bold text-slate-900 text-sm hover:text-blue-600 cursor-pointer"
                    >
                      {act.customerName}
                    </span>
                    <span className="text-slate-400 text-xs">| {act.createdAt}</span>
                  </div>

                  <div className="font-semibold text-xs text-slate-800">{act.summary}</div>
                  <p className="text-xs text-slate-600 leading-relaxed">{act.detail}</p>

                  {act.result && (
                    <div className="text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 inline-block font-medium">
                      ผลลัพธ์: {act.result}
                    </div>
                  )}
                </div>

                <div className="text-right text-xs space-y-1 flex-shrink-0">
                  <div className="text-slate-500 font-medium">ผู้บันทึก: {act.salesOwner}</div>
                  <div className="font-bold text-blue-700">
                    Follow-up: {act.followUpDate} {act.followUpTime}
                  </div>
                  {matchedCust && (
                    <button
                      onClick={() => onSelectCustomer(matchedCust)}
                      className="text-xs text-blue-600 font-bold hover:underline"
                    >
                      ดู Customer Profile →
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
