import React from 'react';
import type { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, TooltipProps } from 'recharts';
import { PieChart as RPieChart, Pie as RPie, Cell as RCell, ResponsiveContainer as RResponsiveContainer, 
         Legend as RLegend, Tooltip as RTooltip } from 'recharts';
import type { Expense, ExpenseCategory } from '@/types';

// Define colors for the chart segments - using more vibrant, modern colors
const COLORS = [
  '#6366F1', '#EC4899', '#8B5CF6', '#10B981', '#F59E0B', 
  '#3B82F6', '#EF4444', '#14B8A6', '#F97316', '#8B5CF6',
  '#06B6D4', '#84CC16', '#9333EA', '#F43F5E', '#0EA5E9'
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
      <div className="flex h-64 items-center justify-center bg-muted/30 rounded-xl border border-border/40 backdrop-blur-sm">
        <p className="text-muted-foreground">No expense data to display</p>
      </div>
    );
  }

  // Custom tooltip to show percentage with modern styling
  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const value = item.value as number;
      const percentage = ((value / total) * 100).toFixed(1);
      return (
        <div className="bg-background/90 p-4 border rounded-xl shadow-lg backdrop-blur-md transition-all duration-200 ease-in-out">
          <p className="font-medium text-base">{item.name}</p>
          <p className="text-primary font-semibold text-lg">{`$${value.toLocaleString()}`}</p>
          <p className="text-muted-foreground text-sm">{`${percentage}% of total`}</p>
        </div>
      );
    }
    return null;
  };

  // Custom legend renderer for a more modern look
  const CustomLegendContent = (props: {
    payload?: Array<{
      value: string;
      color: string;
      payload: {
        name: string;
        value: number;
      };
    }>;
  }) => {
    const { payload = [] } = props;
    
    return (
      <ul className="flex flex-col gap-2 text-sm">
        {payload.map((entry) => (
          <li key={`item-${entry.value}`} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm font-medium">{entry.value}</span>
            <span className="text-xs text-muted-foreground">
              {((data.find(d => d.name === entry.value)?.value || 0) / total * 100).toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    );
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
            innerRadius={40}
            cornerRadius={3}
            paddingAngle={2}
            fill="#8884d8"
            dataKey="value"
            animationBegin={0}
            animationDuration={800}
            animationEasing="ease-out"
            minAngle={15}
            isAnimationActive={true}
          >
            {data.map((entry, index) => (
              <RCell 
                key={`cell-${entry.name}-${entry.value}`} 
                fill={COLORS[index % COLORS.length]} 
                stroke="rgba(255,255,255,0.2)"
                strokeWidth={1}
              />
            ))}
          </RPie>
          <RTooltip content={<CustomTooltip />} />
          <RLegend 
            content={<CustomLegendContent />}
            layout="vertical" 
            verticalAlign="middle" 
            align="right"
            wrapperStyle={{ paddingLeft: '20px' }}
          />
        </RPieChart>
      </RResponsiveContainer>
    </div>
  );
} 