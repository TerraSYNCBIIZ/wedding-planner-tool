'use client';

import { useWedding } from '@/context/WeddingContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, MapPin, Users, Heart, Clock, Edit, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Button } from '@/components/ui/Button';

export function WeddingDetails() {
  const { weddingData } = useWedding();
  const { workspaces, currentWorkspaceId, updateWorkspace } = useWorkspace();
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    coupleNames: '',
    weddingDate: '',
    location: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get current workspace
  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId);
  const isOwner = currentWorkspace?.isOwner || false;
  
  // Initialize edit form when opening modal
  useEffect(() => {
    if (isEditing && weddingData) {
      setEditForm({
        coupleNames: weddingData.coupleNames || '',
        weddingDate: weddingData.date ? new Date(weddingData.date).toISOString().split('T')[0] : '',
        location: weddingData.location || ''
      });
    }
  }, [isEditing, weddingData]);
  
  // Calculate days remaining when wedding date changes
  useEffect(() => {
    if (weddingData?.date) {
      try {
        // Format date explicitly to avoid potential issues
        const dateString = weddingData.date.split('T')[0]; // Get just the date part
        const [year, month, day] = dateString.split('-').map(Number);
        
        // Create date with explicit values to avoid timezone issues
        const weddingDate = new Date(year, month - 1, day); // month is 0-indexed
        const today = new Date();
        
        // Reset hours to compare only dates
        today.setHours(0, 0, 0, 0);
        weddingDate.setHours(0, 0, 0, 0);
        
        const diffTime = weddingDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        setDaysRemaining(diffDays >= 0 ? diffDays : null);
      } catch (error) {
        // Try a fallback method for the calculation
        try {
          const weddingDateFallback = new Date(weddingData.date);
          const todayFallback = new Date();
          
          // Reset hours
          todayFallback.setHours(0, 0, 0, 0);
          weddingDateFallback.setHours(0, 0, 0, 0);
          
          const diffTimeFallback = weddingDateFallback.getTime() - todayFallback.getTime();
          const diffDaysFallback = Math.ceil(diffTimeFallback / (1000 * 60 * 60 * 24));
          
          setDaysRemaining(diffDaysFallback >= 0 ? diffDaysFallback : null);
        } catch (fallbackError) {
          // Silently fail - the UI will handle displaying without a countdown
        }
      }
    }
  }, [weddingData]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentWorkspaceId) return;
    
    setIsSubmitting(true);
    
    try {
      const success = await updateWorkspace(currentWorkspaceId, {
        coupleNames: editForm.coupleNames,
        weddingDate: editForm.weddingDate,
        location: editForm.location
      });
      
      if (success) {
        setIsEditing(false);
      } else {
        alert('Failed to update wedding details. Please try again.');
      }
    } catch (error) {
      console.error('Error updating wedding details:', error);
      alert('An error occurred while updating wedding details.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      <Card className="bg-white/90 shadow-md border border-blue-200">
        <CardHeader className="pb-2 flex flex-row justify-between items-start">
          <div>
            <CardTitle>Wedding Details</CardTitle>
            <CardDescription>Your special day information</CardDescription>
          </div>
          {isOwner && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(true)}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Edit size={16} className="mr-1" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Wedding Countdown */}
          {daysRemaining !== null && (
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200 mb-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-700" />
                  <h3 className="text-sm font-medium text-blue-900">Days Until Wedding</h3>
                </div>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-blue-800">{daysRemaining}</span>
                  <span className="ml-2 text-sm text-blue-700">days</span>
                </div>
              </div>
              <div className="mt-2">
                <div className="w-full bg-blue-100 rounded-full h-2.5 border border-blue-200">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${Math.min(100, Math.max(5, 100 - daysRemaining))}%` }}
                  />
                </div>
                <p className="text-xs text-blue-600 mt-1 text-right">
                  {daysRemaining === 0 
                    ? "Today's the big day!" 
                    : (daysRemaining === 1 
                      ? "Tomorrow's the big day!" 
                      : `Wedding Date: ${weddingData?.date ? formatDate(new Date(weddingData.date)) : 'Not set'}`)}
                </p>
              </div>
            </div>
          )}
          
          {/* Wedding information grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-full text-blue-700">
                <Heart size={20} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-900">Couple</h3>
                <p className="text-base">{weddingData?.coupleNames || 'Not set'}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-full text-blue-700">
                <CalendarDays size={20} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-900">Wedding Date</h3>
                <p className="text-base">{weddingData?.date ? formatDate(new Date(weddingData.date)) : 'Not set'}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-full text-blue-700">
                <MapPin size={20} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-900">Location</h3>
                <p className="text-base">{weddingData?.location || 'Not set'}</p>
              </div>
            </div>
          </div>
          
          <div className="pt-2 mt-2 border-t border-blue-100">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-900">Total Budget:</span>
              <span className="text-lg font-bold text-blue-800">
                ${weddingData?.budget ? weddingData.budget.toLocaleString() : '0'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
            <button 
              onClick={() => setIsEditing(false)} 
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              disabled={isSubmitting}
              type="button"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-xl font-bold text-blue-900 mb-4">Edit Wedding Details</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="coupleNames" className="block text-sm font-medium text-gray-700 mb-1">
                    Couple Names
                  </label>
                  <input
                    type="text"
                    id="coupleNames"
                    name="coupleNames"
                    value={editForm.coupleNames}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. John & Jane"
                  />
                </div>
                
                <div>
                  <label htmlFor="weddingDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Wedding Date
                  </label>
                  <input
                    type="date"
                    id="weddingDate"
                    name="weddingDate"
                    value={editForm.weddingDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={editForm.location}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. New York, NY"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
} 