import {
  AlertCircle,
  Boxes,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCopy,
  DollarSign,
  FileCode,
  Filter,
  FlaskConical,
  HelpCircle,
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
import { ORDERS_TRIGGER_FIX_SQL } from '../data/telegramSqlScripts';

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
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlGuide, setShowSqlGuide] = useState(false);

  const safeOrders = orders || [];

  const handleCopySql = () => {
    navigator.clipboard.writeText(ORDERS_TRIGGER_FIX_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const filteredOrders = safeOrders.filter((o) => {
    const isTester =
      o.orderType === 'TESTER' ||
      o.productName.toLowerCase().includes('เทสเตอร์') ||
      o.productName.toLowerCase().includes('tester');
    const orderType = o.orderType || (isTester ? 'TESTER' : 'BRAND_PRODUCTION');

    const matchesType = typeFilter === 'ALL' || orderType === typeFilter;
    const matchesSearch =
      (o.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.productName || '').toLowerCase().includes(searchTerm.toLowerCase());

    return matchesType && matchesSearch;
  });

  // Calculate Totals & Quantities
  const totalOrdersCount = safeOrders.length;
  const totalUnits = safeOrders.reduce((sum, o) => sum + Number(o.quantity || 0), 0);
  const totalRevenue = safeOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

  const brandOrders = safeOrders.filter(
    (o) => o.orderType !== 'TESTER' && !o.productName.toLowerCase().includes('เทสเตอร์')
  );
  const totalBrandOrders = brandOrders.length;
  const totalBrandUnits = brandOrders.reduce((sum, o) => sum + Number(o.quantity || 0), 0);
  const totalBrandRevenue = brandOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

  const testerOrders = safeOrders.filter(
    (o) => o.orderType === 'TESTER' || o.productName.toLowerCase().includes('เทสเตอร์')
  );
  const totalTesterOrders = testerOrders.length;
  const totalTesterUnits = testerOrders.reduce((sum, o) => sum + Number(o.quantity || 0), 0);
  const totalTesterRevenue = testerOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

  // Filtered totals for footer
  const filteredUnits = filteredOrders.reduce((sum, o) => sum + Number(o.quantity || 0), 0);
  const filteredRevenue = filteredOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 soft-shadow flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ShoppingBag size={22} className="text-blue-600" /> จัดการคำสั่งซื้อและจัดส่ง (Orders & Delivery)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            บันทึก Order พร้อมแสดงจำนวนชิ้น/ชุด แยกประเภท <strong>🏷️ สั่งผลิตแบรนด์ (OEM)</strong> และ <strong>🧪 ขายเทสเตอร์ (Tester)</strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowSqlGuide(!showSqlGuide)}
            className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all"
            title="ดูคำแนะนำ Database & Supabase Trigger"
          >
            <FileCode size={15} /> Supabase Fix {showSqlGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            onClick={onOpenCreateOrder}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-2xs transition-all active:scale-95"
          >
            <Plus size={16} /> + สร้าง Order ใหม่
          </button>
        </div>
      </div>

      {/* Supabase Trigger & notification_queue Fix Banner (Collapsible) */}
      {showSqlGuide && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 text-xs text-amber-900 space-y-3 animate-in fade-in">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-2 bg-amber-100 text-amber-700 rounded-xl mt-0.5">
                <AlertCircle size={18} />
              </div>
              <div>
                <h4 className="font-bold text-sm text-amber-950">
                  ⚡ วิธีแก้ปัญหา Error: relation "notification_queue" does not exist ใน Supabase
                </h4>
                <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
                  หากสร้าง Order แล้วไม่บันทึกลงใน Supabase เกิดจาก Database Trigger <code>trg_orders_notify</code> ใน Supabase เรียกหาตาราง <code>notification_queue</code>
                  <br />
                  ท่านสามารถคัดลอก SQL ด้านล่างไปรันใน <strong>Supabase SQL Editor</strong> เพียงครั้งเดียวเพื่อสร้างตารางและทำให้ Trigger ปลอดภัย 100%:
                </p>
              </div>
            </div>

            <button
              onClick={handleCopySql}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs shadow-xs transition-all flex-shrink-0 ${
                copiedSql
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
              }`}
            >
              {copiedSql ? <Check size={14} /> : <ClipboardCopy size={14} />}
              {copiedSql ? 'คัดลอกแล้ว!' : 'คัดลอก SQL แก้ไข'}
            </button>
          </div>

          <div className="bg-slate-900 text-slate-200 p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto max-h-44 border border-slate-800">
            <pre>{ORDERS_TRIGGER_FIX_SQL}</pre>
          </div>
        </div>
      )}

      {/* KPI Stats Cards (Focusing on Quantity & Revenue) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Total Orders & Quantity */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 soft-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">ออเดอร์ & จำนวนรวม</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Boxes size={18} />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-800">
              {totalUnits.toLocaleString()} <span className="text-xs font-normal text-slate-500">ชิ้น/ชุด</span>
            </div>
            <div className="text-[11px] text-blue-600 font-bold mt-1">
              จากทั้งหมด {totalOrdersCount} ออเดอร์
            </div>
          </div>
        </div>

        {/* Card 2: OEM Brand Production Orders */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 soft-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">🏷️ ผลิตแบรนด์ (OEM)</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Package size={18} />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-700">
              {totalBrandUnits.toLocaleString()} <span className="text-xs font-normal text-slate-500">ชิ้น</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-bold mt-1">
              {totalBrandOrders} ออเดอร์ (฿{totalBrandRevenue.toLocaleString()})
            </div>
          </div>
        </div>

        {/* Card 3: Tester Orders */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 soft-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">🧪 ขายเทสเตอร์ (Tester)</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <FlaskConical size={18} />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-purple-700">
              {totalTesterUnits.toLocaleString()} <span className="text-xs font-normal text-slate-500">ชุด</span>
            </div>
            <div className="text-[11px] text-purple-600 font-bold mt-1">
              {totalTesterOrders} ออเดอร์ (฿{totalTesterRevenue.toLocaleString()})
            </div>
          </div>
        </div>

        {/* Card 4: Total Revenue */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 soft-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">ยอดขายรวมสุทธิ</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <DollarSign size={18} />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
              ฿{totalRevenue.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              เฉลี่ย ฿{totalUnits > 0 ? Math.round(totalRevenue / totalUnits).toLocaleString() : 0}/หน่วย
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 soft-shadow space-y-4">
        {/* Filter Tabs & Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Type Filter Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                typeFilter === 'ALL'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Boxes size={14} /> ทั้งหมด ({safeOrders.length} ออเดอร์ · รวม {totalUnits.toLocaleString()} ชิ้น)
            </button>
            <button
              onClick={() => setTypeFilter('BRAND_PRODUCTION')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                typeFilter === 'BRAND_PRODUCTION'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
              }`}
            >
              <Package size={14} /> 🏷️ สั่งผลิตแบรนด์ ({totalBrandOrders} ออเดอร์ · {totalBrandUnits.toLocaleString()} ชิ้น)
            </button>
            <button
              onClick={() => setTypeFilter('TESTER')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                typeFilter === 'TESTER'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/60'
              }`}
            >
              <FlaskConical size={14} /> 🧪 ขายเทสเตอร์ ({totalTesterOrders} ออเดอร์ · {totalTesterUnits.toLocaleString()} ชุด)
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

        {/* Orders Table with Prominent Quantity Columns */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-3">เลขที่ Order</th>
                <th className="py-3 px-3">ประเภท</th>
                <th className="py-3 px-4">ลูกค้า</th>
                <th className="py-3 px-3">วันที่ Order</th>
                <th className="py-3 px-3">วันที่ส่งมอบ</th>
                <th className="py-3 px-3">สินค้า</th>
                <th className="py-3 px-3 text-right text-blue-900 bg-blue-50/50">จำนวน (Quantity)</th>
                <th className="py-3 px-3 text-right">ราคา/หน่วย</th>
                <th className="py-3 px-3 text-right">ยอดรวม (บาท)</th>
                <th className="py-3 px-3">การติดตาม / Reorder</th>
                <th className="py-3 px-3">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-slate-400">
                    <ShoppingBag size={28} className="mx-auto text-slate-300 mb-2" />
                    ไม่พบรายการ Order ในเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const matchedCust = customers.find((c) => c.id === ord.customerId);
                  const isTester =
                    ord.orderType === 'TESTER' ||
                    ord.productName.toLowerCase().includes('เทสเตอร์') ||
                    ord.productName.toLowerCase().includes('tester');

                  const qty = Number(ord.quantity || 1);
                  const unitP = Number(ord.unitPrice || 0);

                  return (
                    <tr
                      key={ord.id}
                      className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                      onClick={() => matchedCust && onSelectCustomer(matchedCust)}
                    >
                      <td className="py-3.5 px-3 font-bold text-blue-700 font-mono group-hover:underline">
                        {ord.id}
                      </td>
                      <td className="py-3.5 px-3">
                        {isTester ? (
                          <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-md text-[10px] border border-purple-200">
                            <FlaskConical size={11} /> เทสเตอร์
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md text-[10px] border border-emerald-200">
                            <Package size={11} /> ผลิตแบรนด์
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {ord.customerName || (matchedCust ? matchedCust.companyName : '-')}
                      </td>
                      <td className="py-3.5 px-3 text-slate-600">{ord.orderDate}</td>
                      <td className="py-3.5 px-3 text-slate-600 font-medium">{ord.deliveryDate}</td>
                      <td className="py-3.5 px-3 font-medium text-slate-800">{ord.productName}</td>
                      
                      {/* Quantity Column Highlight */}
                      <td className="py-3.5 px-3 text-right bg-blue-50/30">
                        <span className="inline-block font-extrabold text-blue-900 bg-blue-100/80 px-2.5 py-1 rounded-lg text-xs border border-blue-200/80">
                          {qty.toLocaleString()} {isTester ? 'ชุด' : 'ชิ้น'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right text-slate-600 font-mono">
                        ฿{unitP.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-3 font-extrabold text-emerald-700 text-right font-mono">
                        ฿{Number(ord.totalAmount || 0).toLocaleString()}
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
                            <span className="text-[9px] text-slate-400 font-normal">
                              รอบซื้อซ้ำ ({ord.reorderCycleDays || 60} วัน)
                            </span>
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

            {/* Table Footer with Summary Row */}
            {filteredOrders.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100/90 font-bold text-slate-800 border-t-2 border-slate-300">
                  <td colSpan={6} className="py-3 px-4 text-right">
                    รวมทั้งสิ้น ({filteredOrders.length} ออเดอร์):
                  </td>
                  <td className="py-3 px-3 text-right bg-blue-100/60 font-extrabold text-blue-900 text-xs">
                    {filteredUnits.toLocaleString()} หน่วย
                  </td>
                  <td className="py-3 px-3 text-right text-slate-500">-</td>
                  <td className="py-3 px-3 text-right font-extrabold text-emerald-800 text-sm">
                    ฿{filteredRevenue.toLocaleString()}
                  </td>
                  <td colSpan={2} className="py-3 px-3"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

