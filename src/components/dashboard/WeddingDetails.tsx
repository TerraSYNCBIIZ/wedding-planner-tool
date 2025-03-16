'use client';

import { useWedding } from '@/context/WeddingContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, MapPin, Users, Heart } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export function WeddingDetails() {
  const { weddingData } = useWedding();
  
  if (!weddingData) {
    return (
      <Card className="bg-white/90 shadow-md border border-blue-200">
        <CardHeader>
          <CardTitle>Wedding Details</CardTitle>
          <CardDescription>Your wedding information will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No wedding details available. Please complete the setup wizard.</p>
        </CardContent>
      </Card>
    );
  }
  
  const { date, location, coupleNames, guestCount, budget } = weddingData;
  
  return (
    <Card className="bg-white/90 shadow-md border border-blue-200">
      <CardHeader className="pb-2">
        <CardTitle>Wedding Details</CardTitle>
        <CardDescription>Your special day information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded-full text-blue-700">
              <Heart size={20} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-900">Couple</h3>
              <p className="text-base">{coupleNames}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded-full text-blue-700">
              <CalendarDays size={20} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-900">Wedding Date</h3>
              <p className="text-base">{date ? formatDate(new Date(date)) : 'Not set'}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded-full text-blue-700">
              <MapPin size={20} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-900">Location</h3>
              <p className="text-base">{location || 'Not set'}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded-full text-blue-700">
              <Users size={20} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-900">Guest Count</h3>
              <p className="text-base">{guestCount || 'Not set'} guests</p>
            </div>
          </div>
        </div>
        
        <div className="pt-2 mt-2 border-t border-blue-100">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-blue-900">Total Budget:</span>
            <span className="text-lg font-bold text-blue-800">
              ${budget ? budget.toLocaleString() : '0'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 