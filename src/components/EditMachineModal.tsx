import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { CustomerMachine } from '../types';
import { X, Wrench, Camera, CheckCircle, Trash2 } from 'lucide-react';

interface EditMachineModalProps {
  isOpen: boolean;
  onClose: () => void;
  machine: CustomerMachine | null;
  onUpdated?: () => void;
}

export const EditMachineModal: React.FC<EditMachineModalProps> = ({
  isOpen,
  onClose,
  machine,
  onUpdated,
}) => {
  const { brands, updateCustomerMachine, deleteCustomerMachine } = useData();

  const [machineBrand, setMachineBrand] = useState(machine?.machineBrand || 'Ador');
  const [machineModel, setMachineModel] = useState(machine?.machineModel || '');
  const [machineType, setMachineType] = useState(machine?.machineType || 'ARC Inverter');
  const [serialNumber, setSerialNumber] = useState(machine?.serialNumber || '');
  const [photoUrl, setPhotoUrl] = useState(machine?.photoUrl || '');
  const [notes, setNotes] = useState(machine?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !machine) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Photo is too large (max 2MB).');
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machineModel.trim()) {
      setError('Machine Model is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateCustomerMachine(machine.id, {
        machineBrand,
        machineModel: machineModel.trim(),
        machineType,
        serialNumber: serialNumber.trim() || 'N/A',
        photoUrl,
        notes: notes.trim(),
      });
      if (onUpdated) onUpdated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update machine.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to remove this machine (${machine.machineBrand} ${machine.machineModel}) from the customer fleet? Historical job cards will remain safely preserved.`)) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteCustomerMachine(machine.id);
      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-750 shadow-2xl text-slate-100 my-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-black text-white">Edit Machine Details</h3>
              <p className="text-[11px] text-slate-400">
                {machine.customerName} • {machine.machineBrand} {machine.machineModel}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-4">
          {error && (
            <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300">Brand</label>
              <select
                value={machineBrand}
                onChange={e => setMachineBrand(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                {brands
                  .filter(b => b.status === 'active')
                  .map(b => (
                    <option key={b.id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300">Model *</label>
              <input
                type="text"
                required
                value={machineModel}
                onChange={e => setMachineModel(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300">Type</label>
              <select
                value={machineType}
                onChange={e => setMachineType(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="ARC Inverter">ARC Inverter</option>
                <option value="MIG/MAG Inverter">MIG/MAG Inverter</option>
                <option value="TIG Inverter">TIG Inverter</option>
                <option value="Plasma Cutter">Plasma Cutter</option>
                <option value="Submerged Arc Welder">Submerged Arc Welder</option>
                <option value="Spot Welder">Spot Welder</option>
                <option value="Oil Cooled Transformer">Oil Cooled Transformer</option>
                <option value="Inverter Welding Machine">Inverter Welding Machine</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300">Serial Number</label>
              <input
                type="text"
                value={serialNumber}
                onChange={e => setSerialNumber(e.target.value)}
                placeholder="e.g. AD-400-8891"
                className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Machine Photo
            </label>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-950 border border-slate-700 hover:border-amber-500/50 rounded-xl text-xs text-slate-300 transition w-full">
                <Camera className="w-4 h-4 text-amber-400" />
                <span>{photoUrl ? 'Change Photo' : 'Upload Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
              {photoUrl && (
                <button
                  type="button"
                  onClick={() => setPhotoUrl('')}
                  className="p-2 bg-slate-800 text-red-400 hover:bg-slate-700 rounded-xl text-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {photoUrl && (
              <div className="mt-2 w-16 h-16 rounded-lg overflow-hidden border border-slate-700">
                <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="mt-1 block w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDelete}
              className="p-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Machine</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
