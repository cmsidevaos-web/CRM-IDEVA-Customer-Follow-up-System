import { Building, User, Phone, Mail, Globe, MapPin, Tag, X } from 'lucide-react';
import React, { useState } from 'react';
import { CustomerStatus, CustomerTier } from '../types';

interface CreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export const CreateCustomerModal: React.FC<CreateCustomerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [lineId, setLineId] = useState('');
  const [email, setEmail] = useState('');
  const [interestedProducts, setInterestedProducts] = useState('ครีมกันแดด SPF50+');
  const [source, setSource] = useState('Facebook');
  const [salesOwner, setSalesOwner] = useState('คุณสมชาย (Sales A)');
  const [status, setStatus] = useState<CustomerStatus>('NEW');
  const [tier, setTier] = useState<CustomerTier>('GENERAL');
  const [isDealStage, setIsDealStage] = useState(true);
  const [nextFollowUpDate, setNextFollowUpDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextFollowUpTime, setNextFollowUpTime] = useState('10:00');
  const [nextAction, setNextAction] = useState('โทรสอบถามข้อมูลเบื้องต้น');
  const [avgReorderCycleDays, setAvgReorderCycleDays] = useState(0);
  const [address, setAddress] = useState('');

  if (!isOpen) return null;

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

    onSubmit({
      companyName,
      contactName,
      phone,
      lineId: lineId ? lineId.trim() : '',
      email: email ? email.trim() : '',
      interestedProducts,
      source,
      salesOwner,
      status,
      tier,
      nextFollowUpDate,
      nextFollowUpTime,
      nextAction,
      avgReorderCycleDays: isDealStage ? 0 : (Number(avgReorderCycleDays) || 60),
      repeatStatus: isDealStage ? 'NOT_APPLICABLE' : 'UPCOMING',
      address,
    });
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
                  className={`p-2 rounded-xl border text-center font-bold text-[11px] transition-all ${
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
                  className={`p-2 rounded-xl border text-center font-bold text-[11px] transition-all ${
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
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Facebook">Facebook</option>
                <option value="Google Ads">Google Ads</option>
                <option value="Website">Website</option>
                <option value="Line Official">Line Official</option>
                <option value="Walk-in">Walk-in</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">ผู้รับผิดชอบ (Sales Owner)</label>
              <select
                value={salesOwner}
                onChange={(e) => setSalesOwner(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="คุณสมชาย (Sales A)">คุณสมชาย (Sales A)</option>
                <option value="คุณนภา (Sales B)">คุณนภา (Sales B)</option>
                <option value="คุณวิชัย (Manager)">คุณวิชัย (Manager)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">สถานะแรกเริ่ม (Customer Status)</label>
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value as CustomerStatus)}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-slate-800"
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
                      setAvgReorderCycleDays(60);
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
                    <span className="font-bold">เคสลูกค้าอยู่ระหว่างการดีล (In Deal Stage):</span> บันทึกข้อมูลเพื่อติดตามการขาย (Follow-up) ได้ตามปกติ โดยระบบจะไม่นับรอบวันซื้อซ้ำหรือคำนวณวันหมดอายุสินค้าล่วงหน้า จนกว่าจะมีการเปิดคำสั่งซื้อผลิตล็อตแรก
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">รอบซื้อซ้ำโดยเฉลี่ย (วัน)</label>
                    <input
                      type="number"
                      min="1"
                      value={avgReorderCycleDays || 60}
                      onChange={(e) => setAvgReorderCycleDays(Number(e.target.value))}
                      placeholder="60"
                      className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-semibold text-slate-800"
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
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
          >
            บันทึกสร้าง Customer
          </button>
        </div>
      </form>
    </div>
  </div>
);
};
