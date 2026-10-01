import React from 'react';
import { useData } from '../context/DataContext';
import { JobCard } from '../types';
import { checkDueDateStatus } from '../lib/dateUtils';
import {
  Wrench,
  Clock,
  CheckCircle,
  PackageCheck,
  Send,
  Boxes,
  IndianRupee,
  AlertTriangle,
  PlusCircle,
  Users,
  FileBarChart,
  Archive,
  Settings,
  Bell,
  ChevronRight,
  Phone,
  Flame,
} from 'lucide-react';

interface DashboardViewProps {
  onSelectTab: (tab: string) => void;
  onOpenNewJob: () => void;
  onOpenJobDetail: (job: JobCard) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectTab,
  onOpenNewJob,
  onOpenJobDetail,
}) => {
  const { stats, jobs } = useData();

  // Find jobs with urgent pending payments (due today, overdue, or due tomorrow)
  const paymentReminders = jobs
    .filter(j => (j.balance || 0) > 0 && j.paymentDueDate)
    .map(j => ({
      job: j,
      dueStatus: checkDueDateStatus(j.paymentDueDate),
    }))
    .filter(item => ['overdue', 'today', 'tomorrow'].includes(item.dueStatus));

  // Recent 6 active jobs
  const recentJobs = jobs.filter(j => !j.isArchived).slice(0, 6);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome & Quick Action Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 rounded-2xl border border-slate-800 p-5 sm:p-7 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Flame className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                NW SERVICE CENTER
              </h1>
              <p className="text-xs sm:text-sm font-medium text-slate-400">
                National Welding Machine Service Center, Solapur • Daily Operations Hub
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenNewJob}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 active:scale-95 transition"
            >
              <PlusCircle className="w-5 h-5 text-slate-950" />
              <span>+ New Job Card</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Active Jobs */}
        <button
          onClick={() => onSelectTab('all-jobs')}
          className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 hover:bg-slate-800/60 transition text-left group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Active Jobs</span>
            <div className="p-2 rounded-xl bg-slate-800 text-slate-300 group-hover:text-amber-400 transition">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-white">
            {stats.totalActiveJobs}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
            <span>In Workshop</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition text-amber-400" />
          </p>
        </button>

        {/* Received */}
        <button
          onClick={() => onSelectTab('pending')}
          className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-800/60 transition text-left group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Received</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-cyan-400">
            {stats.receivedJobs}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Newly Arrived</p>
        </button>

        {/* Under Repair */}
        <button
          onClick={() => onSelectTab('pending')}
          className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 hover:bg-slate-800/60 transition text-left group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Under Repair</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-amber-400">
            {stats.underRepairJobs}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">On Bench</p>
        </button>

        {/* Total Pending */}
        <button
          onClick={() => onSelectTab('pending')}
          className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-orange-500/40 hover:bg-slate-800/60 transition text-left group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Pending</span>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-orange-400">
            {stats.pendingJobs}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Awaiting Service</p>
        </button>

        {/* Repaired */}
        <button
          onClick={() => onSelectTab('repaired')}
          className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/40 hover:bg-slate-800/60 transition text-left group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Repaired</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-blue-400">
            {stats.repairedJobs}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Testing OK</p>
        </button>

        {/* Ready for Collection */}
        <button
          onClick={() => onSelectTab('ready')}
          className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-800/60 transition text-left group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Ready for Collection</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-emerald-400">
            {stats.readyForCollectionJobs}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Customer Pickup</p>
        </button>

        {/* Dispatched */}
        <button
          onClick={() => onSelectTab('dispatched')}
          className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-purple-500/40 hover:bg-slate-800/60 transition text-left group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Dispatched</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-purple-400">
            {stats.dispatchedJobs}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Delivered</p>
        </button>

        {/* Today's Repair Collection */}
        <button
          onClick={() => onSelectTab('payments')}
          className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-800/60 transition text-left group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Today's Collection</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-emerald-400 truncate">
            ₹{stats.todayRepairCollection.toLocaleString('en-IN')}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Collected Today</p>
        </button>

        {/* Total Pending Amount */}
        <button
          onClick={() => onSelectTab('payments')}
          className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-red-500/40 hover:bg-slate-800/60 transition text-left group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Pending Amount</span>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-red-400 truncate">
            ₹{stats.totalPendingAmount.toLocaleString('en-IN')}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Outstanding Balance</p>
        </button>

        {/* Low Stock Alerts */}
        <button
          onClick={() => onSelectTab('stock')}
          className={`p-4 rounded-2xl border transition text-left group ${
            stats.lowStockCount > 0
              ? 'bg-red-950/30 border-red-500/40 hover:bg-red-900/40'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Low Stock</span>
            <div
              className={`p-2 rounded-xl ${
                stats.lowStockCount > 0 ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`mt-2 text-2xl sm:text-3xl font-black ${
              stats.lowStockCount > 0 ? 'text-red-400' : 'text-slate-400'
            }`}
          >
            {stats.lowStockCount}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {stats.lowStockCount > 0 ? 'Needs Reordering' : 'Stock Healthy'}
          </p>
        </button>
      </div>

      {/* Quick Access Buttons Grid */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <span>Quick Access Operations</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
          <button
            onClick={onOpenNewJob}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 font-bold text-xs transition"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            <span>+ New Job</span>
          </button>

          <button
            onClick={() => onSelectTab('customers')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-200 hover:text-white hover:bg-slate-800 font-semibold text-xs transition"
          >
            <Users className="w-4 h-4 text-cyan-400" />
            <span>Customers</span>
          </button>

          <button
            onClick={() => onSelectTab('all-jobs')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-200 hover:text-white hover:bg-slate-800 font-semibold text-xs transition"
          >
            <Wrench className="w-4 h-4 text-amber-400" />
            <span>All Jobs</span>
          </button>

          <button
            onClick={() => onSelectTab('pending')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-200 hover:text-white hover:bg-slate-800 font-semibold text-xs transition"
          >
            <Clock className="w-4 h-4 text-orange-400" />
            <span>Pending</span>
          </button>

          <button
            onClick={() => onSelectTab('repaired')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-200 hover:text-white hover:bg-slate-800 font-semibold text-xs transition"
          >
            <CheckCircle className="w-4 h-4 text-blue-400" />
            <span>Repaired</span>
          </button>

          <button
            onClick={() => onSelectTab('ready')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-200 hover:text-white hover:bg-slate-800 font-semibold text-xs transition"
          >
            <PackageCheck className="w-4 h-4 text-emerald-400" />
            <span>Ready</span>
          </button>

          <button
            onClick={() => onSelectTab('dispatched')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-200 hover:text-white hover:bg-slate-800 font-semibold text-xs transition"
          >
            <Send className="w-4 h-4 text-purple-400" />
            <span>Dispatched</span>
          </button>

          <button
            onClick={() => onSelectTab('stock')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-200 hover:text-white hover:bg-slate-800 font-semibold text-xs transition"
          >
            <Boxes className="w-4 h-4 text-rose-400" />
            <span>Spare Stock</span>
          </button>

          <button
            onClick={() => onSelectTab('payments')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-200 hover:text-white hover:bg-slate-800 font-semibold text-xs transition"
          >
            <IndianRupee className="w-4 h-4 text-emerald-400" />
            <span>Payments</span>
          </button>

          <button
            onClick={() => onSelectTab('reports')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-200 hover:text-white hover:bg-slate-800 font-semibold text-xs transition"
          >
            <FileBarChart className="w-4 h-4 text-cyan-400" />
            <span>Reports</span>
          </button>

          <button
            onClick={() => onSelectTab('old-jobs')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-200 hover:text-white hover:bg-slate-800 font-semibold text-xs transition"
          >
            <Archive className="w-4 h-4 text-slate-400" />
            <span>Old Jobs</span>
          </button>

          <button
            onClick={() => onSelectTab('settings')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-200 hover:text-white hover:bg-slate-800 font-semibold text-xs transition"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* In-App Payment Due Reminder Widget */}
      {paymentReminders.length > 0 && (
        <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-400 animate-bounce" />
              <h3 className="font-bold text-white text-sm">
                Payment Reminder ({paymentReminders.length})
              </h3>
            </div>
            <span className="text-[11px] text-amber-400/80 font-medium">
              In-App Notification (Not sent to customer)
            </span>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {paymentReminders.map(({ job, dueStatus }) => (
              <div
                key={job.id}
                onClick={() => onOpenJobDetail(job)}
                className="cursor-pointer p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {job.jobNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        dueStatus === 'overdue'
                          ? 'bg-red-500/20 text-red-400'
                          : dueStatus === 'today'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {dueStatus.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white mt-1">{job.customerName}</p>
                  <p className="text-[11px] text-slate-400">
                    {job.machineBrand} {job.machineModel}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-red-400">
                    ₹{job.balance.toLocaleString('en-IN')}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Due: {job.paymentDueDate}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Jobs Table & Mobile Cards */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Wrench className="w-4 h-4 text-amber-400" />
            <span>Recent Job Cards</span>
          </h2>
          <button
            onClick={() => onSelectTab('all-jobs')}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            <span>View All ({stats.totalActiveJobs})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentJobs.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            <p>No active jobs recorded yet.</p>
            <button
              onClick={onOpenNewJob}
              className="mt-3 inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
            >
              <PlusCircle className="w-4 h-4" />
              Create First Job
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3">Job No</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Machine</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Received</th>
                  <th className="py-3 px-3 text-right">Balance</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {recentJobs.map(job => (
                  <tr
                    key={job.id}
                    onClick={() => onOpenJobDetail(job)}
                    className="hover:bg-slate-800/50 cursor-pointer transition"
                  >
                    <td className="py-3 px-3 font-mono font-bold text-amber-400">
                      {job.jobNumber}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-white">{job.customerName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {job.customerPhone}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-200">{job.machineBrand}</span>{' '}
                      <span className="text-slate-400">{job.machineModel}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          job.status === 'Dispatched'
                            ? 'bg-purple-500/20 text-purple-300'
                            : job.status === 'Ready for Collection'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : job.status === 'Repaired'
                            ? 'bg-blue-500/20 text-blue-300'
                            : job.status === 'Under Repair'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                      {job.receivedDate ? job.receivedDate.split(',')[0] : 'N/A'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {job.balance > 0 ? (
                        <span className="font-bold text-red-400">
                          ₹{job.balance.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="font-bold text-emerald-400">Paid</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onOpenJobDetail(job);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 font-bold text-[11px] text-slate-300 transition"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
