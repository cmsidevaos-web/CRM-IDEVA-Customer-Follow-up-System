import { Download, FileSpreadsheet, FileText, X } from 'lucide-react';
import React from 'react';

interface ExportModalProps {
  isOpen: boolean;
  type: 'EXCEL' | 'PDF';
  onClose: () => void;
  onConfirm: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  type,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm p-6 text-center space-y-4 animate-in zoom-in-95">
        <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center bg-blue-50 text-blue-600 font-bold">
          {type === 'EXCEL' ? <FileSpreadsheet size={24} className="text-emerald-600" /> : <FileText size={24} className="text-rose-600" />}
        </div>

        <div>
          <h3 className="font-bold text-slate-800 text-base">
            ส่งออกรายงาน ({type === 'EXCEL' ? 'Excel / CSV' : 'PDF Document'})
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            ดาวน์โหลดไฟล์รายงานสรุปข้อมูล CRM, ประวัติลูกค้า และตารางติดตามซื้อซ้ำ
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs"
          >
            <Download size={15} /> ดาวน์โหลดรายงาน
          </button>
        </div>
      </div>
    </div>
  );
};
