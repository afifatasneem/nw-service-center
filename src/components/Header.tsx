import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { formatISTDateTime, checkDueDateStatus } from '../lib/dateUtils';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Flame,
  LogOut,
  Bell,
  AlertTriangle,
  User,
  Shield,
  Menu,
  X,
  Clock,
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenNewJob: () => void;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewJob,
  onToggleSidebar,
}) => {
  const { currentUser, logout, isOwner } = useAuth();
  const { jobs, stats } = useData();
  const [currentISTTime, setCurrentISTTime] = useState<string>(formatISTDateTime());

  // Live IST Clock updated every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentISTTime(formatISTDateTime());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Compute urgent payment reminders count
  const pendingRemindersCount = jobs.filter(
    j => (j.balance || 0) > 0 && ['today', 'overdue'].includes(checkDueDateStatus(j.paymentDueDate))
  ).length;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo & Business Brand */}
          <div className="flex items-center gap-3">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none"
                aria-label="Toggle Navigation"
              >
                <Menu className="w-6 h-6" />
              </button>
            )}

            <button
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center gap-2.5 text-left group"
            >
              {/* Brand Logo Shield Icon */}
              <div className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <Flame className="w-6 h-6 text-slate-950" />
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[9px] font-black text-slate-950">
                  ⚡
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-base sm:text-lg tracking-wider text-white">
                    NW SERVICE CENTER
                  </span>
                  <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Solapur
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium hidden sm:block truncate max-w-xs">
                  National Welding Machine Service Center
                </p>
              </div>
            </button>
          </div>

          {/* Right Area: IST Clock, Alerts, PWA Install, User Profile & Logout */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Live IST Clock */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs font-mono">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{currentISTTime}</span>
              <span className="text-[10px] text-slate-400 ml-0.5">IST</span>
            </div>

            {/* In-App Payment Reminder Indicator */}
            {pendingRemindersCount > 0 && (
              <button
                onClick={() => onSelectTab('payments')}
                title={`${pendingRemindersCount} Payment Reminders Due / Overdue`}
                className="relative p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-all"
              >
                <Bell className="w-5 h-5 text-amber-400 animate-pulse" />
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow">
                  {pendingRemindersCount}
                </span>
              </button>
            )}

            {/* Low Stock Alert */}
            {stats.lowStockCount > 0 && (
              <button
                onClick={() => onSelectTab('stock')}
                title={`${stats.lowStockCount} Spare Items in Low Stock`}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-semibold transition-all"
              >
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>{stats.lowStockCount} Low Stock</span>
              </button>
            )}

            {/* PWA Install Button */}
            <PWAInstallButton compact />

            {/* User Badge */}
            {currentUser && (
              <div className="flex items-center gap-2 pl-1 sm:pl-2 sm:border-l sm:border-slate-800">
                <div className="hidden lg:block text-right">
                  <p className="text-xs font-bold text-slate-100 truncate max-w-[130px]">
                    {currentUser.fullName}
                  </p>
                  <p className="text-[10px] font-medium text-amber-400 flex items-center justify-end gap-1">
                    {isOwner ? <Shield className="w-3 h-3 text-amber-400" /> : <User className="w-3 h-3" />}
                    {currentUser.role}
                  </p>
                </div>

                {/* Logout Button */}
                <button
                  onClick={logout}
                  title="Logout"
                  className="flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
