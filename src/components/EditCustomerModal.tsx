import {
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  Phone,
  Save,
  Tag,
  Trash2,
  User,
  X
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Customer, CustomerStatus, CustomerTier } from '../types';

interface EditCustomerModalProps {
  isOpen: boolean;
  customer: Customer | null;
  onClose: () => void;
  onSubmit: (updatedCustomer: Customer) => void;
  onDelete?: (customerId: string) => void;
}

export const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  isOpen,
  customer,
  onClose,
  onSubmit,
  onDelete,
}) => {
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [lineId, setLineId] = useState('');
  const [email, setEmail] = useState('');
  const [interestedProducts, setInterestedProducts] = useState('');
  const [source, setSource] = useState('Facebook');
  const [salesOwner, setSalesOwner] = useState('คุณสมชาย (Sales A)');
  const [status, setStatus] = useState<CustomerStatus>('NEW');
  const [tier, setTier] = useState<CustomerTier>('GENERAL');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [nextFollowUpTime, setNextFollowUpTime] = useState('10:00');
  const [nextAction, setNextAction] = useState('');
  const [avgReorderCycleDays, setAvgReorderCycleDays] = useState(60);
  const [address, setAddress] = useState('');
  const [taxId, setTaxId] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (customer) {
      setCompanyName(customer.companyName || '');
      setContactName(customer.contactName || '');
      setPhone(customer.phone || '');
      setLineId(customer.lineId || '');
      setEmail(customer.email || '');
      setInterestedProducts(customer.interestedProducts || '');
      setSource(customer.source || 'Facebook');
      setSalesOwner(customer.salesOwner || 'คุณสมชาย (Sales A)');
      setStatus(customer.status || 'NEW');
      setTier(customer.tier || 'GENERAL');
      setNextFollowUpDate(customer.nextFollowUpDate || new Date().toISOString().split('T')[0]);
      setNextFollowUpTime(customer.nextFollowUpTime || '10:00');
      setNextAction(customer.nextAction || 'โทรสอบถามข้อมูลเบื้องต้น');
      setAvgReorderCycleDays(customer.avgReorderCycleDays || 60);
      setAddress(customer.address || '');
      setTaxId(customer.taxId || '');
      setShowDeleteConfirm(false);
    }
  }, [customer, isOpen]);

  if (!isOpen || !customer) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !contactName.trim() || !phone.trim()) {
      alert('กรุณากรอกชื่อบริษัท ผู้ติดต่อ และเบอร์โทรศัพท์');
      return;
    }

    const updated: Customer = {
      ...customer,
      companyName: companyName.trim(),
      contactName: contactName.trim(),
      phone: phone.trim(),
      lineId: lineId ? lineId.trim() : '',
      email: email ? email.trim() : '',
      interestedProducts: interestedProducts.trim(),
      source,
      salesOwner,
      status,
      tier,
      nextFollowUpDate,
      nextFollowUpTime,
      nextAction: nextAction.trim(),
      avgReorderCycleDays: Number(avgReorderCycleDays) || 60,
      address: address.trim(),
      taxId: taxId.trim(),
      updatedAt: new Date().toISOString().split('T')[0],
    };

    onSubmit(updated);
    onClose();
  };

  const handleDelete = () => {
    if (onDelete && customer) {
      onDelete(customer.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Building size={18} className="text-blue-600" /> แก้ไขข้อมูลลูกค้า (Edit Customer)
            </h3>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              รหัสลูกค้า: <span className="font-bold text-blue-700">{customer.id}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">ชื่อบริษัท / ชื่อลูกค้า *</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="เช่น บริษัท ABC Shop Co., Ltd."
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">ชื่อผู้ติดต่อ *</label>
              <input
                type="text"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="เช่น คุณสมชาย ใจดี"
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">เบอร์โทรศัพท์ *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="081-234-5678"
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">LINE ID (กรอกเองหรือเว้นว่างไว้)</label>
              <input
                type="text"
                value={lineId}
                onChange={(e) => setLineId(e.target.value)}
                placeholder="เช่น @mybrand หรือ myline_id (เว้นว่างได้)"
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Email (เว้นว่างได้)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@example.com"
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">เลขประจำตัวผู้เสียภาษี (Tax ID)</label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="010555xxxxxxx"
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">สินค้าที่สนใจ (Product Interest)</label>
              <input
                type="text"
                value={interestedProducts}
                onChange={(e) => setInterestedProducts(e.target.value)}
                placeholder="เช่น ครีมกันแดด SPF50+, เซรั่มวิตามินซี, เทสเตอร์ทดลองสูตร..."
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">แหล่งที่มา (Lead Source)</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="Facebook">Facebook Ads / Page</option>
                <option value="LINE OA">LINE Official Account</option>
                <option value="TikTok">TikTok Ads / Video</option>
                <option value="Google Ads">Google Search / Ads</option>
                <option value="Website">Website Form</option>
                <option value="Referral">ลูกค้าแนะนำ (Referral)</option>
                <option value="Direct">Direct / งานแสดงสินค้า</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">ผู้รับผิดชอบ (Sales Owner)</label>
              <select
                value={salesOwner}
                onChange={(e) => setSalesOwner(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="คุณสมชาย (Sales A)">คุณสมชาย (Sales A)</option>
                <option value="คุณนภา (Sales B)">คุณนภา (Sales B)</option>
                <option value="คุณวิชัย (Manager)">คุณวิชัย (Manager)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">สถานะลูกค้า (Status)</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CustomerStatus)}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-semibold text-slate-800"
              >
                <option value="NEW">ลูกค้าใหม่ (New Lead)</option>
                <option value="CONTACTED">ติดต่อแล้ว (Contacted)</option>
                <option value="FOLLOW_UP">กำลังติดตาม (Follow-up)</option>
                <option value="QUOTATION_SENT">ส่งใบเสนอราคา (Quotation Sent)</option>
                <option value="NEGOTIATION">เจรจาต่อรอง (Negotiation)</option>
                <option value="WON">ปิดการขายสำเร็จ (Won)</option>
                <option value="EXISTING">ลูกค้าเก่า (Existing)</option>
                <option value="OVERDUE">เกินกำหนด (Overdue)</option>
                <option value="LOST">ยกเลิก / ไม่สนใจ (Lost)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">ระดับลูกค้า (Customer Tier)</label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value as CustomerTier)}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-semibold text-slate-800"
              >
                <option value="GENERAL">General (ทั่วไป)</option>
                <option value="SILVER">Silver</option>
                <option value="GOLD">Gold</option>
                <option value="PLATINUM">Platinum (ลูกค้ารายใหญ่)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">วันนัดติดตามครั้งถัดไป</label>
              <input
                type="date"
                value={nextFollowUpDate}
                onChange={(e) => setNextFollowUpDate(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">เวลานัดติดตาม</label>
              <input
                type="time"
                value={nextFollowUpTime}
                onChange={(e) => setNextFollowUpTime(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Next Action (สิ่งที่ต้องทำต่อไป)</label>
              <input
                type="text"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                placeholder="เช่น โทรติดตามใบเสนอราคา, นัดชิมตัวอย่างเทสเตอร์..."
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">รอบการสั่งซื้อซ้ำโดยประมาณ (วัน)</label>
              <input
                type="number"
                value={avgReorderCycleDays}
                onChange={(e) => setAvgReorderCycleDays(Number(e.target.value) || 0)}
                placeholder="60"
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                * สำหรับลูกค้าที่สั่งผลิตแบรนด์ ระบบจะใช้คำนวณวันซื้อซ้ำรอบถัดไปอัตโนมัติ (ใส่ 0 หากเป็นเทสเตอร์)
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">ที่อยู่จัดส่ง / ที่อยู่ออกใบกำกับภาษี</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="ระบุเลขที่ อาคาร ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์"
                rows={2}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Delete Confirmation Box */}
          {showDeleteConfirm ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2.5 animate-in fade-in">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                <Trash2 size={16} /> ยืนยันการลบลูกค้า {customer.companyName}?
              </div>
              <p className="text-[11px] text-rose-600 leading-relaxed">
                การลบนี้จะนำรายชื่อลูกค้านี้ออกจากระบบ ไม่สามารถกู้คืนได้ กรุณากดยืนยันหากต้องการลบจริง
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition-colors shadow-xs"
                >
                  ยืนยันลบลูกค้า
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold rounded-lg text-xs transition-colors"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          ) : null}

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div>
              {onDelete && !showDeleteConfirm && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl font-bold transition-colors flex items-center gap-1.5 text-xs"
                >
                  <Trash2 size={14} /> ลบลูกค้า (Delete)
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Save size={15} /> บันทึกการแก้ไข
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
