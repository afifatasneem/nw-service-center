import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { UserRole, MachineBrand, Technician } from '../types';
import {
  Settings,
  Users,
  Wrench,
  Key,
  Bell,
  Building,
  CalendarCheck2,
  PlusCircle,
  Edit2,
  Trash2,
  Lock,
  CheckCircle,
  X,
  AlertCircle,
  Flame,
  Smartphone,
  Download,
  ToggleLeft,
  ToggleRight,
  Shield,
  Layers,
} from 'lucide-react';
import { MonthlyClosingView } from './MonthlyClosingView';

export const SettingsView: React.FC = () => {
  const {
    currentUser,
    users,
    addUser,
    updateUser,
    changeUserPassword,
    toggleUserStatus,
    deleteUser,
    isOwner,
  } = useAuth();

  const {
    brands,
    addBrand,
    updateBrand,
    deleteBrand,
    technicians,
    addTechnician,
    updateTechnician,
    deleteTechnician,
    businessSettings,
    updateBusinessSettings,
    spareCategories,
    addSpareCategory,
  } = useData();

  const [activeSection, setActiveSection] = useState<
    'general' | 'users' | 'technicians' | 'brands' | 'categories' | 'password' | 'notifications' | 'closing'
  >('general');

  // Business profile form
  const [bName, setBName] = useState(businessSettings.businessName);
  const [bSubtitle, setBSubtitle] = useState(businessSettings.subTitle);
  const [bPhone, setBPhone] = useState(businessSettings.phone);
  const [bAltPhone, setBAltPhone] = useState(businessSettings.altPhone);
  const [bAddress, setBAddress] = useState(businessSettings.address);
  const [bCity, setBCity] = useState(businessSettings.city);
  const [profileSaved, setProfileSaved] = useState(false);

  // User Management Form state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserId, setNewUserId] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('Staff');
  const [userActionError, setUserActionError] = useState<string | null>(null);

  // Change Password for user modal
  const [targetUserForPass, setTargetUserForPass] = useState<string | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [passSuccess, setPassSuccess] = useState(false);

  // Technician Form state
  const [showAddTechModal, setShowAddTechModal] = useState(false);
  const [techName, setTechName] = useState('');
  const [techMobile, setTechMobile] = useState('');
  const [techRole, setTechRole] = useState('Welding Service Specialist');

  // Machine Brand Form state
  const [showAddBrandModal, setShowAddBrandModal] = useState(false);
  const [brandName, setBrandName] = useState('');

  // Spare Category state
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [catName, setCatName] = useState('');

  // Notification state
  const [notificationPermission, setNotificationPermission] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') {
      alert('Notifications are not supported by this browser.');
      return;
    }
    const result = await Notification.requestPermission();
    setNotificationPermission(result);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateBusinessSettings({
      businessName: bName,
      subTitle: bSubtitle,
      phone: bPhone,
      altPhone: bAltPhone,
      address: bAddress,
      city: bCity,
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserActionError(null);
    try {
      await addUser(newUserName, newUserId, newUserPass, newUserRole);
      setShowAddUserModal(false);
      setNewUserName('');
      setNewUserId('');
      setNewUserPass('');
    } catch (err: unknown) {
      setUserActionError(err instanceof Error ? err.message : 'Failed to add user');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserForPass || !newPasswordVal) return;
    try {
      await changeUserPassword(targetUserForPass, newPasswordVal);
      setPassSuccess(true);
      setTimeout(() => {
        setTargetUserForPass(null);
        setNewPasswordVal('');
        setPassSuccess(false);
      }, 1500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTech = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!techName.trim()) return;
    await addTechnician(techName.trim(), techMobile.trim(), techRole.trim());
    setShowAddTechModal(false);
    setTechName('');
    setTechMobile('');
  };

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) return;
    await addBrand(brandName.trim());
    setShowAddBrandModal(false);
    setBrandName('');
  };

  return (
    <div className="space-y-6">
      {/* Settings Navigation Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
          <button
            onClick={() => setActiveSection('general')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              activeSection === 'general'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-800'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Business Profile</span>
          </button>

          <button
            onClick={() => setActiveSection('users')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              activeSection === 'users'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Users & Staff</span>
          </button>

          <button
            onClick={() => setActiveSection('technicians')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              activeSection === 'technicians'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-800'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Technicians</span>
          </button>

          <button
            onClick={() => setActiveSection('brands')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              activeSection === 'brands'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Machine Brands</span>
          </button>

          <button
            onClick={() => setActiveSection('categories')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              activeSection === 'categories'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Spare Categories</span>
          </button>

          <button
            onClick={() => setActiveSection('password')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              activeSection === 'password'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-800'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>My Password</span>
          </button>

          <button
            onClick={() => setActiveSection('notifications')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              activeSection === 'notifications'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-800'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Notifications & PWA</span>
          </button>

          <button
            onClick={() => setActiveSection('closing')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              activeSection === 'closing'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-800'
            }`}
          >
            <CalendarCheck2 className="w-3.5 h-3.5" />
            <span>Monthly Closing</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: BUSINESS PROFILE */}
      {activeSection === 'general' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 max-w-3xl">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <Building className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold text-white">Business Information</h2>
              <p className="text-xs text-slate-400">
                Printed on quotations, customer receipts, and workshop Job Cards
              </p>
            </div>
          </div>

          {profileSaved && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Business profile updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium">Business Name</label>
                <input
                  type="text"
                  required
                  value={bName}
                  onChange={e => setBName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium">Subtitle / Trade Line</label>
                <input
                  type="text"
                  value={bSubtitle}
                  onChange={e => setBSubtitle(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium">Primary Mobile / WhatsApp</label>
                <input
                  type="text"
                  value={bPhone}
                  onChange={e => setBPhone(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium">Alternative Contact</label>
                <input
                  type="text"
                  value={bAltPhone}
                  onChange={e => setBAltPhone(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-medium">Workshop Address</label>
                <input
                  type="text"
                  value={bAddress}
                  onChange={e => setBAddress(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium">City</label>
                <input
                  type="text"
                  value={bCity}
                  onChange={e => setBCity(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 font-bold text-slate-950 text-xs shadow transition active:scale-95"
              >
                Save Business Profile
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECTION 2: USERS & STAFF MANAGEMENT */}
      {activeSection === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                User & Staff Management
              </h2>
              <p className="text-xs text-slate-400">
                Control team access. Owner can add, edit, disable, or delete users and assign roles.
              </p>
            </div>

            {isOwner && (
              <button
                onClick={() => setShowAddUserModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition active:scale-95"
              >
                <PlusCircle className="w-4 h-4 text-slate-950" />
                <span>+ Add User</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 border-b border-slate-800 text-[11px] text-slate-400 uppercase">
                <tr>
                  <th className="py-2.5 px-3">Full Name</th>
                  <th className="py-2.5 px-3">User ID</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-semibold text-white">{u.fullName}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{u.userId}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === 'Owner'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : u.role === 'Staff'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-1">
                      {isOwner && (
                        <>
                          <button
                            onClick={() => setTargetUserForPass(u.id)}
                            title="Reset Password"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>

                          {u.id !== currentUser?.id && (
                            <>
                              <button
                                onClick={() => toggleUserStatus(u.id)}
                                title={u.status === 'active' ? 'Disable User' : 'Enable User'}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                              >
                                {u.status === 'active' ? (
                                  <ToggleRight className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <ToggleLeft className="w-4 h-4 text-red-400" />
                                )}
                              </button>

                              <button
                                onClick={() => {
                                  if (confirm(`Delete user ${u.fullName}?`)) deleteUser(u.id);
                                }}
                                title="Delete User"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-600 hover:text-white text-slate-400"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 3: TECHNICIANS */}
      {activeSection === 'technicians' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-400" />
                Technician Management
              </h2>
              <p className="text-xs text-slate-400">
                Technicians are dynamic (never hardcoded). Assign technicians to job cards and stock deductions.
              </p>
            </div>

            <button
              onClick={() => setShowAddTechModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              <span>+ Add Technician</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 border-b border-slate-800 text-[11px] text-slate-400 uppercase">
                <tr>
                  <th className="py-2.5 px-3">Technician Name</th>
                  <th className="py-2.5 px-3">Mobile</th>
                  <th className="py-2.5 px-3">Specialty / Role</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {technicians.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No technicians registered yet. Click &ldquo;+ Add Technician&rdquo; to add your first technician.
                    </td>
                  </tr>
                ) : (
                  technicians.map(t => (
                    <tr key={t.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-semibold text-white">{t.name}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{t.mobile || 'N/A'}</td>
                      <td className="py-2.5 px-3 text-slate-300">{t.role}</td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() =>
                            updateTechnician(t.id, {
                              status: t.status === 'active' ? 'inactive' : 'active',
                            })
                          }
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {t.status.toUpperCase()}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => {
                            if (confirm(`Remove technician ${t.name}?`)) deleteTechnician(t.id);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-600 hover:text-white text-slate-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 4: MACHINE BRANDS */}
      {activeSection === 'brands' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                Machine Brands ({brands.length})
              </h2>
              <p className="text-xs text-slate-400">
                Preloaded brands (Ador, ESAB, JK ARC, Neom, etc.) plus custom brands. Historical job brands are never altered.
              </p>
            </div>

            <button
              onClick={() => setShowAddBrandModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              <span>+ Add Brand</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
            {brands.map(b => (
              <div
                key={b.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-white">{b.name}</p>
                  <p className="text-[10px] text-slate-500">
                    {b.status === 'active' ? 'Active' : 'Disabled'}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      updateBrand(b.id, {
                        status: b.status === 'active' ? 'disabled' : 'active',
                      })
                    }
                    className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      b.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {b.status === 'active' ? 'ON' : 'OFF'}
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Delete brand ${b.name}?`)) deleteBrand(b.id);
                    }}
                    className="p-1 text-slate-500 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 5: SPARE CATEGORIES */}
      {activeSection === 'categories' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                Spare Categories ({spareCategories.length})
              </h2>
              <p className="text-xs text-slate-400">
                Organize 60+ components into categories like IGBT PCB, Diodes, Capacitors, SMPS
              </p>
            </div>

            <button
              onClick={() => setShowAddCatModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Add Category</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            {spareCategories.map(cat => (
              <div
                key={cat}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
              >
                <span className="font-semibold text-white">{cat}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 6: MY PASSWORD */}
      {activeSection === 'password' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 max-w-md">
          <div className="pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-400" />
              Change My Password
            </h2>
            <p className="text-xs text-slate-400">
              Update password for logged in account: <strong>{currentUser?.fullName}</strong> ({currentUser?.userId})
            </p>
          </div>

          {passSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs">
              Password changed successfully!
            </div>
          )}

          <form
            onSubmit={e => {
              e.preventDefault();
              if (currentUser) {
                setTargetUserForPass(currentUser.id);
                handlePasswordSubmit(e);
              }
            }}
            className="space-y-3 text-xs"
          >
            <div>
              <label className="block text-slate-300 font-medium">New Password</label>
              <input
                type="password"
                required
                value={newPasswordVal}
                onChange={e => setNewPasswordVal(e.target.value)}
                placeholder="Enter new password"
                className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 font-bold text-slate-950 text-xs shadow transition active:scale-95"
            >
              Update Password
            </button>
          </form>
        </div>
      )}

      {/* SECTION 7: NOTIFICATIONS & PWA */}
      {activeSection === 'notifications' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 max-w-2xl">
          <div className="pb-4 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-400" />
              Notification Settings & PWA Installation
            </h2>
            <p className="text-xs text-slate-400">
              Permission settings for payment due alerts and mobile app setup
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-white">Browser / Android System Notifications</p>
                <p className="text-slate-400 text-[11px]">
                  Current Status:{' '}
                  <span className="font-mono text-amber-400 uppercase font-bold">
                    {notificationPermission}
                  </span>
                </p>
              </div>

              {notificationPermission !== 'granted' && (
                <button
                  onClick={requestNotificationPermission}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 font-bold text-slate-950 text-xs shadow"
                >
                  Enable Notifications
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-800 pt-2">
              Note: NW Service Center runs in-app alerts directly inside the dashboard whenever payments are due or overdue. Browser notifications are supported when permissions are granted by the user.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              PWA Mobile & Laptop Installation Instructions
            </h3>

            <div className="space-y-2 text-slate-300 text-[11px] leading-relaxed">
              <p>
                <strong>On Android Mobile:</strong> Open Chrome → Tap menu (⋮) → Tap <strong>&ldquo;Add to Home screen&rdquo;</strong> or <strong>&ldquo;Install app&rdquo;</strong>. The NW Service Center icon will appear on your phone home screen and open full-screen like a native app.
              </p>
              <p>
                <strong>On Laptop / Desktop:</strong> Look for the <strong>Install NW Service Center</strong> icon in the address bar (or Chrome Settings → Install). Launches in its own window without browser tabs.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 8: MONTHLY CLOSING */}
      {activeSection === 'closing' && <MonthlyClosingView />}

      {/* MODAL: ADD USER */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4" />
                Add User Account
              </h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {userActionError && (
              <div className="mt-3 p-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs">
                {userActionError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-300">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300">User ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. rahul"
                  value={newUserId}
                  onChange={e => setNewUserId(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Enter initial password"
                  value={newUserPass}
                  onChange={e => setNewUserPass(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300">Assign Role *</label>
                <select
                  value={newUserRole}
                  onChange={e => setNewUserRole(e.target.value as UserRole)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="Staff">Staff</option>
                  <option value="Technician">Technician</option>
                  <option value="Owner">Owner</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 font-bold text-slate-950 text-xs shadow transition active:scale-98"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESET PASSWORD FOR USER */}
      {targetUserForPass && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                <Key className="w-4 h-4" />
                Change User Password
              </h3>
              <button
                onClick={() => setTargetUserForPass(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {passSuccess && (
              <div className="mt-3 p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs">
                Password updated successfully!
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-300">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter new password"
                  value={newPasswordVal}
                  onChange={e => setNewPasswordVal(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 font-bold text-slate-950 text-xs shadow transition active:scale-98"
                >
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD TECHNICIAN */}
      {showAddTechModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                <Wrench className="w-4 h-4" />
                Add Technician
              </h3>
              <button
                onClick={() => setShowAddTechModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTech} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-300">
                  Technician Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Asif Tamboli, Santosh K"
                  value={techName}
                  onChange={e => setTechName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300">Mobile Number</label>
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={techMobile}
                  onChange={e => setTechMobile(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300">Specialty Role</label>
                <input
                  type="text"
                  placeholder="e.g. PCB Card Specialist, CO2 Machine Tech"
                  value={techRole}
                  onChange={e => setTechRole(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 font-bold text-slate-950 text-xs shadow transition active:scale-98"
                >
                  Save Technician
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD BRAND */}
      {showAddBrandModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                <Flame className="w-4 h-4" />
                Add Machine Brand
              </h3>
              <button
                onClick={() => setShowAddBrandModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBrand} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-300">
                  Brand Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Miller, Panasonic, Lincoln"
                  value={brandName}
                  onChange={e => setBrandName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 font-bold text-slate-950 text-xs shadow transition active:scale-98"
                >
                  Save Brand
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
