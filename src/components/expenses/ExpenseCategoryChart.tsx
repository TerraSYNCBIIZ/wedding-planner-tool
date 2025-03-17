import React from 'react';
import type { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, TooltipProps } from 'recharts';
import { PieChart as RPieChart, Pie as RPie, Cell as RCell, ResponsiveContainer as RResponsiveContainer, 
         Legend as RLegend, Tooltip as RTooltip } from 'recharts';
import type { Expense, ExpenseCategory } from '@/types';

// Define colors for the chart segments
const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', 
  '#82CA9D', '#FFC658', '#FF6B6B', '#007BFF', '#6C757D',
  '#28A745', '#DC3545', '#FFC107', '#17A2B8', '#6F42C1'
];

interface ExpenseCategoryChartProps {
  expenses: Expense[];
}

interface ChartDataItem {
  name: string;
  value: number;
}

export function ExpenseCategoryChart({ expenses }: ExpenseCategoryChartProps) {
  // Group expenses by category and sum their amounts
  const categoryData = expenses.reduce((acc, expense) => {
    const category = expense.category;
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += expense.totalAmount;
    return acc;
  }, {} as Record<ExpenseCategory, number>);

  // Convert to array format for recharts
  const data = Object.entries(categoryData)
    .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
    .sort((a, b) => b.value - a.value); // Sort by value descending

  // Calculate total for percentages
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center bg-muted rounded-lg border">
        <p className="text-muted-foreground">No expense data to display</p>
      </div>
    );
  }

  // Custom tooltip to show percentage
  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const value = item.value as number;
      const percentage = ((value / total) * 100).toFixed(1);
      return (
        <div className="bg-background p-3 border rounded-md shadow-md">
          <p className="font-medium">{item.name}</p>
          <p className="text-primary">{`$${value.toLocaleString()}`}</p>
          <p className="text-muted-foreground text-sm">{`${percentage}% of total`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-72 w-full">
      <RResponsiveContainer width="100%" height="100%">
        <RPieChart>
          <RPie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <RCell key={`cell-${entry.name}-${entry.value}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </RPie>
          <RTooltip content={<CustomTooltip />} />
          <RLegend 
            layout="vertical" 
            verticalAlign="middle" 
            align="right"
            formatter={(value) => {
              // Find corresponding data item
              const item = data.find(d => d.name === value);
              // Calculate percentage
              const percentage = item ? ((item.value / total) * 100).toFixed(1) : '0';
              // Format display with percentage
              return <span className="text-sm">{value} ({percentage}%)</span>;
            }}
          />
        </RPieChart>
      </RResponsiveContainer>
    </div>
  );
} 