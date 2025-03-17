'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWedding } from '@/context/WeddingContext';
import { Button } from '@/components/ui/Button';
import { AddPaymentDialog } from '../../../../components/expenses/AddPaymentDialog';
import { EditPaymentDialog } from '../../../../components/expenses/EditPaymentDialog';
import { format } from 'date-fns';
import { calculatePaidAmount, calculateRemainingAmount } from '@/lib/excel-utils';
import type { Expense, PaymentAllocation } from '@/types';

export default function ExpensePaymentsPage() {
  const params = useParams();
  const router = useRouter();
  const { expenses, contributors, isLoading } = useWedding();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [isAddPaymentDialogOpen, setIsAddPaymentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentAllocation | null>(null);
  const [isEditPaymentDialogOpen, setIsEditPaymentDialogOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && expenses.length > 0) {
      const expenseId = params.id as string;
      const foundExpense = expenses.find(e => e.id === expenseId);
      
      if (foundExpense) {
        setExpense(foundExpense);
      } else {
        // Expense not found, redirect to expenses list
        router.push('/expenses');
      }
    }
  }, [isLoading, expenses, params.id, router]);

  // Handle opening edit payment dialog
  const handleEditPayment = (payment: PaymentAllocation) => {
    setSelectedPayment(payment);
    setIsEditPaymentDialogOpen(true);
  };

  // Calculate total paid and remaining
  const totalPaid = expense ? calculatePaidAmount(expense) : 0;
  const remainingAmount = expense ? calculateRemainingAmount(expense) : 0;

  if (isLoading) {
    return (
      <div className="container mx-auto mt-8 px-4">
        <div className="text-center">Loading expense details...</div>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="container mx-auto mt-8 px-4">
        <div className="text-center">Expense not found.</div>
      </div>
    );
  }

  // Sort payments by date (most recent first)
  const sortedPayments = [...expense.paymentAllocations].sort((a, b) => {
    // If both have dates, sort by date
    if (a.date && b.date) {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    // If only one has a date, the one with the date comes first
    if (a.date) return -1;
    if (b.date) return 1;
    // Otherwise keep original order
    return 0;
  });

  // Get contributor names for display
  const getContributorName = (contributorId: string) => {
    const contributor = contributors.find(c => c.id === contributorId);
    return contributor ? contributor.name : 'Unknown';
  };

  return (
    <div className="container mx-auto mt-8 px-4 pb-20">
      {/* Expense Details Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{expense.title}</h1>
          <p className="text-gray-500">
            {expense.category} • 
            {expense.dueDate ? ` Due ${format(new Date(expense.dueDate), 'MMM d, yyyy')} • ` : ' '}
            {expense.provider ? `${expense.provider}` : ''}
          </p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Button onClick={() => router.push("/expenses")}>
            Back to Expenses
          </Button>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Payment Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Total Amount</p>
            <p className="text-2xl font-bold">
              ${expense.totalAmount.toFixed(2)}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Amount Paid</p>
            <p className="text-2xl font-bold text-green-600">
              ${totalPaid.toFixed(2)}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Remaining</p>
            <p className="text-2xl font-bold text-red-600">
              ${remainingAmount.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button 
            onClick={() => setIsAddPaymentDialogOpen(true)}
            disabled={remainingAmount <= 0}
          >
            Add Payment
          </Button>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Payment History</h2>
        
        {sortedPayments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No payments have been recorded for this expense yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="py-3 px-4 text-left">Date</th>
                  <th className="py-3 px-4 text-left">Contributor</th>
                  <th className="py-3 px-4 text-left">Amount</th>
                  <th className="py-3 px-4 text-left">Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedPayments.map(payment => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {payment.date 
                        ? format(new Date(payment.date), 'MMM d, yyyy')
                        : 'No date'}
                    </td>
                    <td className="py-3 px-4">
                      {getContributorName(payment.contributorId)}
                    </td>
                    <td className="py-3 px-4">
                      ${payment.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 truncate max-w-xs">
                      {payment.notes || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditPayment(payment)}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Dialogs */}
      {isAddPaymentDialogOpen && (
        <AddPaymentDialog 
          isOpen={isAddPaymentDialogOpen} 
          onClose={() => setIsAddPaymentDialogOpen(false)}
          expense={expense}
          contributors={contributors}
        />
      )}
      
      {isEditPaymentDialogOpen && selectedPayment && (
        <EditPaymentDialog 
          isOpen={isEditPaymentDialogOpen}
          onClose={() => {
            setIsEditPaymentDialogOpen(false);
            setSelectedPayment(null);
          }}
          payment={selectedPayment}
          expense={expense}
          contributors={contributors}
        />
      )}
    </div>
  );
} 