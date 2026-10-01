import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { CustomerMachine, JobCard, JobStatus } from '../types';
import { formatISTDateTime, formatISTDateOnly, calculateDueDate } from '../lib/dateUtils';
import {
  X,
  Wrench,
  Camera,
  Plus,
  CheckCircle,
  Calendar,
  IndianRupee,
  User,
  Phone,
  Layers,
  Sparkles,
  FileText,
} from 'lucide-react';

interface AddMachineModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  customerPhone: string;
  onMachineAdded?: (machine: CustomerMachine, job?: JobCard) => void;
}

export const AddMachineModal: React.FC<AddMachineModalProps> = ({
  isOpen,
  onClose,
  customerName,
  customerPhone,
  onMachineAdded,
}) => {
  const { brands, technicians, addCustomerMachine, createJob, addBrand } = useData();

  // Machine Fields
  const [machineBrand, setMachineBrand] = useState('Ador');
  const [machineModel, setMachineModel] = useState('');
  const [machineType, setMachineType] = useState('ARC Inverter');
  const [serialNumber, setSerialNumber] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [notes, setNotes] = useState('');

  // Inline "Add New Brand" toggle
  const [isAddingNewBrand, setIsAddingNewBrand] = useState(false);
  const [customBrandName, setCustomBrandName] = useState('');

  // Toggle: Create Job Card immediately for repair?
  const [createJobImmediately, setCreateJobImmediately] = useState(true);

  // Job Card Fields (if creating job immediately)
  const [customerComplaint, setCustomerComplaint] = useState('');
  const [technicianName, setTechnicianName] = useState('');
  const [repairCharges, setRepairCharges] = useState<number | ''>(0);
  const [advance, setAdvance] = useState<number | ''>(0);
  const [expectedCompletionDate, setExpectedCompletionDate] = useState(
    formatISTDateOnly(new Date(Date.now() + 86400000 * 2))
  );
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(
    formatISTDateOnly(new Date(Date.now() + 86400000 * 3))
  );
  const [paymentDueDate, setPaymentDueDate] = useState<string>(calculateDueDate(3));
  const [status, setStatus] = useState<JobStatus>('Received');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const finalBrand = isAddingNewBrand && customBrandName.trim() ? customBrandName.trim() : machineBrand;
    if (!finalBrand) {
      setError('Machine Brand is required.');
      return;
    }
    if (!machineModel.trim()) {
      setError('Machine Model is required (e.g. 400i, ARC 200).');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Add Machine to customer's fleet
      const newMachine = await addCustomerMachine({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        machineBrand: finalBrand,
        machineModel: machineModel.trim(),
        machineType: machineType.trim(),
        serialNumber: serialNumber.trim() || 'N/A',
        photoUrl,
        notes: notes.trim(),
      });

      let createdJob: JobCard | undefined;

      // 2. If requested, create a repair Job Card for this machine
      if (createJobImmediately) {
        const numCharges = Number(repairCharges) || 0;
        const numAdvance = Number(advance) || 0;
        const balance = Math.max(0, numCharges - numAdvance);
        const selectedTech = technicians.find(t => t.name === technicianName);
        const receivedTimestamp = formatISTDateTime();

        createdJob = await createJob({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          machineId: newMachine.id,
          machineBrand: finalBrand,
          machineModel: machineModel.trim(),
          serialNumber: serialNumber.trim() || 'N/A',
          machineType: machineType.trim(),
          customerComplaint: customerComplaint.trim() || 'General Inspection & Repair',
          receivedDate: receivedTimestamp,
          expectedCompletionDate,
          expectedDeliveryDate,
          technicianId: selectedTech?.id || '',
          technicianName: technicianName || 'Unassigned',
          repairCharges: numCharges,
          advance: numAdvance,
          balance,
          paymentStatus:
            balance <= 0 && numCharges > 0
              ? 'Paid'
              : numAdvance > 0
              ? 'Partially Paid'
              : 'Pending',
          paymentDueDate,
          payments:
            numAdvance > 0
              ? [
                  {
                    id: `pay_${Date.now()}`,
                    amount: numAdvance,
                    date: receivedTimestamp,
                    receivedBy: 'Advance at Receiving',
                    paymentMode: 'Cash',
                    note: 'Advance received at receiving',
                  },
                ]
              : [],
          partsUsed: [],
          photoUrl,
          notes: notes.trim(),
          status,
        });
      }

      if (onMachineAdded) {
        onMachineAdded(newMachine, createdJob);
      }
      onClose();
    } catch (err: unknown) {
      console.error('Failed to add machine:', err);
      setError(err instanceof Error ? err.message : 'Failed to register machine.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-750 shadow-2xl text-slate-100 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Add Machine to Customer Fleet
              </h2>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span className="font-semibold text-amber-400">{customerName}</span>
                <span>•</span>
                <span>+91 {customerPhone}</span>
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

          {/* Machine Details Section */}
          <div className="space-y-3.5">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              Machine Specifications
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Brand */}
              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Machine Brand *
                </label>
                {!isAddingNewBrand ? (
                  <select
                    value={machineBrand}
                    onChange={handleBrandChange}
                    className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
                      className="block w-full px-3 py-1.5 bg-slate-950 border border-amber-500 rounded-xl text-white text-xs focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSaveCustomBrand}
                      className="px-2.5 py-1.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-amber-400"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewBrand(false)}
                      className="px-2 py-1.5 bg-slate-800 text-slate-400 text-xs rounded-xl"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Model */}
              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Machine Model *
                </label>
                <input
                  type="text"
                  required
                  value={machineModel}
                  onChange={e => setMachineModel(e.target.value)}
                  placeholder="e.g. 400i, ARC 200, Invertec 400"
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Type */}
              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Machine Type
                </label>
                <select
                  value={machineType}
                  onChange={e => setMachineType(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="ARC Inverter">ARC Inverter (Single / Double PCB)</option>
                  <option value="MIG/MAG Inverter">MIG/MAG Inverter (Co2)</option>
                  <option value="TIG Inverter">TIG Inverter (HF / Pulse)</option>
                  <option value="Plasma Cutter">Air Plasma Cutting Machine</option>
                  <option value="Submerged Arc Welder">Submerged Arc Welder (SAW)</option>
                  <option value="Spot Welder">Spot Welder</option>
                  <option value="Oil Cooled Transformer">Oil Cooled ARC Transformer</option>
                  <option value="Inverter Welding Machine">Inverter Welding Machine</option>
                </select>
              </div>

              {/* Serial Number */}
              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Serial Number (Optional)
                </label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={e => setSerialNumber(e.target.value)}
                  placeholder="e.g. AD-400i-8891 or N/A"
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Photo & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Machine / PCB Photo (Optional)
                </label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-950 border border-slate-700 hover:border-amber-500/50 rounded-xl text-xs text-slate-300 transition w-full">
                    <Camera className="w-4 h-4 text-amber-400" />
                    <span>{photoUrl ? 'Change Photo' : 'Upload / Snap Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  {photoUrl && (
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      className="p-2 bg-slate-800 text-red-400 hover:bg-slate-700 rounded-xl text-xs"
                      title="Remove photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {photoUrl && (
                  <div className="mt-2 relative w-20 h-20 rounded-lg overflow-hidden border border-slate-700">
                    <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Notes & Accessories
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Cables, welding torch model, physical condition..."
                  className="mt-1 block w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* Toggle: Create Repair Job Card immediately */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-400" />
                  Create Repair Job Card Now?
                </span>
                <p className="text-[11px] text-slate-400">
                  Check this if the customer is handing over this machine for repair right now.
                </p>
              </div>
              <input
                type="checkbox"
                checked={createJobImmediately}
                onChange={e => setCreateJobImmediately(e.target.checked)}
                className="w-5 h-5 rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-900 cursor-pointer"
              />
            </div>

            {createJobImmediately && (
              <div className="pt-3 border-t border-slate-850 space-y-3">
                {/* Complaint */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Customer Complaint / Problem *
                  </label>
                  <input
                    type="text"
                    required={createJobImmediately}
                    value={customerComplaint}
                    onChange={e => setCustomerComplaint(e.target.value)}
                    placeholder="e.g. No output current, OC LED glowing"
                    className="block w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  {/* Quick Tags */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {quickComplaints.map(qc => (
                      <button
                        type="button"
                        key={qc}
                        onClick={() =>
                          setCustomerComplaint(prev => (prev ? `${prev}, ${qc}` : qc))
                        }
                        className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300 hover:bg-slate-700 hover:text-amber-400 transition"
                      >
                        + {qc}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Technician */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300">
                      Assign Technician
                    </label>
                    <select
                      value={technicianName}
                      onChange={e => setTechnicianName(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      <option value="">-- Assign Later / Unassigned --</option>
                      {technicians
                        .filter(t => t.status === 'active')
                        .map(t => (
                          <option key={t.id} value={t.name}>
                            {t.name} ({t.role || 'Technician'})
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Initial Status */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300">
                      Initial Status
                    </label>
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value as JobStatus)}
                      className="mt-1 block w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      <option value="Received">Received</option>
                      <option value="Under Repair">Under Repair</option>
                      <option value="Waiting for Parts">Waiting for Parts</option>
                      <option value="Waiting for Customer Approval">Waiting for Approval</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Repair Charges */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300">
                      Estimated Charges (₹)
                    </label>
                    <div className="mt-1 relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-xs">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={repairCharges}
                        onChange={e =>
                          setRepairCharges(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        placeholder="0"
                        className="block w-full pl-7 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Advance */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300">
                      Advance Paid (₹)
                    </label>
                    <div className="mt-1 relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-xs">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={advance}
                        onChange={e =>
                          setAdvance(e.target.value === '' ? '' : Number(e.target.value))
                        }
                        placeholder="0"
                        className="block w-full pl-7 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Expected Delivery Date */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300">
                      Expected Delivery
                    </label>
                    <input
                      type="date"
                      value={expectedDeliveryDate}
                      onChange={e => setExpectedDeliveryDate(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-850 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <span>Saving Machine...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>{createJobImmediately ? 'Save Machine & Create Job Card' : 'Save Machine to Fleet'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
