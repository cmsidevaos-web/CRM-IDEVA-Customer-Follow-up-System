import {
  Building2,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  DollarSign,
  FlaskConical,
  Package,
  Phone,
  Search,
  ShoppingBag,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Customer, OrderType } from '../types';

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
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Order Type: 'BRAND_PRODUCTION' (สั่งผลิตแบรนด์) vs 'TESTER' (ขายเทสเตอร์)
  const [orderType, setOrderType] = useState<OrderType>('BRAND_PRODUCTION');

  const [productName, setProductName] = useState('ครีมกันแดด SPF50+');
  const [quantity, setQuantity] = useState(300);
  const [unitPrice, setUnitPrice] = useState(190);
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState(
    new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [reorderCycleDays, setReorderCycleDays] = useState(60);

  // For Tester: Follow-up after trial
  const [testerFollowUpDays, setTesterFollowUpDays] = useState(7);
  const [customTesterFollowUpDate, setCustomTesterFollowUpDate] = useState('');

  // Auto adjust default product and quantity when switching order type
  const handleOrderTypeChange = (type: OrderType) => {
    setOrderType(type);
    if (type === 'TESTER') {
      if (productName === 'ครีมกันแดด SPF50+' && quantity === 300) {
        setProductName('ชุดเทสเตอร์ ครีมกันแดด SPF50+ (30ml x 3 ชิ้น)');
        setQuantity(1);
        setUnitPrice(500);
      }
    } else {
      if (productName.includes('เทสเตอร์')) {
        setProductName('ครีมกันแดด SPF50+ (ผลิตล็อตจริง 300 ชิ้น)');
        setQuantity(300);
        setUnitPrice(190);
      }
    }
  };

  // Initialize or reset when modal opens or selectedCustomer changes
  useEffect(() => {
    if (isOpen) {
      if (selectedCustomer) {
        setSelectedCustomerId(selectedCustomer.id);
        setSearchQuery(`${selectedCustomer.companyName} (${selectedCustomer.id})`);
      } else if (customers.length > 0) {
        setSelectedCustomerId(customers[0].id);
        setSearchQuery(`${customers[0].companyName} (${customers[0].id})`);
      } else {
        setSelectedCustomerId('');
        setSearchQuery('');
      }
      setIsDropdownOpen(false);
    }
  }, [isOpen, selectedCustomer, customers]);

  // Handle click outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered customer list based on query
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase().trim();
    return customers.filter(
      (c) =>
        (c.id && c.id.toLowerCase().includes(q)) ||
        (c.companyName && c.companyName.toLowerCase().includes(q)) ||
        (c.contactName && c.contactName.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.lineId && c.lineId.toLowerCase().includes(q)) ||
        (c.salesOwner && c.salesOwner.toLowerCase().includes(q))
    );
  }, [customers, searchQuery]);

  if (!isOpen) return null;

  const currentCust =
    customers.find((c) => c.id === selectedCustomerId) ||
    selectedCustomer ||
    (filteredCustomers.length > 0 ? filteredCustomers[0] : null);

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    setSearchQuery(`${customer.companyName} (${customer.id})`);
    setIsDropdownOpen(false);
  };

  const handleClearCustomer = () => {
    setSelectedCustomerId('');
    setSearchQuery('');
    setIsDropdownOpen(true);
  };

  const totalAmount = quantity * unitPrice;

  // Formula calculation for next reorder (Brand Production)
  const delDateObj = new Date(deliveryDate || new Date().toISOString().split('T')[0]);
  const nextReorderDateObj = new Date(delDateObj);
  nextReorderDateObj.setDate(nextReorderDateObj.getDate() + Number(reorderCycleDays));
  const nextReorderDate = nextReorderDateObj.toISOString().split('T')[0];

  const followUpStartObj = new Date(nextReorderDateObj);
  followUpStartObj.setDate(followUpStartObj.getDate() - 15);
  const followUpStartDate = followUpStartObj.toISOString().split('T')[0];

  // Tester follow-up date calculation
  const calculatedTesterDateObj = new Date(delDateObj);
  calculatedTesterDateObj.setDate(calculatedTesterDateObj.getDate() + Number(testerFollowUpDays));
  const defaultTesterFollowUpDate = calculatedTesterDateObj.toISOString().split('T')[0];
  const finalTesterFollowUpDate = customTesterFollowUpDate || defaultTesterFollowUpDate;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCust) {
      alert('กรุณาเลือกลูกค้าก่อนสร้าง Order');
      return;
    }

    const isTester = orderType === 'TESTER';

    onSubmit({
      customerId: currentCust.id,
      customerName: currentCust.companyName,
      orderType,
      testerFollowUpDate: isTester ? finalTesterFollowUpDate : undefined,
      productName,
      quantity: Number(quantity),
      unitPrice: Number(unitPrice),
      totalAmount,
      orderDate,
      deliveryDate,
      reorderCycleDays: isTester ? 0 : Number(reorderCycleDays),
      nextReorderDate: isTester ? '' : nextReorderDate,
      followUpStartDate: isTester ? finalTesterFollowUpDate : followUpStartDate,
      status: 'COMPLETED',
      repeatStatus: isTester ? 'UPCOMING' : 'UPCOMING',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto animate-in zoom-in-95 flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-20">
          <div className="flex items-center space-x-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                orderType === 'TESTER'
                  ? 'bg-purple-600/10 text-purple-600'
                  : 'bg-emerald-600/10 text-emerald-600'
              }`}
            >
              {orderType === 'TESTER' ? <FlaskConical size={20} /> : <ShoppingBag size={20} />}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base leading-tight">
                + สร้าง Order ใหม่ (WON)
              </h3>
              <p className="text-[11px] text-slate-500">
                {orderType === 'TESTER'
                  ? '🧪 ขายเทสเตอร์ - ติดตามผลหลังทดลองใช้เพื่อกลับมาสร้างแบรนด์'
                  : '🏷️ งานสั่งผลิตแบรนด์ - คำนวณรอบซื้อซ้ำและแจ้งเตือน Reorder'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
          {/* Order Type Selection: 2 Models */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              เลือกรูปแบบการขาย (Sale Model) *
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleOrderTypeChange('BRAND_PRODUCTION')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  orderType === 'BRAND_PRODUCTION'
                    ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20 text-emerald-950'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <Package
                      size={15}
                      className={
                        orderType === 'BRAND_PRODUCTION' ? 'text-emerald-600' : 'text-slate-400'
                      }
                    />
                    สั่งผลิตสร้างแบรนด์
                  </span>
                  {orderType === 'BRAND_PRODUCTION' && (
                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                      ✓
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 leading-snug">
                  งานผลิตล็อตจริง มีรอบซื้อซ้ำ (Reorder Cycle) 60-90 วัน
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleOrderTypeChange('TESTER')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  orderType === 'TESTER'
                    ? 'border-purple-500 bg-purple-50/80 ring-2 ring-purple-500/20 text-purple-950'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <FlaskConical
                      size={15}
                      className={orderType === 'TESTER' ? 'text-purple-600' : 'text-slate-400'}
                    />
                    ขายเทสเตอร์ (Tester)
                  </span>
                  {orderType === 'TESTER' && (
                    <span className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">
                      ✓
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 leading-snug">
                  ขนาดทดลองใช้ ติดตามผลหลังลองใช้เพื่อชวนมาสั่งผลิตแบรนด์
                </p>
              </button>
            </div>
          </div>

          {/* Customer Search & Filter Selection Box */}
          <div className="relative" ref={dropdownRef}>
            <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>เลือกลูกค้า (ค้นหารหัสหรือชื่อลูกค้า) *</span>
              {currentCust && (
                <span className="text-[11px] font-normal text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-mono">
                  รหัส: {currentCust.id}
                </span>
              )}
            </label>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search size={15} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                  if (
                    selectedCustomerId &&
                    e.target.value !== `${currentCust?.companyName} (${currentCust?.id})`
                  ) {
                    setSelectedCustomerId('');
                  }
                }}
                placeholder="พิมพ์ชื่อบริษัท, ชื่อผู้ติดต่อ, เบอร์โทร หรือรหัสลูกค้า..."
                className="w-full pl-9 pr-16 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal transition-all"
                required
              />
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center space-x-1">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearCustomer}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
                    title="ล้างการค้นหา"
                  >
                    <X size={14} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
                >
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${
                      isDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Auto-suggest Filter Dropdown List */}
            {isDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-xl max-h-52 overflow-y-auto z-50 divide-y divide-slate-100 animate-in fade-in">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((c) => {
                    const isSelected = c.id === selectedCustomerId;
                    return (
                      <div
                        key={c.id}
                        onClick={() => handleSelectCustomer(c)}
                        className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-50 text-blue-950 font-semibold'
                            : 'hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="flex items-center space-x-1.5 mb-0.5">
                            <span className="font-bold text-xs truncate flex items-center gap-1">
                              <Building2 size={13} className="text-slate-400 flex-shrink-0" />
                              {c.companyName}
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                              {c.id}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500 font-normal">
                            {c.contactName && (
                              <span className="flex items-center gap-1">
                                <User size={11} className="text-slate-400" />
                                {c.contactName}
                              </span>
                            )}
                            {c.phone && (
                              <span className="flex items-center gap-1">
                                <Phone size={11} className="text-slate-400" />
                                {c.phone}
                              </span>
                            )}
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                            <Check size={12} />
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-slate-400">
                    <p className="text-xs">ไม่พบข้อมูลลูกค้าที่ตรงกับ "{searchQuery}"</p>
                  </div>
                )}
              </div>
            )}

            {/* Selected Customer Preview Card */}
            {currentCust && (
              <div className="mt-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-[11px]">
                <div className="flex items-center space-x-2 truncate">
                  <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                  <span className="font-bold text-slate-800 truncate">
                    {currentCust.companyName}
                  </span>
                  <span className="text-slate-500">
                    ({currentCust.contactName || 'ไม่มีชื่อผู้ติดต่อ'})
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded">
                    {currentCust.salesOwner || 'Sales'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Product Name */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">สินค้าที่สั่งซื้อ *</label>
            <input
              type="text"
              required
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder={
                orderType === 'TESTER'
                  ? 'เช่น ชุดเทสเตอร์ ครีมกันแดด SPF50+ (30ml x 3 ชิ้น)...'
                  : 'เช่น ครีมกันแดด SPF50+ ล็อต 300 ชิ้น...'
              }
              className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Quantity & Unit Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                จำนวน ({orderType === 'TESTER' ? 'ชุด/ชิ้น' : 'ชิ้น'})
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">ราคาต่อหน่วย (บาท)</label>
              <input
                type="number"
                min="0"
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-semibold"
              />
            </div>
          </div>

          {/* Total Amount Summary Box */}
          <div
            className={`p-3 rounded-xl border flex justify-between items-center font-bold ${
              orderType === 'TESTER'
                ? 'bg-purple-50 border-purple-200 text-purple-950'
                : 'bg-emerald-50 border-emerald-200 text-emerald-950'
            }`}
          >
            <span className="flex items-center gap-1.5 text-xs">
              <DollarSign size={16} /> ยอดรวมทั้งสิ้น:
            </span>
            <span
              className={`text-base font-mono ${
                orderType === 'TESTER' ? 'text-purple-700' : 'text-emerald-700'
              }`}
            >
              ฿{totalAmount.toLocaleString()} บาท
            </span>
          </div>

          {/* Order Date & Delivery Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar size={13} className="text-slate-500" /> วันที่สั่งซื้อ (Order Date)
              </label>
              <input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar size={13} className="text-slate-500" /> วันที่ส่งมอบ (Delivery)
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>

          {/* DYNAMIC SECTION: Brand Production (Reorder Cycle) vs Tester (Trial Follow-up) */}
          {orderType === 'BRAND_PRODUCTION' ? (
            <div className="space-y-3 bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-200/80">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock size={14} className="text-emerald-600" /> รอบซื้อซ้ำ (Reorder Cycle - วัน)
                </label>
                <div className="flex gap-1">
                  {[30, 45, 60, 90].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setReorderCycleDays(days)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors ${
                        reorderCycleDays === days
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {days} วัน
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="number"
                min="1"
                value={reorderCycleDays}
                onChange={(e) => setReorderCycleDays(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 font-semibold"
              />

              <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200/60 space-y-1 text-[11px] text-slate-600">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-700">วันคาดว่าจะซื้อซ้ำอัตโนมัติ:</span>
                  <span className="font-bold text-emerald-700 font-mono">{nextReorderDate}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-700">เริ่มระบบแจ้งเตือน Follow-up:</span>
                  <span className="font-bold text-amber-700 font-mono">{followUpStartDate}</span>
                </div>
              </div>
            </div>
          ) : (
            /* TESTER FOLLOW-UP SECTION */
            <div className="space-y-3 bg-purple-50/70 p-3.5 rounded-2xl border border-purple-200">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-purple-600" /> นัดติดตามผลหลังทดลองใช้ (Tester Follow-up)
                </label>
                <div className="flex gap-1">
                  {[5, 7, 10, 14].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => {
                        setTesterFollowUpDays(days);
                        setCustomTesterFollowUpDate('');
                      }}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors ${
                        testerFollowUpDays === days && !customTesterFollowUpDate
                          ? 'bg-purple-600 text-white'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      +{days} วัน
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">
                  วันที่นัดติดตามผลทดลองใช้ (เพื่อให้ลูกค้ากลับมาสร้างแบรนด์):
                </label>
                <input
                  type="date"
                  value={finalTesterFollowUpDate}
                  onChange={(e) => setCustomTesterFollowUpDate(e.target.value)}
                  className="w-full p-2 border border-purple-300 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 font-bold text-purple-900"
                />
              </div>

              <div className="bg-white/90 p-2.5 rounded-xl border border-purple-200 text-[11px] text-purple-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0 animate-pulse" />
                <span>
                  <strong>การขายเทสเตอร์:</strong> ระบบจะสร้างงานแจ้งเตือนเซลล์ในวันที่{' '}
                  <span className="font-bold underline">{finalTesterFollowUpDate}</span>{' '}
                  เพื่อสอบถามความพึงพอใจและชวนสั่งผลิตแบรนด์จริง (ไม่นับรอบซื้อซ้ำ)
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 ${
                orderType === 'TESTER'
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {orderType === 'TESTER' ? <FlaskConical size={16} /> : <ShoppingBag size={16} />}
              {orderType === 'TESTER'
                ? 'สร้าง Order เทสเตอร์ (ตั้งวันติดตามผล)'
                : 'สร้าง Order แบรนด์ (เริ่มรอบซื้อซ้ำ)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
