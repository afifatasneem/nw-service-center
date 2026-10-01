import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { JobCard, JobStatus } from '../types';
import { formatISTDateTime, formatISTDateOnly } from '../lib/dateUtils';
import {
  X,
  Phone,
  MessageSquare,
  FileText,
  Boxes,
  IndianRupee,
  Send,
  Printer,
  Calendar,
  Clock,
  Wrench,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Share2,
  Download,
  Image,
  User,
  ShieldCheck,
} from 'lucide-react';

interface JobDetailModalProps {
  job: JobCard | null;
  onClose: () => void;
  onOpenQuotation: (job: JobCard) => void;
  onOpenDispatch: (job: JobCard) => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  onClose,
  onOpenQuotation,
  onOpenDispatch,
}) => {
  const { updateJobStatus, recordPayment, useSpareInJob, spareItems, technicians } = useData();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'details' | 'parts' | 'payments' | 'history'>('details');

  // Status Change State
  const [selectedStatus, setSelectedStatus] = useState<JobStatus>(job?.status || 'Received');
  const [statusNote, setStatusNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // WhatsApp Dialog State
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  // Spare parts deduction state
  const [selectedSpareId, setSelectedSpareId] = useState('');
  const [spareQty, setSpareQty] = useState(1);
  const [spareRate, setSpareRate] = useState<number | ''>(0);
  const [spareTech, setSpareTech] = useState(job?.technicianName || '');
  const [isAddingSpare, setIsAddingSpare] = useState(false);
  const [spareError, setSpareError] = useState<string | null>(null);

  // Payment Recording State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [payMode, setPayMode] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque'>('Cash');
  const [payReceivedBy, setPayReceivedBy] = useState(currentUser?.fullName || 'Owner');
  const [payNote, setPayNote] = useState('');
  const [isRecordingPay, setIsRecordingPay] = useState(false);

  if (!job) return null;

  const ALL_STATUSES: JobStatus[] = [
    'Received',
    'Under Repair',
    'Waiting for Parts',
    'Waiting for Customer Approval',
    'Repaired',
    'Ready for Collection',
    'Dispatched',
  ];

  // Prepare standard 4-line WhatsApp short message
  const initWhatsAppMessage = () => {
    const machine = `${job.machineBrand} ${job.machineModel}`;
    const amount = job.repairCharges > 0 ? `₹${job.repairCharges}` : 'Estimated soon';
    const delivery = job.expectedDeliveryDate || 'Will inform shortly';

    const defaultMsg = `Hi Sir, your machine update:\nMachine: ${machine}\nStatus: ${job.status}\nAmount: ${amount}\nExpected Delivery: ${delivery}`;
    setCustomMessage(defaultMsg);
    setShareFeedback(null);
    setShowWhatsAppModal(true);
  };

  // Status update handler
  const handleStatusChange = async (newStatus: JobStatus) => {
    if (newStatus === job.status) return;

    if (newStatus === 'Dispatched') {
      onOpenDispatch(job);
      return;
    }

    setIsUpdatingStatus(true);
    try {
      await updateJobStatus(job.id, newStatus, statusNote.trim() || undefined);
      setSelectedStatus(newStatus);
      setStatusNote('');
    } catch (e) {
      console.error('Failed to update status:', e);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // WhatsApp Choice 1: Message Only
  const handleSendWhatsAppTextOnly = () => {
    const cleanPhone = job.customerPhone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const encoded = encodeURIComponent(customMessage);
    const url = `https://wa.me/${phoneWithCountry}?text=${encoded}`;
    window.open(url, '_blank');
    setShowWhatsAppModal(false);
  };

  // WhatsApp Choice 2: Send Photo + Message
  const handleSendPhotoAndMessage = async () => {
    if (!job.photoUrl) {
      alert('No PCB / Part photo attached to this job card. Sending text only.');
      handleSendWhatsAppTextOnly();
      return;
    }

    setShareFeedback('Preparing photo...');

    try {
      // Convert base64 data to blob file
      const response = await fetch(job.photoUrl);
      const blob = await response.blob();
      const file = new File([blob], `${job.jobNumber}_repaired_pcb.jpg`, { type: 'image/jpeg' });

      // Check if Web Share API with files is supported (Android Chrome / Safari)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Job ${job.jobNumber} Update`,
          text: customMessage,
        });
        setShareFeedback('Shared successfully.');
        setShowWhatsAppModal(false);
        return;
      }
    } catch (err) {
      console.warn('Direct image share not available, using fallback:', err);
    }

    // Clear fallback: prompt download + open WhatsApp text
    setShareFeedback('Direct photo attach not supported by this browser. Downloading photo to your device & opening WhatsApp with text ready...');
    setTimeout(() => {
      // Download photo
      const a = document.createElement('a');
      a.href = job.photoUrl!;
      a.download = `${job.jobNumber}_machine_pcb.jpg`;
      a.click();

      // Open WhatsApp
      handleSendWhatsAppTextOnly();
    }, 1500);
  };

  // Spare parts deduction
  const handleAddSparePart = async (e: React.FormEvent) => {
    e.preventDefault();
    setSpareError(null);

    if (!selectedSpareId || spareQty <= 0) {
      setSpareError('Please select a spare item and quantity.');
      return;
    }

    setIsAddingSpare(true);
    try {
      const selected = spareItems.find(s => s.id === selectedSpareId);
      if (!selected) throw new Error('Item not found');

      const rate = Number(spareRate) || 0;
      await useSpareInJob(job.id, selectedSpareId, spareQty, rate, spareTech || 'Technician');

      // Reset form
      setSelectedSpareId('');
      setSpareQty(1);
      setSpareRate(0);
    } catch (err: unknown) {
      setSpareError(err instanceof Error ? err.message : 'Failed to deduct stock');
    } finally {
      setIsAddingSpare(false);
    }
  };

  // Payment Recording
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(payAmount);
    if (!amountNum || amountNum <= 0) return;

    setIsRecordingPay(true);
    try {
      await recordPayment(job.id, {
        amount: amountNum,
        paymentMode: payMode,
        receivedBy: payReceivedBy.trim() || 'Owner',
        note: payNote.trim() || 'Payment received',
      });
      setShowPaymentModal(false);
      setPayAmount('');
      setPayNote('');
    } catch (e) {
      console.error('Payment record failed:', e);
    } finally {
      setIsRecordingPay(false);
    }
  };

  // Print Job Card
  const handlePrintJob = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl text-slate-100 my-auto max-h-[95vh] flex flex-col">
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-start justify-between gap-3 shrink-0 bg-slate-950/60 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono font-bold text-sm sm:text-base">
              {job.jobNumber}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white">
                  {job.customerName}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    job.status === 'Dispatched'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : job.status === 'Ready for Collection'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : job.status === 'Repaired'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {job.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <span>
                  {job.machineBrand} {job.machineModel} ({job.machineType})
                </span>
                <span>•</span>
                <span className="font-mono text-slate-300">Rec: {job.receivedDate}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* WhatsApp Quick Update Button */}
            <button
              onClick={initWhatsAppMessage}
              title="Send WhatsApp Update"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition active:scale-95"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp Update</span>
            </button>

            {/* Quotation Button */}
            <button
              onClick={() => onOpenQuotation(job)}
              title="Quotation"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition active:scale-95"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Quotation</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-4 bg-slate-950/30 shrink-0 overflow-x-auto text-xs font-semibold text-slate-400">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-2.5 px-3 border-b-2 transition whitespace-nowrap ${
              activeTab === 'details'
                ? 'border-amber-500 text-amber-400 font-bold'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            Machine & Repair Details
          </button>
          <button
            onClick={() => setActiveTab('parts')}
            className={`py-2.5 px-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'parts'
                ? 'border-amber-500 text-amber-400 font-bold'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Parts Used ({job.partsUsed?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-2.5 px-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'payments'
                ? 'border-amber-500 text-amber-400 font-bold'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            <IndianRupee className="w-3.5 h-3.5" />
            <span>Payments & Balance</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2.5 px-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-amber-500 text-amber-400 font-bold'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Status Timeline</span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: DETAILS */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Status Change Quick Bar */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5" />
                    Update Repair Workflow Status
                  </span>
                  {job.status === 'Dispatched' && (
                    <span className="text-xs text-purple-400 font-medium">
                      Dispatched on {job.dispatchDetails?.dispatchedDate}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {ALL_STATUSES.map(st => {
                    const isCurrent = job.status === st;
                    return (
                      <button
                        key={st}
                        disabled={isUpdatingStatus}
                        onClick={() => handleStatusChange(st)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 ${
                          isCurrent
                            ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Information Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer & Dates */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5 text-xs">
                  <h4 className="font-bold text-white uppercase tracking-wider text-[11px] pb-1 border-b border-slate-800">
                    Customer Information
                  </h4>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Customer Name:</span>
                    <span className="font-bold text-white">{job.customerName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Mobile Phone:</span>
                    <a
                      href={`tel:${job.customerPhone}`}
                      className="font-bold text-amber-400 flex items-center gap-1 hover:underline"
                    >
                      <Phone className="w-3 h-3" />
                      {job.customerPhone}
                    </a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Received Date & Time:</span>
                    <span className="font-mono text-slate-200">{job.receivedDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Expected Delivery:</span>
                    <span className="font-bold text-white">{job.expectedDeliveryDate || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Assigned Technician:</span>
                    <span className="font-semibold text-amber-400">{job.technicianName || 'Unassigned'}</span>
                  </div>
                </div>

                {/* Machine Specs & Fault */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5 text-xs">
                  <h4 className="font-bold text-white uppercase tracking-wider text-[11px] pb-1 border-b border-slate-800">
                    Machine Specifications
                  </h4>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Brand:</span>
                    <span className="font-bold text-amber-400">{job.machineBrand}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Model:</span>
                    <span className="font-semibold text-white">{job.machineModel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Machine Type:</span>
                    <span className="text-slate-300">{job.machineType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Serial Number:</span>
                    <span className="font-mono text-slate-300">{job.serialNumber || 'N/A'}</span>
                  </div>
                  <div className="pt-1">
                    <span className="text-slate-400 block mb-1">Customer Complaint / Fault:</span>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 font-medium leading-relaxed">
                      {job.customerComplaint || 'Inspection & Repair'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Photo & Accessories */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {job.photoUrl ? (
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
                    <h4 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Image className="w-3.5 h-3.5 text-amber-400" />
                      PCB / Part Photo
                    </h4>
                    <div className="relative group">
                      <img
                        src={job.photoUrl}
                        alt="PCB"
                        className="w-full h-44 object-cover rounded-xl border border-slate-800"
                      />
                      <a
                        href={job.photoUrl}
                        download={`${job.jobNumber}_pcb.jpg`}
                        className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-slate-900/90 text-amber-400 hover:text-white text-xs font-semibold flex items-center gap-1 shadow"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-center items-center text-center text-xs text-slate-500 py-6">
                    <Image className="w-8 h-8 text-slate-600 mb-1" />
                    <span>No PCB photo attached.</span>
                  </div>
                )}

                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
                  <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
                    Internal Notes & Accessories
                  </h4>
                  <p className="text-slate-300 leading-relaxed">
                    {job.notes || 'No accessories or specific notes recorded.'}
                  </p>

                  {job.dispatchDetails && (
                    <div className="mt-3 pt-3 border-t border-slate-800 space-y-1">
                      <span className="font-bold text-purple-400 block text-[11px]">
                        Dispatch Record:
                      </span>
                      <p className="text-slate-400">
                        Dispatched By: <strong>{job.dispatchDetails.dispatchedBy}</strong> via{' '}
                        <strong>{job.dispatchDetails.deliveryMethod}</strong>
                      </p>
                      {job.dispatchDetails.notes && (
                        <p className="text-slate-400">Notes: {job.dispatchDetails.notes}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrintJob}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Job Card
                  </button>

                  <button
                    onClick={() => onOpenQuotation(job)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 text-xs font-bold transition"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    View / Edit Quotation
                  </button>
                </div>

                {job.status !== 'Dispatched' && (
                  <button
                    onClick={() => onOpenDispatch(job)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/20 transition active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                    Dispatch Machine
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SPARE PARTS USED */}
          {activeTab === 'parts' && (
            <div className="space-y-5">
              {/* Form to add spare part to job */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  Add Spare Part to This Job (Auto Deducts Stock)
                </h4>

                {spareError && (
                  <div className="p-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs">
                    {spareError}
                  </div>
                )}

                <form onSubmit={handleAddSparePart} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-medium text-slate-300">
                      Select Spare Item
                    </label>
                    <select
                      value={selectedSpareId}
                      onChange={e => {
                        setSelectedSpareId(e.target.value);
                      }}
                      className="mt-1 block w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      <option value="">-- Choose Spare Item --</option>
                      {spareItems.map(item => (
                        <option
                          key={item.id}
                          value={item.id}
                          disabled={item.currentStock <= 0}
                        >
                          {item.name} ({item.category}) — {item.currentStock} in stock
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-300">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={spareQty}
                      onChange={e => setSpareQty(Math.max(1, Number(e.target.value)))}
                      className="mt-1 block w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-300">Rate / Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={spareRate}
                      onChange={e => setSpareRate(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0"
                      className="mt-1 block w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={isAddingSpare || !selectedSpareId}
                      className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 font-bold text-slate-950 text-xs rounded-xl shadow transition disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4 text-slate-950" />
                      <span>{isAddingSpare ? 'Deducting Stock...' : 'Deduct & Add Part'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Parts Used Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Parts Replaced on Machine
                </h4>

                {(!job.partsUsed || job.partsUsed.length === 0) ? (
                  <p className="text-xs text-slate-500 italic py-4 text-center">
                    No spare parts recorded for this machine yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-[11px] text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">Item Name</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3 text-center">Qty</th>
                          <th className="py-2.5 px-3 text-right">Rate</th>
                          <th className="py-2.5 px-3 text-right">Amount</th>
                          <th className="py-2.5 px-3">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {job.partsUsed.map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 font-semibold text-white">{p.itemName}</td>
                            <td className="py-2.5 px-3 text-slate-400">{p.categoryName || 'General'}</td>
                            <td className="py-2.5 px-3 text-center font-bold text-amber-400">
                              {p.quantity}
                            </td>
                            <td className="py-2.5 px-3 text-right">₹{p.rate}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-white">
                              ₹{p.amount.toLocaleString('en-IN')}
                            </td>
                            <td className="py-2.5 px-3 text-slate-400 font-mono text-[10px]">
                              {p.date}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PAYMENTS & BALANCE */}
          {activeTab === 'payments' && (
            <div className="space-y-5">
              {/* Payment Summary Box */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] text-slate-400 font-medium">Total Charges</span>
                  <div className="text-lg font-black text-white mt-1">
                    ₹{job.repairCharges.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] text-slate-400 font-medium">Advance Paid</span>
                  <div className="text-lg font-bold text-cyan-400 mt-1">
                    ₹{(job.advance || 0).toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] text-slate-400 font-medium">Remaining Balance</span>
                  <div
                    className={`text-lg font-black mt-1 ${
                      job.balance > 0 ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    ₹{job.balance.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] text-slate-400 font-medium">Payment Status</span>
                  <div className="mt-1">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        job.balance <= 0
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {job.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Record Payment Button */}
              {job.balance > 0 && (
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setPayAmount(job.balance);
                      setShowPaymentModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
                  >
                    <IndianRupee className="w-4 h-4" />
                    Record Payment Received
                  </button>
                </div>
              )}

              {/* Payment History Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Payment Transactions
                </h4>

                {(!job.payments || job.payments.length === 0) ? (
                  <p className="text-xs text-slate-500 italic py-4 text-center">
                    No payment transactions recorded yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-[11px] text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">Date & Time</th>
                          <th className="py-2.5 px-3">Mode</th>
                          <th className="py-2.5 px-3">Received By</th>
                          <th className="py-2.5 px-3">Notes</th>
                          <th className="py-2.5 px-3 text-right">Amount Paid</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {job.payments.map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400">
                              {p.date}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-semibold text-[10px]">
                                {p.paymentMode}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-white">{p.receivedBy}</td>
                            <td className="py-2.5 px-3 text-slate-400">{p.note || '-'}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                              ₹{p.amount.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: STATUS HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Permanent Audit Timeline
              </h4>

              <div className="space-y-3 pl-2 border-l-2 border-slate-800">
                {(job.statusHistory || []).map((entry, idx) => (
                  <div key={idx} className="relative pl-4 space-y-1">
                    <span className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-amber-500 ring-4 ring-slate-900" />
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{entry.status}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {entry.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{entry.note || 'Status updated'}</p>
                    <p className="text-[10px] text-slate-500">By: {entry.changedBy}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* WHATSAPP MACHINE UPDATE MODAL (Strict 4-Line Format + 2 Choices) */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                Short WhatsApp Machine Update
              </h3>
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <p className="text-slate-400">
                To: <strong className="text-white">{job.customerName}</strong> (+91 {job.customerPhone})
              </p>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Message (Max 4 lines • Editable before sending):
                </label>
                <textarea
                  rows={4}
                  value={customMessage}
                  onChange={e => setCustomMessage(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed"
                />
              </div>

              {job.photoUrl && (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/80 border border-slate-700">
                  <img
                    src={job.photoUrl}
                    alt="PCB Attachment"
                    className="w-12 h-12 object-cover rounded-lg border border-slate-600"
                  />
                  <div className="text-[11px] text-slate-300">
                    <p className="font-semibold text-white">PCB Photo Attached</p>
                    <p className="text-slate-400">Available to share with message</p>
                  </div>
                </div>
              )}

              {shareFeedback && (
                <div className="p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px]">
                  {shareFeedback}
                </div>
              )}

              {/* Two Mandatory Choices */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {job.photoUrl && (
                  <button
                    onClick={handleSendPhotoAndMessage}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow hover:from-emerald-500 hover:to-teal-500 active:scale-95 transition"
                  >
                    <Image className="w-4 h-4" />
                    <span>Send Photo + Message</span>
                  </button>
                )}

                <button
                  onClick={handleSendWhatsAppTextOnly}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow active:scale-95 transition"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Message Only</span>
                </button>
              </div>

              <p className="text-[10px] text-slate-500 text-center pt-1">
                Does not send automatically. Opens WhatsApp with text ready.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <IndianRupee className="w-4 h-4" />
                Record Payment
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-300">
                  Payment Amount (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300">
                  Payment Mode
                </label>
                <select
                  value={payMode}
                  onChange={e => setPayMode(e.target.value as any)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300">
                  Received By
                </label>
                <input
                  type="text"
                  value={payReceivedBy}
                  onChange={e => setPayReceivedBy(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300">Note / Ref</label>
                <input
                  type="text"
                  value={payNote}
                  onChange={e => setPayNote(e.target.value)}
                  placeholder="e.g. Full settlement, UPI Txn #9948"
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isRecordingPay || !payAmount}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-xs shadow transition active:scale-98 disabled:opacity-50"
                >
                  {isRecordingPay ? 'Recording Payment...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
