'use client';

import { useWedding } from '@/context/WeddingContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/excel-utils';
import { 
  DollarSign, 
  CreditCard, 
  CheckCircle, 
  AlertTriangle, 
  Wallet,
  PieChart,
  TrendingDown
} from 'lucide-react';

export function FinancialSummary() {
  const { getDashboardStats, contributors, settings } = useWedding();
  const stats = getDashboardStats();
  
  // Calculate total contributions (gifts)
  const totalContributions = contributors.reduce(
    (sum, contributor) => sum + (contributor.totalGiftAmount || 0), 
    0
  );
  
  // Get total budget
  const totalBudget = settings.totalBudget || 0;
  
  // Stats already provides totalExpenses, totalPaid and totalRemaining
  const { totalExpenses, totalPaid, totalRemaining } = stats;
  
  // Calculate funds allocation (how much of the contributions is left unallocated)
  const unallocatedFunds = totalContributions - totalPaid;
  
  // Calculate budget deficit (how much more contributions are needed to meet the budget)
  const budgetDeficit = totalBudget - totalContributions;
  
  // Format all currency with the correct currency setting
  const formatMoneyValue = (value: number) => formatCurrency(value, settings.currency);

  // Color classes
  const getBalanceColorClass = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <Card className="bg-white/90 shadow-md border border-blue-200">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5 text-blue-600" />
          Financial Summary
        </CardTitle>
        <CardDescription>Your wedding finances at a glance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* Total Budget */}
          <div className="p-4 bg-blue-50 rounded-lg flex items-start space-x-4">
            <div className="p-2 bg-blue-200 rounded-full text-blue-700">
              <Wallet size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-700">Total Budget</p>
              <p className="text-xl font-bold text-blue-900">{formatMoneyValue(totalBudget)}</p>
            </div>
          </div>
          
          {/* Total Expenses */}
          <div className="p-4 bg-blue-50 rounded-lg flex items-start space-x-4">
            <div className="p-2 bg-blue-200 rounded-full text-blue-700">
              <CreditCard size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-700">Total Expenses</p>
              <p className="text-xl font-bold text-blue-900">{formatMoneyValue(totalExpenses)}</p>
              <div className={`text-xs ${totalExpenses > totalBudget ? 'text-red-600' : 'text-green-600'}`}>
                {totalExpenses > totalBudget ? 'Over budget' : 'Within budget'}
              </div>
            </div>
          </div>
          
          {/* Total Contributions */}
          <div className="p-4 bg-blue-50 rounded-lg flex items-start space-x-4">
            <div className="p-2 bg-blue-200 rounded-full text-blue-700">
              <DollarSign size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-700">Total Contributions</p>
              <p className="text-xl font-bold text-blue-900">{formatMoneyValue(totalContributions)}</p>
            </div>
          </div>
          
          {/* Budget Deficit */}
          <div className="p-4 bg-blue-50 rounded-lg flex items-start space-x-4">
            <div className={`p-2 rounded-full ${budgetDeficit <= 0 ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'}`}>
              <TrendingDown size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-700">Budget Deficit</p>
              <p className={`text-xl font-bold ${budgetDeficit <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatMoneyValue(Math.abs(budgetDeficit))}
              </p>
              <p className="text-xs text-gray-600">
                {budgetDeficit <= 0 
                  ? 'Contributions exceed budget!' 
                  : 'Additional contributions needed'}
              </p>
            </div>
          </div>
          
          {/* Total Paid */}
          <div className="p-4 bg-blue-50 rounded-lg flex items-start space-x-4">
            <div className="p-2 bg-green-200 rounded-full text-green-700">
              <CheckCircle size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-green-700">Total Paid</p>
              <p className="text-xl font-bold text-green-900">{formatMoneyValue(totalPaid)}</p>
              <p className="text-xs text-gray-600">
                {((totalPaid / totalExpenses) * 100).toFixed(1)}% of expenses
              </p>
            </div>
          </div>
          
          {/* Remaining Balance */}
          <div className="p-4 bg-blue-50 rounded-lg flex items-start space-x-4">
            <div className="p-2 bg-amber-200 rounded-full text-amber-700">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-700">Remaining Balance</p>
              <p className="text-xl font-bold text-amber-900">{formatMoneyValue(totalRemaining)}</p>
              <p className="text-xs text-gray-600">
                {((totalRemaining / totalExpenses) * 100).toFixed(1)}% of expenses
              </p>
            </div>
          </div>
          
          {/* Unallocated Funds */}
          <div className="p-4 bg-blue-50 rounded-lg flex items-start space-x-4">
            <div className={`p-2 rounded-full ${unallocatedFunds >= 0 ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'}`}>
              <Wallet size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-700">Unallocated Funds</p>
              <p className={`text-xl font-bold ${getBalanceColorClass(unallocatedFunds)}`}>
                {formatMoneyValue(unallocatedFunds)}
              </p>
              <p className="text-xs text-gray-600">
                Contributions minus paid expenses
              </p>
            </div>
          </div>
        </div>
        
        {/* Progress bar showing budget usage */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-blue-700">Budget Usage</span>
            <span className="text-sm font-medium text-blue-700">
              {((totalExpenses / totalBudget) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full h-3 bg-blue-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                totalExpenses > totalBudget ? 'bg-red-500' : 'bg-green-500'
              }`}
              style={{ 
                width: totalBudget > 0 
                  ? `${Math.min((totalExpenses / totalBudget) * 100, 100)}%` 
                  : '0%' 
              }}
            />
          </div>
        </div>
        
        {/* Progress bar showing payment completion */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-blue-700">Payment Progress</span>
            <span className="text-sm font-medium text-blue-700">
              {totalExpenses > 0 ? ((totalPaid / totalExpenses) * 100).toFixed(1) : '0'}%
            </span>
          </div>
          <div className="w-full h-3 bg-blue-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 rounded-full"
              style={{ 
                width: totalExpenses > 0 
                  ? `${(totalPaid / totalExpenses) * 100}%` 
                  : '0%' 
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 