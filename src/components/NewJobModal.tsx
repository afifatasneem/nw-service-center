import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { JobCard, JobStatus, CustomerMachine } from '../types';
import { formatISTDateTime, formatISTDateOnly, calculateDueDate } from '../lib/dateUtils';
import {
  X,
  PlusCircle,
  Camera,
  Wrench,
  CheckCircle,
  Calendar,
  IndianRupee,
  Phone,
  User,
  Plus,
  Layers,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface NewJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobCreated?: (job: JobCard) => void;
  initialCustomerName?: string;
  initialCustomerPhone?: string;
  initialMachine?: CustomerMachine | null;
}

export const NewJobModal: React.FC<NewJobModalProps> = ({
  isOpen,
  onClose,
  onJobCreated,
  initialCustomerName = '',
  initialCustomerPhone = '',
  initialMachine = null,
}) => {
  const { brands, technicians, createJob, addBrand, jobs, customerMachines } = useData();

  // Automatic IST timestamp for machine received
  const [receivedDate] = useState<string>(formatISTDateTime());

  // Customer Mode: 'new' or 'existing'
  const [customerMode, setCustomerMode] = useState<'new' | 'existing'>('new');
  const [selectedExistingPhone, setSelectedExistingPhone] = useState<string>('');

  // Machine Selection Mode
  const [selectedMachineId, setSelectedMachineId] = useState<string>('__new_machine__');

  // Form Fields
  const [customerName, setCustomerName] = useState(initialCustomerName);
  const [customerPhone, setCustomerPhone] = useState(initialCustomerPhone);
  const [machineBrand, setMachineBrand] = useState('Ador');
  const [machineModel, setMachineModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [machineType, setMachineType] = useState('ARC Inverter');
  const [customerComplaint, setCustomerComplaint] = useState('');
  const [expectedCompletionDate, setExpectedCompletionDate] = useState(
    formatISTDateOnly(new Date(Date.now() + 86400000 * 2))
  );
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(
    formatISTDateOnly(new Date(Date.now() + 86400000 * 3))
  );
  const [technicianName, setTechnicianName] = useState('');
  const [repairCharges, setRepairCharges] = useState<number | ''>(0);
  const [advance, setAdvance] = useState<number | ''>(0);
  const [paymentDueDate, setPaymentDueDate] = useState<string>(calculateDueDate(3));
  const [status, setStatus] = useState<JobStatus>('Received');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string>('');

  // Inline "Add New Brand" toggle
  const [isAddingNewBrand, setIsAddingNewBrand] = useState(false);
  const [customBrandName, setCustomBrandName] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compute distinct existing customers from jobs and customerMachines
  const existingCustomers = useMemo(() => {
    const map = new Map<string, { name: string; phone: string; machineCount: number }>();
    jobs.forEach(j => {
      const cleanPhone = (j.customerPhone || '').trim();
      const cleanName = (j.customerName || 'Customer').trim();
      if (cleanPhone) {
        if (!map.has(cleanPhone)) {
          map.set(cleanPhone, { name: cleanName, phone: cleanPhone, machineCount: 0 });
        }
      }
    });

    customerMachines.forEach(m => {
      const cleanPhone = (m.customerPhone || '').trim();
      const cleanName = (m.customerName || 'Customer').trim();
      if (cleanPhone && !map.has(cleanPhone)) {
        map.set(cleanPhone, { name: cleanName, phone: cleanPhone, machineCount: 0 });
      }
    });

    // Count distinct machines for each phone
    map.forEach((val, phone) => {
      const machCount = customerMachines.filter(m => m.customerPhone.trim() === phone).length;
      val.machineCount = Math.max(machCount, jobs.filter(j => j.customerPhone.trim() === phone).length);
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [jobs, customerMachines]);

  // Set initial customer or machine if passed via props
  useEffect(() => {
    if (initialCustomerPhone) {
      setCustomerMode('existing');
      setSelectedExistingPhone(initialCustomerPhone);
      setCustomerPhone(initialCustomerPhone);
      setCustomerName(initialCustomerName);
    }
    if (initialMachine) {
      setSelectedMachineId(initialMachine.id);
      setMachineBrand(initialMachine.machineBrand);
      setMachineModel(initialMachine.machineModel);
      setMachineType(initialMachine.machineType);
      setSerialNumber(initialMachine.serialNumber || '');
      setPhotoUrl(initialMachine.photoUrl || '');
    }
  }, [initialCustomerPhone, initialCustomerName, initialMachine]);

  // Machines belonging to the currently selected customer
  const customerExistingMachines = useMemo(() => {
    if (!customerPhone.trim()) return [];
    const clean = customerPhone.trim();

    const list: CustomerMachine[] = [];
    const seen = new Set<string>();

    customerMachines
      .filter(m => m.customerPhone.trim() === clean)
      .forEach(m => {
        const key = `${m.machineBrand}__${m.machineModel}__${m.serialNumber || 'N/A'}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push(m);
        }
      });

    // Also pull any machine from historical jobs not yet in customerMachines
    jobs.forEach(j => {
      if (j.customerPhone.trim() === clean) {
        const key = `${j.machineBrand}__${j.machineModel}__${j.serialNumber || 'N/A'}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            id: j.machineId || `hist_${j.id}`,
            customerName: j.customerName,
            customerPhone: j.customerPhone,
            machineBrand: j.machineBrand,
            machineModel: j.machineModel,
            machineType: j.machineType,
            serialNumber: j.serialNumber,
            photoUrl: j.photoUrl,
            createdAt: j.createdAt,
            updatedAt: j.updatedAt,
          });
        }
      }
    });

    return list;
  }, [customerPhone, customerMachines, jobs]);

  // Handle switching to an existing customer
  const handleSelectExistingCustomer = (phone: string) => {
    setSelectedExistingPhone(phone);
    const target = existingCustomers.find(c => c.phone === phone);
    if (target) {
      setCustomerName(target.name);
      setCustomerPhone(target.phone);
      setSelectedMachineId('__new_machine__');
    }
  };

  // Handle switching machine for the selected customer
  const handleSelectMachine = (machId: string) => {
    setSelectedMachineId(machId);
    if (machId === '__new_machine__') {
      // Clear machine fields for entering a new machine under this customer
      setMachineBrand('Ador');
      setMachineModel('');
      setSerialNumber('');
      setMachineType('ARC Inverter');
      setPhotoUrl('');
    } else {
      const mach = customerExistingMachines.find(m => m.id === machId);
      if (mach) {
        setMachineBrand(mach.machineBrand);
        setMachineModel(mach.machineModel);
        setMachineType(mach.machineType);
        setSerialNumber(mach.serialNumber || '');
        if (mach.photoUrl) setPhotoUrl(mach.photoUrl);
      }
    }
  };

  if (!isOpen) return null;

  // Compute live balance
  const numCharges = Number(repairCharges) || 0;
  const numAdvance = Number(advance) || 0;
  const balance = Math.max(0, numCharges - numAdvance);

  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__add_new__') {
      setIsAddingNewBrand(true);
      setCustomBrandName('');
    } else {
      setIsAddingNewBrand(false);
      setMachineBrand(val);
    }
  };

  const handleSaveCustomBrand = async () => {
    if (!customBrandName.trim()) return;
    try {
      const saved = await addBrand(customBrandName.trim());
      setMachineBrand(saved.name);
      setIsAddingNewBrand(false);
      setCustomBrandName('');
    } catch (e) {
      console.warn('Error saving custom brand:', e);
    }
  };

  // Photo upload handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Photo is too large (max 2MB). Please select a compressed image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const quickComplaints = [
    'No Output Current',
    'OC / Overheat Error',
    'Display Not Turning ON',
    'Main MCB Tripping',
    'Spark Very Weak',
    'Current Not Adjusting',
    'Wire Feeder Issue',
    'IGBT Burnt / Blast',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerName.trim() || !customerPhone.trim()) {
      setError('Customer Name and Mobile Number are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedTech = technicians.find(t => t.name === technicianName);

      const jobData = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        machineId: selectedMachineId !== '__new_machine__' ? selectedMachineId : undefined,
        machineBrand: isAddingNewBrand && customBrandName ? customBrandName.trim() : machineBrand,
        machineModel: machineModel.trim() || 'Standard Model',
        serialNumber: serialNumber.trim() || 'N/A',
        machineType: machineType.trim(),
        customerComplaint: customerComplaint.trim() || 'General Inspection & Repair',
        receivedDate,
        expectedCompletionDate,
        expectedDeliveryDate,
        technicianId: selectedTech?.id || '',
        technicianName: technicianName || 'Unassigned',
        repairCharges: numCharges,
        advance: numAdvance,
        balance,
        paymentStatus:
          balance <= 0 && numCharges > 0
            ? ('Paid' as const)
            : numAdvance > 0
            ? ('Partially Paid' as const)
            : ('Pending' as const),
        paymentDueDate,
        payments:
          numAdvance > 0
            ? [
                {
                  id: `pay_${Date.now()}`,
                  amount: numAdvance,
                  date: receivedDate,
                  receivedBy: 'Advance at Receiving',
                  paymentMode: 'Cash' as const,
                  note: 'Advance received at receiving',
                },
              ]
            : [],
        partsUsed: [],
        photoUrl,
        notes: notes.trim(),
        status,
      };

      const created = await createJob(jobData);
      if (onJobCreated) onJobCreated(created);
      onClose();
    } catch (err: unknown) {
      console.error('Failed to create job:', err);
      setError(err instanceof Error ? err.message : 'Failed to create Job Card.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl text-slate-100 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <PlusCircle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                New Machine Job Card
              </h2>
              <p className="text-[11px] text-slate-400">
                Machine Receiving & Entry • Received:{' '}
                <span className="text-amber-400 font-mono">{receivedDate}</span>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs">
              {error}
            </div>
          )}

          {/* Section: Customer Selection (Select Existing Customer vs New Customer) */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Customer Selection
              </h3>

              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setCustomerMode('new');
                    setSelectedExistingPhone('');
                  }}
                  className={`px-3 py-1 rounded-md font-semibold transition ${
                    customerMode === 'new'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  + New Customer
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerMode('existing')}
                  className={`px-3 py-1 rounded-md font-semibold transition ${
                    customerMode === 'existing'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Select Existing ({existingCustomers.length})
                </button>
              </div>
            </div>

            {customerMode === 'existing' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Choose from Registered Customers:
                </label>
                <select
                  value={selectedExistingPhone}
                  onChange={e => handleSelectExistingCustomer(e.target.value)}
                  className="block w-full px-3 py-2 bg-slate-900 border border-amber-500/50 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="">-- Choose Existing Customer --</option>
                  {existingCustomers.map(cust => (
                    <option key={cust.phone} value={cust.phone}>
                      {cust.name} ({cust.phone}) — {cust.machineCount} machine(s)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="e.g. Ramesh Fabrication"
                  className="mt-1 block w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Mobile Number (WhatsApp) *
                </label>
                <div className="mt-1 relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-xs">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="9876543210"
                    className="block w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Machine Selection (Under this customer) */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5" />
                Customer Machines / Multiple Machine Selection
              </h3>

              {customerExistingMachines.length > 0 && (
                <span className="text-[11px] text-cyan-400 font-semibold">
                  This customer has {customerExistingMachines.length} machine(s) on file
                </span>
              )}
            </div>

            {/* If the customer has existing machines, offer to pick an existing machine or add a new one */}
            {customerExistingMachines.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-2">
                <label className="block text-xs font-bold text-cyan-300">
                  Select Machine for this Service:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectMachine('__new_machine__')}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition ${
                      selectedMachineId === '__new_machine__'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span>+ Add Another / New Machine</span>
                  </button>

                  {customerExistingMachines.map(mach => (
                    <button
                      type="button"
                      key={mach.id}
                      onClick={() => handleSelectMachine(mach.id)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition ${
                        selectedMachineId === mach.id
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 font-bold'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <p className="font-bold text-white truncate">
                        {mach.machineBrand} {mach.machineModel}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {mach.machineType} • SN: {mach.serialNumber || 'N/A'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Machine Brand Dropdown with preload + other */}
              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Machine Brand *
                </label>
                {!isAddingNewBrand ? (
                  <select
                    value={machineBrand}
                    onChange={handleBrandChange}
                    className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    {brands
                      .filter(b => b.status === 'active')
                      .map(b => (
                        <option key={b.id} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    <option value="__add_new__" className="font-bold text-amber-400">
                      + Other / Add New Brand
                    </option>
                  </select>
                ) : (
                  <div className="mt-1 flex items-center gap-1.5">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Type brand name"
                      value={customBrandName}
                      onChange={e => setCustomBrandName(e.target.value)}
                      className="block w-full px-3 py-1.5 bg-slate-950 border border-amber-500 rounded-xl text-white text-sm focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSaveCustomBrand}
                      className="px-2.5 py-1.5 bg-amber-500 text-slate-950 rounded-lg text-xs font-bold hover:bg-amber-400"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewBrand(false)}
                      className="px-2 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-xs hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Machine Model *
                </label>
                <input
                  type="text"
                  required
                  value={machineModel}
                  onChange={e => setMachineModel(e.target.value)}
                  placeholder="e.g. ARC 200, Champ 250, CO2 400"
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Serial Number
                </label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={e => setSerialNumber(e.target.value)}
                  placeholder="e.g. SN-884920"
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Machine Type
                </label>
                <select
                  value={machineType}
                  onChange={e => setMachineType(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="ARC Inverter">ARC Inverter</option>
                  <option value="TIG Welding Inverter">TIG Welding Inverter</option>
                  <option value="MIG / CO2 Machine">MIG / CO2 Machine</option>
                  <option value="Submerged Arc (SAW)">Submerged Arc (SAW)</option>
                  <option value="Plasma Cutter">Plasma Cutter</option>
                  <option value="Thyristor / Diode Rectifier">Thyristor / Diode Rectifier</option>
                  <option value="Oil Cooled Transformer">Oil Cooled Transformer</option>
                  <option value="Spot Welding">Spot Welding</option>
                  <option value="Other">Other Type</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Assign Technician
                </label>
                <select
                  value={technicianName}
                  onChange={e => setTechnicianName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="">-- Assign Later --</option>
                  {technicians
                    .filter(t => t.status === 'active')
                    .map(t => (
                      <option key={t.id} value={t.name}>
                        {t.name} ({t.role || 'Tech'})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Complaint */}
            <div>
              <label className="block text-xs font-medium text-slate-300">
                Customer Complaint / Fault
              </label>
              <textarea
                rows={2}
                value={customerComplaint}
                onChange={e => setCustomerComplaint(e.target.value)}
                placeholder="Describe fault (e.g. Machine not sparking, OC light red)"
                className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />

              {/* Quick tags */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {quickComplaints.map(qc => (
                  <button
                    type="button"
                    key={qc}
                    onClick={() =>
                      setCustomerComplaint(prev => (prev ? `${prev}, ${qc}` : qc))
                    }
                    className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-amber-400 border border-slate-700 transition"
                  >
                    + {qc}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section: Charges, Advance & Balance */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5" />
              Charges & Payment Terms
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Estimated Repair Charges (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={repairCharges}
                  onChange={e => setRepairCharges(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Advance Received (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={advance}
                  onChange={e => setAdvance(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Balance Remaining (₹)
                </label>
                <div className="mt-1 px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-red-400 font-bold text-sm">
                  ₹{balance.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Expected Completion Date
                </label>
                <input
                  type="text"
                  value={expectedCompletionDate}
                  onChange={e => setExpectedCompletionDate(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Expected Delivery Date
                </label>
                <input
                  type="text"
                  value={expectedDeliveryDate}
                  onChange={e => setExpectedDeliveryDate(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Payment Due Date (Reminder)
                </label>
                <input
                  type="text"
                  value={paymentDueDate}
                  onChange={e => setPaymentDueDate(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section: Photo Attachment & Notes */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" />
              Machine / PCB Photo & Accessories
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Attach Machine / PCB Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="mt-1 block w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-amber-400 hover:file:bg-slate-700"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Kept permanently in customer machine profile.
                </p>
              </div>

              {photoUrl && (
                <div className="relative inline-block mt-1">
                  <img
                    src={photoUrl}
                    alt="Preview"
                    className="h-20 w-32 object-cover rounded-xl border border-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-red-600 text-white text-[10px]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300">Internal Notes</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Accessories received (e.g. Torch, Earthing Cable, Holder)"
                className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 text-xs disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4 text-slate-950" />
              <span>{isSubmitting ? 'Saving Job...' : 'Create Job Card'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
