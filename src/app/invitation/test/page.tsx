'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { firestore } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function TestInvitationPage() {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<any[]>([]);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Fetch invitations sent by this user
        const sentInvitationsQuery = query(
          collection(firestore, 'invitations'),
          where('invitedBy', '==', user.uid)
        );
        
        const sentSnapshot = await getDocs(sentInvitationsQuery);
        const sentInvitations = sentSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          type: 'sent'
        }));
        
        // Fetch invitations received by this user (by email)
        const receivedInvitationsQuery = query(
          collection(firestore, 'invitations'),
          where('email', '==', user.email)
        );
        
        const receivedSnapshot = await getDocs(receivedInvitationsQuery);
        const receivedInvitations = receivedSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          type: 'received'
        }));
        
        // Combine all invitations
        const allInvitations = [...sentInvitations, ...receivedInvitations];
        setInvitations(allInvitations);
        
        // Fetch workspace memberships
        const membershipsQuery = query(
          collection(firestore, 'workspaceUsers'),
          where('userId', '==', user.uid)
        );
        
        const membershipsSnapshot = await getDocs(membershipsQuery);
        const membershipsData = membershipsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setMemberships(membershipsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);
  
  if (!user) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6">Invitation System Test</h1>
          <p className="mb-4">You need to be logged in to test the invitation system.</p>
          <Link href="/auth/login">
            <Button className="w-full">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6">Invitation System Test</h1>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">Invitation System Test</h1>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Your User Information</h2>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="grid grid-cols-2 gap-2">
              <div className="font-medium">User ID:</div>
              <div className="font-mono text-sm">{user.uid}</div>
              <div className="font-medium">Email:</div>
              <div>{user.email}</div>
              <div className="font-medium">Display Name:</div>
              <div>{user.displayName || 'Not set'}</div>
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Your Workspace Memberships ({memberships.length})</h2>
          {memberships.length === 0 ? (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-yellow-800">
              <p className="font-medium">No workspace memberships found.</p>
              <p className="text-sm mt-2">
                This means you haven't accepted any invitations yet, or you're the owner of the wedding workspace.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {memberships.map(membership => (
                <div key={membership.id} className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-medium text-green-800">Membership: {membership.id}</h3>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div className="font-medium">Wedding ID:</div>
                    <div className="font-mono">{membership.weddingId}</div>
                    <div className="font-medium">Role:</div>
                    <div>{membership.role}</div>
                    <div className="font-medium">Joined:</div>
                    <div>{new Date(membership.joinedAt).toLocaleString()}</div>
                    <div className="font-medium">Invited By:</div>
                    <div>{membership.invitedByName || membership.invitedByEmail || 'Unknown'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Your Invitations ({invitations.length})</h2>
          {invitations.length === 0 ? (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p>No invitations found for your account.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {invitations.map(invitation => (
                <div 
                  key={invitation.id} 
                  className={`p-4 rounded-lg border ${
                    invitation.type === 'sent' 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-purple-50 border-purple-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">
                      {invitation.type === 'sent' ? 'Sent to:' : 'Received from:'}{' '}
                      <span className="font-mono">{invitation.email}</span>
                    </h3>
                    <span 
                      className={`px-2 py-1 text-xs rounded-full ${
                        invitation.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : invitation.status === 'accepted'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {invitation.status}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div className="font-medium">Role:</div>
                    <div>{invitation.role}</div>
                    <div className="font-medium">Wedding ID:</div>
                    <div className="font-mono">{invitation.weddingId}</div>
                    <div className="font-medium">Created:</div>
                    <div>{new Date(invitation.invitedAt).toLocaleString()}</div>
                    {invitation.type === 'sent' && (
                      <>
                        <div className="font-medium">Token:</div>
                        <div className="font-mono text-xs truncate">{invitation.token}</div>
                      </>
                    )}
                  </div>
                  {invitation.type === 'sent' && invitation.status === 'pending' && (
                    <div className="mt-4">
                      <div className="text-sm font-medium mb-2">Invitation Link:</div>
                      <div className="bg-white p-2 rounded border text-xs font-mono break-all">
                        {`${window.location.origin}/invitation/accept?token=${invitation.token}`}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-between mt-8">
          <Link href="/">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
          <Link href="/profile">
            <Button>Go to Profile</Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 