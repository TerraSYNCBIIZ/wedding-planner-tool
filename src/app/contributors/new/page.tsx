'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWedding } from '../../../context/WeddingContext';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import FormPageLayout from '../../../components/layouts/FormPageLayout';

export default function NewContributorPage() {
  const router = useRouter();
  const { addNewContributor } = useWedding();
  
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) newErrors.name = 'Name is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      await addNewContributor(name);
      router.push('/contributors');
    } catch (error) {
      console.error('Error adding contributor:', error);
      setErrors(prev => ({ ...prev, form: 'Failed to add contributor' }));
    }
  };

  return (
    <FormPageLayout
      title="Add New Contributor"
      backLink="/contributors"
      backLinkText="Back to Contributors"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.form && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {errors.form}
          </div>
        )}
        
        <Input
          label="Contributor Name"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          required
          placeholder="Enter full name"
        />
        
        <div className="flex justify-end pt-4">
          <Button type="submit">Save Contributor</Button>
        </div>
      </form>
    </FormPageLayout>
  );
} 