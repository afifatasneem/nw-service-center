import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { getCurrentMonthPeriod, formatMonthName, formatISTDateTime } from '../lib/dateUtils';
import {
  CalendarCheck2,
  AlertTriangle,
  CheckCircle2,
  FileBarChart,
  Lock,
  Archive,
  IndianRupee,
  Wrench,
  Boxes,
  ShieldAlert,
  Clock,
} from 'lucide-react';

export const MonthlyClosingView: React.FC = () => {
  const {
    jobs,
    spareItems,
    monthlyClosings,
    closeCurrentMonth,
  } = useData();
  const { currentUser, isOwner } = useAuth();

  const currentPeriod = getCurrentMonthPeriod();
  const currentMonthName = formatMonthName(currentPeriod);

  // Check if current month is already closed
  const isAlreadyClosed = monthlyClosings.some(c => c.monthPeriod === currentPeriod);

  const [notes, setNotes] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Calculate live preview metrics for the current period
  const periodJobs = jobs.filter(j => j.monthPeriod === currentPeriod);
  const totalReceived = periodJobs.length;
  const totalRepaired = periodJobs.filter(j => ['Repaired', 'Ready for Collection', 'Dispatched'].includes(j.status)).length;
  const totalDispatched = periodJobs.filter(j => j.status === 'Dispatched').length;
  const totalPending = periodJobs.filter(j => j.status !== 'Dispatched').length;

  const totalBilled = periodJobs.reduce((sum, j) => sum + (j.repairCharges || 0), 0);
  const totalPendingAmount = periodJobs.reduce((sum, j) => sum + (j.balance || 0), 0);

  let totalCollected = 0;
  periodJobs.forEach(j => {
    totalCollected += (j.advance || 0);
    (j.payments || []).forEach(p => {
      totalCollected += p.amount;
    });
  });

  let totalPartsCount = 0;
  periodJobs.forEach(j => {
    (j.partsUsed || []).forEach(p => {
      totalPartsCount += p.quantity;
    });
  });

  const handleExecuteClose = async () => {
    setErrorMessage(null);
    setIsClosing(true);
    try {
      const closing = await closeCurrentMonth(currentUser?.fullName || 'Owner', notes.trim());
      setSuccessMessage(`Successfully closed ${closing.monthName}. Jobs archived to Old Jobs.`);
      setShowConfirmModal(false);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to close month');
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <CalendarCheck2 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Monthly Closing & Audit</h1>
            <p className="text-xs text-slate-400">
              Audit month performance, generate immutable financial snapshot, and archive completed jobs
            </p>
          </div>
        </div>

        {/* Status Pill */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Current Month Target:</span>
            <span className="font-bold text-white text-sm bg-slate-950 px-3 py-1 rounded-xl border border-slate-700">
              {currentMonthName} ({currentPeriod})
            </span>
          </div>

          <div>
            {isAlreadyClosed ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-500/20 text-purple-300 font-bold text-xs border border-purple-500/30">
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                Month Closed & Archived
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/30">
                <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
                Active Accounting Month
              </span>
            )}
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm font-semibold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Month Audit Preview Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <FileBarChart className="w-4 h-4" />
          <span>{currentMonthName} Operational Preview</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400">Machines Received</span>
            <div className="text-xl font-black text-white mt-1">{totalReceived}</div>
            <p className="text-[10px] text-slate-500">In {currentMonthName}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400">Machines Repaired</span>
            <div className="text-xl font-black text-blue-400 mt-1">{totalRepaired}</div>
            <p className="text-[10px] text-slate-500">Tested & Repaired</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400">Machines Dispatched</span>
            <div className="text-xl font-black text-purple-400 mt-1">{totalDispatched}</div>
            <p className="text-[10px] text-slate-500">Handed to Customer</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400">Pending Machines</span>
            <div className="text-xl font-black text-amber-400 mt-1">{totalPending}</div>
            <p className="text-[10px] text-slate-500">Carry over to next</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400">Total Billed Charges</span>
            <div className="text-xl font-black text-white mt-1">
              ₹{totalBilled.toLocaleString('en-IN')}
            </div>
            <p className="text-[10px] text-slate-500">Quoted & Serviced</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400">Payments Collected</span>
            <div className="text-xl font-black text-emerald-400 mt-1">
              ₹{totalCollected.toLocaleString('en-IN')}
            </div>
            <p className="text-[10px] text-slate-500">Actual Income</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400">Pending Amount</span>
            <div className="text-xl font-black text-red-400 mt-1">
              ₹{totalPendingAmount.toLocaleString('en-IN')}
            </div>
            <p className="text-[10px] text-slate-500">To be Collected</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400">Parts Used</span>
            <div className="text-xl font-black text-amber-400 mt-1">{totalPartsCount}</div>
            <p className="text-[10px] text-slate-500">Components Fitted</p>
          </div>
        </div>

        {/* Safety Guarantees Notice */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 space-y-2">
          <p className="font-bold text-white flex items-center gap-1.5 text-amber-400">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            Zero-Loss Data Integrity Guarantees:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px] leading-relaxed">
            <li>
              <strong>Preserves All Data:</strong> All customer records, job cards, parts used, and payment receipts remain permanently accessible.
            </li>
            <li>
              <strong>Physical Stock Intact:</strong> Current spare stock quantities are NEVER reset during monthly closing.
            </li>
            <li>
              <strong>Automatic New Month:</strong> Starting on the 1st of next month, new jobs belong to the new month automatically.
            </li>
            <li>
              <strong>Duplicate Prevention:</strong> Once closed, a month cannot be accidentally closed again.
            </li>
          </ul>
        </div>

        {/* Action Button: CLOSE MONTH */}
        {!isAlreadyClosed && isOwner ? (
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800">
            <div className="text-xs text-slate-400">
              Only the Business Owner can authorize monthly closing.
            </div>

            <button
              onClick={() => setShowConfirmModal(true)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm shadow-xl shadow-red-600/20 active:scale-95 transition flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>CLOSE MONTH ({currentMonthName})</span>
            </button>
          </div>
        ) : !isOwner ? (
          <div className="p-3 rounded-xl bg-slate-800 text-slate-400 text-xs italic text-center">
            Monthly closing action is reserved for the Owner role.
          </div>
        ) : null}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-red-500/40 p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Confirm Monthly Closing</h3>
                <p className="text-xs text-slate-400">
                  Are you sure you want to close <strong>{currentMonthName}</strong>?
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-300 space-y-2">
              <p>
                Closing the month will finalize the financial snapshot for <strong>{currentMonthName}</strong> and archive completed jobs into <strong>Old Jobs / Previous Months</strong>.
              </p>
              <p className="text-slate-400">
                No data will be deleted. Physical stock is not reset. This action cannot be undone for this month.
              </p>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mt-3 mb-1">
                  Closing Remarks / Notes (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Month target achieved, all festival jobs delivered"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteClose}
                disabled={isClosing}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 font-bold text-white text-xs shadow-lg shadow-red-600/30 transition disabled:opacity-50"
              >
                {isClosing ? 'Closing Month...' : 'Yes, Close Month Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
