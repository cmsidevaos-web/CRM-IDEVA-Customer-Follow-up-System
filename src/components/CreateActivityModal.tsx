import { Calendar, Clock, FileText, X } from 'lucide-react';
import React, { useState } from 'react';
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
  const [customerId, setCustomerId] = useState(selectedCustomer?.id || (customers[0]?.id || ''));
  const [type, setType] = useState<ActivityType>('CALL');
  const [summary, setSummary] = useState('ส่งใบเสนอราคา (Quotation Sent)');
  const [detail, setDetail] = useState('โทรสอบถามและนำเสนอโปรโมชั่นพิเศษประจำเดือน');
  const [result, setResult] = useState('ลูกค้ารับทราบ ขอพิจารณาภายใน 2 วัน');
  const [nextAction, setNextAction] = useState('โทรติดตามผลใบเสนอราคา');
  const [followUpDate, setFollowUpDate] = useState(new Date().toISOString().split('T')[0]);
  const [followUpTime, setFollowUpTime] = useState('10:00');
  const [status, setStatus] = useState<CustomerStatus>('QUOTATION_SENT');

  if (!isOpen) return null;

  const currentCust = customers.find((c) => c.id === customerId) || selectedCustomer || customers[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCust) return;

    onSubmit({
      customerId: currentCust.id,
      customerName: currentCust.companyName,
      type,
      summary,
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <Clock size={18} className="text-blue-600" /> + บันทึก Activity การติดต่อ
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">เลือกลูกค้า *</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName} ({c.contactName})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">ประเภทกิจกรรม</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ActivityType)}
                className="w-full p-2.5 border border-slate-200 rounded-xl"
              >
                <option value="CALL">โทรศัพท์ (Call)</option>
                <option value="LINE">LINE Chat</option>
                <option value="EMAIL">Email</option>
                <option value="MEETING">ประชุม (Meeting)</option>
                <option value="SITE_VISIT">เยี่ยมชมหน้างาน</option>
                <option value="DEMO">สาธิตสินค้า</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">อัปเดตสถานะลูกค้า</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CustomerStatus)}
                className="w-full p-2.5 border border-slate-200 rounded-xl"
              >
                <option value="CONTACTED">CONTACTED (ติดต่อแล้ว)</option>
                <option value="FOLLOW_UP">FOLLOW_UP (กำลังติดตาม)</option>
                <option value="QUOTATION_SENT">QUOTATION_SENT (ส่งใบเสนอราคา)</option>
                <option value="NEGOTIATION">NEGOTIATION (เจรจาต่อรอง)</option>
                <option value="WON">WON (ปิดการขาย)</option>
                <option value="LOST">LOST (ไม่สนใจ/ยกเลิก)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">หัวข้อกิจกรรม (Summary) *</label>
            <input
              type="text"
              required
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">รายละเอียดการพูดคุย (Detail)</label>
            <textarea
              rows={2}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">ผลการติดต่อ (Result)</label>
            <input
              type="text"
              value={result}
              onChange={(e) => setResult(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">วัน Follow-up ครั้งถัดไป</label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">เวลา</label>
              <input
                type="time"
                value={followUpTime}
                onChange={(e) => setFollowUpTime(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">สิ่งที่ต้องทำครั้งถัดไป (Next Action)</label>
            <input
              type="text"
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-2xs"
            >
              บันทึกกิจกรรม
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
