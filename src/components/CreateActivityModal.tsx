import {
  Building2,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Phone,
  Search,
  User,
  X,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityType, Customer, CustomerStatus } from '../types';

interface CreateActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  selectedCustomer?: Customer | null;
  onSubmit: (data: any) => void;
}

export const CreateActivityModal: React.FC<CreateActivityModalProps> = ({
  isOpen,
  onClose,
  customers,
  selectedCustomer,
  onSubmit,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [type, setType] = useState<ActivityType>('CALL');
  const [detail, setDetail] = useState('');
  const [result, setResult] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [followUpDate, setFollowUpDate] = useState(new Date().toISOString().split('T')[0]);
  const [followUpTime, setFollowUpTime] = useState('10:00');
  const [status, setStatus] = useState<CustomerStatus>('FOLLOW_UP');

  // Initialize or reset when modal opens or selectedCustomer changes
  useEffect(() => {
    if (isOpen) {
      if (selectedCustomer) {
        setSelectedCustomerId(selectedCustomer.id);
        setSearchQuery(`${selectedCustomer.companyName} (${selectedCustomer.id})`);
        setStatus(selectedCustomer.status || 'FOLLOW_UP');
      } else if (customers.length > 0) {
        setSelectedCustomerId(customers[0].id);
        setSearchQuery(`${customers[0].companyName} (${customers[0].id})`);
        setStatus(customers[0].status || 'FOLLOW_UP');
      } else {
        setSelectedCustomerId('');
        setSearchQuery('');
      }
      setIsDropdownOpen(false);
    }
  }, [isOpen, selectedCustomer, customers]);

  // Handle click outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered customer list based on query (by code/id, company name, contact name, phone, line ID)
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase().trim();
    return customers.filter(
      (c) =>
        (c.id && c.id.toLowerCase().includes(q)) ||
        (c.companyName && c.companyName.toLowerCase().includes(q)) ||
        (c.contactName && c.contactName.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.lineId && c.lineId.toLowerCase().includes(q)) ||
        (c.salesOwner && c.salesOwner.toLowerCase().includes(q))
    );
  }, [customers, searchQuery]);

  if (!isOpen) return null;

  const currentCust = customers.find((c) => c.id === selectedCustomerId) || selectedCustomer || (filteredCustomers.length > 0 ? filteredCustomers[0] : null);

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    setSearchQuery(`${customer.companyName} (${customer.id})`);
    setStatus(customer.status || 'FOLLOW_UP');
    setIsDropdownOpen(false);
  };

  const handleClearCustomer = () => {
    setSelectedCustomerId('');
    setSearchQuery('');
    setIsDropdownOpen(true);
  };

  const getActivityTypeLabel = (actType: ActivityType): string => {
    switch (actType) {
      case 'CALL':
        return 'โทรศัพท์ (Call)';
      case 'LINE':
        return 'LINE Chat';
      case 'FACEBOOK':
        return 'Facebook';
      case 'EMAIL':
        return 'Email';
      case 'MEETING':
        return 'ประชุม (Meeting)';
      case 'SITE_VISIT':
        return 'เยี่ยมชมหน้างาน';
      case 'DEMO':
        return 'สาธิตสินค้า';
      default:
        return actType;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCust) {
      alert('กรุณาเลือกลูกค้าก่อนบันทึกกิจกรรม');
      return;
    }

    // Auto-generate summary from detail or activity type
    const generatedSummary = detail.trim()
      ? detail.length > 60
        ? `${detail.slice(0, 60)}...`
        : detail
      : `${getActivityTypeLabel(type)} - ${currentCust.companyName}`;

    onSubmit({
      customerId: currentCust.id,
      customerName: currentCust.companyName,
      type,
      summary: generatedSummary,
      detail,
      result,
      nextAction,
      followUpDate,
      followUpTime,
      salesOwner: currentCust.salesOwner || 'คุณสมชาย (Sales A)',
      status,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 md:p-6 overflow-hidden animate-in fade-in">
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        {/* Modal Fixed Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-white z-10">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base leading-tight">
                + บันทึก Activity การติดต่อ
              </h3>
              <p className="text-[11px] text-slate-500">บันทึกรายละเอียดการสื่อสารและนัดหมายติดตามผล</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1 overscroll-contain">
          {/* Customer Search & Filter Selection Box */}
          <div className="relative" ref={dropdownRef}>
            <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>เลือกลูกค้า (ค้นหารหัสหรือชื่อลูกค้า) *</span>
              {currentCust && (
                <span className="text-[11px] font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                  รหัส: {currentCust.id}
                </span>
              )}
            </label>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search size={15} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                  if (selectedCustomerId && e.target.value !== `${currentCust?.companyName} (${currentCust?.id})`) {
                    setSelectedCustomerId('');
                  }
                }}
                placeholder="พิมพ์ชื่อบริษัท, ชื่อผู้ติดต่อ, เบอร์โทร หรือรหัสลูกค้า..."
                className="w-full pl-9 pr-16 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal transition-all"
                required
              />
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center space-x-1">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearCustomer}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
                    title="ล้างการค้นหา"
                  >
                    <X size={14} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
                >
                  <ChevronDown size={16} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {/* Auto-suggest Filter Dropdown List */}
            {isDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-xl max-h-56 overflow-y-auto z-50 divide-y divide-slate-100 animate-in fade-in">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((c) => {
                    const isSelected = c.id === selectedCustomerId;
                    return (
                      <div
                        key={c.id}
                        onClick={() => handleSelectCustomer(c)}
                        className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-50/90 text-blue-900'
                            : 'hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="flex items-center space-x-1.5 mb-0.5">
                            <span className="font-bold text-xs truncate flex items-center gap-1">
                              <Building2 size={13} className="text-slate-400 flex-shrink-0" />
                              {c.companyName}
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                              {c.id}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
                            {c.contactName && (
                              <span className="flex items-center gap-1">
                                <User size={11} className="text-slate-400" />
                                {c.contactName}
                              </span>
                            )}
                            {c.phone && (
                              <span className="flex items-center gap-1">
                                <Phone size={11} className="text-slate-400" />
                                {c.phone}
                              </span>
                            )}
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                            <Check size={14} />
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-slate-400">
                    <p className="text-xs">ไม่พบข้อมูลลูกค้าที่ตรงกับ "{searchQuery}"</p>
                    <p className="text-[10px] mt-0.5 text-slate-400">ลองพิมพ์คำค้นหาอื่น เช่น ชื่อบริษัท หรือเบอร์โทร</p>
                  </div>
                )}
              </div>
            )}

            {/* Selected Customer Preview Card */}
            {currentCust && (
              <div className="mt-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-[11px]">
                <div className="flex items-center space-x-2 truncate">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span className="font-bold text-slate-800 truncate">
                    {currentCust.companyName}
                  </span>
                  <span className="text-slate-500">({currentCust.contactName || 'ไม่มีชื่อผู้ติดต่อ'})</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded">
                    {currentCust.status}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Activity Type & Customer Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">ประเภทกิจกรรม</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ActivityType)}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white font-medium"
              >
                <option value="CALL">📞 โทรศัพท์ (Call)</option>
                <option value="LINE">💬 LINE Chat</option>
                <option value="FACEBOOK">🌐 Facebook</option>
                <option value="EMAIL">✉️ Email</option>
                <option value="MEETING">🤝 ประชุม (Meeting)</option>
                <option value="SITE_VISIT">🏢 เยี่ยมชมหน้างาน</option>
                <option value="DEMO">💻 สาธิตสินค้า</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">อัปเดตสถานะลูกค้า</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CustomerStatus)}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white font-medium"
              >
                <option value="CONTACTED">CONTACTED (ติดต่อแล้ว)</option>
                <option value="FOLLOW_UP">FOLLOW_UP (กำลังติดตาม)</option>
                <option value="QUOTATION_SENT">QUOTATION_SENT (ส่งใบเสนอราคา)</option>
                <option value="NEGOTIATION">NEGOTIATION (เจรจาต่อรอง)</option>
                <option value="WON">WON (ปิดการขาย)</option>
                <option value="EXISTING">EXISTING (ลูกค้าเก่า)</option>
                <option value="LOST">LOST (ไม่สนใจ/ยกเลิก)</option>
              </select>
            </div>
          </div>

          {/* Detail Input */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              รายละเอียดการพูดคุย (Detail)
            </label>
            <textarea
              rows={3}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="ระบุสิ่งที่ได้พูดคุยกับลูกค้า ความต้องการ หรือข้อเสนอ..."
              className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 leading-relaxed"
            />
          </div>

          {/* Contact Result */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">ผลการติดต่อ (Result)</label>
            <input
              type="text"
              value={result}
              onChange={(e) => setResult(e.target.value)}
              placeholder="เช่น ลูกค้ารับทราบ ขอพิจารณาภายใน 2 วัน หรือ นัดส่งแคตตาล็อก"
              className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
            />
          </div>

          {/* Next Follow-up Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar size={13} className="text-slate-500" />
                วัน Follow-up ครั้งถัดไป
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Clock size={13} className="text-slate-500" />
                เวลา
              </label>
              <input
                type="time"
                value={followUpTime}
                onChange={(e) => setFollowUpTime(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>

          {/* Next Action */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              สิ่งที่ต้องทำครั้งถัดไป (Next Action)
            </label>
            <input
              type="text"
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              placeholder="เช่น โทรติดตามผลใบเสนอราคา, นัดสาธิตระบบผ่าน Zoom"
              className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="p-4 sm:px-6 bg-slate-50/90 border-t border-slate-100 flex items-center justify-end space-x-2 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer shadow-2xs"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            บันทึกกิจกรรม
          </button>
        </div>
      </form>
    </div>
  </div>
);
};
