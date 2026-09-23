import { Building, User, Phone, Mail, Globe, MapPin, Tag, X, Send, ShieldCheck, AlertTriangle } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { AppUser, CustomerStatus, CustomerTier } from '../types';
import { INITIAL_USERS } from '../data/defaultUsers';

interface CreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  users?: AppUser[];
  currentUser?: AppUser;
}

export const CreateCustomerModal: React.FC<CreateCustomerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  users = INITIAL_USERS,
  currentUser,
}) => {
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [lineId, setLineId] = useState('');
  const [email, setEmail] = useState('');
  const [interestedProducts, setInterestedProducts] = useState('ครีมกันแดด SPF50+');
  const [source, setSource] = useState('Facebook');
  const [salesOwner, setSalesOwner] = useState('Ito San');
  const [status, setStatus] = useState<CustomerStatus>('NEW');
  const [tier, setTier] = useState<CustomerTier>('GENERAL');
  const [isDealStage, setIsDealStage] = useState(true);
  const [nextFollowUpDate, setNextFollowUpDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextFollowUpTime, setNextFollowUpTime] = useState('10:00');
  const [nextAction, setNextAction] = useState('โทรสอบถามข้อมูลเบื้องต้น');
  const [avgReorderCycleDays, setAvgReorderCycleDays] = useState(0);
  const [address, setAddress] = useState('');

  // Extract and prioritize Sales Users from users table
  const salesUsersList = useMemo(() => {
    const safeUsers = Array.isArray(users) && users.length > 0 ? users : INITIAL_USERS;
    const active = safeUsers.filter((u) => u.status === 'ACTIVE' || !u.status);

    // Sales role first, then others
    const salesOnly = active.filter((u) => u.role === 'SALES');
    const others = active.filter((u) => u.role !== 'SALES');

    return [...salesOnly, ...others];
  }, [users]);

  // Set default sales owner when modal opens
  useEffect(() => {
    if (isOpen) {
      if (currentUser && currentUser.role === 'SALES' && (currentUser.salesOwnerTag || currentUser.name)) {
        setSalesOwner(currentUser.salesOwnerTag || currentUser.name);
      } else {
        const defaultSales = salesUsersList.find((u) => u.role === 'SALES') || salesUsersList[0];
        if (defaultSales) {
          setSalesOwner(defaultSales.salesOwnerTag || defaultSales.name);
        }
      }
    }
  }, [isOpen, currentUser, salesUsersList]);

  if (!isOpen) return null;

  // Selected User Object from database users table
  const selectedUser = salesUsersList.find(
    (u) =>
      u.name === salesOwner ||
      u.salesOwnerTag === salesOwner ||
      (u.salesId && u.salesId === salesOwner) ||
      u.id === salesOwner
  );

  const handleStatusChange = (newStatus: CustomerStatus) => {
    setStatus(newStatus);
    if (newStatus === 'WON' || newStatus === 'EXISTING') {
      setIsDealStage(false);
      if (!avgReorderCycleDays || avgReorderCycleDays === 0) setAvgReorderCycleDays(60);
    } else {
      setIsDealStage(true);
      setAvgReorderCycleDays(0);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !contactName.trim() || !phone.trim()) {
      alert('กรุณากรอกชื่อบริษัท ผู้ติดต่อ และเบอร์โทรศัพท์');
      return;
    }

    const payload: any = {
      companyName: companyName.trim(),
      contactName: contactName.trim(),
      phone: phone.trim(),
      lineId: lineId ? lineId.trim() : '',
      email: email ? email.trim() : '',
      interestedProducts,
      source,
      salesOwner: selectedUser ? (selectedUser.salesOwnerTag || selectedUser.name) : salesOwner,
      salesId: selectedUser?.salesId || selectedUser?.id || '',
      responsibleUserId: selectedUser?.id || '',
      status,
      tier,
      nextFollowUpDate,
      nextFollowUpTime,
      nextAction: nextAction.trim(),
      avgReorderCycleDays: isDealStage ? 0 : (Number(avgReorderCycleDays) || 60),
      repeatStatus: isDealStage ? 'NOT_APPLICABLE' : 'UPCOMING',
      address: address.trim(),
    };

    onSubmit(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 md:p-6 overflow-hidden animate-in fade-in">
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        {/* Fixed Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-white z-10">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <Building size={18} className="text-blue-600" /> + สร้าง Customer ใหม่ (New Lead)
          </h3>
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
                <label className="block font-bold text-slate-700 mb-1">ชื่อบริษัท / ลูกค้า *</label>
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
                <label className="block font-bold text-slate-700 mb-1">LINE ID (ถ้ามี - กรอกเองหรือเว้นว่างไว้)</label>
                <input
                  type="text"
                  value={lineId}
                  onChange={(e) => setLineId(e.target.value)}
                  placeholder="เช่น @brand_name หรือ user_line (เว้นว่างได้)"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email (ถ้ามี - เว้นว่างได้)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@example.com (เว้นว่างได้)"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ความสนใจเบื้องต้น (Sale / Product Type)</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setInterestedProducts('ครีมกันแดด SPF50+ (ผลิตล็อตจริง)');
                      setAvgReorderCycleDays(60);
                    }}
                    className={`p-2 rounded-xl border text-center font-bold text-[11px] transition-all cursor-pointer ${
                      !interestedProducts.includes('เทสเตอร์')
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🏷️ สั่งผลิตแบรนด์
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInterestedProducts('ชุดเทสเตอร์ทดลองสูตร (Tester Sample)');
                      setAvgReorderCycleDays(0);
                    }}
                    className={`p-2 rounded-xl border text-center font-bold text-[11px] transition-all cursor-pointer ${
                      interestedProducts.includes('เทสเตอร์')
                        ? 'border-purple-500 bg-purple-50 text-purple-800'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🧪 สนใจเทสเตอร์
                  </button>
                </div>
                <input
                  type="text"
                  value={interestedProducts}
                  onChange={(e) => setInterestedProducts(e.target.value)}
                  placeholder="ระบุสินค้าที่สนใจ..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">แหล่งที่มา (Source)</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="Facebook">Facebook</option>
                  <option value="Google Ads">Google Ads</option>
                  <option value="Website">Website</option>
                  <option value="Line Official">Line Official</option>
                  <option value="Walk-in">Walk-in</option>
                </select>
              </div>

              {/* Dynamic Sales Owner from public.users table */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>ผู้รับผิดชอบ (Sales Owner) *</span>
                  <span className="text-[10px] font-normal text-blue-600">ดึงจาก Users Table</span>
                </label>
                <select
                  value={salesOwner}
                  onChange={(e) => setSalesOwner(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-slate-800 bg-white"
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
                      <AlertTriangle size={13} className="text-amber-500 flex-shrink-0" />
                      <span>
                        <strong>Telegram Private:</strong> ⚠️ ยังไม่มี Chat ID (จะส่งเฉพาะ Group กลาง)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">สถานะแรกเริ่ม (Customer Status)</label>
                <select
                  value={status}
                  onChange={(e) => handleStatusChange(e.target.value as CustomerStatus)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-slate-800 bg-white"
                >
                  <option value="NEW">NEW (ลูกค้าใหม่ / อยู่ระหว่างดีล)</option>
                  <option value="CONTACTED">CONTACTED (ติดต่อแล้ว / อยู่ระหว่างดีล)</option>
                  <option value="FOLLOW_UP">FOLLOW_UP (กำลังติดตาม / อยู่ระหว่างดีล)</option>
                  <option value="QUOTATION_SENT">QUOTATION_SENT (ส่งใบเสนอราคา)</option>
                  <option value="NEGOTIATION">NEGOTIATION (กำลังเจรจาต่อรอง)</option>
                  <option value="WON">WON (ปิดการขายสำเร็จ)</option>
                  <option value="EXISTING">EXISTING (ลูกค้าเก่าสั่งผลิตประจำ)</option>
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
                      className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                        isDealStage
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      🎯 อยู่ระหว่างดีล (ยังไม่มีรอบซื้อซ้ำ)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDealStage(false);
                        if (!avgReorderCycleDays || avgReorderCycleDays === 0) setAvgReorderCycleDays(60);
                      }}
                      className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                        !isDealStage
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      🔁 สั่งผลิตประจำ (เปิดระบบเตือนซื้อซ้ำ)
                    </button>
                  </div>
                </div>

                {!isDealStage && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        รอบการซื้อซ้ำเฉลี่ย (วัน)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={avgReorderCycleDays}
                        onChange={(e) => setAvgReorderCycleDays(Number(e.target.value))}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center text-[11px] text-slate-500 pt-4 sm:pt-6">
                      * ระบบจะเริ่มนับวันเตือนซื้อซ้ำอัตโนมัติเมื่อมีคำสั่งซื้อ
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">วัน Follow-up ครั้งถัดไป</label>
                <input
                  type="date"
                  value={nextFollowUpDate}
                  onChange={(e) => setNextFollowUpDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">สิ่งที่ต้องทำครั้งถัดไป (Next Action)</label>
                <input
                  type="text"
                  value={nextAction}
                  onChange={(e) => setNextAction(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">ที่อยู่จัดส่ง / ออกใบกำกับภาษี</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123/45 ถนนสุขุมวิท..."
                rows={2}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="p-4 sm:px-6 bg-slate-50/90 border-t border-slate-100 flex items-center justify-end space-x-2 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 cursor-pointer transition-colors shadow-2xs"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Building size={16} /> บันทึกสร้าง Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
