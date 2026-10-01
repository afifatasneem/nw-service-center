import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { JobCard } from '../types';
import { checkDueDateStatus } from '../lib/dateUtils';
import {
  IndianRupee,
  Search,
  Bell,
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Phone,
  Filter,
  ChevronRight,
  Plus,
  X,
} from 'lucide-react';

interface PaymentsViewProps {
  onOpenJobDetail: (job: JobCard) => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({ onOpenJobDetail }) => {
  const { jobs, recordPayment } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Overdue' | 'Due Today' | 'Due Tomorrow' | 'Pending' | 'Paid'>('All');

  // Quick Payment Modal
  const [selectedJobForPay, setSelectedJobForPay] = useState<JobCard | null>(null);
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [payMode, setPayMode] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque'>('Cash');
  const [payReceivedBy, setPayReceivedBy] = useState('Owner');
  const [payNote, setPayNote] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  // Compute Payment Dashboard Metrics
  const totalBilled = jobs.reduce((sum, j) => sum + (j.repairCharges || 0), 0);
  const totalPending = jobs.reduce((sum, j) => sum + (j.balance || 0), 0);

  const dueTodayJobs = jobs.filter(j => j.balance > 0 && checkDueDateStatus(j.paymentDueDate) === 'today');
  const dueTomorrowJobs = jobs.filter(j => j.balance > 0 && checkDueDateStatus(j.paymentDueDate) === 'tomorrow');
  const overdueJobs = jobs.filter(j => j.balance > 0 && checkDueDateStatus(j.paymentDueDate) === 'overdue');
  const paidJobs = jobs.filter(j => j.paymentStatus === 'Paid');

  // Filter jobs
  const filteredJobs = jobs.filter(job => {
    const dueStatus = checkDueDateStatus(job.paymentDueDate);

    // Status filter
    if (statusFilter === 'Overdue' && (dueStatus !== 'overdue' || job.balance <= 0)) return false;
    if (statusFilter === 'Due Today' && (dueStatus !== 'today' || job.balance <= 0)) return false;
    if (statusFilter === 'Due Tomorrow' && (dueStatus !== 'tomorrow' || job.balance <= 0)) return false;
    if (statusFilter === 'Pending' && job.balance <= 0) return false;
    if (statusFilter === 'Paid' && job.paymentStatus !== 'Paid') return false;

    // Search filter
    const q = searchQuery.toLowerCase();
    const matchName = (job.customerName || '').toLowerCase().includes(q);
    const matchPhone = (job.customerPhone || '').includes(q);
    const matchJob = (job.jobNumber || '').toLowerCase().includes(q);

    return matchName || matchPhone || matchJob;
  });

  const handleOpenPay = (job: JobCard, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedJobForPay(job);
    setPayAmount(job.balance);
    setPayNote('Full balance settlement');
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobForPay || !payAmount || Number(payAmount) <= 0) return;

    setIsRecording(true);
    try {
      await recordPayment(selectedJobForPay.id, {
        amount: Number(payAmount),
        paymentMode: payMode,
        receivedBy: payReceivedBy.trim() || 'Owner',
        note: payNote.trim(),
      });
      setSelectedJobForPay(null);
    } finally {
      setIsRecording(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <IndianRupee className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-white">
                Payment Dashboard & Accounts
              </h1>
              <p className="text-xs text-slate-400">
                Track job bills, advances, pending balances, and 3-day post-service payment reminders
              </p>
            </div>
          </div>
        </div>

        {/* Payment KPI Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
          {/* Total Pending */}
          <button
            onClick={() => setStatusFilter('Pending')}
            className={`p-3 rounded-xl border text-left transition ${
              statusFilter === 'Pending'
                ? 'bg-amber-500/15 border-amber-500/50'
                : 'bg-slate-950 border-slate-800 hover:bg-slate-800/40'
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-slate-500">Total Pending</span>
            <div className="text-xl font-black text-amber-400 mt-1">
              ₹{totalPending.toLocaleString('en-IN')}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Unsettled Balance</p>
          </button>

          {/* Overdue */}
          <button
            onClick={() => setStatusFilter('Overdue')}
            className={`p-3 rounded-xl border text-left transition ${
              statusFilter === 'Overdue'
                ? 'bg-red-500/20 border-red-500/50'
                : 'bg-slate-950 border-slate-800 hover:bg-slate-800/40'
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-slate-500">Overdue</span>
            <div className="text-xl font-black text-red-400 mt-1">{overdueJobs.length}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Past Due Date</p>
          </button>

          {/* Due Today */}
          <button
            onClick={() => setStatusFilter('Due Today')}
            className={`p-3 rounded-xl border text-left transition ${
              statusFilter === 'Due Today'
                ? 'bg-orange-500/20 border-orange-500/50'
                : 'bg-slate-950 border-slate-800 hover:bg-slate-800/40'
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-slate-500">Due Today</span>
            <div className="text-xl font-black text-orange-400 mt-1">{dueTodayJobs.length}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Follow-up Today</p>
          </button>

          {/* Due Tomorrow */}
          <button
            onClick={() => setStatusFilter('Due Tomorrow')}
            className={`p-3 rounded-xl border text-left transition ${
              statusFilter === 'Due Tomorrow'
                ? 'bg-cyan-500/20 border-cyan-500/50'
                : 'bg-slate-950 border-slate-800 hover:bg-slate-800/40'
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-slate-500">Due Tomorrow</span>
            <div className="text-xl font-black text-cyan-400 mt-1">{dueTomorrowJobs.length}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Upcoming Reminders</p>
          </button>

          {/* Fully Paid */}
          <button
            onClick={() => setStatusFilter('Paid')}
            className={`p-3 rounded-xl border text-left transition ${
              statusFilter === 'Paid'
                ? 'bg-emerald-500/20 border-emerald-500/50'
                : 'bg-slate-950 border-slate-800 hover:bg-slate-800/40'
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-slate-500">Fully Paid</span>
            <div className="text-xl font-black text-emerald-400 mt-1">{paidJobs.length}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Zero Balance</p>
          </button>
        </div>
      </div>

      {/* In-App 3-Day Payment Reminders Banner */}
      {(overdueJobs.length > 0 || dueTodayJobs.length > 0) && (
        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400 animate-pulse" />
            <h3 className="font-bold text-white text-sm">
              In-App Payment Reminders (Action Required)
            </h3>
            <span className="text-[11px] text-amber-400/80 font-medium ml-auto">
              Private In-App Warning • No automatic customer SMS/WhatsApp
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...overdueJobs, ...dueTodayJobs].slice(0, 6).map(job => (
              <div
                key={job.id}
                onClick={() => onOpenJobDetail(job)}
                className="cursor-pointer p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-amber-400 text-xs">{job.jobNumber}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-red-500/20 text-red-400">
                      OVERDUE / DUE
                    </span>
                  </div>
                  <p className="font-bold text-white text-xs mt-1">{job.customerName}</p>
                  <p className="text-[11px] text-slate-400">{job.customerPhone}</p>
                </div>

                <div className="text-right">
                  <div className="font-bold text-red-400 text-sm">
                    ₹{job.balance.toLocaleString('en-IN')}
                  </div>
                  <button
                    onClick={e => handleOpenPay(job, e)}
                    className="mt-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] shadow"
                  >
                    Receive
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by customer, phone, or job number..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {(['All', 'Pending', 'Overdue', 'Due Today', 'Due Tomorrow', 'Paid'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
                statusFilter === tab
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Payment Ledger Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3">Job No</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Machine</th>
                <th className="py-3 px-3 text-right">Total Charges</th>
                <th className="py-3 px-3 text-right">Advance Paid</th>
                <th className="py-3 px-3 text-right">Remaining Balance</th>
                <th className="py-3 px-3">Payment Due Date</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-500">
                    No matching payment records found.
                  </td>
                </tr>
              ) : (
                filteredJobs.map(job => {
                  const dueStatus = checkDueDateStatus(job.paymentDueDate);
                  return (
                    <tr
                      key={job.id}
                      onClick={() => onOpenJobDetail(job)}
                      className="hover:bg-slate-800/40 cursor-pointer transition"
                    >
                      <td className="py-3 px-3 font-mono font-bold text-amber-400">
                        {job.jobNumber}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-white">{job.customerName}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-500" />
                          {job.customerPhone}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-300">
                        {job.machineBrand} {job.machineModel}
                      </td>

                      <td className="py-3 px-3 text-right text-white font-bold">
                        ₹{job.repairCharges.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 px-3 text-right text-cyan-400 font-semibold">
                        ₹{(job.advance || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 px-3 text-right">
                        {job.balance > 0 ? (
                          <span className="font-black text-red-400">
                            ₹{job.balance.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="font-bold text-emerald-400">₹0</span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        {job.paymentDueDate ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-slate-300">{job.paymentDueDate}</span>
                            {dueStatus === 'overdue' && (
                              <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[9px] font-bold">
                                OVERDUE
                              </span>
                            )}
                            {dueStatus === 'today' && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[9px] font-bold">
                                TODAY
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            job.balance <= 0
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {job.paymentStatus}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        {job.balance > 0 ? (
                          <button
                            onClick={e => handleOpenPay(job, e)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow transition active:scale-95"
                          >
                            Receive
                          </button>
                        ) : (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              onOpenJobDetail(job);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white font-semibold text-[11px]"
                          >
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QUICK RECEIVE PAYMENT MODAL */}
      {selectedJobForPay && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                <IndianRupee className="w-4 h-4" />
                Receive Payment — {selectedJobForPay.jobNumber}
              </h3>
              <button
                onClick={() => setSelectedJobForPay(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="mt-4 space-y-3 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Customer:</span>
                  <span className="font-bold text-white">{selectedJobForPay.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Pending Balance:</span>
                  <span className="font-bold text-red-400">
                    ₹{selectedJobForPay.balance.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300">
                  Amount Received (₹) *
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
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
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
                <label className="block text-[11px] font-medium text-slate-300">Note / Remarks</label>
                <input
                  type="text"
                  value={payNote}
                  onChange={e => setPayNote(e.target.value)}
                  placeholder="e.g. Cleared full balance"
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isRecording || !payAmount}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-xs shadow transition active:scale-98 disabled:opacity-50"
                >
                  {isRecording ? 'Updating Balance...' : 'Confirm Payment Received'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
