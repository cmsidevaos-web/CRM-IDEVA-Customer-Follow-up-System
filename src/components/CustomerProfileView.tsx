import {
  ArrowLeft,
  Award,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Edit,
  Eye,
  FileCheck,
  FileText,
  Globe,
  Mail,
  MapPin,
  MessageSquare,
  Paperclip,
  Phone,
  Pin,
  Plus,
  Repeat,
  Send,
  ShoppingBag,
  Tag,
  Trash2,
  Upload,
  UserCheck,
  X
} from 'lucide-react';
import React, { useRef, useState } from 'react';
import {
  Activity,
  Customer,
  CustomerDocument,
  CustomerStatus,
  InternalNote,
  Order,
  ViewTab
} from '../types';

interface CustomerProfileViewProps {
  customer: Customer;
  activities: Activity[];
  orders: Order[];
  documents: CustomerDocument[];
  notes: InternalNote[];
  onBack: () => void;
  onOpenCreateActivity: () => void;
  onOpenCreateOrder: () => void;
  onUpdateCustomerStatus: (newStatus: CustomerStatus) => void;
  onAddNote: (content: string, isPinned: boolean) => void;
  onEditCustomer?: (customer: Customer) => void;
  onDeleteCustomer?: () => void;
  onAddDocument?: (docData: { name: string; type: 'QUOTATION' | 'PROPOSAL' | 'INVOICE' | 'CONTRACT' | 'OTHER'; fileSize: string; fileUrl: string }) => Promise<void> | void;
  onDeleteDocument?: (docId: string) => Promise<void> | void;
}

export const CustomerProfileView: React.FC<CustomerProfileViewProps> = ({
  customer,
  activities,
  orders,
  documents,
  notes,
  onBack,
  onOpenCreateActivity,
  onOpenCreateOrder,
  onUpdateCustomerStatus,
  onAddNote,
  onEditCustomer,
  onDeleteCustomer,
  onAddDocument,
  onDeleteDocument,
}) => {
  const [newNoteText, setNewNoteText] = useState('');
  const [isNotePinned, setIsNotePinned] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Document Upload States
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [selectedDocType, setSelectedDocType] = useState<'QUOTATION' | 'PROPOSAL' | 'INVOICE' | 'CONTRACT' | 'OTHER'>('QUOTATION');
  const [previewDoc, setPreviewDoc] = useState<CustomerDocument | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await processAndUploadFile(files[0]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processAndUploadFile(e.dataTransfer.files[0]);
    }
  };

  const processAndUploadFile = async (file: File) => {
    try {
      setIsUploadingDoc(true);
      setUploadProgress('กำลังอ่านไฟล์...');

      const sizeMB = file.size / (1024 * 1024);
      const fileSizeStr = sizeMB >= 1 ? `${sizeMB.toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB`;

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });

      let docType: 'QUOTATION' | 'PROPOSAL' | 'INVOICE' | 'CONTRACT' | 'OTHER' = selectedDocType;
      const lowerName = file.name.toLowerCase();
      if (lowerName.includes('quotation') || lowerName.includes('ใบเสนอราคา')) docType = 'QUOTATION';
      else if (lowerName.includes('invoice') || lowerName.includes('ใบแจ้งหนี้') || lowerName.includes('ใบเสร็จ')) docType = 'INVOICE';
      else if (lowerName.includes('contract') || lowerName.includes('สัญญา')) docType = 'CONTRACT';
      else if (lowerName.includes('proposal') || lowerName.includes('ข้อเสนอ')) docType = 'PROPOSAL';

      setUploadProgress('กำลังบันทึกลง Supabase...');

      if (onAddDocument) {
        await onAddDocument({
          name: file.name,
          type: docType,
          fileSize: fileSizeStr,
          fileUrl: dataUrl,
        });
      }
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาดในการอัปโหลดเอกสาร: ${err?.message || 'ไม่สามารถอัปโหลดได้'}`);
    } finally {
      setIsUploadingDoc(false);
      setUploadProgress('');
    }
  };

  const handleDownloadDoc = (doc: CustomerDocument) => {
    if (!doc.fileUrl) {
      alert('ไม่พบที่อยู่ไฟล์เอกสาร');
      return;
    }
    const a = document.createElement('a');
    a.href = doc.fileUrl;
    a.download = doc.name;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getDocTypeBadge = (type: string) => {
    switch (type) {
      case 'QUOTATION':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">ใบเสนอราคา</span>;
      case 'PROPOSAL':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">ข้อเสนอ</span>;
      case 'INVOICE':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">ใบแจ้งหนี้</span>;
      case 'CONTRACT':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">สัญญา</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">เอกสารทั่วไป</span>;
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status: CustomerStatus) => {
    switch (status) {
      case 'EXISTING':
        return <span className="bg-teal-100 text-teal-800 font-bold px-3 py-1 rounded-lg text-xs">ลูกค้าเก่า (Existing)</span>;
      case 'QUOTATION_SENT':
        return <span className="bg-purple-100 text-purple-800 font-bold px-3 py-1 rounded-lg text-xs">ส่งใบเสนอราคา (Quotation Sent)</span>;
      case 'NEGOTIATION':
        return <span className="bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-lg text-xs">เจรจาต่อรอง (Negotiation)</span>;
      case 'WON':
        return <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-lg text-xs">ปิดการขาย (Won)</span>;
      case 'LOST':
        return <span className="bg-rose-100 text-rose-800 font-bold px-3 py-1 rounded-lg text-xs">ไม่สนใจ / ยกเลิก (Lost)</span>;
      case 'OVERDUE':
        return <span className="bg-red-600 text-white font-bold px-3 py-1 rounded-lg text-xs">เกินกำหนด (Overdue)</span>;
      default:
        return <span className="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-lg text-xs">{status}</span>;
    }
  };

  const customerOrders = orders.filter((o) => o.customerId === customer.id);
  const latestOrder = customerOrders.length > 0 ? customerOrders[0] : null;
  const totalCustUnits = customerOrders.reduce((sum, o) => sum + Number(o.quantity || 0), 0);
  const totalCustRevenue = customerOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 soft-shadow flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors flex items-center gap-1 text-xs font-semibold"
          >
            <ArrowLeft size={18} /> กลับ
          </button>
          <div className="h-5 w-px bg-slate-200" />
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            Customer Profile
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              ID: {customer.id}
            </span>
          </h2>
        </div>

        {/* Quick Contact & Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {customer.phone && (
            <a
              href={`tel:${customer.phone}`}
              className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center transition-colors"
              title={`โทรหาลูกค้า: ${customer.phone}`}
            >
              <Phone size={18} />
            </a>
          )}
          {customer.lineId ? (
            <a
              href={`https://line.me/ti/p/~${customer.lineId}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 h-9 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 flex items-center justify-center gap-1 transition-colors shadow-2xs font-bold text-xs"
              title={`เปิด LINE Chat: ${customer.lineId}`}
            >
              LINE
            </a>
          ) : (
            <button
              disabled
              className="px-3 h-9 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center gap-1 font-bold text-xs cursor-not-allowed"
              title="ลูกค้าไม่ได้ระบุ LINE ID"
            >
              LINE
            </button>
          )}
          {customer.email ? (
            <a
              href={`mailto:${customer.email}`}
              className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors"
              title={`ส่งอีเมล: ${customer.email}`}
            >
              <Mail size={18} />
            </a>
          ) : null}
          <div className="h-5 w-px bg-slate-200" />
          {onEditCustomer && (
            <button
              onClick={() => onEditCustomer(customer)}
              className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
              title="แก้ไขข้อมูลลูกค้า"
            >
              <Edit size={14} /> แก้ไขลูกค้า
            </button>
          )}
          {onDeleteCustomer && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
              title="ลบข้อมูลลูกค้า"
            >
              <Trash2 size={14} /> ลบลูกค้า
            </button>
          )}
          <button
            onClick={onOpenCreateActivity}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-2xs"
          >
            <Plus size={15} /> + บันทึก Activity
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal for Profile */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <Trash2 size={22} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">ยืนยันการลบลูกค้า</h3>
                <p className="text-[11px] text-slate-500 font-mono">ID: {customer.id}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div className="font-bold text-slate-800">{customer.companyName}</div>
              <div className="text-slate-600">ผู้ติดต่อ: {customer.contactName} | เบอร์โทร: {customer.phone}</div>
              {customer.lineId && (
                <div className="text-emerald-600 font-mono text-[11px]">LINE: {customer.lineId}</div>
              )}
            </div>

            <p className="text-xs text-rose-600 leading-relaxed">
              ⚠️ การลบนี้จะนำลูกค้ารายนี้ออกจากฐานข้อมูลอย่างถาวร ยืนยันที่จะดำเนินการหรือไม่?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteCustomer) {
                    setShowDeleteConfirm(false);
                    onDeleteCustomer();
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

      {/* Main 3 Columns Layout matching Diagram 1 & 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUMN 1 (Left 3 cols): ข้อมูลลูกค้า */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 soft-shadow space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <UserCheck size={16} className="text-blue-600" /> ข้อมูลลูกค้า
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                customer.tier === 'PLATINUM' ? 'bg-indigo-100 text-indigo-800' :
                customer.tier === 'GOLD' ? 'bg-amber-100 text-amber-800' :
                customer.tier === 'SILVER' ? 'bg-slate-200 text-slate-800' : 'bg-slate-100 text-slate-600'
              }`}>
                Tier {customer.tier}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 text-[11px]">บริษัท</label>
                <div className="font-bold text-slate-900 text-sm">{customer.companyName}</div>
              </div>

              <div>
                <label className="text-slate-400 text-[11px]">ผู้ติดต่อ</label>
                <div className="font-semibold text-slate-800">{customer.contactName}</div>
              </div>

              <div>
                <label className="text-slate-400 text-[11px]">เบอร์โทร</label>
                <div className="font-semibold text-blue-700 font-mono">{customer.phone}</div>
              </div>

              <div>
                <label className="text-slate-400 text-[11px]">LINE ID</label>
                {customer.lineId ? (
                  <div className="font-semibold text-emerald-600 font-mono">{customer.lineId}</div>
                ) : (
                  <div className="text-slate-400 italic">ไม่ระบุ</div>
                )}
              </div>

              <div>
                <label className="text-slate-400 text-[11px]">Email</label>
                {customer.email ? (
                  <div className="text-slate-700 font-mono">{customer.email}</div>
                ) : (
                  <div className="text-slate-400 italic">ไม่ระบุ</div>
                )}
              </div>

              <div>
                <label className="text-slate-400 text-[11px]">สินค้าที่สนใจ</label>
                <div className="font-medium text-slate-800 bg-blue-50 p-2 rounded-lg text-blue-900 border border-blue-100">
                  {customer.interestedProducts}
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-[11px]">แหล่งที่มา</label>
                <div className="text-slate-700">{customer.source}</div>
              </div>

              <div>
                <label className="text-slate-400 text-[11px]">ผู้รับผิดชอบ</label>
                <div className="font-semibold text-slate-800">{customer.salesOwner}</div>
              </div>

              {customer.address && (
                <div>
                  <label className="text-slate-400 text-[11px]">ที่อยู่จัดส่ง / ที่อยู่ออกใบกำกับ</label>
                  <div className="text-slate-600 text-[11px] leading-relaxed flex items-start gap-1 mt-0.5">
                    <MapPin size={13} className="text-slate-400 flex-shrink-0 mt-0.5" />
                    {customer.address}
                  </div>
                </div>
              )}

              {customer.taxId && (
                <div>
                  <label className="text-slate-400 text-[11px]">เลขประจำตัวผู้เสียภาษี (Tax ID)</label>
                  <div className="font-mono text-slate-700">{customer.taxId}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COLUMN 2 (Middle 5 cols): สถานะปัจจุบัน & Timeline ประวัติการติดต่อ */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card: สถานะปัจจุบัน */}
          <div className="bg-white rounded-2xl border border-blue-200 p-5 soft-shadow bg-gradient-to-br from-blue-50/20 to-white">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <Clock size={16} className="text-blue-600" /> สถานะปัจจุบัน
              </h3>
              {getStatusBadge(customer.status)}
            </div>

            <div className="space-y-2 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <div className="flex items-start justify-between">
                <span className="text-slate-500 font-semibold">Next Action:</span>
                <span className="font-bold text-blue-900 text-right">{customer.nextAction}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Follow-up:</span>
                <span className="font-bold text-slate-800 font-mono">
                  {customer.nextFollowUpDate} {customer.nextFollowUpTime || '10:00'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">ผู้รับผิดชอบ:</span>
                <span className="font-medium text-slate-700">{customer.salesOwner}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                onClick={onOpenCreateActivity}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1 shadow-2xs"
              >
                <Plus size={14} /> บันทึก Activity
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className="bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs px-3 py-2 rounded-xl border border-slate-200 transition-colors"
                >
                  เปลี่ยนสถานะ ▼
                </button>

                {showStatusDropdown && (
                  <div className="absolute left-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-20 text-xs">
                    {(['NEW', 'EXISTING', 'CONTACTED', 'FOLLOW_UP', 'QUOTATION_SENT', 'NEGOTIATION', 'WON', 'LOST'] as CustomerStatus[]).map((st) => (
                      <button
                        key={st}
                        onClick={() => {
                          onUpdateCustomerStatus(st);
                          setShowStatusDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-700 font-medium transition-colors"
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card: ประวัติการติดต่อลูกค้า (Timeline) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 soft-shadow space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <Clock size={16} className="text-blue-600" /> ประวัติการติดต่อลูกค้า (Timeline)
              </h3>
              <span className="text-xs text-slate-400">{activities.length} กิจกรรม</span>
            </div>

            <div className="relative pl-4 border-l-2 border-blue-200 space-y-6 my-2">
              {activities.length === 0 ? (
                <p className="text-slate-400 text-xs italic py-2">ยังไม่มีประวัติกิจกรรม</p>
              ) : (
                activities.map((act) => (
                  <div key={act.id} className="relative group">
                    {/* Timeline Dot */}
                    <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white shadow-2xs" />

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-blue-700">{act.createdAt}</span>
                          {act.type === 'FACEBOOK' ? (
                            <span className="bg-blue-600 text-white font-bold px-2 py-0.2 rounded-full text-[10px]">Facebook</span>
                          ) : act.type === 'LINE' ? (
                            <span className="bg-emerald-500 text-white font-bold px-2 py-0.2 rounded-full text-[10px]">LINE</span>
                          ) : act.type === 'CALL' ? (
                            <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.2 rounded-full text-[10px]">Call</span>
                          ) : act.type === 'EMAIL' ? (
                            <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.2 rounded-full text-[10px]">Email</span>
                          ) : act.type === 'MEETING' ? (
                            <span className="bg-purple-100 text-purple-800 font-bold px-2 py-0.2 rounded-full text-[10px]">Meeting</span>
                          ) : null}
                        </div>
                        <span className="font-semibold text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded-md text-[10px]">
                          {act.salesOwner}
                        </span>
                      </div>

                      <div className="font-bold text-slate-800 text-sm">{act.summary}</div>
                      <p className="text-slate-600 leading-relaxed text-[11px]">{act.detail}</p>

                      {act.result && (
                        <div className="bg-white p-2 rounded-lg border border-slate-200 text-[11px] text-slate-700">
                          <span className="font-bold text-emerald-700">ผลการติดต่อ:</span> {act.result}
                        </div>
                      )}

                      {act.attachments && act.attachments.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/80 space-y-1">
                          {act.attachments.map((att) => (
                            <a
                              key={att.id}
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                alert(`ดาวน์โหลดไฟล์ ${att.name}`);
                              }}
                              className="inline-flex items-center gap-1.5 text-blue-600 hover:underline text-[11px] font-medium"
                            >
                              <Paperclip size={13} /> ไฟล์แนบ: {att.name}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* COLUMN 3 (Right 4 cols): Orders, Repeat Order Info, Docs, Internal Notes */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: ข้อมูลการซื้อ (Orders) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 soft-shadow space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                  <ShoppingBag size={16} className="text-blue-600" /> ข้อมูลการซื้อ (Orders)
                </h3>
                {customerOrders.length > 0 && (
                  <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded-full">
                    {customerOrders.length} ออเดอร์
                  </span>
                )}
              </div>
              <button
                onClick={onOpenCreateOrder}
                className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
              >
                + สร้าง Order
              </button>
            </div>

            {customerOrders.length > 0 ? (
              <div className="space-y-2.5">
                {/* Orders Total Summary */}
                <div className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200/80 flex items-center justify-between text-xs">
                  <span className="text-emerald-900 font-semibold">ยอดรวม ({totalCustUnits.toLocaleString()} ชิ้น):</span>
                  <span className="font-extrabold text-emerald-700 font-mono text-sm">
                    ฿{totalCustRevenue.toLocaleString()} บาท
                  </span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
                  {customerOrders.map((ord, idx) => (
                    <div key={ord.id || idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span className="font-mono text-blue-700 text-[11px]">{ord.id}</span>
                        <span className="text-slate-500 font-normal text-[11px]">{ord.orderDate}</span>
                      </div>
                      <div className="font-semibold text-slate-800 truncate">{ord.productName}</div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-slate-600">
                        <span className="font-bold text-slate-900 bg-slate-200/70 px-2 py-0.5 rounded text-[11px]">
                          {Number(ord.quantity || 1).toLocaleString()} ชิ้น
                        </span>
                        <span className="font-bold text-emerald-700 font-mono">
                          ฿{Number(ord.totalAmount || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-slate-400 text-xs italic py-2">ยังไม่มีประวัติคำสั่งซื้อ</p>
            )}
          </div>

          {/* Card 2: ข้อมูลการซื้อซ้ำ หรือ สถานะการดีล */}
          {customer.repeatStatus === 'NOT_APPLICABLE' ||
          (Number(customer.totalOrdersCount || 0) === 0 &&
            customer.status !== 'WON' &&
            customer.status !== 'EXISTING' &&
            (!customer.avgReorderCycleDays || customer.avgReorderCycleDays === 0)) ? (
            <div className="bg-white rounded-2xl border border-amber-200 p-5 soft-shadow bg-gradient-to-br from-amber-50/40 via-white to-slate-50/30 space-y-3">
              <div className="flex items-center justify-between border-b border-amber-100 pb-2.5">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                  <Briefcase size={16} className="text-amber-600" /> สถานะการดีล & การซื้อซ้ำ
                </h3>
                <span className="bg-amber-100 text-amber-900 border border-amber-200 font-bold px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1">
                  💼 อยู่ระหว่างการดีล (ยังไม่มีข้อมูลซื้อซ้ำ)
                </span>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
                  <span>สถานะการขายปัจจุบัน:</span>
                  <span className="bg-white px-2 py-0.5 rounded-md border border-amber-300 text-amber-800 text-[11px]">
                    {customer.status}
                  </span>
                </div>
                <p className="text-[11px] text-amber-800/90 leading-relaxed">
                  ลูกค้ารายนี้อยู่ระหว่างการเจรจาดีล/เสนอราคา ยังไม่มีคำสั่งซื้อผลิตล็อตแรก ระบบจึง<strong>ยังไม่เริ่มนับรอบซื้อซ้ำ</strong>
                </p>
              </div>

              <div className="space-y-2 text-xs pt-0.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">นัดติดตามครั้งถัดไป:</span>
                  <span className="font-bold text-slate-800">{customer.nextFollowUpDate} {customer.nextFollowUpTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">สิ่งที่ต้องทำ (Next Action):</span>
                  <span className="font-medium text-slate-800 text-right max-w-[65%] truncate" title={customer.nextAction}>
                    {customer.nextAction || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ยอดคำสั่งซื้อสะสม:</span>
                  <span className="font-bold text-slate-600">0 รายการ (฿0)</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={onOpenCreateOrder}
                  className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <Plus size={14} /> เปิดคำสั่งซื้อผลิตล็อตแรก (First Order)
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-amber-200 p-5 soft-shadow bg-gradient-to-br from-amber-50/30 to-white space-y-3">
              <div className="flex items-center justify-between border-b border-amber-100 pb-2.5">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                  <Repeat size={16} className="text-amber-600" /> ข้อมูลติดตามซื้อซ้ำ (Repeat Order)
                </h3>
                <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                  {customer.repeatStatus || 'UPCOMING'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">รอบซื้อเฉลี่ย:</span>
                  <span className="font-bold text-slate-800">{customer.avgReorderCycleDays || 0} วัน</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ล่าสุดส่งมอบ:</span>
                  <span className="font-medium text-slate-800">{customer.lastDeliveryDate || customer.lastOrderDate || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">คาดว่าจะซื้อซ้ำ:</span>
                  <span className="font-bold text-amber-700">{customer.nextReorderDate || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">เริ่มติดตาม (Follow-up Start):</span>
                  <span className="font-medium text-slate-800">{customer.followUpStartDate || '-'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Card 3: เอกสารที่เกี่ยวข้อง */}
          <div
            className={`bg-white rounded-2xl border ${dragOver ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200'} p-5 soft-shadow space-y-3 transition-all`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <FileText size={16} className="text-blue-600" /> เอกสารที่เกี่ยวข้อง ({documents.length})
              </h3>
              <div className="flex items-center gap-2">
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value as any)}
                  className="text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  title="ประเภทเอกสารที่จะอัปโหลด"
                >
                  <option value="QUOTATION">ใบเสนอราคา</option>
                  <option value="PROPOSAL">ข้อเสนอโครงการ</option>
                  <option value="INVOICE">ใบแจ้งหนี้</option>
                  <option value="CONTRACT">สัญญา</option>
                  <option value="OTHER">เอกสารทั่วไป</option>
                </select>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingDoc}
                  className="text-xs bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <Upload size={13} /> {isUploadingDoc ? 'กำลังอัปโหลด...' : 'อัปโหลดเอกสาร'}
                </button>
              </div>
            </div>

            {isUploadingDoc && (
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-xs text-blue-700 font-semibold animate-pulse">
                <Clock size={14} className="animate-spin text-blue-600" />
                <span>{uploadProgress || 'กำลังประมวลผลไฟล์...'}</span>
              </div>
            )}

            <div className="space-y-2 text-xs max-h-64 overflow-y-auto pr-1">
              {documents.length === 0 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-5 border-2 border-dashed border-slate-200 rounded-2xl text-center hover:border-blue-400 hover:bg-slate-50/80 transition-all cursor-pointer group"
                >
                  <Upload size={24} className="mx-auto text-slate-400 group-hover:text-blue-600 group-hover:scale-110 transition-all mb-1" />
                  <p className="text-slate-600 font-bold">ยังไม่มีเอกสารสำหรับลูกค้ารายนี้</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">คลิกที่นี่ หรือ ลากไฟล์มาวางเพื่ออัปโหลด (PDF, Image, Doc)</p>
                </div>
              ) : (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 hover:bg-blue-50/50 hover:border-blue-200 transition-all group"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                      <FileCheck size={18} className="text-blue-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-800 truncate max-w-[160px]" title={doc.name}>
                            {doc.name}
                          </span>
                          {getDocTypeBadge(doc.type)}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {doc.fileSize} • {doc.createdAt} {doc.uploadedBy ? `• โดย ${doc.uploadedBy}` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {doc.fileUrl && (
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-white transition-colors"
                          title="ดูตัวอย่างเอกสาร"
                        >
                          <Eye size={15} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDownloadDoc(doc)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-white transition-colors"
                        title="ดาวน์โหลดเอกสาร"
                      >
                        <Download size={15} />
                      </button>
                      {onDeleteDocument && (
                        <button
                          onClick={() => {
                            if (confirm(`ยืนยันการลบเอกสาร "${doc.name}"?`)) {
                              onDeleteDocument(doc.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
                          title="ลบเอกสาร"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Card 4: โน้ตภายใน (Internal Notes) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 soft-shadow space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <MessageSquare size={16} className="text-blue-600" /> โน้ตภายใน
              </h3>
            </div>

            {/* Note Input */}
            <div className="space-y-2">
              <textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="เขียนโน้ตเพิ่มเติมเกี่ยวกับลูกค้ารายนี้..."
                rows={2}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center space-x-1.5 text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNotePinned}
                    onChange={(e) => setIsNotePinned(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>ปักหมุดไว้ด้านบน</span>
                </label>
                <button
                  onClick={() => {
                    if (!newNoteText.trim()) return;
                    onAddNote(newNoteText, isNotePinned);
                    setNewNoteText('');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-2xs"
                >
                  บันทึกโน้ต
                </button>
              </div>
            </div>

            {/* Notes List */}
            <div className="space-y-2 pt-2">
              {notes.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 rounded-xl border text-xs relative ${
                    n.isPinned
                      ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  {n.isPinned && (
                    <span className="absolute top-2 right-2 text-amber-600">
                      <Pin size={13} />
                    </span>
                  )}
                  <p className="leading-relaxed">{n.content}</p>
                  <div className="mt-1.5 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>{n.author}</span>
                    <span>{n.createdAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <FileText className="text-blue-600 flex-shrink-0" size={18} />
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-800 text-sm truncate">{previewDoc.name}</h3>
                  <div className="text-[10px] text-slate-500">{previewDoc.fileSize} • {previewDoc.createdAt}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleDownloadDoc(previewDoc)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Download size={14} /> ดาวน์โหลด
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-auto bg-slate-100 flex items-center justify-center min-h-[300px]">
              {previewDoc.fileUrl?.startsWith('data:image/') ? (
                <img src={previewDoc.fileUrl} alt={previewDoc.name} className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-md" />
              ) : previewDoc.fileUrl?.startsWith('data:application/pdf') ? (
                <iframe src={previewDoc.fileUrl} title={previewDoc.name} className="w-full h-[65vh] rounded-lg border border-slate-200" />
              ) : (
                <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 max-w-md shadow-xs">
                  <FileText size={48} className="mx-auto text-blue-500 mb-3" />
                  <h4 className="font-bold text-slate-800 text-sm">{previewDoc.name}</h4>
                  <p className="text-slate-500 text-xs mt-1">ไฟล์ประเภทนี้ไม่สามารถแสดงพรีวิวในหน้าจอได้โดยตรง</p>
                  <button
                    onClick={() => handleDownloadDoc(previewDoc)}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-2"
                  >
                    <Download size={14} /> ดาวน์โหลดไฟล์มาเปิดในเครื่อง
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
