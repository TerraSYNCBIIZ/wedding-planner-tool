'use client';

import { useWedding } from '@/context/WeddingContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, MapPin, Users, Heart, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useState, useEffect } from 'react';

export function WeddingDetails() {
  const { weddingData } = useWedding();
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  
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
  
  return (
    <Card className="bg-white/90 shadow-md border border-blue-200">
      <CardHeader className="pb-2">
        <CardTitle>Wedding Details</CardTitle>
        <CardDescription>Your special day information</CardDescription>
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
  );
} 