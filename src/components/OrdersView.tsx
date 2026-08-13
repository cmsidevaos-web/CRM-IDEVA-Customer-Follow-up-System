import {
  CheckCircle2,
  DollarSign,
  PackageCheck,
  Plus,
  Repeat,
  Search,
  ShoppingBag,
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

  const safeOrders = orders || [];

  const filteredOrders = safeOrders.filter(
    (o) =>
      (o.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.productName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 soft-shadow space-y-5">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <ShoppingBag size={20} className="text-blue-600" /> ประวัติคำสั่งซื้อและจัดส่ง (Orders & Delivery)
          </h2>
          <p className="text-xs text-slate-500">บันทึก Order ยอดขาย คำนวณวันส่งมอบ และระบบคำนวณรอบการสั่งซื้อซ้ำ</p>
        </div>

        <button
          onClick={onOpenCreateOrder}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-2xs transition-all"
        >
          <Plus size={16} /> + สร้าง Order ใหม่
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ค้นหาเลขที่ Order, ชื่อลูกค้า, สินค้า..."
          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white"
        />
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
              <th className="py-3 px-3">เลขที่ Order</th>
              <th className="py-3 px-4">ลูกค้า</th>
              <th className="py-3 px-3">วันที่ Order</th>
              <th className="py-3 px-3">วันที่ส่งมอบ</th>
              <th className="py-3 px-3">สินค้า</th>
              <th className="py-3 px-3">จำนวน</th>
              <th className="py-3 px-3">ยอดรวม (บาท)</th>
              <th className="py-3 px-3">คาดว่าจะซื้อซ้ำ</th>
              <th className="py-3 px-3">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400">
                  ไม่พบรายการ Order
                </td>
              </tr>
            ) : (
              filteredOrders.map((ord) => {
                const matchedCust = customers.find((c) => c.id === ord.customerId);
                return (
                  <tr
                    key={ord.id}
                    className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                    onClick={() => matchedCust && onSelectCustomer(matchedCust)}
                  >
                    <td className="py-3.5 px-3 font-bold text-blue-700 font-mono">{ord.id}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{ord.customerName}</td>
                    <td className="py-3.5 px-3 text-slate-600">{ord.orderDate}</td>
                    <td className="py-3.5 px-3 text-slate-600 font-medium">{ord.deliveryDate}</td>
                    <td className="py-3.5 px-3 font-medium text-slate-800">{ord.productName}</td>
                    <td className="py-3.5 px-3 font-bold text-slate-900">{ord.quantity} ชิ้น</td>
                    <td className="py-3.5 px-3 font-extrabold text-emerald-700">
                      ฿{ord.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-amber-700">{ord.nextReorderDate}</td>
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
