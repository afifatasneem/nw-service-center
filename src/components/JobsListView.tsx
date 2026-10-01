import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { JobCard, JobStatus } from '../types';
import { checkDueDateStatus } from '../lib/dateUtils';
import {
  Wrench,
  Search,
  PlusCircle,
  Phone,
  MessageSquare,
  Clock,
  CheckCircle,
  PackageCheck,
  Send,
  Eye,
  Filter,
  IndianRupee,
} from 'lucide-react';

interface JobsListViewProps {
  statusFilterTab?: 'all' | 'pending' | 'repaired' | 'ready' | 'dispatched';
  onOpenJobDetail: (job: JobCard) => void;
  onOpenNewJob: () => void;
}

export const JobsListView: React.FC<JobsListViewProps> = ({
  statusFilterTab = 'all',
  onOpenJobDetail,
  onOpenNewJob,
}) => {
  const { jobs, brands, updateJobStatus } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [specificStatus, setSpecificStatus] = useState<string>('All');

  // Filter jobs based on the parent tab + local filters
  const filteredJobs = jobs.filter(job => {
    if (job.isArchived) return false;

    // Tab-level filter
    if (statusFilterTab === 'pending') {
      if (['Repaired', 'Ready for Collection', 'Dispatched'].includes(job.status)) return false;
    } else if (statusFilterTab === 'repaired') {
      if (job.status !== 'Repaired') return false;
    } else if (statusFilterTab === 'ready') {
      if (job.status !== 'Ready for Collection') return false;
    } else if (statusFilterTab === 'dispatched') {
      if (job.status !== 'Dispatched') return false;
    }

    // Specific status dropdown
    if (specificStatus !== 'All' && job.status !== specificStatus) return false;

    // Brand filter
    if (selectedBrand !== 'All' && job.machineBrand !== selectedBrand) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchCustomer = (job.customerName || '').toLowerCase().includes(q);
      const matchPhone = (job.customerPhone || '').includes(q);
      const matchJob = (job.jobNumber || '').toLowerCase().includes(q);
      const matchModel = (job.machineModel || '').toLowerCase().includes(q);
      const matchComplaint = (job.customerComplaint || '').toLowerCase().includes(q);
      if (!matchCustomer && !matchPhone && !matchJob && !matchModel && !matchComplaint) return false;
    }

    return true;
  });

  const getTabTitle = () => {
    switch (statusFilterTab) {
      case 'pending':
        return 'Pending Repair Jobs (In Workshop)';
      case 'repaired':
        return 'Repaired & Tested Jobs';
      case 'ready':
        return 'Ready for Customer Collection';
      case 'dispatched':
        return 'Dispatched & Delivered Machines';
      default:
        return 'All Active Machine Jobs';
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Action */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-400" />
            <span>{getTabTitle()}</span>
          </h1>
          <p className="text-xs text-slate-400">
            Found {filteredJobs.length} active machines in this section
          </p>
        </div>

        <button
          onClick={onOpenNewJob}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition active:scale-95"
        >
          <PlusCircle className="w-4 h-4 text-slate-950" />
          <span>+ New Job Card</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search customer, phone, job # (e.g. NW-0001), model..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Brand Filter */}
          <select
            value={selectedBrand}
            onChange={e => setSelectedBrand(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="All">All Brands</option>
            {brands.map(b => (
              <option key={b.id} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Specific Status (only when in All Jobs or Pending) */}
          {statusFilterTab === 'all' && (
            <select
              value={specificStatus}
              onChange={e => setSpecificStatus(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="All">All Statuses</option>
              <option value="Received">Received</option>
              <option value="Under Repair">Under Repair</option>
              <option value="Waiting for Parts">Waiting for Parts</option>
              <option value="Waiting for Customer Approval">Waiting Approval</option>
              <option value="Repaired">Repaired</option>
              <option value="Ready for Collection">Ready for Collection</option>
              <option value="Dispatched">Dispatched</option>
            </select>
          )}
        </div>
      </div>

      {/* Jobs Table & Mobile Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3">Job No</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Machine</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Received</th>
                <th className="py-3 px-3">Expected</th>
                <th className="py-3 px-3 text-right">Charges</th>
                <th className="py-3 px-3 text-right">Balance</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No active jobs match this view.
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

                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-200">{job.machineBrand}</span>{' '}
                        <span className="text-slate-400">{job.machineModel}</span>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
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

                      <td className="py-3 px-3 text-slate-300 font-mono text-[11px]">
                        {job.expectedDeliveryDate || 'N/A'}
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

                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onOpenJobDetail(job);
                          }}
                          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 font-bold text-slate-200 text-[11px] transition shadow"
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
