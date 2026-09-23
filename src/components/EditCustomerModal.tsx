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
import React, { useEffect, useMemo, useState } from 'react';
import { AppUser, Customer, CustomerStatus, CustomerTier } from '../types';
import { INITIAL_USERS } from '../data/defaultUsers';

interface EditCustomerModalProps {
  isOpen: boolean;
  customer: Customer | null;
  onClose: () => void;
  onSubmit: (updatedCustomer: Customer) => void;
  onDelete?: (customerId: string) => void;
  users?: AppUser[];
}

export const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  isOpen,
  customer,
  onClose,
  onSubmit,
  onDelete,
  users = INITIAL_USERS,
}) => {
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [lineId, setLineId] = useState('');
  const [email, setEmail] = useState('');
  const [interestedProducts, setInterestedProducts] = useState('');
  const [source, setSource] = useState('Facebook');
  const [salesOwner, setSalesOwner] = useState('Ito San');
  const [status, setStatus] = useState<CustomerStatus>('NEW');
  const [tier, setTier] = useState<CustomerTier>('GENERAL');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [nextFollowUpTime, setNextFollowUpTime] = useState('10:00');
  const [nextAction, setNextAction] = useState('');
  const [avgReorderCycleDays, setAvgReorderCycleDays] = useState(60);
  const [isDealStage, setIsDealStage] = useState(false);
  const [address, setAddress] = useState('');
  const [taxId, setTaxId] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Extract and prioritize Sales Users from users table
  const salesUsersList = useMemo(() => {
    const safeUsers = Array.isArray(users) && users.length > 0 ? users : INITIAL_USERS;
    const active = safeUsers.filter((u) => u.status === 'ACTIVE' || !u.status);

    const salesOnly = active.filter((u) => u.role === 'SALES');
    const others = active.filter((u) => u.role !== 'SALES');

    return [...salesOnly, ...others];
  }, [users]);

  // Selected User Object from database users table
  const selectedUser = salesUsersList.find(
    (u) =>
      u.name === salesOwner ||
      u.salesOwnerTag === salesOwner ||
      (u.salesId && u.salesId === salesOwner) ||
      u.id === salesOwner
  );

  useEffect(() => {
    if (customer) {
      const inDeal =
        customer.repeatStatus === 'NOT_APPLICABLE' ||
        (Number(customer.totalOrdersCount || 0) === 0 &&
          customer.status !== 'WON' &&
          customer.status !== 'EXISTING' &&
          (!customer.avgReorderCycleDays || customer.avgReorderCycleDays === 0));

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
      setIsDealStage(inDeal);
      setAvgReorderCycleDays(inDeal ? 0 : (customer.avgReorderCycleDays || 60));
      setAddress(customer.address || '');
      setTaxId(customer.taxId || '');
      setShowDeleteConfirm(false);
    }
  }, [customer, isOpen]);

  if (!isOpen || !customer) return null;

  const handleStatusChange = (newStatus: CustomerStatus) => {
    setStatus(newStatus);
    if (newStatus === 'WON' || newStatus === 'EXISTING') {
      setIsDealStage(false);
      if (!avgReorderCycleDays || avgReorderCycleDays === 0) setAvgReorderCycleDays(60);
    } else if (newStatus === 'NEW' || newStatus === 'CONTACTED' || newStatus === 'FOLLOW_UP' || newStatus === 'QUOTATION_SENT' || newStatus === 'NEGOTIATION') {
      if (Number(customer.totalOrdersCount || 0) === 0) {
        setIsDealStage(true);
        setAvgReorderCycleDays(0);
      }
    }
  };

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
      avgReorderCycleDays: isDealStage ? 0 : (Number(avgReorderCycleDays) || 60),
      repeatStatus: isDealStage ? 'NOT_APPLICABLE' : (customer.repeatStatus === 'NOT_APPLICABLE' ? 'UPCOMING' : (customer.repeatStatus || 'UPCOMING')),
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 md:p-6 overflow-hidden animate-in fade-in">
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        {/* Fixed Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-white z-10">
          <div>
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Building size={18} className="text-blue-600" /> แก้ไขข้อมูลลูกค้า (Edit Customer)
            </h3>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              รหัสลูกค้า: <span className="font-bold text-blue-700">{customer.id}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1 overscroll-contain">
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
              <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>ผู้รับผิดชอบ (Sales Owner)</span>
                <span className="text-[10px] font-normal text-blue-600">ดึงจาก Users Table</span>
              </label>
              <select
                value={salesOwner}
                onChange={(e) => setSalesOwner(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-semibold text-slate-800"
              >
                {salesUsersList.map((u) => {
                  const tag = u.salesOwnerTag || u.name;
                  const isConnected = Boolean(u.telegramChatId);
                  return (
                    <option key={u.id} value={tag}>
                      {u.name} {u.salesId ? `(${u.salesId})` : ''} - {u.role} {isConnected ? `[TG: ${u.telegramChatId}]` : '[TG: ยังไม่เชื่อมต่อ]'}
                    </option>
                  );
                })}
              </select>

              {/* Live Telegram Private Notification Status Badge */}
              <div className="mt-1.5 p-2 rounded-xl border text-[11px] flex items-center gap-2 transition-all bg-slate-50 border-slate-200">
                {selectedUser?.telegramChatId ? (
                  <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                    <span>
                      <strong>Telegram Private:</strong> 🟢 พร้อมส่งแจ้งเตือนตรงถึง {selectedUser.name} (Chat ID: <code className="font-mono bg-white px-1 py-0.5 rounded border border-emerald-200">{selectedUser.telegramChatId}</code>)
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-amber-700 font-medium">
                    <span className="text-amber-500 font-bold flex-shrink-0">⚠️</span>
                    <span>
                      <strong>Telegram Private:</strong> ⚠️ ยังไม่มี Chat ID (จะส่งเฉพาะ Group กลาง)
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">สถานะลูกค้า (Status)</label>
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value as CustomerStatus)}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-semibold text-slate-800"
              >
                <option value="NEW">ลูกค้าใหม่ (New Lead - กำลังดีล)</option>
                <option value="CONTACTED">ติดต่อแล้ว (Contacted - กำลังดีล)</option>
                <option value="FOLLOW_UP">กำลังติดตาม (Follow-up - กำลังดีล)</option>
                <option value="QUOTATION_SENT">ส่งใบเสนอราคา (Quotation Sent - กำลังดีล)</option>
                <option value="NEGOTIATION">เจรจาต่อรอง (Negotiation - กำลังดีล)</option>
                <option value="WON">ปิดการขายสำเร็จ (Won - สั่งผลิตแล้ว)</option>
                <option value="EXISTING">ลูกค้าเก่า (Existing - สั่งผลิตแล้ว)</option>
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

            {/* Deal Stage vs Repeat Order Configuration */}
            <div className="sm:col-span-2 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    💼 รูปแบบลูกค้า & การซื้อซ้ำ (Repeat Order)
                  </span>
                  <p className="text-[11px] text-slate-500">
                    กรณีลูกค้าอยู่ระหว่างการดีล สามารถเลือกยังไม่ต้องมีข้อมูลการซื้อซ้ำได้
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-white p-1 border border-slate-200 rounded-xl self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDealStage(true);
                      setAvgReorderCycleDays(0);
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      isDealStage
                        ? 'bg-amber-100 text-amber-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    💼 อยู่ระหว่างดีล (ไม่ต้องมีข้อมูลซื้อซ้ำ)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDealStage(false);
                      setAvgReorderCycleDays(customer.avgReorderCycleDays || 60);
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      !isDealStage
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🔄 สั่งผลิตแล้ว / นับรอบซื้อซ้ำ
                  </button>
                </div>
              </div>

              {isDealStage ? (
                <div className="text-[11px] text-amber-800 bg-amber-50/90 border border-amber-200 rounded-xl p-2.5 flex items-start gap-2 leading-relaxed">
                  <span className="text-base leading-none mt-0.5">ℹ️</span>
                  <div>
                    <span className="font-bold">เคสลูกค้าอยู่ระหว่างการดีล (In Deal Stage):</span> ลูกค้ารายนี้ยังไม่มีประวัติสั่งผลิตล็อตแรก ระบบจะไม่นับรอบวันซื้อซ้ำหรือคำนวณวันหมดอายุสินค้า จนกว่าจะมีการบันทึกคำสั่งซื้อจริง
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">รอบการสั่งซื้อซ้ำโดยประมาณ (วัน)</label>
                    <input
                      type="number"
                      min="1"
                      value={avgReorderCycleDays || 60}
                      onChange={(e) => setAvgReorderCycleDays(Number(e.target.value) || 0)}
                      placeholder="60"
                      className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-semibold text-slate-800"
                    />
                  </div>
                  <div className="flex items-center text-[11px] text-slate-500 pt-4 sm:pt-6">
                    * สำหรับลูกค้าสั่งผลิตแบรนด์ ระบบจะคำนวณวันซื้อซ้ำรอบถัดไปอัตโนมัติ
                  </div>
                </div>
              )}
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
        </div>

        {/* Fixed Footer Buttons */}
        <div className="p-4 sm:px-6 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
          <div>
            {onDelete && !showDeleteConfirm && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl font-bold transition-colors flex items-center gap-1.5 text-xs cursor-pointer"
              >
                <Trash2 size={14} /> ลบลูกค้า (Delete)
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer shadow-2xs"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
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
