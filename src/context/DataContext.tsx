import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  JobCard,
  JobStatus,
  MachineBrand,
  Technician,
  SpareItem,
  SpareTransaction,
  MonthlyClosing,
  BusinessSettings,
  PaymentEntry,
  JobPartUsed,
  QuotationDetails,
  DispatchDetails,
  CustomerMachine,
} from '../types';
import {
  formatISTDateTime,
  formatISTDateOnly,
  getCurrentMonthPeriod,
  formatMonthName,
} from '../lib/dateUtils';
import { INITIAL_BRANDS, INITIAL_SPARE_CATEGORIES, INITIAL_SPARE_ITEMS } from '../lib/preloadedData';
import { db, OperationType, handleFirestoreError, testFirestoreConnection } from '../lib/firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { useAuth } from './AuthContext';

interface DataContextType {
  jobs: JobCard[];
  customerMachines: CustomerMachine[];
  brands: MachineBrand[];
  technicians: Technician[];
  spareItems: SpareItem[];
  spareCategories: string[];
  spareTransactions: SpareTransaction[];
  monthlyClosings: MonthlyClosing[];
  businessSettings: BusinessSettings;
  isLoading: boolean;

  // Machine operations
  addCustomerMachine: (machine: Omit<CustomerMachine, 'id' | 'createdAt' | 'updatedAt'>) => Promise<CustomerMachine>;
  updateCustomerMachine: (id: string, updates: Partial<CustomerMachine>) => Promise<boolean>;
  deleteCustomerMachine: (id: string) => Promise<boolean>;

  // Job operations
  createJob: (jobData: Omit<JobCard, 'id' | 'jobNumber' | 'createdAt' | 'updatedAt' | 'statusHistory' | 'monthPeriod' | 'isArchived'>) => Promise<JobCard>;
  updateJobStatus: (jobId: string, newStatus: JobStatus, note?: string) => Promise<boolean>;
  updateJob: (jobId: string, updates: Partial<JobCard>) => Promise<boolean>;
  dispatchJob: (jobId: string, dispatchData: DispatchDetails) => Promise<boolean>;
  recordPayment: (jobId: string, payment: Omit<PaymentEntry, 'id' | 'date'>) => Promise<boolean>;
  updateJobQuotation: (jobId: string, quotation: QuotationDetails) => Promise<boolean>;
  useSpareInJob: (jobId: string, itemId: string, quantity: number, rate: number, technicianName: string) => Promise<boolean>;
  deleteJob: (jobId: string) => Promise<boolean>;

  // Spare Stock operations
  addStock: (itemId: string, quantity: number, supplierOrSource: string, notes?: string) => Promise<boolean>;
  deductStock: (itemId: string, quantity: number, jobNumber?: string, technician?: string, reason?: string, notes?: string) => Promise<boolean>;
  createNewSpareItem: (name: string, category: string, initialStock?: number, minAlert?: number, unit?: string) => Promise<SpareItem>;
  updateSpareItem: (itemId: string, updates: Partial<SpareItem>) => Promise<boolean>;
  deleteSpareItem: (itemId: string) => Promise<boolean>;
  addSpareCategory: (categoryName: string) => void;

  // Brand operations
  addBrand: (name: string) => Promise<MachineBrand>;
  updateBrand: (id: string, updates: Partial<MachineBrand>) => Promise<boolean>;
  deleteBrand: (id: string) => Promise<boolean>;

  // Technician operations
  addTechnician: (name: string, mobile: string, role?: string) => Promise<Technician>;
  updateTechnician: (id: string, updates: Partial<Technician>) => Promise<boolean>;
  deleteTechnician: (id: string) => Promise<boolean>;

  // Monthly Closing
  closeCurrentMonth: (closedBy: string, notes?: string) => Promise<MonthlyClosing>;

  // Settings
  updateBusinessSettings: (settings: Partial<BusinessSettings>) => Promise<boolean>;

  // Helper stats
  stats: {
    totalActiveJobs: number;
    receivedJobs: number;
    underRepairJobs: number;
    pendingJobs: number;
    repairedJobs: number;
    readyForCollectionJobs: number;
    dispatchedJobs: number;
    todayRepairCollection: number;
    totalPendingAmount: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Local storage cache keys
const JOBS_CACHE = 'nw_cache_jobs';
const CUSTOMER_MACHINES_CACHE = 'nw_cache_customer_machines';
const BRANDS_CACHE = 'nw_cache_brands';
const TECHS_CACHE = 'nw_cache_technicians';
const SPARES_CACHE = 'nw_cache_spares';
const CATEGORIES_CACHE = 'nw_cache_spare_categories';
const TRANSACTIONS_CACHE = 'nw_cache_transactions';
const CLOSINGS_CACHE = 'nw_cache_closings';
const SETTINGS_CACHE = 'nw_cache_settings';

const DEFAULT_SETTINGS: BusinessSettings = {
  businessName: 'NW SERVICE CENTER',
  subTitle: 'National Welding Machine Service Center',
  phone: '+91 98900 00000',
  altPhone: '+91 94220 00000',
  address: 'Shop No. 4, Old Pune Naka, Near Bus Stand',
  city: 'Solapur',
  state: 'Maharashtra',
  email: 'nwservicecenter.solapur@gmail.com',
  isOwnerConfigured: false,
  paymentReminderDays: 3,
  updatedAt: '',
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [customerMachines, setCustomerMachines] = useState<CustomerMachine[]>([]);
  const [brands, setBrands] = useState<MachineBrand[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [spareItems, setSpareItems] = useState<SpareItem[]>([]);
  const [spareCategories, setSpareCategories] = useState<string[]>(INITIAL_SPARE_CATEGORIES);
  const [spareTransactions, setSpareTransactions] = useState<SpareTransaction[]>([]);
  const [monthlyClosings, setMonthlyClosings] = useState<MonthlyClosing[]>([]);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load from cache first for instant responsiveness
  useEffect(() => {
    try {
      const cJobs = localStorage.getItem(JOBS_CACHE);
      if (cJobs) setJobs(JSON.parse(cJobs));

      const cMachines = localStorage.getItem(CUSTOMER_MACHINES_CACHE);
      if (cMachines) setCustomerMachines(JSON.parse(cMachines));

      const cBrands = localStorage.getItem(BRANDS_CACHE);
      if (cBrands) setBrands(JSON.parse(cBrands));

      const cTechs = localStorage.getItem(TECHS_CACHE);
      if (cTechs) setTechnicians(JSON.parse(cTechs));

      const cSpares = localStorage.getItem(SPARES_CACHE);
      if (cSpares) setSpareItems(JSON.parse(cSpares));

      const cCats = localStorage.getItem(CATEGORIES_CACHE);
      if (cCats) setSpareCategories(JSON.parse(cCats));

      const cTx = localStorage.getItem(TRANSACTIONS_CACHE);
      if (cTx) setSpareTransactions(JSON.parse(cTx));

      const cClosings = localStorage.getItem(CLOSINGS_CACHE);
      if (cClosings) setMonthlyClosings(JSON.parse(cClosings));

      const cSettings = localStorage.getItem(SETTINGS_CACHE);
      if (cSettings) setBusinessSettings(JSON.parse(cSettings));
    } catch (e) {
      console.warn('Cache loading error:', e);
    }
  }, []);

  // Initialize and synchronize with Firestore
  useEffect(() => {
    let unsubJobs = () => {};
    let unsubMachines = () => {};
    let unsubBrands = () => {};
    let unsubTechs = () => {};
    let unsubSpares = () => {};
    let unsubTx = () => {};
    let unsubClosings = () => {};
    let unsubSettings = () => {};

    const syncFirestore = async () => {
      await testFirestoreConnection();

      // Setup Realtime Listeners
      try {
        // 0. Customer Machines
        unsubMachines = onSnapshot(collection(db, 'customer_machines'), (snap) => {
          const loaded: CustomerMachine[] = [];
          snap.forEach(d => loaded.push({ id: d.id, ...(d.data() as Omit<CustomerMachine, 'id'>) }));
          setCustomerMachines(loaded);
          localStorage.setItem(CUSTOMER_MACHINES_CACHE, JSON.stringify(loaded));
        }, (err) => handleFirestoreError(err, OperationType.GET, 'customer_machines'));

        // 1. Machine Brands
        unsubBrands = onSnapshot(collection(db, 'machine_brands'), (snap) => {
          if (snap.empty && brands.length === 0) {
            // Seed initial brands
            seedInitialBrands();
          } else {
            const loaded: MachineBrand[] = [];
            snap.forEach(d => loaded.push({ id: d.id, ...(d.data() as Omit<MachineBrand, 'id'>) }));
            setBrands(loaded);
            localStorage.setItem(BRANDS_CACHE, JSON.stringify(loaded));
          }
        }, (err) => handleFirestoreError(err, OperationType.GET, 'machine_brands'));

        // 2. Technicians
        unsubTechs = onSnapshot(collection(db, 'technicians'), (snap) => {
          if (snap.empty && technicians.length === 0) {
            seedInitialTechnicians();
          } else {
            const loaded: Technician[] = [];
            snap.forEach(d => loaded.push({ id: d.id, ...(d.data() as Omit<Technician, 'id'>) }));
            setTechnicians(loaded);
            localStorage.setItem(TECHS_CACHE, JSON.stringify(loaded));
          }
        }, (err) => handleFirestoreError(err, OperationType.GET, 'technicians'));

        // 3. Spare Items
        unsubSpares = onSnapshot(collection(db, 'spare_items'), (snap) => {
          if (snap.empty && spareItems.length === 0) {
            seedInitialSpares();
          } else {
            const loaded: SpareItem[] = [];
            snap.forEach(d => loaded.push({ id: d.id, ...(d.data() as Omit<SpareItem, 'id'>) }));
            setSpareItems(loaded);
            localStorage.setItem(SPARES_CACHE, JSON.stringify(loaded));
          }
        }, (err) => handleFirestoreError(err, OperationType.GET, 'spare_items'));

        // 4. Spare Transactions
        unsubTx = onSnapshot(collection(db, 'spare_transactions'), (snap) => {
          const loaded: SpareTransaction[] = [];
          snap.forEach(d => loaded.push({ id: d.id, ...(d.data() as Omit<SpareTransaction, 'id'>) }));
          // sort descending by timestamp
          loaded.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          setSpareTransactions(loaded);
          localStorage.setItem(TRANSACTIONS_CACHE, JSON.stringify(loaded));
        }, (err) => handleFirestoreError(err, OperationType.GET, 'spare_transactions'));

        // 5. Jobs
        unsubJobs = onSnapshot(collection(db, 'jobs'), (snap) => {
          if (snap.empty && jobs.length === 0) {
            seedInitialJobs();
          } else {
            const loaded: JobCard[] = [];
            snap.forEach(d => loaded.push({ id: d.id, ...(d.data() as Omit<JobCard, 'id'>) }));
            // sort descending by created
            loaded.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
            setJobs(loaded);
            localStorage.setItem(JOBS_CACHE, JSON.stringify(loaded));
            setIsLoading(false);
          }
        }, (err) => handleFirestoreError(err, OperationType.GET, 'jobs'));

        // 6. Monthly closings
        unsubClosings = onSnapshot(collection(db, 'monthly_closings'), (snap) => {
          const loaded: MonthlyClosing[] = [];
          snap.forEach(d => loaded.push({ id: d.id, ...(d.data() as Omit<MonthlyClosing, 'id'>) }));
          loaded.sort((a, b) => b.monthPeriod.localeCompare(a.monthPeriod));
          setMonthlyClosings(loaded);
          localStorage.setItem(CLOSINGS_CACHE, JSON.stringify(loaded));
        }, (err) => handleFirestoreError(err, OperationType.GET, 'monthly_closings'));

        // 7. Settings
        unsubSettings = onSnapshot(doc(db, 'settings', 'general'), (snap) => {
          if (snap.exists()) {
            const data = snap.data() as BusinessSettings;
            setBusinessSettings(data);
            localStorage.setItem(SETTINGS_CACHE, JSON.stringify(data));
          }
        }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/general'));
      } catch (err) {
        console.warn('Realtime listeners fallback to cached mode:', err);
        setIsLoading(false);
      }
    };

    syncFirestore();

    return () => {
      unsubJobs();
      unsubMachines();
      unsubBrands();
      unsubTechs();
      unsubSpares();
      unsubTx();
      unsubClosings();
      unsubSettings();
    };
  }, []);

  // Helper: Seed Initial Brands if empty
  const seedInitialBrands = async () => {
    try {
      const seeded: MachineBrand[] = [];
      const now = formatISTDateTime();
      for (const brand of INITIAL_BRANDS) {
        const id = 'brand_' + brand.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const brandObj: MachineBrand = {
          id,
          name: brand.name,
          status: 'active',
          isDefault: true,
          createdAt: now,
        };
        seeded.push(brandObj);
        await setDoc(doc(db, 'machine_brands', id), brandObj);
      }
      setBrands(seeded);
      localStorage.setItem(BRANDS_CACHE, JSON.stringify(seeded));
    } catch (e) {
      console.warn('Seeding brands fallback:', e);
    }
  };

  // Helper: Seed Initial Spares if empty
  const seedInitialSpares = async () => {
    try {
      const seeded: SpareItem[] = [];
      const now = formatISTDateTime();
      for (const item of INITIAL_SPARE_ITEMS) {
        const id = 'spare_' + item.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const spareObj: SpareItem = {
          id,
          name: item.name,
          category: item.category,
          currentStock: item.defaultStock || 10,
          minStockAlert: item.minAlert || 3,
          totalAdded: item.defaultStock || 10,
          totalUsed: 0,
          unit: item.unit || 'pcs',
          createdAt: now,
          updatedAt: now,
        };
        seeded.push(spareObj);
        await setDoc(doc(db, 'spare_items', id), spareObj);
      }
      setSpareItems(seeded);
      localStorage.setItem(SPARES_CACHE, JSON.stringify(seeded));
    } catch (e) {
      console.warn('Seeding spares fallback:', e);
    }
  };

  // Helper: Seed Initial Technicians if empty
  const seedInitialTechnicians = async () => {
    try {
      const initialTechs: Array<{ name: string; mobile: string; role: string }> = [
        { name: 'Ramesh Pawar', mobile: '9890111222', role: 'Senior Inverter Specialist' },
        { name: 'Sachin Patil', mobile: '9890222333', role: 'Card & IGBT Technician' },
        { name: 'Amol Shinde', mobile: '9890333444', role: 'Assistant Technician' },
      ];
      const seeded: Technician[] = [];
      const now = formatISTDateTime();
      for (const t of initialTechs) {
        const id = 'tech_' + t.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const techObj: Technician = {
          id,
          name: t.name,
          mobile: t.mobile,
          role: t.role,
          status: 'active',
          createdAt: now,
        };
        seeded.push(techObj);
        await setDoc(doc(db, 'technicians', id), techObj);
      }
      setTechnicians(seeded);
      localStorage.setItem(TECHS_CACHE, JSON.stringify(seeded));
    } catch (e) {
      console.warn('Seeding technicians fallback:', e);
    }
  };

  // Helper: Seed Initial Demo Customer (ABC Fabrication with 3 machines) if empty
  const seedInitialJobs = async () => {
    try {
      const now = formatISTDateTime();
      const currentMonth = getCurrentMonthPeriod();

      // Demo Customer: ABC Fabrication
      const custName = 'ABC Fabrication';
      const custPhone = '9890123456';

      // 1. Machine 1: Ador 400i (Repaired, Job NW-0001)
      const mach1Id = 'mach_demo_ador_400i';
      const mach1: CustomerMachine = {
        id: mach1Id,
        customerName: custName,
        customerPhone: custPhone,
        machineBrand: 'Ador',
        machineModel: '400i',
        machineType: 'ARC Inverter',
        serialNumber: 'AD-400i-8891',
        photoUrl: '',
        notes: 'Includes 400A heavy welding torch and 50mm cable',
        createdAt: now,
        updatedAt: now,
      };

      const job1: JobCard = {
        id: 'job_demo_nw_0001',
        jobNumber: 'NW-0001',
        customerName: custName,
        customerPhone: custPhone,
        machineId: mach1Id,
        machineBrand: 'Ador',
        machineModel: '400i',
        machineType: 'ARC Inverter',
        serialNumber: 'AD-400i-8891',
        customerComplaint: 'No Output Current, OC Overheat LED glowing',
        receivedDate: '28/09/2026, 10:15 AM',
        expectedCompletionDate: '29/09/2026',
        expectedDeliveryDate: '30/09/2026',
        technicianId: 'tech_ramesh_pawar',
        technicianName: 'Ramesh Pawar',
        status: 'Repaired',
        statusHistory: [
          { status: 'Received', timestamp: '28/09/2026, 10:15 AM', changedBy: 'Owner' },
          { status: 'Under Repair', timestamp: '28/09/2026, 02:30 PM', changedBy: 'Ramesh Pawar' },
          { status: 'Repaired', timestamp: '29/09/2026, 05:00 PM', changedBy: 'Ramesh Pawar', note: 'Replaced 2x 25N120 IGBTs and 1x Diode card. Output 220A tested OK on load.' },
        ],
        repairCharges: 3200,
        advance: 1000,
        balance: 0,
        paymentStatus: 'Paid',
        payments: [
          { id: 'pay_init_1', amount: 1000, date: '28/09/2026, 10:15 AM', receivedBy: 'Owner', paymentMode: 'Cash', note: 'Advance at receiving' },
          { id: 'pay_init_2', amount: 2200, date: '30/09/2026, 11:30 AM', receivedBy: 'Owner', paymentMode: 'UPI', note: 'Final settlement' },
        ],
        partsUsed: [
          { itemId: 'spare_25n120', itemName: '25N120', quantity: 2, rate: 350, amount: 700, date: '28/09/2026', technician: 'Ramesh Pawar' },
        ],
        monthPeriod: currentMonth,
        isArchived: false,
        createdAt: '2026-09-28T10:15:00Z',
        updatedAt: now,
      };

      // 2. Machine 2: ESAB 400A (Under Repair, Job NW-0002)
      const mach2Id = 'mach_demo_esab_400a';
      const mach2: CustomerMachine = {
        id: mach2Id,
        customerName: custName,
        customerPhone: custPhone,
        machineBrand: 'ESAB',
        machineModel: '400A',
        machineType: 'MIG/MAG Inverter',
        serialNumber: 'ES-400A-1024',
        photoUrl: '',
        notes: 'Co2 gas pre-heater cable attached',
        createdAt: now,
        updatedAt: now,
      };

      const job2: JobCard = {
        id: 'job_demo_nw_0002',
        jobNumber: 'NW-0002',
        customerName: custName,
        customerPhone: custPhone,
        machineId: mach2Id,
        machineBrand: 'ESAB',
        machineModel: '400A',
        machineType: 'MIG/MAG Inverter',
        serialNumber: 'ES-400A-1024',
        customerComplaint: 'Wire feeder motor running slow, main contactor chattering',
        receivedDate: '30/09/2026, 11:30 AM',
        expectedCompletionDate: '02/10/2026',
        expectedDeliveryDate: '03/10/2026',
        technicianId: 'tech_sachin_patil',
        technicianName: 'Sachin Patil',
        status: 'Under Repair',
        statusHistory: [
          { status: 'Received', timestamp: '30/09/2026, 11:30 AM', changedBy: 'Owner' },
          { status: 'Under Repair', timestamp: '30/09/2026, 03:00 PM', changedBy: 'Sachin Patil', note: 'Checking drive card PWM and 24V DC auxiliary supply.' },
        ],
        repairCharges: 4500,
        advance: 1500,
        balance: 3000,
        paymentStatus: 'Partially Paid',
        paymentDueDate: '03/10/2026',
        payments: [
          { id: 'pay_init_3', amount: 1500, date: '30/09/2026, 11:30 AM', receivedBy: 'Owner', paymentMode: 'UPI', note: 'Advance at receiving' },
        ],
        partsUsed: [],
        monthPeriod: currentMonth,
        isArchived: false,
        createdAt: '2026-09-30T11:30:00Z',
        updatedAt: now,
      };

      // 3. Machine 3: JK ARC 300 (Pending, Job NW-0003)
      const mach3Id = 'mach_demo_jk_arc_300';
      const mach3: CustomerMachine = {
        id: mach3Id,
        customerName: custName,
        customerPhone: custPhone,
        machineBrand: 'JK ARC',
        machineModel: '300',
        machineType: 'ARC Inverter',
        serialNumber: 'JK-300-5512',
        photoUrl: '',
        notes: 'Brought by operator Rahul',
        createdAt: now,
        updatedAt: now,
      };

      const job3: JobCard = {
        id: 'job_demo_nw_0003',
        jobNumber: 'NW-0003',
        customerName: custName,
        customerPhone: custPhone,
        machineId: mach3Id,
        machineBrand: 'JK ARC',
        machineModel: '300',
        machineType: 'ARC Inverter',
        serialNumber: 'JK-300-5512',
        customerComplaint: 'Display not turning ON after 440V high input phase blast',
        receivedDate: '01/10/2026, 09:45 AM',
        expectedCompletionDate: '03/10/2026',
        expectedDeliveryDate: '04/10/2026',
        technicianId: 'tech_amol_shinde',
        technicianName: 'Amol Shinde',
        status: 'Waiting for Parts',
        statusHistory: [
          { status: 'Received', timestamp: '01/10/2026, 09:45 AM', changedBy: 'Owner' },
          { status: 'Waiting for Parts', timestamp: '01/10/2026, 12:00 PM', changedBy: 'Amol Shinde', note: 'SMPS card burnt, awaiting 24V auxiliary transformer board.' },
        ],
        repairCharges: 2800,
        advance: 0,
        balance: 2800,
        paymentStatus: 'Pending',
        paymentDueDate: '04/10/2026',
        payments: [],
        partsUsed: [],
        monthPeriod: currentMonth,
        isArchived: false,
        createdAt: '2026-10-01T09:45:00Z',
        updatedAt: now,
      };

      // Save customer machines
      const seededMachines = [mach1, mach2, mach3];
      for (const m of seededMachines) {
        await setDoc(doc(db, 'customer_machines', m.id), m);
      }
      setCustomerMachines(seededMachines);
      localStorage.setItem(CUSTOMER_MACHINES_CACHE, JSON.stringify(seededMachines));

      // Save jobs
      const seededJobs = [job3, job2, job1];
      for (const j of seededJobs) {
        await setDoc(doc(db, 'jobs', j.id), j);
      }
      setJobs(seededJobs);
      localStorage.setItem(JOBS_CACHE, JSON.stringify(seededJobs));
      setIsLoading(false);
    } catch (e) {
      console.warn('Seeding demo customer and jobs fallback:', e);
      setIsLoading(false);
    }
  };

  // Helper to generate guaranteed sequential unique Job Number: NW-0001, NW-0002...
  const generateNextJobNumber = (): string => {
    let maxNum = 0;
    jobs.forEach(j => {
      if (j.jobNumber && j.jobNumber.startsWith('NW-')) {
        const numPart = parseInt(j.jobNumber.replace('NW-', ''), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    });
    const next = maxNum + 1;
    return `NW-${next.toString().padStart(4, '0')}`;
  };

  // Machine Operations
  const addCustomerMachine = async (
    machine: Omit<CustomerMachine, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<CustomerMachine> => {
    const now = formatISTDateTime();
    const id = `mach_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newMachine: CustomerMachine = {
      ...machine,
      id,
      createdAt: now,
      updatedAt: now,
    };
    try {
      await setDoc(doc(db, 'customer_machines', id), newMachine);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `customer_machines/${id}`);
    }
    const updated = [newMachine, ...customerMachines];
    setCustomerMachines(updated);
    localStorage.setItem(CUSTOMER_MACHINES_CACHE, JSON.stringify(updated));
    return newMachine;
  };

  const updateCustomerMachine = async (
    id: string,
    updates: Partial<CustomerMachine>
  ): Promise<boolean> => {
    const target = customerMachines.find(m => m.id === id);
    if (!target) return false;
    const now = formatISTDateTime();
    const updatedMachine: CustomerMachine = {
      ...target,
      ...updates,
      updatedAt: now,
    };
    try {
      await updateDoc(doc(db, 'customer_machines', id), {
        ...updates,
        updatedAt: now,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `customer_machines/${id}`);
    }
    const updatedList = customerMachines.map(m => (m.id === id ? updatedMachine : m));
    setCustomerMachines(updatedList);
    localStorage.setItem(CUSTOMER_MACHINES_CACHE, JSON.stringify(updatedList));
    return true;
  };

  const deleteCustomerMachine = async (id: string): Promise<boolean> => {
    try {
      await deleteDoc(doc(db, 'customer_machines', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `customer_machines/${id}`);
    }
    const filtered = customerMachines.filter(m => m.id !== id);
    setCustomerMachines(filtered);
    localStorage.setItem(CUSTOMER_MACHINES_CACHE, JSON.stringify(filtered));
    return true;
  };

  // 1. Create Job Card
  const createJob = async (
    jobData: Omit<JobCard, 'id' | 'jobNumber' | 'createdAt' | 'updatedAt' | 'statusHistory' | 'monthPeriod' | 'isArchived'>
  ): Promise<JobCard> => {
    const now = formatISTDateTime();
    const jobNumber = generateNextJobNumber();
    const id = `job_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const currentMonth = getCurrentMonthPeriod();

    // Auto-link or create CustomerMachine if not explicitly provided
    let assignedMachineId = jobData.machineId;
    if (!assignedMachineId) {
      const cleanPhone = (jobData.customerPhone || '').trim();
      const existingMach = customerMachines.find(m => {
        if (m.customerPhone.trim() !== cleanPhone) return false;
        if (jobData.serialNumber && jobData.serialNumber !== 'N/A' && m.serialNumber && m.serialNumber !== 'N/A') {
          return m.serialNumber.toLowerCase() === jobData.serialNumber.toLowerCase();
        }
        return m.machineBrand.toLowerCase() === jobData.machineBrand.toLowerCase() &&
               m.machineModel.toLowerCase() === jobData.machineModel.toLowerCase();
      });

      if (existingMach) {
        assignedMachineId = existingMach.id;
      } else {
        const newMach = await addCustomerMachine({
          customerName: jobData.customerName,
          customerPhone: jobData.customerPhone,
          machineBrand: jobData.machineBrand,
          machineModel: jobData.machineModel,
          machineType: jobData.machineType,
          serialNumber: jobData.serialNumber || 'N/A',
          photoUrl: jobData.photoUrl || '',
          notes: `Registered with Job ${jobNumber}`,
        });
        assignedMachineId = newMach.id;
      }
    }

    const newJob: JobCard = {
      ...jobData,
      id,
      jobNumber,
      machineId: assignedMachineId,
      receivedDate: jobData.receivedDate || now,
      monthPeriod: currentMonth,
      isArchived: false,
      statusHistory: [
        {
          status: jobData.status || 'Received',
          timestamp: now,
          changedBy: currentUser?.fullName || 'Owner',
          note: 'Job Card created and machine received',
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    try {
      await setDoc(doc(db, 'jobs', id), newJob);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `jobs/${id}`);
    }

    const updated = [newJob, ...jobs];
    setJobs(updated);
    localStorage.setItem(JOBS_CACHE, JSON.stringify(updated));
    return newJob;
  };

  // 2. Update Job Status
  const updateJobStatus = async (jobId: string, newStatus: JobStatus, note?: string): Promise<boolean> => {
    const target = jobs.find(j => j.id === jobId);
    if (!target) return false;

    const now = formatISTDateTime();
    const historyEntry = {
      status: newStatus,
      timestamp: now,
      changedBy: currentUser?.fullName || 'Staff',
      note: note || `Status updated to ${newStatus}`,
    };

    const updatedHistory = [...(target.statusHistory || []), historyEntry];
    const updates: Partial<JobCard> = {
      status: newStatus,
      statusHistory: updatedHistory,
      updatedAt: now,
    };

    return updateJob(jobId, updates);
  };

  // 3. Update Generic Job fields
  const updateJob = async (jobId: string, updates: Partial<JobCard>): Promise<boolean> => {
    const target = jobs.find(j => j.id === jobId);
    if (!target) return false;

    const now = formatISTDateTime();
    const updatedJob: JobCard = {
      ...target,
      ...updates,
      updatedAt: now,
    };

    try {
      await updateDoc(doc(db, 'jobs', jobId), {
        ...updates,
        updatedAt: now,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `jobs/${jobId}`);
    }

    const newJobs = jobs.map(j => (j.id === jobId ? updatedJob : j));
    setJobs(newJobs);
    localStorage.setItem(JOBS_CACHE, JSON.stringify(newJobs));
    return true;
  };

  // 4. Dispatch Job
  const dispatchJob = async (jobId: string, dispatchData: DispatchDetails): Promise<boolean> => {
    const target = jobs.find(j => j.id === jobId);
    if (!target) return false;

    const now = formatISTDateTime();
    const historyEntry = {
      status: 'Dispatched' as JobStatus,
      timestamp: now,
      changedBy: dispatchData.dispatchedBy || currentUser?.fullName || 'Staff',
      note: `Machine dispatched. Delivery: ${dispatchData.deliveryMethod}. Technician: ${dispatchData.technician || 'N/A'}`,
    };

    const updates: Partial<JobCard> = {
      status: 'Dispatched',
      dispatchDetails: dispatchData,
      statusHistory: [...(target.statusHistory || []), historyEntry],
      updatedAt: now,
    };

    return updateJob(jobId, updates);
  };

  // 5. Record Payment
  const recordPayment = async (
    jobId: string,
    payment: Omit<PaymentEntry, 'id' | 'date'>
  ): Promise<boolean> => {
    const target = jobs.find(j => j.id === jobId);
    if (!target) return false;

    const now = formatISTDateTime();
    const paymentId = `pay_${Date.now()}`;
    const newEntry: PaymentEntry = {
      ...payment,
      id: paymentId,
      date: now,
    };

    const currentPayments = target.payments || [];
    const updatedPayments = [...currentPayments, newEntry];

    // Compute updated total paid and balance
    const totalPaid = updatedPayments.reduce((sum, p) => sum + (p.amount || 0), 0) + (target.advance || 0);
    const totalCharge = target.repairCharges || 0;
    const newBalance = Math.max(0, totalCharge - totalPaid);

    let paymentStatus: 'Paid' | 'Partially Paid' | 'Pending' = 'Pending';
    if (newBalance <= 0) {
      paymentStatus = 'Paid';
    } else if (totalPaid > 0) {
      paymentStatus = 'Partially Paid';
    }

    const updates: Partial<JobCard> = {
      payments: updatedPayments,
      balance: newBalance,
      paymentStatus,
      updatedAt: now,
    };

    return updateJob(jobId, updates);
  };

  // 6. Update Quotation
  const updateJobQuotation = async (jobId: string, quotation: QuotationDetails): Promise<boolean> => {
    const target = jobs.find(j => j.id === jobId);
    if (!target) return false;

    const now = formatISTDateTime();
    const finalQuotation = {
      ...quotation,
      updatedAt: now,
    };

    const totalRepairCharges = quotation.totalAmount || target.repairCharges;
    const totalPaid = (target.payments || []).reduce((s, p) => s + p.amount, 0) + (quotation.advance || target.advance || 0);
    const newBalance = Math.max(0, totalRepairCharges - totalPaid);

    const updates: Partial<JobCard> = {
      quotation: finalQuotation,
      repairCharges: totalRepairCharges,
      advance: quotation.advance || target.advance,
      balance: newBalance,
      updatedAt: now,
    };

    return updateJob(jobId, updates);
  };

  // 7. Use Spare in Job (automatically deducts stock and logs transaction only once)
  const useSpareInJob = async (
    jobId: string,
    itemId: string,
    quantity: number,
    rate: number,
    technicianName: string
  ): Promise<boolean> => {
    const targetJob = jobs.find(j => j.id === jobId);
    const targetItem = spareItems.find(s => s.id === itemId);

    if (!targetJob || !targetItem) return false;
    if (targetItem.currentStock < quantity) {
      throw new Error(`Insufficient stock for ${targetItem.name}. Current stock: ${targetItem.currentStock}`);
    }

    const now = formatISTDateTime();

    // 1. Deduct stock and record transaction
    await deductStock(
      itemId,
      quantity,
      targetJob.jobNumber,
      technicianName,
      `Used in Job ${targetJob.jobNumber} (${targetJob.machineBrand} ${targetJob.machineModel})`,
      'Job spare replacement'
    );

    // 2. Add to Job's partsUsed list
    const partEntry: JobPartUsed = {
      itemId,
      itemName: targetItem.name,
      categoryName: targetItem.category,
      quantity,
      rate,
      amount: quantity * rate,
      date: now,
      technician: technicianName,
    };

    const updatedParts = [...(targetJob.partsUsed || []), partEntry];

    // Recalculate repair charges if parts add to the total
    const partsTotal = updatedParts.reduce((sum, p) => sum + p.amount, 0);
    const existingCharges = targetJob.repairCharges || 0;
    const updatedCharges = Math.max(existingCharges, partsTotal);
    const totalPaid = (targetJob.payments || []).reduce((s, p) => s + p.amount, 0) + (targetJob.advance || 0);
    const updatedBalance = Math.max(0, updatedCharges - totalPaid);

    await updateJob(jobId, {
      partsUsed: updatedParts,
      repairCharges: updatedCharges,
      balance: updatedBalance,
      updatedAt: now,
    });

    return true;
  };

  // 8. Delete Job
  const deleteJob = async (jobId: string): Promise<boolean> => {
    try {
      await deleteDoc(doc(db, 'jobs', jobId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `jobs/${jobId}`);
    }
    const filtered = jobs.filter(j => j.id !== jobId);
    setJobs(filtered);
    localStorage.setItem(JOBS_CACHE, JSON.stringify(filtered));
    return true;
  };

  // 9. Add Stock [ + ]
  const addStock = async (
    itemId: string,
    quantity: number,
    supplierOrSource: string,
    notes?: string
  ): Promise<boolean> => {
    const item = spareItems.find(s => s.id === itemId);
    if (!item || quantity <= 0) return false;

    const now = formatISTDateTime();
    const previousStock = item.currentStock;
    const newStock = previousStock + quantity;
    const totalAdded = (item.totalAdded || 0) + quantity;

    // Update item
    const updatedItem: SpareItem = {
      ...item,
      currentStock: newStock,
      totalAdded,
      updatedAt: now,
    };

    try {
      await updateDoc(doc(db, 'spare_items', itemId), {
        currentStock: newStock,
        totalAdded,
        updatedAt: now,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `spare_items/${itemId}`);
    }

    // Record transaction
    const txId = `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const tx: SpareTransaction = {
      id: txId,
      itemId,
      itemName: item.name,
      categoryName: item.category,
      type: 'IN',
      quantity,
      previousStock,
      newStock,
      supplierOrSource: supplierOrSource || 'Supplier Purchase',
      notes,
      timestamp: now,
      createdBy: currentUser?.fullName || 'Owner',
      createdAt: now,
    };

    try {
      await setDoc(doc(db, 'spare_transactions', txId), tx);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `spare_transactions/${txId}`);
    }

    // Update state
    const newSpares = spareItems.map(s => (s.id === itemId ? updatedItem : s));
    setSpareItems(newSpares);
    localStorage.setItem(SPARES_CACHE, JSON.stringify(newSpares));

    const newTx = [tx, ...spareTransactions];
    setSpareTransactions(newTx);
    localStorage.setItem(TRANSACTIONS_CACHE, JSON.stringify(newTx));

    return true;
  };

  // 10. Deduct Stock [ - ]
  const deductStock = async (
    itemId: string,
    quantity: number,
    jobNumber?: string,
    technician?: string,
    reason?: string,
    notes?: string
  ): Promise<boolean> => {
    const item = spareItems.find(s => s.id === itemId);
    if (!item || quantity <= 0) return false;

    if (item.currentStock < quantity) {
      throw new Error(`Insufficient stock for ${item.name}. Available: ${item.currentStock}`);
    }

    const now = formatISTDateTime();
    const previousStock = item.currentStock;
    const newStock = previousStock - quantity;
    const totalUsed = (item.totalUsed || 0) + quantity;

    // Update item
    const updatedItem: SpareItem = {
      ...item,
      currentStock: newStock,
      totalUsed,
      updatedAt: now,
    };

    try {
      await updateDoc(doc(db, 'spare_items', itemId), {
        currentStock: newStock,
        totalUsed,
        updatedAt: now,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `spare_items/${itemId}`);
    }

    // Record transaction
    const txId = `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const tx: SpareTransaction = {
      id: txId,
      itemId,
      itemName: item.name,
      categoryName: item.category,
      type: 'OUT',
      quantity,
      previousStock,
      newStock,
      jobNumber: jobNumber || 'N/A',
      technician: technician || 'N/A',
      reason: reason || 'Machine Repair / Consumption',
      notes,
      timestamp: now,
      createdBy: currentUser?.fullName || 'Staff',
      createdAt: now,
    };

    try {
      await setDoc(doc(db, 'spare_transactions', txId), tx);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `spare_transactions/${txId}`);
    }

    // Update state
    const newSpares = spareItems.map(s => (s.id === itemId ? updatedItem : s));
    setSpareItems(newSpares);
    localStorage.setItem(SPARES_CACHE, JSON.stringify(newSpares));

    const newTx = [tx, ...spareTransactions];
    setSpareTransactions(newTx);
    localStorage.setItem(TRANSACTIONS_CACHE, JSON.stringify(newTx));

    return true;
  };

  // 11. Create New Spare Item
  const createNewSpareItem = async (
    name: string,
    category: string,
    initialStock: number = 0,
    minAlert: number = 3,
    unit: string = 'pcs'
  ): Promise<SpareItem> => {
    const now = formatISTDateTime();
    const id = 'spare_' + Date.now();
    const newItem: SpareItem = {
      id,
      name: name.trim(),
      category: category.trim(),
      currentStock: Math.max(0, initialStock),
      minStockAlert: Math.max(1, minAlert),
      totalAdded: Math.max(0, initialStock),
      totalUsed: 0,
      unit,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await setDoc(doc(db, 'spare_items', id), newItem);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `spare_items/${id}`);
    }

    // If initial stock was provided, record opening stock transaction
    if (initialStock > 0) {
      const txId = `tx_${Date.now()}`;
      const tx: SpareTransaction = {
        id: txId,
        itemId: id,
        itemName: newItem.name,
        categoryName: newItem.category,
        type: 'IN',
        quantity: initialStock,
        previousStock: 0,
        newStock: initialStock,
        supplierOrSource: 'Opening Stock',
        notes: 'Initial inventory entry',
        timestamp: now,
        createdBy: currentUser?.fullName || 'Owner',
        createdAt: now,
      };
      try {
        await setDoc(doc(db, 'spare_transactions', txId), tx);
        setSpareTransactions(prev => [tx, ...prev]);
      } catch (err) {
        console.warn('Opening stock log error:', err);
      }
    }

    const updated = [...spareItems, newItem];
    setSpareItems(updated);
    localStorage.setItem(SPARES_CACHE, JSON.stringify(updated));

    // Ensure category exists in categories list
    if (!spareCategories.includes(category.trim())) {
      addSpareCategory(category.trim());
    }

    return newItem;
  };

  // 12. Update Spare Item
  const updateSpareItem = async (itemId: string, updates: Partial<SpareItem>): Promise<boolean> => {
    const item = spareItems.find(s => s.id === itemId);
    if (!item) return false;

    const now = formatISTDateTime();
    const updatedItem: SpareItem = {
      ...item,
      ...updates,
      updatedAt: now,
    };

    try {
      await updateDoc(doc(db, 'spare_items', itemId), {
        ...updates,
        updatedAt: now,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `spare_items/${itemId}`);
    }

    const updated = spareItems.map(s => (s.id === itemId ? updatedItem : s));
    setSpareItems(updated);
    localStorage.setItem(SPARES_CACHE, JSON.stringify(updated));
    return true;
  };

  // 13. Delete Spare Item
  const deleteSpareItem = async (itemId: string): Promise<boolean> => {
    try {
      await deleteDoc(doc(db, 'spare_items', itemId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `spare_items/${itemId}`);
    }
    const filtered = spareItems.filter(s => s.id !== itemId);
    setSpareItems(filtered);
    localStorage.setItem(SPARES_CACHE, JSON.stringify(filtered));
    return true;
  };

  // 14. Add Spare Category
  const addSpareCategory = (catName: string) => {
    const clean = catName.trim();
    if (!clean || spareCategories.includes(clean)) return;
    const updated = [...spareCategories, clean];
    setSpareCategories(updated);
    localStorage.setItem(CATEGORIES_CACHE, JSON.stringify(updated));
  };

  // 15. Brands CRUD
  const addBrand = async (name: string): Promise<MachineBrand> => {
    const clean = name.trim();
    if (!clean) throw new Error('Brand name required');

    const now = formatISTDateTime();
    const id = 'brand_' + Date.now();
    const newBrand: MachineBrand = {
      id,
      name: clean,
      status: 'active',
      isDefault: false,
      createdAt: now,
    };

    try {
      await setDoc(doc(db, 'machine_brands', id), newBrand);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `machine_brands/${id}`);
    }

    const updated = [...brands, newBrand];
    setBrands(updated);
    localStorage.setItem(BRANDS_CACHE, JSON.stringify(updated));
    return newBrand;
  };

  const updateBrand = async (id: string, updates: Partial<MachineBrand>): Promise<boolean> => {
    const target = brands.find(b => b.id === id);
    if (!target) return false;

    const updatedBrand: MachineBrand = { ...target, ...updates };
    try {
      await updateDoc(doc(db, 'machine_brands', id), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `machine_brands/${id}`);
    }

    const updated = brands.map(b => (b.id === id ? updatedBrand : b));
    setBrands(updated);
    localStorage.setItem(BRANDS_CACHE, JSON.stringify(updated));
    return true;
  };

  const deleteBrand = async (id: string): Promise<boolean> => {
    try {
      await deleteDoc(doc(db, 'machine_brands', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `machine_brands/${id}`);
    }
    const filtered = brands.filter(b => b.id !== id);
    setBrands(filtered);
    localStorage.setItem(BRANDS_CACHE, JSON.stringify(filtered));
    return true;
  };

  // 16. Technicians CRUD
  const addTechnician = async (name: string, mobile: string, role: string = 'Service Technician'): Promise<Technician> => {
    const clean = name.trim();
    if (!clean) throw new Error('Technician name required');

    const now = formatISTDateTime();
    const id = 'tech_' + Date.now();
    const newTech: Technician = {
      id,
      name: clean,
      mobile: mobile.trim(),
      role: role.trim() || 'Service Technician',
      status: 'active',
      createdAt: now,
    };

    try {
      await setDoc(doc(db, 'technicians', id), newTech);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `technicians/${id}`);
    }

    const updated = [...technicians, newTech];
    setTechnicians(updated);
    localStorage.setItem(TECHS_CACHE, JSON.stringify(updated));
    return newTech;
  };

  const updateTechnician = async (id: string, updates: Partial<Technician>): Promise<boolean> => {
    const target = technicians.find(t => t.id === id);
    if (!target) return false;

    const updatedTech: Technician = { ...target, ...updates };
    try {
      await updateDoc(doc(db, 'technicians', id), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `technicians/${id}`);
    }

    const updated = technicians.map(t => (t.id === id ? updatedTech : t));
    setTechnicians(updated);
    localStorage.setItem(TECHS_CACHE, JSON.stringify(updated));
    return true;
  };

  const deleteTechnician = async (id: string): Promise<boolean> => {
    try {
      await deleteDoc(doc(db, 'technicians', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `technicians/${id}`);
    }
    const filtered = technicians.filter(t => t.id !== id);
    setTechnicians(filtered);
    localStorage.setItem(TECHS_CACHE, JSON.stringify(filtered));
    return true;
  };

  // 17. Close Month (Preserves all records, customers, payments, stock, and creates immutable audit)
  const closeCurrentMonth = async (closedBy: string, notes?: string): Promise<MonthlyClosing> => {
    const currentPeriod = getCurrentMonthPeriod();

    // Check if this month is already closed
    if (monthlyClosings.some(c => c.monthPeriod === currentPeriod)) {
      throw new Error(`Month ${formatMonthName(currentPeriod)} has already been closed. Duplicate closing is prevented.`);
    }

    const now = formatISTDateTime();
    const periodJobs = jobs.filter(j => j.monthPeriod === currentPeriod);

    const totalJobsReceived = periodJobs.length;
    const totalJobsRepaired = periodJobs.filter(j => j.status === 'Repaired' || j.status === 'Ready for Collection' || j.status === 'Dispatched').length;
    const totalDispatched = periodJobs.filter(j => j.status === 'Dispatched').length;
    const totalPendingJobs = periodJobs.filter(j => j.status !== 'Dispatched').length;

    const totalRepairCollection = periodJobs.reduce((sum, j) => sum + (j.repairCharges || 0), 0);
    const totalPendingAmount = periodJobs.reduce((sum, j) => sum + (j.balance || 0), 0);

    // Sum of all payments received in this month
    let totalPaymentsReceived = 0;
    periodJobs.forEach(j => {
      totalPaymentsReceived += (j.advance || 0);
      (j.payments || []).forEach(p => {
        totalPaymentsReceived += (p.amount || 0);
      });
    });

    // Total parts used
    let totalPartsUsed = 0;
    periodJobs.forEach(j => {
      (j.partsUsed || []).forEach(p => {
        totalPartsUsed += p.quantity;
      });
    });

    const lowStockCount = spareItems.filter(s => s.currentStock > 0 && s.currentStock <= s.minStockAlert).length;
    const outOfStockCount = spareItems.filter(s => s.currentStock <= 0).length;

    const closing: MonthlyClosing = {
      id: currentPeriod,
      monthPeriod: currentPeriod,
      monthName: formatMonthName(currentPeriod),
      closedAt: now,
      closedBy: closedBy || 'Owner',
      totalJobsReceived,
      totalJobsRepaired,
      totalDispatched,
      totalPendingJobs,
      totalRepairCollection,
      totalPendingAmount,
      totalPaymentsReceived,
      totalPartsUsed,
      spareStockSummary: {
        totalItemsTracked: spareItems.length,
        lowStockCount,
        outOfStockCount,
      },
      monthlyIncome: totalPaymentsReceived,
      notes,
      createdAt: now,
    };

    try {
      await setDoc(doc(db, 'monthly_closings', currentPeriod), closing);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `monthly_closings/${currentPeriod}`);
    }

    // Mark completed jobs for this month as archived (retained in Old Jobs)
    const updatedJobs = jobs.map(j => {
      if (j.monthPeriod === currentPeriod && j.status === 'Dispatched') {
        return { ...j, isArchived: true };
      }
      return j;
    });

    setJobs(updatedJobs);
    localStorage.setItem(JOBS_CACHE, JSON.stringify(updatedJobs));

    const updatedClosings = [closing, ...monthlyClosings];
    setMonthlyClosings(updatedClosings);
    localStorage.setItem(CLOSINGS_CACHE, JSON.stringify(updatedClosings));

    return closing;
  };

  // 18. Update Business Settings
  const updateBusinessSettings = async (updates: Partial<BusinessSettings>): Promise<boolean> => {
    const now = formatISTDateTime();
    const updated: BusinessSettings = {
      ...businessSettings,
      ...updates,
      updatedAt: now,
    };

    try {
      await setDoc(doc(db, 'settings', 'general'), updated);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/general');
    }

    setBusinessSettings(updated);
    localStorage.setItem(SETTINGS_CACHE, JSON.stringify(updated));
    return true;
  };

  // Statistics for Dashboard
  const todayStr = formatISTDateOnly(new Date());

  const activeJobs = jobs.filter(j => !j.isArchived);

  const receivedJobs = activeJobs.filter(j => j.status === 'Received').length;
  const underRepairJobs = activeJobs.filter(j => j.status === 'Under Repair').length;
  const pendingJobs = activeJobs.filter(j => j.status !== 'Dispatched').length;
  const repairedJobs = activeJobs.filter(j => j.status === 'Repaired').length;
  const readyForCollectionJobs = activeJobs.filter(j => j.status === 'Ready for Collection').length;
  const dispatchedJobs = activeJobs.filter(j => j.status === 'Dispatched').length;

  // Today's Repair Collection (payments received today in IST)
  let todayRepairCollection = 0;
  jobs.forEach(j => {
    if (j.receivedDate && j.receivedDate.startsWith(todayStr)) {
      todayRepairCollection += (j.advance || 0);
    }
    (j.payments || []).forEach(p => {
      if (p.date && p.date.startsWith(todayStr)) {
        todayRepairCollection += p.amount;
      }
    });
  });

  // Total Pending Amount (across all non-dispatched or unbalanced jobs)
  const totalPendingAmount = jobs.reduce((sum, j) => sum + (j.balance || 0), 0);

  // Stock alerts
  const lowStockCount = spareItems.filter(s => s.currentStock > 0 && s.currentStock <= s.minStockAlert).length;
  const outOfStockCount = spareItems.filter(s => s.currentStock <= 0).length;

  const stats = {
    totalActiveJobs: activeJobs.length,
    receivedJobs,
    underRepairJobs,
    pendingJobs,
    repairedJobs,
    readyForCollectionJobs,
    dispatchedJobs,
    todayRepairCollection,
    totalPendingAmount,
    lowStockCount,
    outOfStockCount,
  };

  return (
    <DataContext.Provider
      value={{
        jobs,
        customerMachines,
        brands,
        technicians,
        spareItems,
        spareCategories,
        spareTransactions,
        monthlyClosings,
        businessSettings,
        isLoading,

        addCustomerMachine,
        updateCustomerMachine,
        deleteCustomerMachine,

        createJob,
        updateJobStatus,
        updateJob,
        dispatchJob,
        recordPayment,
        updateJobQuotation,
        useSpareInJob,
        deleteJob,

        addStock,
        deductStock,
        createNewSpareItem,
        updateSpareItem,
        deleteSpareItem,
        addSpareCategory,

        addBrand,
        updateBrand,
        deleteBrand,

        addTechnician,
        updateTechnician,
        deleteTechnician,

        closeCurrentMonth,
        updateBusinessSettings,

        stats,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
