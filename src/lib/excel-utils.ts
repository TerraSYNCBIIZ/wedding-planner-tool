import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import type { Expense, Gift, Contributor } from '../types';

// Format a date for display
export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  try {
    return format(new Date(dateString), 'MMM d, yyyy');
  } catch (error) {
    return 'Invalid Date';
  }
};

// Calculate the total paid amount for an expense
export const calculatePaidAmount = (expense: Expense): number => {
  return expense.paymentAllocations.reduce((total, allocation) => total + allocation.amount, 0);
};

// Calculate the remaining amount for an expense
export const calculateRemainingAmount = (expense: Expense): number => {
  const paidAmount = calculatePaidAmount(expense);
  return expense.totalAmount - paidAmount;
};

// Format currency for display
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

// Generate Excel worksheet data for expenses
export const generateExpensesWorksheet = (
  expenses: Expense[],
  contributors: Contributor[]
): XLSX.WorkSheet => {
  // Create header row
  const headers = [
    'Title',
    'Category',
    'Total Amount',
    'Amount Paid',
    'Remaining',
    'Due Date',
    'Provider',
    'Status',
    'Contributors',
    'Notes'
  ];
  
  // Create data rows
  const data = expenses.map(expense => {
    const paidAmount = calculatePaidAmount(expense);
    const remainingAmount = calculateRemainingAmount(expense);
    const status = paidAmount === 0 ? 'Unpaid' : 
                  paidAmount === expense.totalAmount ? 'Paid' : 'Partially Paid';
    
    // Get contributor names for this expense
    const contributorIds = expense.paymentAllocations.map(a => a.contributorId);
    const contributorNames = contributors
      .filter(c => contributorIds.includes(c.id))
      .map(c => c.name)
      .join(', ');
    
    return [
      expense.title,
      expense.category,
      expense.totalAmount,
      paidAmount,
      remainingAmount,
      formatDate(expense.dueDate),
      expense.provider || 'N/A',
      status,
      contributorNames || 'None',
      expense.notes || ''
    ];
  });
  
  // Combine headers and data
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
  
  // Set column widths
  const colWidths = [
    { wch: 30 }, // Title
    { wch: 15 }, // Category
    { wch: 15 }, // Total Amount
    { wch: 15 }, // Amount Paid
    { wch: 15 }, // Remaining
    { wch: 15 }, // Due Date
    { wch: 20 }, // Provider
    { wch: 15 }, // Status
    { wch: 30 }, // Contributors
    { wch: 40 }  // Notes
  ];
  
  worksheet['!cols'] = colWidths;
  
  return worksheet;
};

// Generate Excel worksheet data for gifts
export const generateGiftsWorksheet = (gifts: Gift[]): XLSX.WorkSheet => {
  // Create header row
  const headers = [
    'From',
    'Amount',
    'Date',
    'Allocated Amount',
    'Remaining Amount',
    'Notes'
  ];
  
  // Create data rows
  const data = gifts.map(gift => {
    const allocatedAmount = gift.allocations.reduce((sum, a) => sum + a.amount, 0);
    const remainingAmount = gift.amount - allocatedAmount;
    
    return [
      gift.fromPerson,
      gift.amount,
      formatDate(gift.date),
      allocatedAmount,
      remainingAmount,
      gift.notes || ''
    ];
  });
  
  // Combine headers and data
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
  
  // Set column widths
  const colWidths = [
    { wch: 30 }, // From
    { wch: 15 }, // Amount
    { wch: 15 }, // Date
    { wch: 20 }, // Allocated Amount
    { wch: 20 }, // Remaining Amount
    { wch: 40 }  // Notes
  ];
  
  worksheet['!cols'] = colWidths;
  
  return worksheet;
};

// Generate Excel worksheet data for an upcoming payments summary
export const generateUpcomingPaymentsWorksheet = (
  expenses: Expense[],
  contributors: Contributor[]
): XLSX.WorkSheet => {
  // Filter for expenses with upcoming due dates
  const now = new Date();
  const upcomingExpenses = expenses
    .filter(e => e.dueDate && new Date(e.dueDate) > now)
    .sort((a, b) => {
      if (!a.dueDate || !b.dueDate) return 0;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  
  // Create header row
  const headers = [
    'Title',
    'Due Date',
    'Total Amount',
    'Remaining Amount',
    'Status',
    'Contributors',
    'Provider'
  ];
  
  // Create data rows
  const data = upcomingExpenses.map(expense => {
    const paidAmount = calculatePaidAmount(expense);
    const remainingAmount = calculateRemainingAmount(expense);
    const status = paidAmount === 0 ? 'Unpaid' : 
                  paidAmount === expense.totalAmount ? 'Paid' : 'Partially Paid';
    
    // Get contributor names for this expense
    const contributorIds = expense.paymentAllocations.map(a => a.contributorId);
    const contributorNames = contributors
      .filter(c => contributorIds.includes(c.id))
      .map(c => c.name)
      .join(', ');
    
    return [
      expense.title,
      formatDate(expense.dueDate),
      expense.totalAmount,
      remainingAmount,
      status,
      contributorNames || 'None',
      expense.provider || 'N/A'
    ];
  });
  
  // Combine headers and data
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
  
  // Set column widths
  const colWidths = [
    { wch: 30 }, // Title
    { wch: 15 }, // Due Date
    { wch: 15 }, // Total Amount
    { wch: 20 }, // Remaining Amount
    { wch: 15 }, // Status
    { wch: 30 }, // Contributors
    { wch: 20 }  // Provider
  ];
  
  worksheet['!cols'] = colWidths;
  
  return worksheet;
};

// Generate a complete Excel workbook with multiple sheets
export const generateExcelWorkbook = (
  expenses: Expense[],
  gifts: Gift[],
  contributors: Contributor[]
): XLSX.WorkBook => {
  const workbook = XLSX.utils.book_new();
  
  const expensesSheet = generateExpensesWorksheet(expenses, contributors);
  XLSX.utils.book_append_sheet(workbook, expensesSheet, 'All Expenses');
  
  const giftsSheet = generateGiftsWorksheet(gifts);
  XLSX.utils.book_append_sheet(workbook, giftsSheet, 'Gifts');
  
  const upcomingSheet = generateUpcomingPaymentsWorksheet(expenses, contributors);
  XLSX.utils.book_append_sheet(workbook, upcomingSheet, 'Upcoming Payments');
  
  return workbook;
};

// Export Excel file
export const exportToExcel = (
  expenses: Expense[],
  gifts: Gift[],
  contributors: Contributor[]
): void => {
  const workbook = generateExcelWorkbook(expenses, gifts, contributors);
  XLSX.writeFile(workbook, `Wedding_Finance_Report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}; 