import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Users,
  Wrench,
  Clock,
  CheckCircle,
  PackageCheck,
  Send,
  Boxes,
  IndianRupee,
  FileBarChart,
  Archive,
  Settings,
  X,
  ChevronRight,
} from 'lucide-react';
import { useData } from '../context/DataContext';

interface NavigationProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenNewJob: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewJob,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { stats } = useData();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'all-jobs', label: 'All Jobs', icon: Wrench, badge: stats.totalActiveJobs },
    { id: 'pending', label: 'Pending', icon: Clock, badge: stats.pendingJobs, color: 'text-amber-400' },
    { id: 'repaired', label: 'Repaired', icon: CheckCircle, badge: stats.repairedJobs, color: 'text-blue-400' },
    { id: 'ready', label: 'Ready', icon: PackageCheck, badge: stats.readyForCollectionJobs, color: 'text-emerald-400' },
    { id: 'dispatched', label: 'Dispatched', icon: Send, badge: stats.dispatchedJobs },
    { id: 'customers', label: 'Customers', icon: Users, badge: null },
    { id: 'stock', label: 'Spare Stock', icon: Boxes, badge: stats.lowStockCount ? `${stats.lowStockCount} low` : null, badgeColor: 'bg-red-500/20 text-red-400' },
    { id: 'payments', label: 'Payments', icon: IndianRupee, badge: null },
    { id: 'reports', label: 'Reports', icon: FileBarChart, badge: null },
    { id: 'old-jobs', label: 'Old Jobs', icon: Archive, badge: null },
    { id: 'settings', label: 'Settings', icon: Settings, badge: null },
  ];

  const handleItemClick = (id: string) => {
    onSelectTab(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Navigation Container (Desktop Sidebar + Mobile Drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header in Drawer */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center font-black text-slate-950 text-sm">
              NW
            </div>
            <span className="font-bold text-white text-sm">Menu</span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Action Button: + New Job */}
        <div className="p-4 border-b border-slate-800/80">
          <button
            onClick={() => {
              onOpenNewJob();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 active:scale-98 transition-all"
          >
            <PlusCircle className="w-5 h-5 text-slate-950" />
            <span>+ New Job Card</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-amber-400' : item.color || 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      item.badgeColor ||
                      (isActive
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 border border-slate-700')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Business Badge */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 text-center">
          <p className="text-[11px] font-semibold text-slate-300">National Welding Machine</p>
          <p className="text-[10px] text-amber-400 font-medium">Solapur, Maharashtra</p>
        </div>
      </aside>

      {/* Mobile Sticky Quick Nav Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition ${
            currentTab === 'dashboard' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </button>

        <button
          onClick={() => onSelectTab('pending')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition relative ${
            currentTab === 'pending' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Clock className="w-5 h-5 mb-0.5" />
          <span>Pending</span>
          {stats.pendingJobs > 0 && (
            <span className="absolute top-0 right-2 w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[9px] font-bold flex items-center justify-center">
              {stats.pendingJobs}
            </span>
          )}
        </button>

        {/* Center Prominent New Job Button */}
        <button
          onClick={onOpenNewJob}
          className="flex flex-col items-center -mt-5 bg-gradient-to-tr from-amber-500 to-amber-600 p-3 rounded-full text-slate-950 shadow-lg shadow-amber-500/30 active:scale-95 transition"
        >
          <PlusCircle className="w-6 h-6 text-slate-950 stroke-[2.5]" />
        </button>

        <button
          onClick={() => onSelectTab('stock')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition ${
            currentTab === 'stock' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Boxes className="w-5 h-5 mb-0.5" />
          <span>Stock</span>
        </button>

        <button
          onClick={() => onSelectTab('payments')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition ${
            currentTab === 'payments' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <IndianRupee className="w-5 h-5 mb-0.5" />
          <span>Payments</span>
        </button>
      </div>
    </>
  );
};
