import {
  CheckCircle2,
  DollarSign,
  FlaskConical,
  Filter,
  Package,
  PackageCheck,
  Plus,
  Repeat,
  Search,
  ShoppingBag,
  Sparkles,
  Truck
} from 'lucide-react';
import React, { useState } from 'react';
import { Customer, Order } from '../types';

interface OrdersViewProps {
  orders?: Order[];
  customers?: Customer[];
  onOpenCreateOrder?: () => void;
  onSelectCustomer?: (customer: Customer) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders = [],
  customers = [],
  onOpenCreateOrder = () => {},
  onSelectCustomer = (_c: Customer) => {},
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'BRAND_PRODUCTION' | 'TESTER'>('ALL');

  const safeOrders = orders || [];

  const filteredOrders = safeOrders.filter((o) => {
    const isTester = o.orderType === 'TESTER' || o.productName.toLowerCase().includes('เทสเตอร์') || o.productName.toLowerCase().includes('tester');
    const orderType = o.orderType || (isTester ? 'TESTER' : 'BRAND_PRODUCTION');

    const matchesType = typeFilter === 'ALL' || orderType === typeFilter;
    const matchesSearch =
      (o.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.productName || '').toLowerCase().includes(searchTerm.toLowerCase());

    return matchesType && matchesSearch;
  });

  const totalBrandOrders = safeOrders.filter((o) => o.orderType !== 'TESTER' && !o.productName.toLowerCase().includes('เทสเตอร์')).length;
  const totalTesterOrders = safeOrders.filter((o) => o.orderType === 'TESTER' || o.productName.toLowerCase().includes('เทสเตอร์')).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 soft-shadow space-y-5">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <ShoppingBag size={20} className="text-blue-600" /> ประวัติคำสั่งซื้อและจัดส่ง (Orders & Delivery)
          </h2>
          <p className="text-xs text-slate-500">
            บันทึก Order แยกประเภท <strong>🏷️ สั่งผลิตแบรนด์ (มีรอบซื้อซ้ำ)</strong> และ <strong>🧪 ขายเทสเตอร์ (ติดตามผลทดลองใช้เพื่อสร้างแบรนด์)</strong>
          </p>
        </div>

        <button
          onClick={onOpenCreateOrder}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-2xs transition-all active:scale-95"
        >
          <Plus size={16} /> + สร้าง Order ใหม่
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
        {/* Type Filter Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              typeFilter === 'ALL'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ทั้งหมด ({safeOrders.length})
          </button>
          <button
            onClick={() => setTypeFilter('BRAND_PRODUCTION')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              typeFilter === 'BRAND_PRODUCTION'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
            }`}
          >
            <Package size={14} /> 🏷️ สั่งผลิตแบรนด์ ({totalBrandOrders})
          </button>
          <button
            onClick={() => setTypeFilter('TESTER')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              typeFilter === 'TESTER'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/60'
            }`}
          >
            <FlaskConical size={14} /> 🧪 ขายเทสเตอร์ ({totalTesterOrders})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหา Order, ลูกค้า, สินค้า..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
              <th className="py-3 px-3">เลขที่ Order</th>
              <th className="py-3 px-3">ประเภทการขาย</th>
              <th className="py-3 px-4">ลูกค้า</th>
              <th className="py-3 px-3">วันที่ Order</th>
              <th className="py-3 px-3">วันที่ส่งมอบ</th>
              <th className="py-3 px-3">สินค้า</th>
              <th className="py-3 px-3 text-right">จำนวน</th>
              <th className="py-3 px-3 text-right">ยอดรวม (บาท)</th>
              <th className="py-3 px-3">การติดตาม / ซื้อซ้ำ</th>
              <th className="py-3 px-3">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-400">
                  ไม่พบรายการ Order ในเงื่อนไขนี้
                </td>
              </tr>
            ) : (
              filteredOrders.map((ord) => {
                const matchedCust = customers.find((c) => c.id === ord.customerId);
                const isTester = ord.orderType === 'TESTER' || ord.productName.toLowerCase().includes('เทสเตอร์') || ord.productName.toLowerCase().includes('tester');

                return (
                  <tr
                    key={ord.id}
                    className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                    onClick={() => matchedCust && onSelectCustomer(matchedCust)}
                  >
                    <td className="py-3.5 px-3 font-bold text-blue-700 font-mono">{ord.id}</td>
                    <td className="py-3.5 px-3">
                      {isTester ? (
                        <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-md text-[10px] border border-purple-200">
                          <FlaskConical size={11} /> เทสเตอร์ (Tester)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md text-[10px] border border-emerald-200">
                          <Package size={11} /> ผลิตแบรนด์ (OEM)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{ord.customerName}</td>
                    <td className="py-3.5 px-3 text-slate-600">{ord.orderDate}</td>
                    <td className="py-3.5 px-3 text-slate-600 font-medium">{ord.deliveryDate}</td>
                    <td className="py-3.5 px-3 font-medium text-slate-800">{ord.productName}</td>
                    <td className="py-3.5 px-3 font-bold text-slate-900 text-right">{ord.quantity.toLocaleString()} {isTester ? 'ชุด' : 'ชิ้น'}</td>
                    <td className="py-3.5 px-3 font-extrabold text-emerald-700 text-right">
                      ฿{ord.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3">
                      {isTester ? (
                        <div className="text-purple-700 font-bold flex flex-col">
                          <span className="flex items-center gap-1 text-[11px]">
                            <Sparkles size={12} className="text-purple-500" />
                            {ord.testerFollowUpDate || 'นัดติดตามผล 7 วัน'}
                          </span>
                          <span className="text-[9px] text-slate-400 font-normal">ติดตามผลทดลองใช้</span>
                        </div>
                      ) : (
                        <div className="text-amber-700 font-bold flex flex-col">
                          <span className="flex items-center gap-1 text-[11px]">
                            <Repeat size={12} className="text-amber-500" />
                            {ord.nextReorderDate || `${ord.reorderCycleDays || 60} วัน`}
                          </span>
                          <span className="text-[9px] text-slate-400 font-normal">รอบซื้อซ้ำ ({ord.reorderCycleDays || 60} วัน)</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                        {ord.status === 'COMPLETED' ? 'จัดส่งแล้ว' : ord.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
