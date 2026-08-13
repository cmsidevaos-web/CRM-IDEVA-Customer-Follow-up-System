import { DollarSign, ShoppingBag, X } from 'lucide-react';
import React, { useState } from 'react';
import { Customer } from '../types';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  selectedCustomer?: Customer | null;
  onSubmit: (data: any) => void;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  customers,
  selectedCustomer,
  onSubmit,
}) => {
  const [customerId, setCustomerId] = useState(selectedCustomer?.id || (customers[0]?.id || ''));
  const [productName, setProductName] = useState('ครีมกันแดด SPF50+');
  const [quantity, setQuantity] = useState(300);
  const [unitPrice, setUnitPrice] = useState(190);
  const [orderDate, setOrderDate] = useState('2026-07-20');
  const [deliveryDate, setDeliveryDate] = useState('2026-08-10');
  const [reorderCycleDays, setReorderCycleDays] = useState(60);

  if (!isOpen) return null;

  const currentCust = customers.find((c) => c.id === customerId) || selectedCustomer || customers[0];
  const totalAmount = quantity * unitPrice;

  // Formula calculation for next reorder
  const delDateObj = new Date(deliveryDate || '2026-08-10');
  const nextReorderDateObj = new Date(delDateObj);
  nextReorderDateObj.setDate(nextReorderDateObj.getDate() + Number(reorderCycleDays));
  const nextReorderDate = nextReorderDateObj.toISOString().split('T')[0];

  const followUpStartObj = new Date(nextReorderDateObj);
  followUpStartObj.setDate(followUpStartObj.getDate() - 15);
  const followUpStartDate = followUpStartObj.toISOString().split('T')[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCust) return;

    onSubmit({
      customerId: currentCust.id,
      customerName: currentCust.companyName,
      productName,
      quantity: Number(quantity),
      unitPrice: Number(unitPrice),
      totalAmount,
      orderDate,
      deliveryDate,
      reorderCycleDays: Number(reorderCycleDays),
      nextReorderDate,
      followUpStartDate,
      status: 'COMPLETED',
      repeatStatus: 'UPCOMING',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <ShoppingBag size={18} className="text-emerald-600" /> + สร้าง Order ใหม่ (WON)
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
              className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName} ({c.contactName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">สินค้าที่สั่งซื้อ *</label>
            <input
              type="text"
              required
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">จำนวน (ชิ้น)</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">ราคาต่อหน่วย (บาท)</label>
              <input
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex justify-between items-center font-bold">
            <span>ยอดรวมทั้งสิ้น:</span>
            <span className="text-base text-emerald-700">฿{totalAmount.toLocaleString()} บาท</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">วันที่สั่งซื้อ (Order Date)</label>
              <input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">วันที่ส่งมอบ (Delivery)</label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">รอบซื้อซ้ำ (Reorder Cycle - วัน)</label>
            <input
              type="number"
              value={reorderCycleDays}
              onChange={(e) => setReorderCycleDays(Number(e.target.value))}
              className="w-full p-2.5 border border-slate-200 rounded-xl"
            />
          </div>

          {/* Auto calculated formula preview */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-[11px] text-slate-600">
            <div>
              <span className="font-semibold text-slate-800">วันคาดว่าจะซื้อซ้ำอัตโนมัติ:</span>{' '}
              <span className="font-bold text-blue-700">{nextReorderDate}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-800">เริ่มระบบแจ้งเตือน Follow-up:</span>{' '}
              <span className="font-bold text-amber-700">{followUpStartDate}</span>
            </div>
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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-2xs"
            >
              สร้าง Order และเริ่มคำนวณรอบซื้อซ้ำ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
