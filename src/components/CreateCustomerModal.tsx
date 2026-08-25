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
  const [nextFollowUpDate, setNextFollowUpDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextFollowUpTime, setNextFollowUpTime] = useState('10:00');
  const [nextAction, setNextAction] = useState('โทรสอบถามข้อมูลเบื้องต้น');
  const [avgReorderCycleDays, setAvgReorderCycleDays] = useState(60);
  const [address, setAddress] = useState('');

  if (!isOpen) return null;

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
      avgReorderCycleDays: Number(avgReorderCycleDays) || 60,
      address,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <Building size={18} className="text-blue-600" /> + สร้าง Customer ใหม่ (New Lead)
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
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
              <label className="block font-bold text-slate-700 mb-1">สถานะแรกเริ่ม</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CustomerStatus)}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
              >
                <option value="NEW">NEW (ลูกค้าใหม่)</option>
                <option value="EXISTING">EXISTING (ลูกค้าเก่า)</option>
                <option value="CONTACTED">CONTACTED (ติดต่อแล้ว)</option>
                <option value="FOLLOW_UP">FOLLOW_UP (กำลังติดตาม)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">รอบซื้อซ้ำโดยเฉลี่ย (วัน)</label>
              <input
                type="number"
                value={avgReorderCycleDays}
                onChange={(e) => setAvgReorderCycleDays(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
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
              บันทึกสร้าง Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
