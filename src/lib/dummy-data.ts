import type { Expense, Gift, Contributor, CustomCategory, Settings, ExpenseCategory } from '../types';

// Mock expenses
export const mockExpenses: Expense[] = [
  {
    id: '1',
    title: 'Venue Booking',
    totalAmount: 5000,
    category: 'venue' as ExpenseCategory,
    dueDate: new Date(2023, 11, 30).toISOString(),
    provider: 'Grand Hotel',
    notes: 'Includes ceremony and reception',
    paymentAllocations: [
      {
        id: 'pay1',
        contributorId: '1',
        amount: 2500,
        date: new Date(2023, 8, 15).toISOString()
      }
    ],
    createdAt: new Date(2023, 6, 10).toISOString(),
    updatedAt: new Date(2023, 6, 10).toISOString()
  },
  {
    id: '2',
    title: 'Catering',
    totalAmount: 3000,
    category: 'food' as ExpenseCategory,
    dueDate: new Date(2023, 10, 15).toISOString(),
    provider: 'Delicious Catering',
    notes: '$60 per person for 50 guests',
    paymentAllocations: [
      {
        id: 'pay2',
        contributorId: '2',
        amount: 1000,
        date: new Date(2023, 9, 1).toISOString()
      }
    ],
    createdAt: new Date(2023, 6, 12).toISOString(),
    updatedAt: new Date(2023, 6, 12).toISOString()
  },
  {
    id: '3',
    title: 'Photography',
    totalAmount: 2500,
    category: 'photography' as ExpenseCategory,
    dueDate: new Date(2023, 11, 1).toISOString(),
    provider: 'Moments Photography',
    notes: '8 hours coverage',
    paymentAllocations: [],
    createdAt: new Date(2023, 7, 5).toISOString(),
    updatedAt: new Date(2023, 7, 5).toISOString()
  }
];

// Mock contributors
export const mockContributors: Contributor[] = [
  {
    id: '1',
    name: 'Bride\'s Parents'
  },
  {
    id: '2',
    name: 'Groom\'s Parents'
  },
  {
    id: '3',
    name: 'Couple'
  }
];

// Mock gifts
export const mockGifts: Gift[] = [
  {
    id: '1',
    fromPerson: 'Uncle Bob',
    amount: 500,
    date: new Date(2023, 8, 10).toISOString(),
    notes: 'Wedding gift',
    allocations: [
      {
        id: 'alloc1',
        expenseId: '1',
        amount: 300,
        giftId: '1'
      }
    ]
  },
  {
    id: '2',
    fromPerson: 'Aunt Mary',
    amount: 300,
    date: new Date(2023, 8, 15).toISOString(),
    notes: 'Congratulations!',
    allocations: []
  }
];

// Mock categories
export const mockCategories: CustomCategory[] = [
  {
    id: '1',
    name: 'Honeymoon',
    createdAt: new Date(2023, 6, 1).toISOString()
  },
  {
    id: '2',
    name: 'Rehearsal Dinner',
    createdAt: new Date(2023, 6, 5).toISOString()
  }
];

// Mock settings
export const mockSettings: Settings = {
  currency: 'USD'
};

// Function to get mock data
export const getMockData = () => {
  return {
    expenses: mockExpenses,
    contributors: mockContributors,
    gifts: mockGifts,
    categories: mockCategories,
    settings: mockSettings
  };
}; 