import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { SpareItem } from '../types';
import {
  Boxes,
  Plus,
  Minus,
  Search,
  AlertTriangle,
  History,
  PlusCircle,
  FolderPlus,
  X,
  CheckCircle,
  Package,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
} from 'lucide-react';

export const SpareStockView: React.FC = () => {
  const {
    spareItems,
    spareCategories,
    spareTransactions,
    addStock,
    deductStock,
    createNewSpareItem,
    addSpareCategory,
    jobs,
    technicians,
  } = useData();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'inventory' | 'history'>('inventory');

  // Modals state
  const [addingStockItem, setAddingStockItem] = useState<SpareItem | null>(null);
  const [addQty, setAddQty] = useState<number>(5);
  const [addSupplier, setAddSupplier] = useState('');
  const [addNotes, setAddNotes] = useState('');
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  const [deductingStockItem, setDeductingStockItem] = useState<SpareItem | null>(null);
  const [deductQty, setDeductQty] = useState<number>(1);
  const [deductJobNumber, setDeductJobNumber] = useState('');
  const [deductTech, setDeductTech] = useState('');
  const [deductReason, setDeductReason] = useState('Machine Repair / Spare Replacement');
  const [deductNotes, setDeductNotes] = useState('');
  const [deductError, setDeductError] = useState<string | null>(null);
  const [isSubmittingDeduct, setIsSubmittingDeduct] = useState(false);

  // New Item Modal
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState(spareCategories[0] || 'IGBT PCB');
  const [newItemStock, setNewItemStock] = useState<number>(10);
  const [newItemMinAlert, setNewItemMinAlert] = useState<number>(3);
  const [newItemUnit, setNewItemUnit] = useState('pcs');
  const [isSubmittingNewItem, setIsSubmittingNewItem] = useState(false);

  // New Category Modal
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Filtering
  const filteredItems = spareItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesQuery =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  // KPI calculations
  const totalItemsCount = spareItems.length;
  const totalStockQuantity = spareItems.reduce((sum, item) => sum + (item.currentStock || 0), 0);
  const lowStockItems = spareItems.filter(item => item.currentStock > 0 && item.currentStock <= item.minStockAlert);
  const outOfStockItems = spareItems.filter(item => item.currentStock <= 0);
  const totalAddedAllTime = spareItems.reduce((sum, item) => sum + (item.totalAdded || 0), 0);
  const totalUsedAllTime = spareItems.reduce((sum, item) => sum + (item.totalUsed || 0), 0);

  // Handlers
  const handleConfirmAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingStockItem || addQty <= 0) return;
    setIsSubmittingAdd(true);
    try {
      await addStock(addingStockItem.id, addQty, addSupplier.trim() || 'Purchased Stock', addNotes.trim());
      setAddingStockItem(null);
      setAddQty(5);
      setAddSupplier('');
      setAddNotes('');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleConfirmDeductStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeductError(null);
    if (!deductingStockItem || deductQty <= 0) return;

    if (deductingStockItem.currentStock < deductQty) {
      setDeductError(`Cannot deduct ${deductQty}. Current stock is only ${deductingStockItem.currentStock}.`);
      return;
    }

    setIsSubmittingDeduct(true);
    try {
      await deductStock(
        deductingStockItem.id,
        deductQty,
        deductJobNumber.trim() || 'Shop Floor',
        deductTech.trim() || 'Technician',
        deductReason.trim(),
        deductNotes.trim()
      );
      setDeductingStockItem(null);
      setDeductQty(1);
      setDeductJobNumber('');
      setDeductTech('');
      setDeductNotes('');
    } catch (err: unknown) {
      setDeductError(err instanceof Error ? err.message : 'Stock deduction failed');
    } finally {
      setIsSubmittingDeduct(false);
    }
  };

  const handleCreateNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemCategory) return;
    setIsSubmittingNewItem(true);
    try {
      await createNewSpareItem(
        newItemName.trim(),
        newItemCategory,
        newItemStock,
        newItemMinAlert,
        newItemUnit
      );
      setShowNewItemModal(false);
      setNewItemName('');
      setNewItemStock(10);
      setNewItemMinAlert(3);
    } finally {
      setIsSubmittingNewItem(false);
    }
  };

  const handleCreateNewCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addSpareCategory(newCatName.trim());
    setSelectedCategory(newCatName.trim());
    setShowNewCategoryModal(false);
    setNewCatName('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-white">
                Welding Spare Parts & Component Inventory
              </h1>
              <p className="text-xs text-slate-400">
                Track IGBTs, MOSFETs, Diodes, Capacitors, Control Cards, and SMPS stock
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowNewItemModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              <span>+ Add New Spare</span>
            </button>

            <button
              onClick={() => setShowNewCategoryModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
            >
              <FolderPlus className="w-4 h-4 text-cyan-400" />
              <span>+ Add Category</span>
            </button>
          </div>
        </div>

        {/* Inventory Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500">Items Tracked</span>
            <div className="text-xl font-black text-white mt-1">{totalItemsCount}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Components</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500">Total In Stock</span>
            <div className="text-xl font-black text-amber-400 mt-1">{totalStockQuantity}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Units Available</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500">Low Stock</span>
            <div className="text-xl font-black text-orange-400 mt-1">{lowStockItems.length}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Below Alert Level</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500">Out of Stock</span>
            <div className="text-xl font-black text-red-400 mt-1">{outOfStockItems.length}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">0 Units Left</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500">Total Added</span>
            <div className="text-xl font-black text-emerald-400 mt-1">{totalAddedAllTime}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Purchased / Received</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500">Total Used</span>
            <div className="text-xl font-black text-purple-400 mt-1">{totalUsedAllTime}</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Fitted in Jobs</p>
          </div>
        </div>
      </div>

      {/* Tabs: Inventory Table vs Stock History */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'inventory'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            Inventory List ({filteredItems.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Stock History Logs ({spareTransactions.length})</span>
          </button>
        </div>
      </div>

      {/* INVENTORY TAB CONTENT */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Search & Category Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search spare name, category (e.g. 40N120, Diode, PCB)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Category Selector Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
                  selectedCategory === 'All'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                All Categories
              </button>
              {spareCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
                    selectedCategory === cat
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Spares Inventory Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-center">Current Stock</th>
                    <th className="py-3 px-4 text-center">Min Alert</th>
                    <th className="py-3 px-4 text-center">Added / Used</th>
                    <th className="py-3 px-4 text-center">Quick Adjust</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredItems.map(item => {
                    const isLow = item.currentStock > 0 && item.currentStock <= item.minStockAlert;
                    const isOut = item.currentStock <= 0;

                    return (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-white text-sm">{item.name}</div>
                          <div className="text-[11px] text-slate-500">{item.unit || 'pcs'}</div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[10px]">
                            {item.category}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-xl text-xs font-black ${
                              isOut
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : isLow
                                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {item.currentStock} {item.unit || 'pcs'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center text-slate-400 font-mono">
                          {item.minStockAlert}
                        </td>

                        <td className="py-3 px-4 text-center font-mono text-[11px]">
                          <span className="text-emerald-400 font-bold">+{item.totalAdded || 0}</span>
                          <span className="text-slate-600 mx-1.5">/</span>
                          <span className="text-purple-400 font-bold">-{item.totalUsed || 0}</span>
                        </td>

                        {/* Quick Adjust Buttons: [ + ] and [ - ] */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* [ + ] Add stock button */}
                            <button
                              onClick={() => {
                                setAddingStockItem(item);
                                setAddQty(5);
                              }}
                              title="Add Stock (+)"
                              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-600 hover:text-white font-bold text-xs flex items-center gap-1 transition active:scale-95"
                            >
                              <Plus className="w-4 h-4" />
                              <span className="hidden sm:inline">Add</span>
                            </button>

                            {/* [ - ] Deduct stock button */}
                            <button
                              onClick={() => {
                                setDeductingStockItem(item);
                                setDeductQty(1);
                                setDeductError(null);
                              }}
                              title="Deduct Stock (-)"
                              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-red-600/20 border border-red-500/40 text-red-400 hover:bg-red-600 hover:text-white font-bold text-xs flex items-center gap-1 transition active:scale-95"
                            >
                              <Minus className="w-4 h-4" />
                              <span className="hidden sm:inline">Deduct</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STOCK HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-amber-400" />
              <span>Permanent Stock Movement Audit Trail</span>
            </h3>
            <span className="text-[11px] text-slate-500">
              Every addition and deduction is permanently timestamped in IST.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Date & Time (IST)</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Item Name</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-center">Stock Before &rarr; After</th>
                  <th className="py-2.5 px-3">Job / Source / Reason</th>
                  <th className="py-2.5 px-3">Handled By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {spareTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No stock transactions logged yet.
                    </td>
                  </tr>
                ) : (
                  spareTransactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400">
                        {tx.timestamp}
                      </td>

                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold text-[10px] ${
                            tx.type === 'IN'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {tx.type === 'IN' ? (
                            <ArrowDownRight className="w-3 h-3" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3" />
                          )}
                          {tx.type === 'IN' ? '+ ADDED' : '- USED'}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 font-semibold text-white">{tx.itemName}</td>

                      <td className="py-2.5 px-3 text-center font-bold">
                        <span className={tx.type === 'IN' ? 'text-emerald-400' : 'text-red-400'}>
                          {tx.type === 'IN' ? `+${tx.quantity}` : `-${tx.quantity}`}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400">
                        {tx.previousStock} &rarr;{' '}
                        <strong className="text-white">{tx.newStock}</strong>
                      </td>

                      <td className="py-2.5 px-3 text-slate-300">
                        {tx.type === 'IN' ? (
                          <span>Source: {tx.supplierOrSource || 'Supplier'}</span>
                        ) : (
                          <span>
                            {tx.jobNumber && tx.jobNumber !== 'N/A' && (
                              <strong className="text-amber-400 mr-1.5">{tx.jobNumber}</strong>
                            )}
                            {tx.reason || 'Repair'}
                          </span>
                        )}
                        {tx.notes && <p className="text-[10px] text-slate-500">{tx.notes}</p>}
                      </td>

                      <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                        {tx.technician || tx.createdBy || 'Staff'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: [ + ] ADD STOCK */}
      {addingStockItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                Add Stock: {addingStockItem.name}
              </h3>
              <button
                onClick={() => setAddingStockItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmAddStock} className="mt-4 space-y-3 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] flex justify-between">
                <span className="text-slate-400">Current In Stock:</span>
                <span className="font-bold text-white">{addingStockItem.currentStock} pcs</span>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300">
                  Quantity to Add *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={addQty}
                  onChange={e => setAddQty(Math.max(1, Number(e.target.value)))}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300">
                  Supplier / Source
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pune Electronics, Mumbai Trader, Local Purchase"
                  value={addSupplier}
                  onChange={e => setAddSupplier(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300">Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Batch #49, Original IRF parts"
                  value={addNotes}
                  onChange={e => setAddNotes(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-xs shadow transition active:scale-98 disabled:opacity-50"
                >
                  {isSubmittingAdd ? 'Saving Stock...' : 'Confirm Stock Addition (+)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: [ - ] DEDUCT STOCK */}
      {deductingStockItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-red-400 flex items-center gap-1.5">
                <Minus className="w-4 h-4" />
                Deduct Stock: {deductingStockItem.name}
              </h3>
              <button
                onClick={() => setDeductingStockItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {deductError && (
              <div className="mt-3 p-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-[11px]">
                {deductError}
              </div>
            )}

            <form onSubmit={handleConfirmDeductStock} className="mt-4 space-y-3 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] flex justify-between">
                <span className="text-slate-400">Current In Stock:</span>
                <span className="font-bold text-white">{deductingStockItem.currentStock} pcs</span>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300">
                  Quantity to Deduct *
                </label>
                <input
                  type="number"
                  min="1"
                  max={deductingStockItem.currentStock}
                  required
                  value={deductQty}
                  onChange={e => setDeductQty(Math.max(1, Number(e.target.value)))}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300">
                  Select Job Number
                </label>
                <select
                  value={deductJobNumber}
                  onChange={e => setDeductJobNumber(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                >
                  <option value="">-- General Maintenance / Floor --</option>
                  {jobs
                    .filter(j => j.status !== 'Dispatched')
                    .map(j => (
                      <option key={j.id} value={j.jobNumber}>
                        {j.jobNumber} — {j.customerName} ({j.machineBrand})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300">
                  Select Technician / Staff
                </label>
                <select
                  value={deductTech}
                  onChange={e => setDeductTech(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                >
                  <option value="">-- Select Staff --</option>
                  {technicians.map(t => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300">Reason</label>
                <input
                  type="text"
                  value={deductReason}
                  onChange={e => setDeductReason(e.target.value)}
                  placeholder="e.g. PCB repair replacement, testing damage"
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingDeduct || deductingStockItem.currentStock < deductQty}
                  className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 font-bold text-white text-xs shadow transition active:scale-98 disabled:opacity-50"
                >
                  {isSubmittingDeduct ? 'Deducting Stock...' : 'Confirm Stock Deduction (-)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD NEW SPARE ITEM */}
      {showNewItemModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-amber-400" />
                Add New Spare Item
              </h3>
              <button
                onClick={() => setShowNewItemModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewItem} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-300">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50T65 IGBT, 1+2 Control PCB"
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300">Category *</label>
                <select
                  value={newItemCategory}
                  onChange={e => setNewItemCategory(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {spareCategories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newItemStock}
                    onChange={e => setNewItemStock(Number(e.target.value))}
                    className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300">
                    Min Stock Alert
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newItemMinAlert}
                    onChange={e => setNewItemMinAlert(Number(e.target.value))}
                    className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingNewItem}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 font-bold text-slate-950 text-xs shadow transition active:scale-98 disabled:opacity-50"
                >
                  {isSubmittingNewItem ? 'Creating Item...' : 'Save New Spare Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD NEW CATEGORY */}
      {showNewCategoryModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-1.5">
                <FolderPlus className="w-4 h-4 text-cyan-400" />
                Add Spare Category
              </h3>
              <button
                onClick={() => setShowNewCategoryModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewCategory} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-300">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Plasma Consumables, High Frequency"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-bold text-white text-xs shadow transition active:scale-98"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
