'use client';

import { useState } from 'react';
import { useInvitations } from '@/context/InvitationContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function InviteUserForm() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('viewer');
  const [status, setStatus] = useState<{
    type: 'idle' | 'loading' | 'success' | 'error',
    message: string
  }>({ type: 'idle', message: '' });
  
  const { sendInvitation, isLoading } = useInvitations();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setStatus({ 
        type: 'error', 
        message: 'Please enter an email address' 
      });
      return;
    }
    
    try {
      setStatus({ type: 'loading', message: 'Sending invitation...' });
      const success = await sendInvitation(email, role);
      
      if (success) {
        setStatus({ 
          type: 'success', 
          message: `Invitation sent to ${email} successfully!` 
        });
        setEmail('');
      } else {
        setStatus({ 
          type: 'error', 
          message: 'Failed to send invitation. Please check the console for more details.' 
        });
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      let errorMsg = 'An error occurred while sending the invitation.';
      
      // Add more specific error messages
      if (error && typeof error === 'object' && 'text' in error) {
        errorMsg += ` Server response: ${(error as {text: string}).text}`;
      }
      
      setStatus({ 
        type: 'error', 
        message: errorMsg
      });
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-md w-full">
      <h2 className="text-2xl font-bold mb-6">Invite a Collaborator</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email address"
            disabled={isLoading}
            required
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Permission Level
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="role"
                value="viewer"
                checked={role === 'viewer'}
                onChange={() => setRole('viewer')}
                className="mr-2"
              />
              <span>Viewer (can only view)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="role"
                value="editor"
                checked={role === 'editor'}
                onChange={() => setRole('editor')}
                className="mr-2"
              />
              <span>Editor (can make changes)</span>
            </label>
          </div>
        </div>
        
        <Button
          type="submit"
          disabled={isLoading || !email}
          className="w-full"
        >
          {isLoading ? 'Sending...' : 'Send Invitation'}
        </Button>
        
        {status.message && (
          <div 
            className={`mt-4 p-3 rounded ${
              status.type === 'success' 
                ? 'bg-green-100 text-green-800' 
                : status.type === 'error'
                ? 'bg-red-100 text-red-800'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            {status.message}
          </div>
        )}
      </form>
    </div>
  );
} 