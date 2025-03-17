'use client';

import { useWedding } from '@/context/WeddingContext';
import { Button } from '../ui/Button';
import { CalendarClock, AlertCircle, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { calculatePaidAmount, calculateRemainingAmount, formatCurrency } from '@/lib/excel-utils';
import type { Expense } from '@/types';

interface UpcomingPaymentsProps {
  onPayExpense?: (expense: Expense) => void;
}

export function UpcomingPayments({ onPayExpense }: UpcomingPaymentsProps) {
  const { expenses } = useWedding();
  
  // Filter expenses that are not fully paid
  const unpaidExpenses = expenses.filter(expense => 
    calculatePaidAmount(expense) < expense.totalAmount
  );
  
  // Sort by due date (if available) or by remaining amount
  const sortedExpenses = [...unpaidExpenses].sort((a, b) => {
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (a.dueDate) {
      return -1; // a has due date, b doesn't
    }
    if (b.dueDate) {
      return 1; // b has due date, a doesn't
    }
    // Sort by remaining amount (highest first)
    return calculateRemainingAmount(b) - calculateRemainingAmount(a);
  });
  
  // Take only the first 5 expenses
  const upcomingPayments = sortedExpenses.slice(0, 5);
  
  return (
    <div className="bg-white/90 shadow-md border border-blue-200 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-blue-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-blue-800">Upcoming Payments</h3>
            <p className="text-sm text-blue-600">Expenses that need your attention</p>
          </div>
          <Link href="/expenses">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </div>
      </div>
      <div className="p-4">
        {upcomingPayments.length === 0 ? (
          <div className="bg-blue-50 text-blue-800 border border-blue-200 p-4 rounded-md flex items-start">
            <CalendarClock className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <p>No upcoming payments. All expenses are paid!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingPayments.map(expense => {
              const paidAmount = calculatePaidAmount(expense);
              const remainingAmount = expense.totalAmount - paidAmount;
              const percentPaid = (paidAmount / expense.totalAmount) * 100;
              
              return (
                <div key={expense.id} className="p-3 rounded-lg border border-blue-100 bg-blue-50/50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-blue-900">{expense.title}</h3>
                      <p className="text-sm text-blue-700">{expense.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-800">{formatCurrency(remainingAmount)}</p>
                      <p className="text-xs text-blue-600">
                        of {formatCurrency(expense.totalAmount)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full" 
                      style={{ width: `${percentPaid}%` }}
                    />
                  </div>
                  
                  <div className="mt-2 flex items-center justify-between">
                    {/* Due date if available */}
                    {expense.dueDate && (
                      <div className="flex items-center">
                        <CalendarClock size={14} className="text-blue-700 mr-1" />
                        <span className="text-xs text-blue-700">
                          Due: {new Date(expense.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    
                    {/* Pay button */}
                    {onPayExpense && (
                      <Button 
                        type="button"
                        size="sm" 
                        variant="outline" 
                        className="text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                        onClick={() => onPayExpense(expense)}
                      >
                        <CreditCard className="h-3 w-3 mr-1" />
                        Pay Now
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 