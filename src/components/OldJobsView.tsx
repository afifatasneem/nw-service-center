import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { JobCard, JobStatus } from '../types';
import { formatMonthName } from '../lib/dateUtils';
import {
  Archive,
  Search,
  Filter,
  Calendar,
  Phone,
  Wrench,
  CheckCircle,
  ChevronRight,
  Eye,
} from 'lucide-react';

interface OldJobsViewProps {
  onOpenJobDetail: (job: JobCard) => void;
}

export const OldJobsView: React.FC<OldJobsViewProps> = ({ onOpenJobDetail }) => {
  const { jobs } = useData();

  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract distinct months and brands
  const distinctMonths = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach(j => {
      if (j.monthPeriod) set.add(j.monthPeriod);
    });
    return Array.from(set).sort().reverse();
  }, [jobs]);

  const distinctBrands = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach(j => {
      if (j.machineBrand) set.add(j.machineBrand);
    });
    return Array.from(set).sort();
  }, [jobs]);

  // Filter jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      // Month
      if (selectedMonth !== 'All' && job.monthPeriod !== selectedMonth) return false;
      // Status
      if (selectedStatus !== 'All' && job.status !== selectedStatus) return false;
      // Brand
      if (selectedBrand !== 'All' && job.machineBrand !== selectedBrand) return false;

      // Search query (customer, mobile, job number)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCustomer = (job.customerName || '').toLowerCase().includes(q);
        const matchPhone = (job.customerPhone || '').includes(q);
        const matchJobNum = (job.jobNumber || '').toLowerCase().includes(q);
        const matchModel = (job.machineModel || '').toLowerCase().includes(q);
        if (!matchCustomer && !matchPhone && !matchJobNum && !matchModel) return false;
      }

      return true;
    });
  }, [jobs, selectedMonth, selectedStatus, selectedBrand, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Archive className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-white">
                Old Jobs & Previous Months Archive
              </h1>
              <p className="text-xs text-slate-400">
                Permanently accessible historical archive of all machines serviced at NW Service Center
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-semibold text-slate-400">Total Jobs In Archive:</span>
            <span className="ml-2 font-mono font-bold text-amber-400 text-sm">{jobs.length}</span>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Search Input */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Search Job / Customer / Phone
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Job #, Customer, Mobile..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Month Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Filter by Month
            </label>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="All">All Months (Entire History)</option>
              {distinctMonths.map(m => (
                <option key={m} value={m}>
                  {formatMonthName(m)} ({m})
                </option>
              ))}
            </select>
          </div>

          {/* Machine Brand Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Filter by Brand
            </label>
            <select
              value={selectedBrand}
              onChange={e => setSelectedBrand(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="All">All Brands</option>
              {distinctBrands.map(b => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Filter by Status
            </label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="All">All Statuses</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Ready for Collection">Ready for Collection</option>
              <option value="Repaired">Repaired</option>
              <option value="Under Repair">Under Repair</option>
              <option value="Received">Received</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Found {filteredJobs.length} Archived Records</span>
          {selectedMonth !== 'All' && (
            <span className="font-semibold text-amber-400">
              Showing: {formatMonthName(selectedMonth)}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3">Job No</th>
                <th className="py-3 px-3">Month</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Machine</th>
                <th className="py-3 px-3">Fault / Complaint</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Charges</th>
                <th className="py-3 px-3 text-right">Balance</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No old jobs match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredJobs.map(job => (
                  <tr
                    key={job.id}
                    onClick={() => onOpenJobDetail(job)}
                    className="hover:bg-slate-800/40 cursor-pointer transition"
                  >
                    <td className="py-3 px-3 font-mono font-bold text-amber-400">
                      {job.jobNumber}
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">
                      {formatMonthName(job.monthPeriod)}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-white">{job.customerName}</div>
                      <div className="text-[11px] text-slate-500">{job.customerPhone}</div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-200">{job.machineBrand}</span>{' '}
                      <span className="text-slate-400">{job.machineModel}</span>
                    </td>

                    <td className="py-3 px-3 text-slate-300 max-w-xs truncate">
                      {job.customerComplaint || 'General Service'}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          job.status === 'Dispatched'
                            ? 'bg-purple-500/20 text-purple-300'
                            : job.status === 'Ready for Collection'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right text-white font-bold">
                      ₹{job.repairCharges.toLocaleString('en-IN')}
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

                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onOpenJobDetail(job);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
