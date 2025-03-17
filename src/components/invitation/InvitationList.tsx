'use client';

import { useEffect } from 'react';
import { useInvitations } from '@/context/InvitationContext';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function InvitationList() {
  const { invitations, getInvitations, isLoading } = useInvitations();
  
  // Refresh invitations when the component mounts
  useEffect(() => {
    getInvitations();
  }, [getInvitations]);
  
  const handleRefresh = () => {
    getInvitations();
  };
  
  // Calculate status classes
  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-md w-full mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Sent Invitations</h2>
        <Button 
          onClick={handleRefresh} 
          size="sm" 
          type="button"
          variant="outline"
          disabled={isLoading}
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          <span className="ml-2">Refresh</span>
        </Button>
      </div>
      
      {invitations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>You haven't sent any invitations yet.</p>
        </div>
      ) : (
        <div className="divide-y">
          {invitations.map((invitation) => (
            <div 
              key={invitation.id} 
              className="py-4 flex items-center justify-between"
            >
              <div>
                <p className="font-medium">{invitation.email}</p>
                <div className="flex items-center mt-1 space-x-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                    Role: {invitation.role === 'editor' ? 'Editor' : 'Viewer'}
                  </span>
                  <span 
                    className={`text-xs px-2 py-1 rounded-full ${getStatusClasses(invitation.status)}`}
                  >
                    {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Sent: {new Date(invitation.invitedAt).toLocaleDateString()} 
                  {new Date(invitation.invitedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 