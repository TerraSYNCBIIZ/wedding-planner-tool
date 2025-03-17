'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useInvitations } from '@/context/InvitationContext';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Timestamp } from 'firebase/firestore';

export default function InvitationsPage() {
  const router = useRouter();
  const { 
    currentWorkspaceId, 
    workspaces
  } = useWorkspace();
  
  const { 
    invitations, 
    isLoading,
    getInvitations,
    sendInvitation,
    cancelInvitation 
  } = useInvitations();
  
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // Get the current workspace
  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId);
  
  // Load invitations when the page loads
  useEffect(() => {
    if (!currentWorkspaceId) {
      router.push('/');
      return;
    }
    
    getInvitations();
  }, [currentWorkspaceId, getInvitations, router]);
  
  // Handle form submission
  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }
    
    if (!currentWorkspaceId) {
      setError('No workspace selected');
      return;
    }
    
    try {
      setIsSending(true);
      
      const result = await sendInvitation(email.trim(), role);
      
      if (result.success) {
        setSuccess(`Invitation sent to ${email}`);
        setEmail('');
      } else {
        setError(result.error || 'Failed to send invitation');
      }
    } catch (err) {
      console.error('Error sending invitation:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsSending(false);
    }
  };
  
  // Handle cancel invitation
  const handleCancelInvitation = async (invitationId: string, recipientEmail: string) => {
    try {
      const success = await cancelInvitation(invitationId);
      
      if (success) {
        setSuccess(`Invitation to ${recipientEmail} canceled`);
      } else {
        setError('Failed to cancel invitation');
      }
    } catch (err) {
      console.error('Error canceling invitation:', err);
      setError('An unexpected error occurred');
    }
  };
  
  // Format date
  const formatDate = (date: Timestamp | string | Date) => {
    if (date instanceof Timestamp) {
      return new Date(date.toMillis()).toLocaleDateString();
    }
    if (typeof date === 'string') {
      return new Date(date).toLocaleDateString();
    }
    return date.toLocaleDateString();
  };
  
  // Check if user is the workspace owner
  const isOwner = currentWorkspace?.isOwner ?? false;
  
  if (!currentWorkspaceId) {
    return (
      <div className="flex items-center justify-center h-96">
        <p>Please select a workspace first</p>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }
  
  // If user is not the owner, they can't manage invitations
  if (!isOwner) {
    return (
      <div className="container mx-auto p-4 max-w-3xl">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Manage Invitations</h1>
          <p className="mb-6">Only the workspace owner can manage invitations.</p>
          <Link href="/">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Manage Invitations</h1>
        
        {/* Feedback messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
            {success}
          </div>
        )}
        
        {/* New invitation form */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Send New Invitation</h2>
          <form onSubmit={handleSendInvitation} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                id="role"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={role}
                onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
              >
                <option value="editor">Editor (can make changes)</option>
                <option value="viewer">Viewer (read-only access)</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Editors can modify content, while Viewers can only view content
              </p>
            </div>
            
            <Button
              type="submit"
              disabled={isSending || !email.trim()}
            >
              {isSending ? 'Sending...' : 'Send Invitation'}
            </Button>
            
            <div className="mt-4 text-sm">
              <Link href="/test-emailjs" className="text-blue-600 hover:underline">
                Test email sending functionality
              </Link>
            </div>
          </form>
        </div>
        
        {/* Pending invitations */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Pending Invitations</h2>
          
          {invitations.length === 0 ? (
            <p className="text-gray-500 italic">No pending invitations</p>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expires
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invitations.map(invitation => (
                    <tr key={invitation.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{invitation.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded ${
                          invitation.role === 'editor' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {invitation.role === 'editor' ? 'Editor' : 'Viewer'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded ${
                          invitation.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : invitation.status === 'accepted'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}>
                          {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(invitation.expiresAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {invitation.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelInvitation(invitation.id, invitation.email)}
                          >
                            Cancel
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 