'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useRouter } from 'next/navigation';

export function DeleteAccount() {
  const { user, deleteAccount } = useAuth();
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDeleteAccount = async () => {
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setError('');
    setIsLoading(true);
    
    try {
      const success = await deleteAccount(password);
      if (success) {
        // Account deleted successfully, redirect to home
        router.push('/');
      } else {
        setError('Failed to delete account. Please check your password and try again.');
      }
    } catch (err) {
      setError('An error occurred while deleting your account. Please try again.');
      console.error('Error deleting account:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-6 border-t pt-6">
      <h3 className="text-lg font-medium text-red-600">Danger Zone</h3>
      <p className="mt-1 text-sm text-gray-600">
        Permanently delete your account and all associated data.
      </p>
      
      <Button
        variant="destructive"
        className="mt-4"
        onClick={() => setShowDeleteDialog(true)}
      >
        Delete Account
      </Button>
      
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Your Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All your data including wedding planning information,
              invitations, and workspace memberships will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="password" className="text-sm font-medium">
              Enter your password to confirm
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1"
            />
            
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount}
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 