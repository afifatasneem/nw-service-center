import React, { useState } from 'react';
import { JobCard, QuotationDetails, QuotationItem } from '../types';
import { useData } from '../context/DataContext';
import { formatISTDateTime, formatISTDateOnly } from '../lib/dateUtils';
import {
  X,
  Printer,
  Share2,
  Edit3,
  CheckCircle,
  Plus,
  Trash2,
  FileText,
  Flame,
  Phone,
  MessageSquare,
} from 'lucide-react';

interface QuotationModalProps {
  job: JobCard | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QuotationModal: React.FC<QuotationModalProps> = ({ job, isOpen, onClose }) => {
  const { updateJobQuotation, businessSettings } = useData();

  const [isEditing, setIsEditing] = useState(false);
  const [items, setItems] = useState<QuotationItem[]>(() => {
    if (job?.quotation?.items && job.quotation.items.length > 0) {
      return job.quotation.items;
    }
    return [
      { id: 'item_1', description: 'IGBT & Diode Circuit Servicing', quantity: 1, rate: 800, amount: 800 },
      { id: 'item_2', description: 'Driver Card Resistor & Capacitor Replacement', quantity: 1, rate: 450, amount: 450 },
    ];
  });

  const [labourCharges, setLabourCharges] = useState<number>(job?.quotation?.labourCharges ?? 350);
  const [advance, setAdvance] = useState<number>(job?.quotation?.advance ?? job?.advance ?? 0);
  const [expectedDate, setExpectedDate] = useState<string>(
    job?.quotation?.expectedCompletionDate || job?.expectedCompletionDate || formatISTDateOnly(new Date(Date.now() + 86400000 * 2))
  );
  const [quotationNotes, setQuotationNotes] = useState<string>(
    job?.quotation?.notes || '1. Work carries 30 days testing warranty on repaired components.\n2. Payment terms: Advance/Balance on testing & delivery.'
  );

  if (!isOpen || !job) return null;

  // Compute item totals
  const partsTotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalAmount = partsTotal + Number(labourCharges);
  const balance = Math.max(0, totalAmount - Number(advance));

  // Item row editing
  const handleItemChange = (index: number, field: keyof QuotationItem, value: any) => {
    const updated = [...items];
    const target = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'rate') {
      target.amount = (Number(target.quantity) || 0) * (Number(target.rate) || 0);
    }
    updated[index] = target;
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: `item_${Date.now()}`,
        description: 'New Spare / Service Item',
        quantity: 1,
        rate: 200,
        amount: 200,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Save Quotation
  const handleSaveQuotation = async () => {
    const now = formatISTDateTime();
    const quotData: QuotationDetails = {
      items,
      labourCharges,
      totalAmount,
      advance,
      balance,
      expectedCompletionDate: expectedDate,
      notes: quotationNotes,
      createdAt: job.quotation?.createdAt || now,
      updatedAt: now,
    };

    await updateJobQuotation(job.id, quotData);
    setIsEditing(false);
  };

  // Share via WhatsApp
  const handleShareWhatsApp = () => {
    const cleanPhone = job.customerPhone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const itemsText = items.map((it, i) => `${i + 1}. ${it.description} (x${it.quantity}): ₹${it.amount}`).join('\n');
    const msg = `*NW SERVICE CENTER — Solapur*\n*REPAIR ESTIMATE / QUOTATION*\n\nJob No: *${job.jobNumber}*\nCustomer: ${job.customerName}\nMachine: ${job.machineBrand} ${job.machineModel}\nComplaint: ${job.customerComplaint}\n\n*Estimated Parts & Work:*\n${itemsText}\nLabour Charges: ₹${labourCharges}\n*Total Amount: ₹${totalAmount}*\nAdvance: ₹${advance}\n*Balance: ₹${balance}*\nExpected Completion: ${expectedDate}\n\nThank you,\nNW Service Center, Solapur\nPh: ${businessSettings.phone}`;

    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Print Quotation
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl text-slate-100 my-auto max-h-[95vh] flex flex-col">
        {/* Header Action Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/70 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">
              Quotation / Estimate — <span className="text-amber-400 font-mono">{job.jobNumber}</span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Quotation</span>
              </button>
            ) : (
              <button
                onClick={handleSaveQuotation}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            )}

            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow active:scale-95"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Share WhatsApp</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quotation Document Container (Printable) */}
        <div id="quotation-print-area" className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white text-slate-900 rounded-b-2xl">
          {/* Letterhead */}
          <div className="border-b-2 border-slate-900 pb-5 mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500 text-slate-950 font-black shadow">
                <Flame className="w-7 h-7 text-slate-950 stroke-[2.5]" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-wider">
                  NW SERVICE CENTER
                </h1>
                <p className="text-xs font-bold text-amber-700 uppercase tracking-widest">
                  National Welding Machine Service Center
                </p>
                <p className="text-[11px] text-slate-600">
                  {businessSettings.address}, {businessSettings.city}, {businessSettings.state}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right text-xs text-slate-700">
              <p className="font-bold text-slate-900">REPAIR ESTIMATE</p>
              <p className="font-mono text-amber-700 font-bold text-sm">{job.jobNumber}</p>
              <p className="text-[11px] text-slate-500">Date: {formatISTDateOnly()}</p>
              <p className="text-[11px] font-semibold text-slate-800 mt-1">
                Ph: {businessSettings.phone}
              </p>
            </div>
          </div>

          {/* Customer & Machine Details Grid */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs mb-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Customer Information:
              </p>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{job.customerName}</p>
              <p className="text-slate-700 flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3 text-slate-500" />
                +91 {job.customerPhone}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Machine Details:
              </p>
              <p className="font-bold text-slate-900 text-sm mt-0.5">
                {job.machineBrand} {job.machineModel}
              </p>
              <p className="text-slate-700 text-xs mt-0.5">
                Type: {job.machineType} • Serial: {job.serialNumber || 'N/A'}
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Fault: <strong>{job.customerComplaint}</strong>
              </p>
            </div>
          </div>

          {/* Quotation Line Items Table */}
          <div className="mb-6">
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[10px] border-b border-slate-300">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Description of Work / Parts</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                  {isEditing && <th className="py-2.5 px-3 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 px-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={item.description}
                          onChange={e => handleItemChange(idx, 'description', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                        />
                      ) : (
                        <span className="font-semibold text-slate-800">{item.description}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {isEditing ? (
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))}
                          className="w-14 px-1.5 py-1 border border-slate-300 rounded text-xs text-center"
                        />
                      ) : (
                        <span>{item.quantity}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={item.rate}
                          onChange={e => handleItemChange(idx, 'rate', Number(e.target.value))}
                          className="w-20 px-1.5 py-1 border border-slate-300 rounded text-xs text-right"
                        />
                      ) : (
                        <span>₹{item.rate}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      ₹{item.amount.toLocaleString('en-IN')}
                    </td>
                    {isEditing && (
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {isEditing && (
              <button
                type="button"
                onClick={handleAddItem}
                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-800 border border-slate-300"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item / Component
              </button>
            )}
          </div>

          {/* Calculation Summary Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start text-xs border-t border-slate-200 pt-4">
            <div>
              <p className="font-bold text-slate-800 mb-1">Expected Completion Date:</p>
              {isEditing ? (
                <input
                  type="text"
                  value={expectedDate}
                  onChange={e => setExpectedDate(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs w-48"
                />
              ) : (
                <p className="font-semibold text-slate-900">{expectedDate}</p>
              )}

              <p className="font-bold text-slate-800 mt-4 mb-1">Terms & Conditions:</p>
              {isEditing ? (
                <textarea
                  rows={3}
                  value={quotationNotes}
                  onChange={e => setQuotationNotes(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              ) : (
                <p className="text-slate-600 whitespace-pre-line leading-relaxed text-[11px]">
                  {quotationNotes}
                </p>
              )}
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Parts & Spares Subtotal:</span>
                <span className="font-semibold text-slate-900">₹{partsTotal.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between items-center text-slate-600">
                <span>Labour & Servicing Charges:</span>
                {isEditing ? (
                  <input
                    type="number"
                    min="0"
                    value={labourCharges}
                    onChange={e => setLabourCharges(Number(e.target.value))}
                    className="w-24 px-2 py-1 border border-slate-300 rounded text-xs text-right font-semibold"
                  />
                ) : (
                  <span className="font-semibold text-slate-900">₹{labourCharges}</span>
                )}
              </div>

              <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-300">
                <span>Total Quotation Amount:</span>
                <span className="text-amber-700">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between items-center text-slate-600 pt-1">
                <span>Advance Required / Paid:</span>
                {isEditing ? (
                  <input
                    type="number"
                    min="0"
                    value={advance}
                    onChange={e => setAdvance(Number(e.target.value))}
                    className="w-24 px-2 py-1 border border-slate-300 rounded text-xs text-right font-semibold"
                  />
                ) : (
                  <span className="font-semibold text-cyan-700">₹{advance}</span>
                )}
              </div>

              <div className="flex justify-between text-sm font-bold text-red-600 pt-2 border-t border-slate-200">
                <span>Balance Payable:</span>
                <span>₹{balance.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Authorized Signature Stamp */}
          <div className="mt-12 flex justify-between items-end pt-6 border-t border-slate-200 text-xs text-slate-600">
            <div>
              <p>For NW SERVICE CENTER, Solapur</p>
              <p className="text-[10px] text-slate-400">Customer Copy / Quotation</p>
            </div>
            <div className="text-center">
              <div className="h-10 border-b border-slate-400 w-44 mb-1" />
              <p className="font-bold text-slate-800">Authorized Signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
