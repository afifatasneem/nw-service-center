import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { JobCard, CustomerMachine, JobStatus } from '../types';
import { AddMachineModal } from './AddMachineModal';
import { EditMachineModal } from './EditMachineModal';
import {
  Users,
  Search,
  Phone,
  Wrench,
  Calendar,
  ChevronRight,
  IndianRupee,
  Boxes,
  Send,
  FileText,
  User,
  Plus,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Image,
  ExternalLink,
  Edit2,
  Layers,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Eye,
  Filter,
  X,
} from 'lucide-react';

interface CustomerHistoryViewProps {
  onOpenJobDetail: (job: JobCard) => void;
  onOpenNewJob?: (customerName?: string, customerPhone?: string, machine?: CustomerMachine | null) => void;
}

// Enriched machine item combining registry + associated Job Cards
export interface EnrichedMachine {
  id: string;
  brand: string;
  model: string;
  type: string;
  serialNumber: string;
  photoUrl?: string;
  notes?: string;
  jobs: JobCard[];
  latestJob: JobCard | null;
  // Specific machine status derived from latest job
  currentStatus: JobStatus | 'Registered (No Active Jobs)';
  totalJobsCount: number;
}

interface CustomerProfileSummary {
  name: string;
  phone: string;
  machines: EnrichedMachine[];
  allJobs: JobCard[];
  totalMachinesCount: number;
  activeJobsCount: number;
  pendingJobsCount: number;
  completedJobsCount: number;
  totalPendingAmount: number;
  totalPaidAmount: number;
  totalBilledAmount: number;
  latestVisit: string;
}

export const CustomerHistoryView: React.FC<CustomerHistoryViewProps> = ({
  onOpenJobDetail,
  onOpenNewJob,
}) => {
  const { jobs, customerMachines } = useData();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'profiles' | 'all-machines'>('profiles');
  const [filterOption, setFilterOption] = useState<'all' | 'active' | 'pending-pay' | 'multi-machine'>('all');
  const [selectedCustomerKey, setSelectedCustomerKey] = useState<string | null>(null);

  // Modals
  const [isAddMachineOpen, setIsAddMachineOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<CustomerMachine | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Machine History Drawer / Modal (if machine has multiple jobs)
  const [historyMachine, setHistoryMachine] = useState<EnrichedMachine | null>(null);

  // 1. Group all Customer Machines and Job Cards into Customer Profiles
  const customersSummary = useMemo(() => {
    const map = new Map<string, CustomerProfileSummary>();

    // Step A: Seed customers from customerMachines
    customerMachines.forEach(m => {
      const cleanPhone = (m.customerPhone || '').trim();
      const cleanName = (m.customerName || 'Customer').trim();
      const key = `${cleanName.toLowerCase()}__${cleanPhone}`;

      if (!map.has(key)) {
        map.set(key, {
          name: cleanName,
          phone: cleanPhone,
          machines: [],
          allJobs: [],
          totalMachinesCount: 0,
          activeJobsCount: 0,
          pendingJobsCount: 0,
          completedJobsCount: 0,
          totalPendingAmount: 0,
          totalPaidAmount: 0,
          totalBilledAmount: 0,
          latestVisit: m.createdAt || '',
        });
      }
    });

    // Step B: Seed customers from historical jobs (in case any exist without explicit machine doc)
    jobs.forEach(j => {
      const cleanPhone = (j.customerPhone || '').trim();
      const cleanName = (j.customerName || 'Customer').trim();
      const key = `${cleanName.toLowerCase()}__${cleanPhone}`;

      if (!map.has(key)) {
        map.set(key, {
          name: cleanName,
          phone: cleanPhone,
          machines: [],
          allJobs: [],
          totalMachinesCount: 0,
          activeJobsCount: 0,
          pendingJobsCount: 0,
          completedJobsCount: 0,
          totalPendingAmount: 0,
          totalPaidAmount: 0,
          totalBilledAmount: 0,
          latestVisit: j.receivedDate || '',
        });
      }
    });

    // Step C: Build machines list for each customer
    map.forEach((profile, key) => {
      const custPhone = profile.phone;
      const custNameLower = profile.name.toLowerCase();

      // Find all jobs for this customer
      const custJobs = jobs.filter(
        j => (j.customerPhone || '').trim() === custPhone ||
             (j.customerName || '').trim().toLowerCase() === custNameLower
      );
      profile.allJobs = custJobs;

      // Find explicit machines for this customer
      const explicitMachines = customerMachines.filter(
        m => (m.customerPhone || '').trim() === custPhone ||
             (m.customerName || '').trim().toLowerCase() === custNameLower
      );

      const machinesMap = new Map<string, EnrichedMachine>();

      // Register explicit machines
      explicitMachines.forEach(m => {
        const mKey = m.id;
        machinesMap.set(mKey, {
          id: m.id,
          brand: m.machineBrand,
          model: m.machineModel,
          type: m.machineType,
          serialNumber: m.serialNumber || 'N/A',
          photoUrl: m.photoUrl,
          notes: m.notes,
          jobs: [],
          latestJob: null,
          currentStatus: 'Registered (No Active Jobs)',
          totalJobsCount: 0,
        });
      });

      // Match jobs to machines
      custJobs.forEach(j => {
        let assignedMachine: EnrichedMachine | undefined;

        if (j.machineId && machinesMap.has(j.machineId)) {
          assignedMachine = machinesMap.get(j.machineId);
        } else {
          // Match by brand + model + serialNumber
          for (const m of machinesMap.values()) {
            const sameBrand = m.brand.toLowerCase() === j.machineBrand.toLowerCase();
            const sameModel = m.model.toLowerCase() === j.machineModel.toLowerCase();
            const sameSerial =
              j.serialNumber && j.serialNumber !== 'N/A' && m.serialNumber !== 'N/A'
                ? m.serialNumber.toLowerCase() === j.serialNumber.toLowerCase()
                : true;

            if (sameBrand && sameModel && sameSerial) {
              assignedMachine = m;
              break;
            }
          }
        }

        // If job is for an implicit machine not yet in customerMachines registry, auto-create it
        if (!assignedMachine) {
          const autoKey = `hist_${j.machineBrand}_${j.machineModel}_${j.serialNumber || 'NA'}`;
          if (!machinesMap.has(autoKey)) {
            machinesMap.set(autoKey, {
              id: j.machineId || autoKey,
              brand: j.machineBrand,
              model: j.machineModel,
              type: j.machineType,
              serialNumber: j.serialNumber || 'N/A',
              photoUrl: j.photoUrl,
              notes: j.notes,
              jobs: [],
              latestJob: null,
              currentStatus: 'Registered (No Active Jobs)',
              totalJobsCount: 0,
            });
          }
          assignedMachine = machinesMap.get(autoKey)!;
        }

        assignedMachine.jobs.push(j);
      });

      // Process each machine's jobs & status
      const enrichedList: EnrichedMachine[] = [];
      machinesMap.forEach(m => {
        // Sort jobs descending by date
        m.jobs.sort((a, b) => (b.createdAt || b.receivedDate).localeCompare(a.createdAt || a.receivedDate));
        m.totalJobsCount = m.jobs.length;
        m.latestJob = m.jobs[0] || null;

        if (m.latestJob) {
          m.currentStatus = m.latestJob.status;
          if (!m.photoUrl && m.latestJob.photoUrl) {
            m.photoUrl = m.latestJob.photoUrl;
          }
        }

        enrichedList.push(m);
      });

      profile.machines = enrichedList;
      profile.totalMachinesCount = enrichedList.length;

      // Calculate Customer KPI Totals:
      // Active Jobs: Received, Under Repair
      // Pending Jobs: Waiting for Parts, Waiting for Customer Approval, or has balance due
      // Completed Jobs: Repaired, Ready for Collection, Dispatched
      let activeCount = 0;
      let pendingCount = 0;
      let completedCount = 0;
      let totalPending = 0;
      let totalBilled = 0;
      let totalPaid = 0;

      custJobs.forEach(job => {
        totalBilled += job.repairCharges || 0;
        totalPending += job.balance || 0;

        const paid = (job.advance || 0) + (job.payments || []).reduce((s, p) => s + (p.amount || 0), 0);
        totalPaid += paid;

        if (job.status === 'Received' || job.status === 'Under Repair') {
          activeCount++;
        } else if (
          job.status === 'Waiting for Parts' ||
          job.status === 'Waiting for Customer Approval'
        ) {
          pendingCount++;
        } else if (
          job.status === 'Repaired' ||
          job.status === 'Ready for Collection' ||
          job.status === 'Dispatched'
        ) {
          completedCount++;
        }
      });

      profile.activeJobsCount = activeCount;
      profile.pendingJobsCount = pendingCount;
      profile.completedJobsCount = completedCount;
      profile.totalPendingAmount = totalPending;
      profile.totalBilledAmount = totalBilled;
      profile.totalPaidAmount = totalPaid;
    });

    return Array.from(map.values()).sort((a, b) => {
      // Prioritize customers with active jobs or high machine counts
      if (b.activeJobsCount !== a.activeJobsCount) {
        return b.activeJobsCount - a.activeJobsCount;
      }
      return b.totalMachinesCount - a.totalMachinesCount;
    });
  }, [jobs, customerMachines]);

  // 2. Comprehensive Search Filter:
  // Customer Name, Mobile Number, Brand, Model, Serial Number, Job Number
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return customersSummary.filter(cust => {
      // Query match
      const matchName = cust.name.toLowerCase().includes(q);
      const matchPhone = cust.phone.includes(q);
      const matchBrand = cust.machines.some(m => m.brand.toLowerCase().includes(q));
      const matchModel = cust.machines.some(m => m.model.toLowerCase().includes(q));
      const matchSerial = cust.machines.some(m => m.serialNumber.toLowerCase().includes(q));
      const matchJob = cust.allJobs.some(j => j.jobNumber.toLowerCase().includes(q));

      const queryMatches = !q || matchName || matchPhone || matchBrand || matchModel || matchSerial || matchJob;
      if (!queryMatches) return false;

      // Filter category
      if (filterOption === 'active') return cust.activeJobsCount > 0;
      if (filterOption === 'pending-pay') return cust.totalPendingAmount > 0;
      if (filterOption === 'multi-machine') return cust.totalMachinesCount >= 2;

      return true;
    });
  }, [customersSummary, searchQuery, filterOption]);

  // Active Selected Customer
  const activeCustomer = useMemo(() => {
    if (selectedCustomerKey) {
      const found = customersSummary.find(
        c => `${c.name.toLowerCase()}__${c.phone}` === selectedCustomerKey
      );
      if (found) return found;
    }
    return filteredCustomers[0] || customersSummary[0] || null;
  }, [customersSummary, filteredCustomers, selectedCustomerKey]);

  // All Machines Fleet list for flat directory view
  const allFleetMachines = useMemo(() => {
    const list: Array<{
      machine: EnrichedMachine;
      customerName: string;
      customerPhone: string;
    }> = [];

    customersSummary.forEach(c => {
      c.machines.forEach(m => {
        list.push({
          machine: m,
          customerName: c.name,
          customerPhone: c.phone,
        });
      });
    });

    const q = searchQuery.toLowerCase().trim();
    if (!q) return list;

    return list.filter(item => {
      return (
        item.customerName.toLowerCase().includes(q) ||
        item.customerPhone.includes(q) ||
        item.machine.brand.toLowerCase().includes(q) ||
        item.machine.model.toLowerCase().includes(q) ||
        item.machine.serialNumber.toLowerCase().includes(q) ||
        (item.machine.latestJob && item.machine.latestJob.jobNumber.toLowerCase().includes(q))
      );
    });
  }, [customersSummary, searchQuery]);

  // Quick WhatsApp link for customer
  const handleOpenWhatsApp = (customer: CustomerProfileSummary) => {
    const clean = customer.phone.replace(/[^0-9]/g, '');
    const phone = clean.length === 10 ? `91${clean}` : clean;
    const msg = encodeURIComponent(
      `Hello ${customer.name}, NW Service Center Solapur update regarding your welding machine(s).`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  // Helper for status badge style
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Repaired':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'Ready for Collection':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Dispatched':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'Under Repair':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse';
      case 'Waiting for Parts':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'Waiting for Customer Approval':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'Received':
        return 'bg-slate-800 text-slate-300 border-slate-700';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Search Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-inner">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-white">
                  Customer Directory & Multi-Machine Fleet
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                  Unlimited Machines per Customer
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage customer welding machines, Job Cards, quotations, payments, and dispatch history
              </p>
            </div>
          </div>

          {/* Search Bar supporting Customer Name, Mobile, Brand, Model, Serial #, Job # */}
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search by Name, Phone, Brand, Model, Serial #, Job #..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* View Switcher & Filter Pills */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Main View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('profiles')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === 'profiles'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Customer Profiles ({customersSummary.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('all-machines')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === 'all-machines'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>All Machines Directory ({allFleetMachines.length})</span>
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-500 font-semibold mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter:
            </span>
            <button
              onClick={() => setFilterOption('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                filterOption === 'all'
                  ? 'bg-slate-800 text-amber-400 border border-amber-500/40'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-850'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterOption('active')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                filterOption === 'active'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-850'
              }`}
            >
              Active Repair
            </button>
            <button
              onClick={() => setFilterOption('pending-pay')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                filterOption === 'pending-pay'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/50'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-850'
              }`}
            >
              Balance Due
            </button>
            <button
              onClick={() => setFilterOption('multi-machine')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                filterOption === 'multi-machine'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-850'
              }`}
            >
              Multi-Machine (2+)
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: CUSTOMER PROFILES (SPLIT VIEW) */}
      {activeTab === 'profiles' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Customer Accounts List */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2 max-h-[82vh] overflow-y-auto">
            <div className="pb-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-bold">
              <span>Customers ({filteredCustomers.length})</span>
              <span>Fleet Machines</span>
            </div>

            {filteredCustomers.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No matching customers found.
              </div>
            ) : (
              filteredCustomers.map(cust => {
                const key = `${cust.name.toLowerCase()}__${cust.phone}`;
                const isSelected =
                  activeCustomer &&
                  `${activeCustomer.name.toLowerCase()}__${activeCustomer.phone}` === key;

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedCustomerKey(key)}
                    className={`w-full p-3 rounded-xl text-left transition flex items-center justify-between group ${
                      isSelected
                        ? 'bg-amber-500/15 border-2 border-amber-500'
                        : 'bg-slate-950/70 border border-slate-800 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-white text-xs truncate group-hover:text-amber-400 transition">
                          {cust.name}
                        </p>
                        {cust.totalMachinesCount > 1 && (
                          <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                            {cust.totalMachinesCount} machines
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                        {cust.phone}
                      </p>

                      {/* Status Snippet */}
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {cust.activeJobsCount > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                            {cust.activeJobsCount} in repair
                          </span>
                        )}
                        {cust.totalPendingAmount > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-300">
                            Due: ₹{cust.totalPendingAmount.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-slate-800 text-amber-400 text-xs font-black border border-slate-700">
                        {cust.totalMachinesCount}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right Column: Complete Customer Profile with Multi-Machines Section */}
          <div className="lg:col-span-8 space-y-6">
            {activeCustomer ? (
              <>
                {/* 1. Profile Header Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black text-white flex items-center gap-2">
                          <User className="w-5 h-5 text-amber-400" />
                          {activeCustomer.name}
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-amber-400 text-xs font-black">
                          {activeCustomer.totalMachinesCount} Machine{activeCustomer.totalMachinesCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs">
                        <a
                          href={`tel:${activeCustomer.phone}`}
                          className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          +91 {activeCustomer.phone}
                        </a>
                        <span className="text-slate-600">•</span>
                        <button
                          onClick={() => handleOpenWhatsApp(activeCustomer)}
                          className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          WhatsApp
                        </button>
                      </div>
                    </div>

                    {/* Action Buttons: + Add More Machine & + New Job */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => setIsAddMachineOpen(true)}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>+ Add More Machine</span>
                      </button>

                      {onOpenNewJob && (
                        <button
                          onClick={() =>
                            onOpenNewJob(activeCustomer.name, activeCustomer.phone, null)
                          }
                          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/40 font-bold text-xs transition flex items-center gap-1.5"
                        >
                          <PlusCircle className="w-4 h-4" />
                          <span>+ New Job Card</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 2. Customer Profile KPI Metrics (REQUIRED BY USER PROMPT) */}
                  {/* Total Machines | Active Jobs | Pending Jobs | Completed Jobs | Total Pending Amount */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                    {/* Total Machines */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Total Machines
                      </span>
                      <p className="text-lg font-black text-amber-400 mt-0.5">
                        {activeCustomer.totalMachinesCount}
                      </p>
                      <span className="text-[10px] text-slate-500">Registered fleet</span>
                    </div>

                    {/* Active Jobs */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Active Jobs
                      </span>
                      <p className="text-lg font-black text-amber-300 mt-0.5">
                        {activeCustomer.activeJobsCount}
                      </p>
                      <span className="text-[10px] text-slate-500">In shop / repair</span>
                    </div>

                    {/* Pending Jobs */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Pending Jobs
                      </span>
                      <p className="text-lg font-black text-rose-400 mt-0.5">
                        {activeCustomer.pendingJobsCount}
                      </p>
                      <span className="text-[10px] text-slate-500">Parts / approval</span>
                    </div>

                    {/* Completed Jobs */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Completed Jobs
                      </span>
                      <p className="text-lg font-black text-emerald-400 mt-0.5">
                        {activeCustomer.completedJobsCount}
                      </p>
                      <span className="text-[10px] text-slate-500">Repaired / delivered</span>
                    </div>

                    {/* Total Pending Amount */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Total Pending
                      </span>
                      <p
                        className={`text-lg font-black mt-0.5 ${
                          activeCustomer.totalPendingAmount > 0
                            ? 'text-red-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        ₹{activeCustomer.totalPendingAmount.toLocaleString('en-IN')}
                      </p>
                      <span className="text-[10px] text-slate-500">
                        {activeCustomer.totalPendingAmount > 0 ? 'Balance due' : 'All clear'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. DEDICATED SECTION: My Machines / Customer Machines (REQUIRED BY USER PROMPT) */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div>
                      <h3 className="text-base font-black text-white flex items-center gap-2">
                        <Wrench className="w-5 h-5 text-amber-400" />
                        <span>My Machines / Customer Machines</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold">
                          {activeCustomer.machines.length}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        All welding machines owned by {activeCustomer.name}. Each machine has its own Job Card, history, and quotation.
                      </p>
                    </div>

                    <button
                      onClick={() => setIsAddMachineOpen(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow transition flex items-center gap-1 self-start sm:self-auto"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>+ Add More Machine</span>
                    </button>
                  </div>

                  {/* Unlimited Machines Grid */}
                  {activeCustomer.machines.length === 0 ? (
                    <div className="text-center py-10 bg-slate-950 rounded-xl border border-slate-800/80 p-6 space-y-3">
                      <Wrench className="w-10 h-10 text-slate-600 mx-auto" />
                      <p className="text-sm font-bold text-slate-300">
                        No welding machines registered for this customer yet.
                      </p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Add their first welding machine to start logging repair jobs, quotes, and payment cards.
                      </p>
                      <button
                        onClick={() => setIsAddMachineOpen(true)}
                        className="mt-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Add More Machine</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {activeCustomer.machines.map((mach, idx) => {
                        const latest = mach.latestJob;
                        const quoteAmount = latest?.quotation?.totalAmount || latest?.repairCharges || 0;
                        const paidAmount =
                          (latest?.advance || 0) +
                          (latest?.payments || []).reduce((s, p) => s + (p.amount || 0), 0);
                        const balanceAmount = latest?.balance ?? 0;

                        return (
                          <div
                            key={mach.id}
                            className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 transition shadow-lg space-y-3.5"
                          >
                            {/* Machine Card Header */}
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-850">
                              <div className="flex items-start gap-3">
                                {/* Machine Photo Thumbnail or Icon */}
                                {mach.photoUrl ? (
                                  <div
                                    onClick={() => setPreviewPhotoUrl(mach.photoUrl!)}
                                    className="w-14 h-14 rounded-xl overflow-hidden border border-slate-700 shrink-0 cursor-pointer group relative shadow"
                                    title="Click to zoom photo"
                                  >
                                    <img
                                      src={mach.photoUrl}
                                      alt={mach.model}
                                      className="w-full h-full object-cover group-hover:scale-105 transition"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                      <Eye className="w-4 h-4 text-white" />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-14 h-14 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                                    <Wrench className="w-7 h-7" />
                                  </div>
                                )}

                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                      Machine #{idx + 1}
                                    </span>
                                    <h4 className="text-base font-black text-white">
                                      {mach.brand} {mach.model}
                                    </h4>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-cyan-300 border border-slate-800">
                                      {mach.type}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                    <span className="font-mono text-slate-300">
                                      SN: <strong>{mach.serialNumber || 'N/A'}</strong>
                                    </span>
                                    {mach.notes && (
                                      <>
                                        <span>•</span>
                                        <span className="text-slate-400 truncate max-w-xs">
                                          {mach.notes}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Status & Edit Controls */}
                              <div className="flex items-center gap-2 self-start sm:self-auto">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-black border ${getStatusBadge(
                                    mach.currentStatus
                                  )}`}
                                >
                                  {mach.currentStatus}
                                </span>

                                <button
                                  onClick={() => {
                                    const raw = customerMachines.find(m => m.id === mach.id) || {
                                      id: mach.id,
                                      customerName: activeCustomer.name,
                                      customerPhone: activeCustomer.phone,
                                      machineBrand: mach.brand,
                                      machineModel: mach.model,
                                      machineType: mach.type,
                                      serialNumber: mach.serialNumber,
                                      photoUrl: mach.photoUrl,
                                      notes: mach.notes,
                                      createdAt: '',
                                      updatedAt: '',
                                    };
                                    setEditingMachine(raw);
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-850 transition"
                                  title="Edit machine details"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Machine Specific Details (REQUIRED FIELDS IN PROMPT) */}
                            {latest ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs bg-slate-900/70 p-3.5 rounded-xl border border-slate-850">
                                {/* Col 1: Job Number & Received Date */}
                                <div className="space-y-1">
                                  <span className="text-[10px] text-slate-500 font-bold uppercase block">
                                    Job & Receiving
                                  </span>
                                  <p className="font-mono font-black text-amber-400 text-sm">
                                    {latest.jobNumber}
                                  </p>
                                  <p className="text-slate-400 text-[11px] flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-slate-500" />
                                    {latest.receivedDate}
                                  </p>
                                </div>

                                {/* Col 2: Complaint & Fault */}
                                <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                                  <span className="text-[10px] text-slate-500 font-bold uppercase block">
                                    Customer Complaint
                                  </span>
                                  <p className="text-slate-200 font-medium line-clamp-2">
                                    {latest.customerComplaint || 'General checkup & repair'}
                                  </p>
                                  <p className="text-[11px] text-slate-400">
                                    Tech: <strong className="text-white">{latest.technicianName || 'Unassigned'}</strong>
                                  </p>
                                </div>

                                {/* Col 3: Quotation, Advance, Balance */}
                                <div className="space-y-1">
                                  <span className="text-[10px] text-slate-500 font-bold uppercase block">
                                    Quotation & Payment
                                  </span>
                                  <p className="text-slate-300">
                                    Charges: <strong className="text-white">₹{quoteAmount.toLocaleString('en-IN')}</strong>
                                  </p>
                                  <p className="text-slate-300">
                                    Advance: <strong className="text-emerald-400">₹{paidAmount.toLocaleString('en-IN')}</strong>
                                  </p>
                                  <p className="font-bold">
                                    Balance:{' '}
                                    <span className={balanceAmount > 0 ? 'text-red-400' : 'text-emerald-400'}>
                                      ₹{balanceAmount.toLocaleString('en-IN')}
                                    </span>
                                  </p>
                                </div>

                                {/* Col 4: Dispatch Details */}
                                <div className="space-y-1">
                                  <span className="text-[10px] text-slate-500 font-bold uppercase block">
                                    Dispatch Details
                                  </span>
                                  {latest.dispatchDetails ? (
                                    <div className="space-y-0.5 text-purple-300">
                                      <p className="font-bold flex items-center gap-1">
                                        <Truck className="w-3 h-3 text-purple-400" />
                                        Dispatched {latest.dispatchDetails.dispatchedDate}
                                      </p>
                                      <p className="text-[10px] text-slate-400">
                                        By {latest.dispatchDetails.dispatchedBy} via {latest.dispatchDetails.deliveryMethod}
                                      </p>
                                    </div>
                                  ) : (
                                    <p className="text-slate-500 text-[11px]">
                                      {latest.status === 'Ready for Collection'
                                        ? 'Ready for collection at Solapur shop'
                                        : 'Not yet dispatched'}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-850 text-xs text-slate-400 flex items-center justify-between">
                                <span>No active job recorded for this machine.</span>
                                {onOpenNewJob && (
                                  <button
                                    onClick={() => {
                                      const rawMach: CustomerMachine = {
                                        id: mach.id,
                                        customerName: activeCustomer.name,
                                        customerPhone: activeCustomer.phone,
                                        machineBrand: mach.brand,
                                        machineModel: mach.model,
                                        machineType: mach.type,
                                        serialNumber: mach.serialNumber,
                                        photoUrl: mach.photoUrl,
                                        notes: mach.notes,
                                        createdAt: '',
                                        updatedAt: '',
                                      };
                                      onOpenNewJob(activeCustomer.name, activeCustomer.phone, rawMach);
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-xs hover:bg-amber-500 hover:text-slate-950 transition"
                                  >
                                    + Create Job Card
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Machine Actions Footer */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-850 text-xs">
                              {/* Left: Multi-job history indicator */}
                              <div className="flex items-center gap-2">
                                {mach.jobs.length > 1 && (
                                  <button
                                    onClick={() => setHistoryMachine(mach)}
                                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-400 text-[11px] font-semibold border border-cyan-500/30 transition flex items-center gap-1"
                                  >
                                    <Clock className="w-3 h-3" />
                                    <span>Repair History ({mach.jobs.length} jobs)</span>
                                  </button>
                                )}
                              </div>

                              {/* Right: Quick Actions */}
                              <div className="flex items-center gap-2">
                                {onOpenNewJob && (
                                  <button
                                    onClick={() => {
                                      const rawMach: CustomerMachine = {
                                        id: mach.id,
                                        customerName: activeCustomer.name,
                                        customerPhone: activeCustomer.phone,
                                        machineBrand: mach.brand,
                                        machineModel: mach.model,
                                        machineType: mach.type,
                                        serialNumber: mach.serialNumber,
                                        photoUrl: mach.photoUrl,
                                        notes: mach.notes,
                                        createdAt: '',
                                        updatedAt: '',
                                      };
                                      onOpenNewJob(activeCustomer.name, activeCustomer.phone, rawMach);
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-750 font-bold text-xs transition flex items-center gap-1"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>+ New Job for this Machine</span>
                                  </button>
                                )}

                                {latest && (
                                  <button
                                    onClick={() => onOpenJobDetail(latest)}
                                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow transition flex items-center gap-1"
                                  >
                                    <span>View Job Card</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 4. Complete Service Ledger & Job Cards History for this customer */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <h3 className="text-base font-black text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-amber-400" />
                        <span>All Job Cards & Service Ledger</span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-bold">
                          {activeCustomer.allJobs.length}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Permanent chronological history of every job card issued to {activeCustomer.name}
                      </p>
                    </div>
                  </div>

                  {activeCustomer.allJobs.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs">
                      No service jobs created yet for this customer.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {activeCustomer.allJobs.map(job => (
                        <div
                          key={job.id}
                          onClick={() => onOpenJobDetail(job)}
                          className="cursor-pointer p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-amber-400 text-xs">
                                {job.jobNumber}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                                  job.status
                                )}`}
                              >
                                {job.status}
                              </span>
                              <span className="text-white font-bold text-xs">
                                {job.machineBrand} {job.machineModel}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-1">
                              Fault: <span className="text-slate-300">{job.customerComplaint}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-4 text-xs shrink-0 justify-between sm:justify-end">
                            <div className="text-left sm:text-right">
                              <p className="text-white font-bold">
                                ₹{job.repairCharges.toLocaleString('en-IN')}
                              </p>
                              <p
                                className={`text-[11px] font-semibold ${
                                  job.balance > 0 ? 'text-red-400' : 'text-emerald-400'
                                }`}
                              >
                                {job.balance > 0
                                  ? `Due: ₹${job.balance.toLocaleString('en-IN')}`
                                  : 'Paid'}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-24 bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-500 text-xs">
                Select a customer from the left to view their profile, multiple machines, and complete service history.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: ALL FLEET MACHINES DIRECTORY (FLAT CATALOG) */}
      {activeTab === 'all-machines' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-400" />
                <span>All Customer Welding Machines Directory</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 text-xs font-bold">
                  {allFleetMachines.length} Machines
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Search and lookup any machine in Solapur by Brand, Model, Serial Number, Owner, or Job Number
              </p>
            </div>
          </div>

          {allFleetMachines.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs">
              No matching machines found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allFleetMachines.map(({ machine, customerName, customerPhone }) => {
                const latest = machine.latestJob;
                return (
                  <div
                    key={machine.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 transition flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-cyan-400 font-bold uppercase block">
                            {machine.type}
                          </span>
                          <h4 className="text-sm font-black text-white">
                            {machine.brand} {machine.model}
                          </h4>
                          <p className="text-[11px] font-mono text-slate-400">
                            SN: {machine.serialNumber || 'N/A'}
                          </p>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${getStatusBadge(
                            machine.currentStatus
                          )}`}
                        >
                          {machine.currentStatus}
                        </span>
                      </div>

                      {/* Owner info */}
                      <div className="mt-3 pt-2 border-t border-slate-850 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">
                            Customer
                          </span>
                          <p className="font-bold text-amber-400">{customerName}</p>
                          <p className="text-[11px] text-slate-400">{customerPhone}</p>
                        </div>

                        {latest && (
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 font-bold uppercase block">
                              Latest Job
                            </span>
                            <span className="font-mono text-xs font-bold text-white">
                              {latest.jobNumber}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-slate-850 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setSelectedCustomerKey(`${customerName.toLowerCase()}__${customerPhone}`);
                          setActiveTab('profiles');
                        }}
                        className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1"
                      >
                        <span>Open Customer Profile</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>

                      {latest && (
                        <button
                          onClick={() => onOpenJobDetail(latest)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow"
                        >
                          View Job
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Global Modals */}

      {/* 1. Add Machine to Customer Modal */}
      {activeCustomer && (
        <AddMachineModal
          isOpen={isAddMachineOpen}
          onClose={() => setIsAddMachineOpen(false)}
          customerName={activeCustomer.name}
          customerPhone={activeCustomer.phone}
          onMachineAdded={(_newMach, createdJob) => {
            if (createdJob) {
              onOpenJobDetail(createdJob);
            }
          }}
        />
      )}

      {/* 2. Edit Machine Details Modal */}
      <EditMachineModal
        isOpen={!!editingMachine}
        onClose={() => setEditingMachine(null)}
        machine={editingMachine}
      />

      {/* 3. Machine Photo Zoom Modal */}
      {previewPhotoUrl && (
        <div
          onClick={() => setPreviewPhotoUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 cursor-pointer"
        >
          <div className="relative max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
            <img
              src={previewPhotoUrl}
              alt="Machine Enlarge"
              className="w-full h-full object-contain"
            />
            <button
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 4. Machine Repair History Drawer / Modal */}
      {historyMachine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-750 shadow-2xl text-slate-100 my-auto flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-black text-white">
                    Repair History: {historyMachine.brand} {historyMachine.model}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Serial: {historyMachine.serialNumber} • {historyMachine.jobs.length} jobs on record
                  </p>
                </div>
              </div>
              <button
                onClick={() => setHistoryMachine(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3">
              {historyMachine.jobs.map(j => (
                <div
                  key={j.id}
                  onClick={() => {
                    setHistoryMachine(null);
                    onOpenJobDetail(j);
                  }}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 cursor-pointer transition flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400 text-xs">
                        {j.jobNumber}
                      </span>
                      <span
                        className={`px-2 py-0.2 rounded-full text-[10px] font-bold border ${getStatusBadge(
                          j.status
                        )}`}
                      >
                        {j.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-1">{j.customerComplaint}</p>
                    <p className="text-[10px] text-slate-500">Received: {j.receivedDate}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-bold text-white">
                      ₹{j.repairCharges.toLocaleString('en-IN')}
                    </p>
                    <ChevronRight className="w-4 h-4 text-slate-500 inline ml-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
