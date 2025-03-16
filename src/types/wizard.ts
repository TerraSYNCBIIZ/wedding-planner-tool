// Wedding setup data
export interface WeddingSetupData {
  // Basic information
  person1Name: string;
  person2Name: string;
  weddingDate: string; // ISO date string
  location?: string;
  
  // Budget information
  totalBudget: number;
  currency: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

// Wizard form data
export type WizardFormData = Partial<WeddingSetupData>; 