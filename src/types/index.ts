export type UserRole = 'Owner' | 'Staff' | 'Technician';

export interface UserAccount {
  id: string; // userId / username
  userId: string;
  fullName: string;
  role: UserRole;
  passwordHash: string;
  salt: string;
  status: 'active' | 'disabled';
  createdAt: string;
  updatedAt: string;
}

export type JobStatus =
  | 'Received'
  | 'Under Repair'
  | 'Waiting for Parts'
  | 'Waiting for Customer Approval'
  | 'Repaired'
  | 'Ready for Collection'
  | 'Dispatched';

export type PaymentStatus = 'Paid' | 'Partially Paid' | 'Pending';

export interface StatusHistoryEntry {
  status: JobStatus;
  timestamp: string; // IST formatted
  changedBy: string;
  note?: string;
}

export interface PaymentEntry {
  id: string;
  amount: number;
  date: string; // IST formatted
  receivedBy: string;
  paymentMode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque';
  note?: string;
}

export interface JobPartUsed {
  itemId: string;
  itemName: string;
  categoryName?: string;
  quantity: number;
  rate: number;
  amount: number;
  date: string;
  technician: string;
}

export interface QuotationItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface QuotationDetails {
  items: QuotationItem[];
  labourCharges: number;
  totalAmount: number;
  advance: number;
  balance: number;
  expectedCompletionDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DispatchDetails {
  dispatchedDate: string;
  dispatchedTime: string;
  dispatchedBy: string;
  technician: string;
  deliveryMethod: string;
  notes?: string;
}

export interface CustomerMachine {
  id: string; // e.g. "mach_xxx"
  customerName: string;
  customerPhone: string;
  machineBrand: string;
  machineModel: string;
  machineType: string;
  serialNumber?: string;
  photoUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobCard {
  id: string;
  jobNumber: string; // e.g. NW-0001
  customerName: string;
  customerPhone: string;
  machineId?: string; // Links to CustomerMachine
  machineBrand: string;
  machineModel: string;
  serialNumber: string;
  machineType: string; // ARC, TIG, MIG/MAG, Inverter, CO2, Plasma, etc.
  customerComplaint: string;
  receivedDate: string; // IST formatted
  expectedCompletionDate: string;
  expectedDeliveryDate: string;
  technicianId?: string;
  technicianName?: string;
  status: JobStatus;
  statusHistory: StatusHistoryEntry[];
  quotation?: QuotationDetails;
  repairCharges: number;
  advance: number;
  balance: number;
  paymentStatus: PaymentStatus;
  paymentDueDate?: string;
  payments: PaymentEntry[];
  partsUsed: JobPartUsed[];
  photoUrl?: string; // PCB / Part photo (base64 or URL)
  notes?: string;
  dispatchDetails?: DispatchDetails;
  monthPeriod: string; // e.g. "2026-10"
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SpareItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStockAlert: number;
  totalAdded: number;
  totalUsed: number;
  unit?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SpareTransaction {
  id: string;
  itemId: string;
  itemName: string;
  categoryName: string;
  type: 'IN' | 'OUT';
  quantity: number;
  previousStock: number;
  newStock: number;
  supplierOrSource?: string; // for +
  jobNumber?: string; // for -
  technician?: string; // for -
  reason?: string; // for -
  notes?: string;
  timestamp: string; // IST formatted
  createdBy: string;
  createdAt: string;
}

export interface Technician {
  id: string;
  name: string;
  mobile: string;
  role: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface MachineBrand {
  id: string;
  name: string;
  status: 'active' | 'disabled';
  isDefault?: boolean;
  createdAt: string;
}

export interface MonthlyClosing {
  id: string; // e.g. "2026-10"
  monthPeriod: string;
  monthName: string;
  closedAt: string;
  closedBy: string;
  totalJobsReceived: number;
  totalJobsRepaired: number;
  totalDispatched: number;
  totalPendingJobs: number;
  totalRepairCollection: number;
  totalPendingAmount: number;
  totalPaymentsReceived: number;
  totalPartsUsed: number;
  spareStockSummary: {
    totalItemsTracked: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  monthlyIncome: number;
  notes?: string;
  createdAt: string;
}

export interface BusinessSettings {
  businessName: string;
  subTitle: string;
  phone: string;
  altPhone: string;
  address: string;
  city: string;
  state: string;
  email: string;
  gstNumber?: string;
  isOwnerConfigured: boolean;
  paymentReminderDays: number;
  updatedAt: string;
}
