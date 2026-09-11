import {
  Download,
  Edit,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Plus,
  Search,
  Trash2,
  UserCheck
} from 'lucide-react';
import React, { useState } from 'react';
import { Customer, CustomerStatus, ViewTab } from '../types';

interface CustomerListViewProps {
  customers?: Customer[];
  initialStatusFilter?: string;
  onSelectCustomer?: (customer: Customer) => void;
  onOpenCreateCustomer?: () => void;
  onOpenCreateActivity?: () => void;
  onOpenCreateActivityForCustomer?: (customer: Customer) => void;
  onOpenCreateOrder?: (customer: Customer) => void;
  onEditCustomer?: (customer: Customer) => void;
  onDeleteCustomer?: (customer: Customer) => void;
  onExportData?: (type: 'EXCEL' | 'PDF') => void;
}

export const CustomerListView: React.FC<CustomerListViewProps> = ({
  customers = [],
  initialStatusFilter = 'ALL',
  onSelectCustomer = (_c: Customer) => {},
  onOpenCreateCustomer = () => {},
  onOpenCreateActivity = () => {},
  onOpenCreateActivityForCustomer = (_c: Customer) => {},
  onOpenCreateOrder = (_c: Customer) => {},
  onEditCustomer = (_c: Customer) => {},
  onDeleteCustomer = (_c: Customer) => {},
  onExportData = (_type: 'EXCEL' | 'PDF') => {},
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatusFilter || 'ALL');
  const [selectedSales, setSelectedSales] = useState<string>('ALL');
  const [selectedFollowupFilter, setSelectedFollowupFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const itemsPerPage = 10;

  const safeCustomers = customers || [];

  // Filtering Logic
  const filteredCustomers = safeCustomers.filter((c) => {
    const matchesSearch =
      c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.lineId ? c.lineId.toLowerCase().includes(searchTerm.toLowerCase()) : false);

    const isDeal =
      c.repeatStatus === 'NOT_APPLICABLE' ||
      (Number(c.totalOrdersCount || 0) === 0 &&
        c.status !== 'WON' &&
        c.status !== 'EXISTING' &&
        (!c.avgReorderCycleDays || c.avgReorderCycleDays === 0));

    let matchesStatus = true;
    if (selectedStatus === 'IN_DEAL') {
      matchesStatus = isDeal || c.status === 'NEW' || c.status === 'CONTACTED' || c.status === 'FOLLOW_UP' || c.status === 'QUOTATION_SENT' || c.status === 'NEGOTIATION';
    } else if (selectedStatus !== 'ALL') {
      matchesStatus = c.status === selectedStatus;
    }

    const matchesSales = selectedSales === 'ALL' || c.salesOwner === selectedSales;

    const todayStr = new Date().toISOString().split('T')[0];
    let matchesFollowup = true;
    if (selectedFollowupFilter === 'TODAY') {
      matchesFollowup = c.nextFollowUpDate === todayStr || c.nextFollowUpDate === '2026-07-30';
    } else if (selectedFollowupFilter === 'OVERDUE') {
      matchesFollowup = c.status === 'OVERDUE' || (c.nextFollowUpDate < todayStr && c.status !== 'WON' && c.status !== 'LOST');
    }

    return matchesSearch && matchesStatus && matchesSales && matchesFollowup;
  });

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Status Badge styling exact match to diagram
  const renderStatusBadge = (status: CustomerStatus) => {
    switch (status) {
      case 'NEW':
        return <span className="bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-md text-xs">ลูกค้าใหม่ (New)</span>;
      case 'EXISTING':
        return <span className="bg-teal-100 text-teal-800 font-bold px-2.5 py-1 rounded-md text-xs">ลูกค้าเก่า (Existing)</span>;
      case 'CONTACTED':
        return <span className="bg-blue-100 text-blue-700 font-bold px-2.5 py-1 rounded-md text-xs">ติดต่อแล้ว (Contacted)</span>;
      case 'FOLLOW_UP':
        return <span className="bg-sky-100 text-sky-800 font-bold px-2.5 py-1 rounded-md text-xs">กำลังติดตาม (Follow-up)</span>;
      case 'QUOTATION_SENT':
        return <span className="bg-purple-100 text-purple-800 font-bold px-2.5 py-1 rounded-md text-xs">ส่งใบเสนอราคา (Quotation Sent)</span>;
      case 'NEGOTIATION':
        return <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-md text-xs">เจรจา (Negotiation)</span>;
      case 'WON':
        return <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-md text-xs">ปิดการขาย (Won)</span>;
      case 'LOST':
        return <span className="bg-rose-100 text-rose-700 font-bold px-2.5 py-1 rounded-md text-xs">ไม่สนใจ / ยกเลิก (Lost)</span>;
      case 'OVERDUE':
        return <span className="bg-red-600 text-white font-bold px-2.5 py-1 rounded-md text-xs shadow-2xs">เกินกำหนด (Overdue)</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-md text-xs">{status}</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 soft-shadow space-y-5">
      {/* Search Header & Action Buttons */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-xl">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="ค้นหาชื่อลูกค้า, บริษัท, เบอร์โทร, LINE ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onExportData('EXCEL')}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium text-xs px-3 py-2.5 rounded-xl border border-emerald-200 flex items-center space-x-1.5 transition-all"
            title="ส่งออกไฟล์ Excel"
          >
            <FileSpreadsheet size={15} />
            <span className="hidden sm:inline">Export Excel</span>
          </button>
          <button
            onClick={() => onExportData('PDF')}
            className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium text-xs px-3 py-2.5 rounded-xl border border-rose-200 flex items-center space-x-1.5 transition-all"
            title="ส่งออกไฟล์ PDF"
          >
            <FileText size={15} />
            <span className="hidden sm:inline">Export PDF</span>
          </button>
          <button
            onClick={onOpenCreateCustomer}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-2 shadow-sm transition-all"
          >
            <Plus size={16} />
            <span>+ สร้าง Customer</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">สถานะ</label>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-slate-700 font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">ทั้งหมด</option>
            <option value="IN_DEAL">💼 อยู่ระหว่างการดีล (ยังไม่มีข้อมูลซื้อซ้ำ)</option>
            <option value="NEW">New (ลูกค้าใหม่)</option>
            <option value="EXISTING">Existing (ลูกค้าเก่า)</option>
            <option value="CONTACTED">Contacted (ติดต่อแล้ว)</option>
            <option value="FOLLOW_UP">Follow-up (กำลังติดตาม)</option>
            <option value="QUOTATION_SENT">Quotation Sent (ส่งใบเสนอราคา)</option>
            <option value="NEGOTIATION">Negotiation (เจรจาต่อรอง)</option>
            <option value="WON">Won (ปิดการขาย)</option>
            <option value="LOST">Lost (ไม่สนใจ/ยกเลิก)</option>
            <option value="OVERDUE">Overdue (เกินกำหนด)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">ผู้รับผิดชอบ</label>
          <select
            value={selectedSales}
            onChange={(e) => {
              setSelectedSales(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-slate-700 font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">ทั้งหมด</option>
            <option value="คุณสมชาย (Sales A)">คุณสมชาย (Sales A)</option>
            <option value="คุณนภา (Sales B)">คุณนภา (Sales B)</option>
            <option value="คุณวิชัย (Manager)">คุณวิชัย (Manager)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">วันที่ติดตาม</label>
          <select
            value={selectedFollowupFilter}
            onChange={(e) => {
              setSelectedFollowupFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-slate-700 font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">ทั้งหมด</option>
            <option value="TODAY">วันนี้ (30/07/2026)</option>
            <option value="OVERDUE">เกินกำหนด</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedStatus('ALL');
              setSelectedSales('ALL');
              setSelectedFollowupFilter('ALL');
              setCurrentPage(1);
            }}
            className="w-full bg-white hover:bg-slate-100 text-slate-600 font-medium border border-slate-200 rounded-lg py-1.5 px-3 flex items-center justify-center gap-1 transition-colors"
          >
            <Filter size={13} /> ล้างตัวกรอง
          </button>
        </div>
      </div>

      {/* Main Customers Table matching Diagram 1 */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
              <th className="py-3 px-3">ลำดับ</th>
              <th className="py-3 px-4">บริษัท / ชื่อลูกค้า</th>
              <th className="py-3 px-3">ผู้ติดต่อ</th>
              <th className="py-3 px-3">เบอร์โทร / LINE</th>
              <th className="py-3 px-3">สถานะ</th>
              <th className="py-3 px-3">Follow-up</th>
              <th className="py-3 px-3">ผู้รับผิดชอบ</th>
              <th className="py-3 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedCustomers.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  ไม่พบข้อมูลลูกค้าตามเงื่อนไขที่ค้นหา
                </td>
              </tr>
            ) : (
              paginatedCustomers.map((cust, idx) => {
                const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
                return (
                  <tr
                    key={cust.id}
                    className="hover:bg-blue-50/50 transition-colors group cursor-pointer"
                    onClick={() => onSelectCustomer(cust)}
                  >
                    <td className="py-3.5 px-3 text-slate-400 font-mono text-[11px]">{globalIdx}.</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors flex items-center gap-1.5">
                        {cust.companyName}
                        {(cust.repeatStatus === 'NOT_APPLICABLE' ||
                          (Number(cust.totalOrdersCount || 0) === 0 &&
                            cust.status !== 'WON' &&
                            cust.status !== 'EXISTING' &&
                            (!cust.avgReorderCycleDays || cust.avgReorderCycleDays === 0))) && (
                          <span className="bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded text-[9px] font-bold">
                            💼 ดีล
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Tier: <span className="font-semibold text-slate-600">{cust.tier}</span> | สินค้า: {cust.interestedProducts}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-medium text-slate-700">{cust.contactName}</td>
                    <td className="py-3.5 px-3 text-slate-600">
                      <div className="font-mono text-slate-800">{cust.phone}</div>
                      {cust.lineId ? (
                        <div className="text-[10px] text-emerald-600 font-mono flex items-center gap-0.5">
                          <span className="font-semibold">LINE:</span> {cust.lineId}
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-300">-</div>
                      )}
                    </td>
                    <td className="py-3.5 px-3">{renderStatusBadge(cust.status)}</td>
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-800">{cust.nextFollowUpDate}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{cust.nextFollowUpTime || '10:00'}</div>
                    </td>
                    <td className="py-3.5 px-3 font-medium text-slate-600">{cust.salesOwner}</td>
                    <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => onSelectCustomer(cust)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 p-1.5 rounded-lg transition-colors"
                          title="ดูข้อมูล Customer Profile"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => onEditCustomer(cust)}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-700 p-1.5 rounded-lg transition-colors"
                          title="แก้ไขข้อมูลลูกค้า"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => onOpenCreateActivityForCustomer(cust)}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 p-1.5 rounded-lg transition-colors"
                          title="+ บันทึกกิจกรรม"
                        >
                          <Plus size={15} />
                        </button>
                        <button
                          onClick={() => setDeletingCustomer(cust)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-1.5 rounded-lg transition-colors"
                          title="ลบข้อมูลลูกค้า"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer matching Diagram 1 */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 pt-2 gap-3">
        <div>
          แสดง{' '}
          <span className="font-bold text-slate-800">
            {filteredCustomers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} -{' '}
            {Math.min(currentPage * itemsPerPage, filteredCustomers.length)}
          </span>{' '}
          จาก <span className="font-bold text-slate-800">{filteredCustomers.length.toLocaleString()}</span> รายการ
        </div>

        {/* Page Buttons */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-100 font-medium"
          >
            ‹
          </button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-7 h-7 rounded-lg font-bold text-xs transition-colors ${
                  currentPage === pageNum
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          {totalPages > 5 && <span className="px-1 text-slate-400">...</span>}
          {totalPages > 5 && (
            <button
              onClick={() => setCurrentPage(totalPages)}
              className={`w-8 h-7 rounded-lg font-bold text-xs transition-colors ${
                currentPage === totalPages
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {totalPages}
            </button>
          )}

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-100 font-medium"
          >
            ›
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <Trash2 size={22} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">ยืนยันการลบลูกค้า</h3>
                <p className="text-[11px] text-slate-500 font-mono">ID: {deletingCustomer.id}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div className="font-bold text-slate-800">{deletingCustomer.companyName}</div>
              <div className="text-slate-600">ผู้ติดต่อ: {deletingCustomer.contactName} | เบอร์โทร: {deletingCustomer.phone}</div>
              {deletingCustomer.lineId && (
                <div className="text-emerald-600 font-mono text-[11px]">LINE: {deletingCustomer.lineId}</div>
              )}
            </div>

            <p className="text-xs text-rose-600 leading-relaxed">
              ⚠️ การลบนี้จะนำลูกค้ารายนี้ออกจากฐานข้อมูลอย่างถาวร ยืนยันที่จะดำเนินการหรือไม่?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingCustomer(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deletingCustomer) {
                    onDeleteCustomer(deletingCustomer);
                    setDeletingCustomer(null);
                  }
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5"
              >
                <Trash2 size={14} /> ยืนยันลบลูกค้า
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
