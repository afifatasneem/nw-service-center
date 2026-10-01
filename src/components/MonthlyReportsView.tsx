import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { getCurrentMonthPeriod, formatMonthName, formatISTDateOnly } from '../lib/dateUtils';
import {
  FileBarChart,
  Printer,
  Calendar,
  IndianRupee,
  Wrench,
  Boxes,
  Send,
  Clock,
  CheckCircle,
  Flame,
} from 'lucide-react';

export const MonthlyReportsView: React.FC = () => {
  const { jobs, spareItems, monthlyClosings, businessSettings } = useData();

  const currentPeriod = getCurrentMonthPeriod();

  // Aggregate distinct months from jobs and closings
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    set.add(currentPeriod);
    jobs.forEach(j => {
      if (j.monthPeriod) set.add(j.monthPeriod);
    });
    monthlyClosings.forEach(c => {
      if (c.monthPeriod) set.add(c.monthPeriod);
    });
    return Array.from(set).sort().reverse();
  }, [jobs, monthlyClosings, currentPeriod]);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentPeriod);

  // Check if closing record exists for selected month
  const closedRecord = monthlyClosings.find(c => c.monthPeriod === selectedMonth);

  // Compute metrics for selected month
  const monthJobs = jobs.filter(j => j.monthPeriod === selectedMonth);

  const totalReceived = closedRecord ? closedRecord.totalJobsReceived : monthJobs.length;
  const totalRepaired = closedRecord
    ? closedRecord.totalJobsRepaired
    : monthJobs.filter(j => ['Repaired', 'Ready for Collection', 'Dispatched'].includes(j.status)).length;
  const totalDispatched = closedRecord
    ? closedRecord.totalDispatched
    : monthJobs.filter(j => j.status === 'Dispatched').length;
  const totalPending = closedRecord
    ? closedRecord.totalPendingJobs
    : monthJobs.filter(j => j.status !== 'Dispatched').length;

  const totalRepairCollection = closedRecord
    ? closedRecord.totalRepairCollection
    : monthJobs.reduce((sum, j) => sum + (j.repairCharges || 0), 0);
  const totalPendingAmount = closedRecord
    ? closedRecord.totalPendingAmount
    : monthJobs.reduce((sum, j) => sum + (j.balance || 0), 0);

  let totalPaymentsReceived = 0;
  monthJobs.forEach(j => {
    totalPaymentsReceived += j.advance || 0;
    (j.payments || []).forEach(p => {
      totalPaymentsReceived += p.amount || 0;
    });
  });
  if (closedRecord) totalPaymentsReceived = closedRecord.totalPaymentsReceived;

  let totalPartsUsed = 0;
  monthJobs.forEach(j => {
    (j.partsUsed || []).forEach(p => {
      totalPartsUsed += p.quantity || 0;
    });
  });
  if (closedRecord) totalPartsUsed = closedRecord.totalPartsUsed;

  const monthlyIncome = totalPaymentsReceived;

  const lowStockCount = spareItems.filter(s => s.currentStock > 0 && s.currentStock <= s.minStockAlert).length;
  const outOfStockCount = spareItems.filter(s => s.currentStock <= 0).length;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Controller Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <FileBarChart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white">
              Monthly Performance & Financial Reports
            </h1>
            <p className="text-xs text-slate-400">
              National Welding Machine Service Center, Solapur
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 font-semibold">Select Month:</label>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {availableMonths.map(m => (
                <option key={m} value={m}>
                  {formatMonthName(m)} ({m})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition active:scale-95"
          >
            <Printer className="w-4 h-4 text-slate-950" />
            <span>Print / Download PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document */}
      <div id="monthly-report-area" className="bg-white text-slate-900 rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-2xl">
        {/* Letterhead */}
        <div className="border-b-2 border-slate-900 pb-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500 text-slate-950 font-black shadow">
              <Flame className="w-7 h-7 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-wider">
                NW SERVICE CENTER
              </h2>
              <p className="text-xs font-bold text-amber-700 uppercase tracking-widest">
                National Welding Machine Service Center, Solapur
              </p>
              <p className="text-[11px] text-slate-600">
                {businessSettings.address}, {businessSettings.city} • Ph: {businessSettings.phone}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-900 font-black text-xs border border-slate-300">
              MONTHLY AUDIT REPORT
            </span>
            <p className="text-sm font-black text-amber-800 mt-1">
              {formatMonthName(selectedMonth)}
            </p>
            <p className="text-[10px] text-slate-500">Generated on {formatISTDateOnly()}</p>
          </div>
        </div>

        {/* Report 10 Core Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 text-xs">
          {/* Total Jobs Received */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase">1. Jobs Received</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalReceived}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Total incoming machines</p>
          </div>

          {/* Total Jobs Repaired */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase">2. Jobs Repaired</span>
            <div className="text-2xl font-black text-blue-700 mt-1">{totalRepaired}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Serviced & tested OK</p>
          </div>

          {/* Total Dispatched */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase">3. Dispatched</span>
            <div className="text-2xl font-black text-purple-700 mt-1">{totalDispatched}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Delivered to client</p>
          </div>

          {/* Total Pending Jobs */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase">4. Pending Jobs</span>
            <div className="text-2xl font-black text-amber-600 mt-1">{totalPending}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Carry forward in shop</p>
          </div>

          {/* Total Repair Collection (Billed) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase">
              5. Total Repair Charges
            </span>
            <div className="text-xl font-black text-slate-900 mt-1">
              ₹{totalRepairCollection.toLocaleString('en-IN')}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Gross repair estimates</p>
          </div>

          {/* Total Payments Received */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-800 uppercase">
              6. Payments Received
            </span>
            <div className="text-xl font-black text-emerald-700 mt-1">
              ₹{totalPaymentsReceived.toLocaleString('en-IN')}
            </div>
            <p className="text-[10px] text-emerald-600 mt-0.5">Actual cash/UPI collected</p>
          </div>

          {/* Total Pending Amount */}
          <div className="p-4 rounded-xl bg-red-50 border border-red-200">
            <span className="text-[10px] font-bold text-red-800 uppercase">
              7. Pending Balance
            </span>
            <div className="text-xl font-black text-red-700 mt-1">
              ₹{totalPendingAmount.toLocaleString('en-IN')}
            </div>
            <p className="text-[10px] text-red-600 mt-0.5">Outstanding collection</p>
          </div>

          {/* Monthly Net Income */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
            <span className="text-[10px] font-bold text-amber-900 uppercase">
              8. Monthly Income
            </span>
            <div className="text-xl font-black text-amber-800 mt-1">
              ₹{monthlyIncome.toLocaleString('en-IN')}
            </div>
            <p className="text-[10px] text-amber-700 mt-0.5">Realized cashflow</p>
          </div>
        </div>

        {/* Operational Breakdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 text-xs">
          {/* Spare Stock Summary */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-200 flex items-center justify-between">
              <span>9. Spare Stock Inventory Summary</span>
              <Boxes className="w-4 h-4 text-slate-600" />
            </h3>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-600">Total Spare Items Tracked:</span>
              <span className="font-bold text-slate-900">{spareItems.length} types</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-600">Total Spare Parts Fitted in {formatMonthName(selectedMonth)}:</span>
              <span className="font-bold text-purple-700">{totalPartsUsed} units</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-600">Low Stock Warnings:</span>
              <span className="font-bold text-amber-700">{lowStockCount} items</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-600">Out of Stock Items:</span>
              <span className="font-bold text-red-700">{outOfStockCount} items</span>
            </div>
          </div>

          {/* Service Efficiency Summary */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-200 flex items-center justify-between">
              <span>10. Workshop Efficiency & Delivery</span>
              <Wrench className="w-4 h-4 text-slate-600" />
            </h3>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-600">Repair Completion Rate:</span>
              <span className="font-bold text-slate-900">
                {totalReceived > 0 ? `${Math.round((totalRepaired / totalReceived) * 100)}%` : '100%'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-600">Dispatch Delivery Rate:</span>
              <span className="font-bold text-slate-900">
                {totalReceived > 0 ? `${Math.round((totalDispatched / totalReceived) * 100)}%` : '100%'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-600">Closing Status:</span>
              <span className="font-bold text-slate-900">
                {closedRecord ? `Closed on ${closedRecord.closedAt} by ${closedRecord.closedBy}` : 'Ongoing Active Month'}
              </span>
            </div>
          </div>
        </div>

        {/* Machine Breakdown Table for this month */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
            Machines Serviced in {formatMonthName(selectedMonth)} ({monthJobs.length})
          </h3>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-900 text-[10px] uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Job No</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Machine</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Charges</th>
                  <th className="py-2.5 px-3 text-right">Advance</th>
                  <th className="py-2.5 px-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {monthJobs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-500">
                      No machines registered in this monthly period.
                    </td>
                  </tr>
                ) : (
                  monthJobs.map(j => (
                    <tr key={j.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">{j.jobNumber}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{j.customerName}</td>
                      <td className="py-2 px-3">{j.machineBrand} {j.machineModel}</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-[10px]">
                          {j.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">₹{j.repairCharges}</td>
                      <td className="py-2 px-3 text-right text-cyan-800 font-medium">₹{j.advance || 0}</td>
                      <td className="py-2 px-3 text-right font-bold text-red-600">₹{j.balance || 0}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Signature */}
        <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-end text-xs text-slate-600">
          <div>
            <p className="font-bold text-slate-800">NW SERVICE CENTER — Solapur</p>
            <p className="text-[10px] text-slate-500">Confidential Business Audit Document</p>
          </div>
          <div className="text-center">
            <div className="h-10 border-b border-slate-400 w-44 mb-1" />
            <p className="font-bold text-slate-800">Owner Signature & Stamp</p>
          </div>
        </div>
      </div>
    </div>
  );
};
