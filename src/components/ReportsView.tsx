import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  PieChart as PieChartIcon,
  Printer,
  TrendingUp,
  Users
} from 'lucide-react';
import React, { useState } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Customer } from '../types';

interface ReportsViewProps {
  customers?: Customer[];
  onExportData?: (type: 'EXCEL' | 'PDF') => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ customers = [], onExportData = (_t: 'EXCEL' | 'PDF') => {} }) => {
  const [activeReportTab, setActiveReportTab] = useState<'SALES' | 'PIPELINE' | 'LOST' | 'REPEAT'>('SALES');

  // Lost Analysis Data
  const lostReasonsData = [
    { reason: 'ราคาแพงกว่าคู่แข่ง', count: 8, percentage: '44%', color: '#DC2626' },
    { reason: 'สเปคไม่ตรงความต้องการ', count: 4, percentage: '22%', color: '#EA580C' },
    { reason: 'ลูกค้าตัดงบประมาณ', count: 3, percentage: '17%', color: '#D97706' },
    { reason: 'เลือกผู้ขายรายเดิม', count: 3, percentage: '17%', color: '#475569' },
  ];

  // Sales Ranking Data (Calculated dynamically from Supabase customers)
  const salesPerformanceData = React.useMemo(() => {
    const map: Record<string, number> = {};
    customers.forEach((c) => {
      const owner = c.salesOwner || 'คุณสมชาย (Sales A)';
      map[owner] = (map[owner] || 0) + (c.totalPurchases || 0);
    });
    const entries = Object.entries(map).map(([name, wonVal]) => ({
      name,
      wonVal,
      target: Math.max(500000, Math.round(wonVal * 1.25)),
    }));
    return entries.length > 0
      ? entries
      : [
          { name: 'คุณสมชาย (Sales A)', wonVal: 0, target: 1000000 },
          { name: 'คุณนภา (Sales B)', wonVal: 0, target: 800000 },
        ];
  }, [customers]);

  // Top Customers
  const topCustomers = [...customers]
    .sort((a, b) => (b.totalPurchases || 0) - (a.totalPurchases || 0))
    .slice(0, 10);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 soft-shadow space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 size={20} className="text-blue-600" /> รายงานสรุปและวิเคราะห์ผล (CRM Reports & Analytics)
          </h2>
          <p className="text-xs text-slate-500">รายงานการขาย Conversion Rate สาเหตุการเสียดีล (Lost Analysis) และคาดการณ์การซื้อซ้ำ</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onExportData('EXCEL')}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs px-3.5 py-2 rounded-xl border border-emerald-200 flex items-center gap-1.5 transition-all"
          >
            <FileSpreadsheet size={15} /> Export Excel
          </button>
          <button
            onClick={() => onExportData('PDF')}
            className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs px-3.5 py-2 rounded-xl border border-rose-200 flex items-center gap-1.5 transition-all"
          >
            <FileText size={15} /> Export PDF
          </button>
        </div>
      </div>

      {/* Sub tabs */}
      <div className="flex space-x-2 border-b border-slate-200 text-xs font-bold">
        <button
          onClick={() => setActiveReportTab('SALES')}
          className={`pb-2.5 px-3 border-b-2 transition-all ${
            activeReportTab === 'SALES'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          ยอดขายตามพนักงาน
        </button>
        <button
          onClick={() => setActiveReportTab('LOST')}
          className={`pb-2.5 px-3 border-b-2 transition-all ${
            activeReportTab === 'LOST'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          วิเคราะห์เหตุผล Lost (Lost Analysis)
        </button>
        <button
          onClick={() => setActiveReportTab('REPEAT')}
          className={`pb-2.5 px-3 border-b-2 transition-all ${
            activeReportTab === 'REPEAT'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Top Customers & Repeat Forecast
        </button>
      </div>

      {/* Report Content */}
      {activeReportTab === 'SALES' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesPerformanceData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(val: any) => [`฿${Number(val).toLocaleString()} บาท`, 'ยอดขาย']} />
                <Legend />
                <Bar dataKey="wonVal" name="ยอดขายที่ทำได้ (WON)" fill="#16A34A" radius={[6, 6, 0, 0]} />
                <Bar dataKey="target" name="เป้าหมาย (Target)" fill="#CBD5E1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeReportTab === 'LOST' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={lostReasonsData} cx="50%" cy="50%" outerRadius={80} dataKey="count">
                  {lostReasonsData.map((e, i) => (
                    <Cell key={i} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-slate-800 text-sm mb-3">สรุปสถิติสาเหตุที่ลูกค้ายกเลิก/ไม่สนใจ (Lost Analysis)</h4>
            {lostReasonsData.map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-bold text-slate-800">{item.reason}</span>
                </div>
                <span className="font-extrabold text-slate-900">{item.count} ราย ({item.percentage})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeReportTab === 'REPEAT' && (
        <div className="space-y-4 animate-in fade-in">
          <h3 className="font-bold text-sm text-slate-800">10 อันดับลูกค้ายอดซื้อสูงสุด (Top 10 Customers)</h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200 text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-100 font-bold text-slate-600 border-b">
                  <th className="py-2.5 px-3">อันดับ</th>
                  <th className="py-2.5 px-3">บริษัท</th>
                  <th className="py-2.5 px-3">ผู้ติดต่อ</th>
                  <th className="py-2.5 px-3">Tier</th>
                  <th className="py-2.5 px-3">รอบซื้อซ้ำ</th>
                  <th className="py-2.5 px-3 text-right">ยอดซื้อสะสม (บาท)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topCustomers.map((cust, i) => (
                  <tr key={cust.id} className="hover:bg-blue-50/50">
                    <td className="py-2.5 px-3 font-bold text-blue-700">#{i + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{cust.companyName}</td>
                    <td className="py-2.5 px-3 text-slate-700">{cust.contactName}</td>
                    <td className="py-2.5 px-3 font-bold text-indigo-700">{cust.tier}</td>
                    <td className="py-2.5 px-3 text-slate-600">{cust.avgReorderCycleDays} วัน</td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-emerald-700">
                      ฿{(cust.totalPurchases || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
