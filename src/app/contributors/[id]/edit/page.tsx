'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWedding } from '../../../../context/WeddingContext';
import { Button } from '../../../../components/ui/Button';
import Link from 'next/link';
import type { Contributor } from '../../../../types';

export default function EditContributorPage() {
  const { id } = useParams() as { id: string };
  const { contributors, updateExistingContributor } = useWedding();
  const router = useRouter();
  
  const [name, setName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Find the contributor and set form values
  const contributor = contributors.find(c => c.id === id);
  
  useEffect(() => {
    if (contributor) {
      setName(contributor.name);
      setNotes(contributor.notes || '');
    }
  }, [contributor]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    console.log('Form submitted with values:', { name, notes });
    
    // Validation
    if (!name.trim()) {
      setError('Please enter a name for the contributor.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('Calling updateExistingContributor with:', { id, name: name.trim(), notes: notes.trim() || null });
      const dataToUpdate: Partial<Contributor> = {
        name: name.trim()
      };
      
      // Only include notes field if it's not empty
      if (notes.trim()) {
        dataToUpdate.notes = notes.trim();
      }
      
      await updateExistingContributor(id, dataToUpdate);
      console.log('Update successful, redirecting to contributors page');
      router.push('/contributors');
    } catch (err) {
      console.error('Error updating contributor:', err);
      setError('An error occurred while updating the contributor. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!contributor) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-card p-6 rounded-lg shadow text-center">
          <h2 className="text-xl font-bold mb-4">Contributor Not Found</h2>
          <p className="mb-4">The contributor you are looking for does not exist.</p>
          <Link href="/contributors">
            <Button>Back to Contributors</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-md mx-auto bg-card rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Edit Contributor</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form 
          onSubmit={(e) => {
            console.log('Form onSubmit triggered');
            handleSubmit(e);
          }}
        >
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded-md"
              placeholder="Enter contributor name"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="notes" className="block text-sm font-medium mb-1">Notes (Optional)</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border rounded-md"
              rows={3}
              placeholder="Add any details about this contributor..."
            />
          </div>
          
          <div className="flex justify-between">
            <Link href="/contributors">
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              onClick={(e) => {
                console.log('Save button clicked');
                if (!isSubmitting) {
                  // This is a backup in case the form submit isn't triggering
                  handleSubmit(e as unknown as React.FormEvent);
                }
              }}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 