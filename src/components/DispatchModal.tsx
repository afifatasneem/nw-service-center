import React, { useState } from 'react';
import { JobCard, DispatchDetails } from '../types';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { formatISTDateTime, formatISTDateOnly } from '../lib/dateUtils';
import { Send, X, CheckCircle, Truck, User, Calendar, Clock, AlertTriangle } from 'lucide-react';

interface DispatchModalProps {
  job: JobCard | null;
  isOpen: boolean;
  onClose: () => void;
  onDispatched?: () => void;
}

export const DispatchModal: React.FC<DispatchModalProps> = ({
  job,
  isOpen,
  onClose,
  onDispatched,
}) => {
  const { dispatchJob, technicians } = useData();
  const { currentUser } = useAuth();

  const [dispatchDate, setDispatchDate] = useState<string>(formatISTDateOnly());
  const [dispatchTime, setDispatchTime] = useState<string>(
    new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })
  );
  const [dispatchedBy, setDispatchedBy] = useState<string>(currentUser?.fullName || 'Owner');
  const [technician, setTechnician] = useState<string>(job?.technicianName || '');
  const [deliveryMethod, setDeliveryMethod] = useState<string>('Handover to Customer');
  const [notes, setNotes] = useState<string>('Machine fully tested with output spark and handed over.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !job) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const details: DispatchDetails = {
        dispatchedDate: dispatchDate,
        dispatchedTime: dispatchTime,
        dispatchedBy: dispatchedBy.trim() || 'Owner',
        technician: technician || job.technicianName || 'N/A',
        deliveryMethod,
        notes: notes.trim(),
      };

      await dispatchJob(job.id, details);
      if (onDispatched) onDispatched();
      onClose();
    } catch (err) {
      console.error('Dispatch failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl text-slate-100 p-6 my-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Dispatch Machine</h2>
              <p className="text-xs text-slate-400">
                Job <span className="font-mono text-amber-400 font-bold">{job.jobNumber}</span> • Outward Handover
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {job.balance > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-bold">Pending Balance: ₹{job.balance.toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-amber-400/80">
                Ensure payment collection or credit approval before machine dispatch.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          {/* Readonly Summary */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Customer</span>
              <p className="font-bold text-white truncate">{job.customerName}</p>
              <p className="text-[11px] text-slate-400">{job.customerPhone}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Machine</span>
              <p className="font-bold text-amber-400 truncate">
                {job.machineBrand} {job.machineModel}
              </p>
              <p className="text-[11px] text-slate-400">{job.machineType}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-300">
                Dispatch Date (IST)
              </label>
              <input
                type="text"
                required
                value={dispatchDate}
                onChange={e => setDispatchDate(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300">
                Dispatch Time (IST)
              </label>
              <input
                type="text"
                required
                value={dispatchTime}
                onChange={e => setDispatchTime(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-300">
                Dispatched By *
              </label>
              <input
                type="text"
                required
                value={dispatchedBy}
                onChange={e => setDispatchedBy(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300">
                Handled Technician
              </label>
              <select
                value={technician}
                onChange={e => setTechnician(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                <option value="">-- Select Technician --</option>
                {technicians.map(t => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300">
              Delivery Method
            </label>
            <select
              value={deliveryMethod}
              onChange={e => setDeliveryMethod(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
              <option value="Handover to Customer">Direct Handover to Customer / Representative</option>
              <option value="Auto Rickshaw / Local Delivery">Auto Rickshaw / Local Delivery</option>
              <option value="Transport / Cargo Parcel">Transport / Cargo Parcel</option>
              <option value="Courier Service">Courier Service</option>
              <option value="Technician Site Delivery">Technician Site Delivery</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300">
              Dispatch Notes / Remarks
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Tested on full amp rod, cables returned"
              className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 font-bold text-white text-xs shadow-lg hover:from-purple-500 hover:to-indigo-500 active:scale-95 transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Confirming Dispatch...' : 'Confirm Dispatch'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
