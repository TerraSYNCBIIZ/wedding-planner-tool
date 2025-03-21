// Define the available expense categories
export type ExpenseCategory = 
  | 'venue' 
  | 'food' 
  | 'drink' 
  | 'photography' 
  | 'dress' 
  | 'decorations' 
  | 'sound' 
  | 'miscellaneous'
  | string; // Allow custom categories

// Define the payment status options
export type PaymentStatus = 
  | 'paid' 
  | 'partially_paid' 
  | 'unpaid' 
  | 'scheduled';

// Define a contributor (person paying for something or giving a gift)
export interface Contributor {
  id: string;
  name: string;
  totalGiftAmount?: number;  // Total amount of gifts given by this contributor
  gifts?: ContributorGift[]; // Gifts given by this contributor
  notes?: string;          // Any additional notes about the contributor
}

// Define a gift given by a contributor
export interface ContributorGift {
  id: string;
  contributorId: string;
  amount: number;
  date: string; // ISO date string
  notes?: string;
  allocations: GiftAllocation[];
}

// Define a payment allocation
export interface PaymentAllocation {
  id: string;
  contributorId: string;
  amount: number;
  date: string; // ISO date string
  notes?: string;
  giftId?: string; // ID of the gift if this payment is from a gift allocation
  allocationId?: string; // ID of the gift allocation if this payment is from a gift allocation
}

// Define the main expense type
export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  totalAmount: number;
  dueDate?: string; // ISO date string, optional
  provider?: string; // Vendor or provider name
  notes?: string;
  paymentAllocations: PaymentAllocation[];
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  isGift?: boolean; // Is this a monetary gift that can be allocated?
}

// Define a gift (money given that can be allocated to expenses)
// This interface will be kept for backward compatibility but eventually phased out
export interface Gift {
  id: string;
  fromPerson: string;
  amount: number;
  date: string; // ISO date string
  notes?: string;
  allocations: GiftAllocation[];
}

// Define how a gift is allocated across expenses
export interface GiftAllocation {
  id: string;
  giftId: string;
  expenseId: string;
  amount: number;
}

// Define a custom category added by the user
export interface CustomCategory {
  id: string;
  name: string;
  createdAt: string; // ISO date string
}

// Define application settings
export interface Settings {
  weddingDate?: string; // ISO date string
  currency: string; // Default: USD
  totalBudget?: number;
}

// Dashboard summary stats
export interface DashboardStats {
  totalExpenses: number;
  totalPaid: number;
  totalRemaining: number;
  upcomingPayments: Expense[];
  expensesByCategory: Record<ExpenseCategory, number>;
  contributors: Record<string, number>; // contributorId -> amount
} 