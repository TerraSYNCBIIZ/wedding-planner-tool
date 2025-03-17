'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { firestore } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { CalendarDays, MapPin, Heart, Users2, Trash2, Edit2, Eye, RefreshCw } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface WorkspaceMember {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  role: string;
  joinedAt: string;
  weddingId?: string;
}

interface WorkspaceWithDetails {
  id: string;
  weddingId: string;
  role: string;
  joinedAt: string;
  // Wedding details
  coupleNames?: string;
  weddingDate?: string;
  location?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerId?: string;
  // Other members
  members: WorkspaceMember[];
  membersCount: number;
  isOwner?: boolean;
}

export function WorkspaceMembership() {
  const { user } = useAuth();
  const { 
    workspaces: contextWorkspaces,
    refreshWorkspaces,
    removeMember,
    updateMemberRole,
    deleteWorkspace,
    leaveWorkspace,
    isLoading: contextLoading 
  } = useWorkspace();
  
  const [workspaces, setWorkspaces] = useState<WorkspaceWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Management state
  const [expandedWorkspace, setExpandedWorkspace] = useState<string | null>(null);
  
  // Dialog states
  const [deleteWorkspaceDialog, setDeleteWorkspaceDialog] = useState<string | null>(null);
  const [leaveWorkspaceDialog, setLeaveWorkspaceDialog] = useState<string | null>(null);
  const [removeMemberDialog, setRemoveMemberDialog] = useState<{
    workspaceId: string;
    memberId: string;
    memberName: string;
  } | null>(null);
  const [changeRoleDialog, setChangeRoleDialog] = useState<{
    workspaceId: string;
    memberId: string;
    memberName: string;
    currentRole: string;
    newRole: 'editor' | 'viewer';
  } | null>(null);

  // Manual refresh button handler
  const handleRefreshWorkspaces = async () => {
    // Only proceed if we're not already loading
    if (loading || contextLoading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Manual refresh of workspaces triggered by user');
      // Reset the initial load flag so we can refresh if needed
      localStorage.removeItem('initialWorkspaceLoadTriggered');
      await refreshWorkspaces();
    } catch (error) {
      console.error('Error during manual refresh:', error);
      setError('Failed to refresh workspaces. Please try again.');
    } finally {
      // After a brief delay, set loading to false to ensure UI updates
      // This ensures the loading indicator is visible long enough for users to see it
      setTimeout(() => setLoading(false), 500);
    }
  };
  
  useEffect(() => {
    // Use the workspaces from context if available
    if (contextWorkspaces.length > 0) {
      // Convert from WorkspaceDetails to WorkspaceWithDetails
      const convertedWorkspaces = contextWorkspaces.map(workspace => {
        const isOwner = workspace.ownerId === user?.uid;
        
        // Enhanced logging for debugging workspace data
        console.log('Processing workspace in WorkspaceMembership component:', {
          id: workspace.id,
          isOwner: workspace.isOwner,
          coupleNames: workspace.coupleNames,
          ownerId: workspace.ownerId,
          ownerName: workspace.ownerName,
          weddingDate: workspace.weddingDate,
          location: workspace.location,
          hasMembers: workspace.members?.length > 0,
          members: workspace.members?.map(m => ({
            id: m.id,
            userId: m.userId,
            displayName: m.displayName,
            email: m.email
          }))
        });
        
        // Process the members array - this is critical for correct display
        const processedMembers = workspace.members || [];
        
        // Log the members we found
        console.log(`Found ${processedMembers.length} members for workspace ${workspace.id}`);
        
        // For owners: Count members who are not the current user (true external collaborators)
        // For members: All members count except yourself
        const externalMembers = isOwner 
          ? processedMembers.filter(m => m.userId !== user?.uid)
          : processedMembers.filter(m => m.userId !== user?.uid);
          
        const memberCount = externalMembers.length;
        console.log(`External members count: ${memberCount}`);
        
        return {
          id: isOwner ? `owner-${workspace.id}` : workspace.id,
          weddingId: workspace.id,  // Use the workspace ID as the wedding ID
          role: isOwner ? 'owner' : 'viewer', // Default role for non-owners
          joinedAt: 'N/A', // No specific joined date available
          isOwner: isOwner,
          ownerId: workspace.ownerId,
          ownerName: workspace.ownerName || '',
          ownerEmail: workspace.ownerEmail || '',
          coupleNames: workspace.coupleNames && workspace.coupleNames !== 'Wedding' 
            ? workspace.coupleNames 
            : '', // Don't use "Wedding" as a default
          weddingDate: workspace.weddingDate || '',
          location: workspace.location || '',
          members: processedMembers,
          membersCount: memberCount // Only count external members
        } as WorkspaceWithDetails;
      });
      
      // More verbose logging to debug workspace processing
      console.log('Processed workspaces for UI:', convertedWorkspaces.map(w => ({
        id: w.id,
        weddingId: w.weddingId, 
        membersCount: w.membersCount,
        totalMembers: w.members.length,
        isOwner: w.isOwner,
        coupleNames: w.coupleNames
      })));
      
      setWorkspaces(convertedWorkspaces);
      setLoading(false);
    } else if (!contextLoading) {
      // If context is not loading but no workspaces are there yet, load them
      // Only do this once on initial load, not repeatedly
      if (loading) {
        refreshWorkspaces().catch(error => {
          console.error('Error refreshing workspaces from component:', error);
          setError('Failed to load workspaces. Please try again.');
          setLoading(false);
        });
      }
    } else {
      // Make sure we don't stay in loading state too long - reduced timeout
      const timeoutId = setTimeout(() => {
        if (loading && contextLoading) {
          console.log('Loading timeout reached, forcing state update');
          setLoading(false);
        }
      }, 5000); // 5 second safety timeout
      
      return () => clearTimeout(timeoutId);
    }
  }, [contextWorkspaces, contextLoading, refreshWorkspaces, user, loading]);
  
  // Initial load effect
  useEffect(() => {
    // If user logs in and we have no workspaces yet, trigger a refresh
    if (user && !contextWorkspaces.length && !contextLoading) {
      // Add a flag to localStorage to prevent infinite refreshes
      const hasInitialLoadFlag = localStorage.getItem('initialWorkspaceLoadTriggered');
      
      if (!hasInitialLoadFlag) {
        setLoading(true);
        console.log('Initial workspace load triggered');
        localStorage.setItem('initialWorkspaceLoadTriggered', 'true');
        
        // Call refresh only once
        refreshWorkspaces().catch(error => {
          console.error('Error in initial workspace load:', error);
          setLoading(false);
        });
      } else {
        // If we've already tried to load once, just reset the loading state
        console.log('Initial load already triggered, skipping refresh');
        setLoading(false);
      }
    } else if (!user || contextWorkspaces.length > 0) {
      // Reset loading state if we have workspaces or no user
      setLoading(false);
    }
    
    // Clear the flag when component unmounts
    return () => {
      // Don't clear on every unmount, only when explicitly reset
    };
  }, [user, contextWorkspaces.length, contextLoading, refreshWorkspaces]);
  
  // Handler functions for workspace management
  const handleDeleteWorkspace = async (workspaceId: string) => {
    const success = await deleteWorkspace(workspaceId);
    if (success) {
      // Remove this workspace from the local state
      setWorkspaces(prev => prev.filter(w => w.weddingId !== workspaceId));
      setDeleteWorkspaceDialog(null);
    } else {
      alert('Error deleting workspace. Please try again.');
    }
  };
  
  const handleLeaveWorkspace = async (workspaceMemberId: string, workspaceId: string) => {
    const success = await leaveWorkspace(workspaceMemberId);
    if (success) {
      // Remove this workspace from the local state
      setWorkspaces(prev => prev.filter(w => w.id !== workspaceMemberId));
      setLeaveWorkspaceDialog(null);
    } else {
      alert('Error leaving workspace. Please try again.');
    }
  };
  
  const handleRemoveMember = async (workspaceId: string, memberId: string) => {
    if (!removeMemberDialog) return;
    
    const workspace = workspaces.find(w => w.weddingId === workspaceId);
    if (!workspace) return;
    
    const success = await removeMember(memberId, workspaceId);
    if (success) {
      // Update the members list locally
      setWorkspaces(prev => 
        prev.map(w => {
          if (w.weddingId === workspaceId) {
            return {
              ...w,
              members: w.members.filter(m => m.id !== memberId),
              membersCount: w.membersCount - 1
            };
          }
          return w;
        })
      );
      setRemoveMemberDialog(null);
    } else {
      alert('Error removing member. Please try again.');
    }
  };
  
  const handleChangeRole = async () => {
    if (!changeRoleDialog) return;
    
    const { workspaceId, memberId, newRole } = changeRoleDialog;
    
    const success = await updateMemberRole(memberId, newRole);
    if (success) {
      // Update the member role locally
      setWorkspaces(prev => 
        prev.map(w => {
          if (w.weddingId === workspaceId) {
            return {
              ...w,
              members: w.members.map(m => 
                m.id === memberId ? { ...m, role: newRole } : m
              )
            };
          }
          return w;
        })
      );
      setChangeRoleDialog(null);
    } else {
      alert('Error changing role. Please try again.');
    }
  };
  
  if (loading || contextLoading) {
    return (
      <div className="card bg-white/90 rounded-xl shadow-md p-6 border border-blue-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-blue-900">Wedding Workspaces</h3>
          <Button
            onClick={handleRefreshWorkspaces}
            size="sm"
            type="button"
            variant="outline"
            disabled={loading || contextLoading}
          >
            <RefreshCw size={16} className="animate-spin" />
            <span className="ml-2">Loading...</span>
          </Button>
        </div>
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-blue-100 rounded w-3/4" />
            <div className="h-4 bg-blue-100 rounded" />
            <div className="h-4 bg-blue-100 rounded w-5/6" />
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="card bg-white/90 rounded-xl shadow-md p-6 border border-blue-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-blue-900">Wedding Workspaces</h3>
          <Button
            onClick={handleRefreshWorkspaces}
            size="sm"
            type="button"
            variant="outline"
            disabled={loading || contextLoading}
          >
            <RefreshCw size={16} className={loading || contextLoading ? 'animate-spin' : ''} />
            <span className="ml-2">Refresh</span>
          </Button>
        </div>
        <div className="p-6 bg-red-50 rounded-lg border border-red-100 text-center">
          <p className="text-red-700 mb-4">{error}</p>
          <Button onClick={handleRefreshWorkspaces}>Try Again</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="card bg-white/90 rounded-xl shadow-md p-6 border border-blue-200">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-blue-900">Wedding Workspaces</h3>
        <Button
          onClick={handleRefreshWorkspaces}
          size="sm"
          type="button"
          variant="outline"
          disabled={loading || contextLoading}
        >
          <RefreshCw size={16} className={loading || contextLoading ? 'animate-spin' : ''} />
          <span className="ml-2">Refresh</span>
        </Button>
      </div>
      
      {workspaces.length === 0 ? (
        <div className="text-center py-6 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-blue-800 mb-2 font-medium">No wedding workspaces found</p>
          <p className="text-blue-600 text-sm">
            You are not a member of any wedding workspaces yet. This could mean:
          </p>
          <ul className="text-blue-600 text-sm list-disc list-inside mt-2">
            <li>You haven't accepted any invitations</li>
            <li>The invitation you accepted had an issue</li>
            <li>You are the owner of this wedding (owners don't appear as members)</li>
          </ul>
        </div>
      ) : (
        <div className="space-y-6">
          {workspaces.map((workspace) => (
            <div 
              key={workspace.id} 
              className="rounded-lg border border-blue-200 overflow-hidden"
            >
              {/* Workspace Header */}
              <div className="p-4 bg-blue-50 flex justify-between items-start border-b border-blue-200">
                <div>
                  <h4 className="font-medium text-blue-800 text-lg">
                    {workspace.coupleNames ? (
                      <span>
                        {workspace.coupleNames.toLowerCase().includes('wedding') 
                          ? workspace.coupleNames 
                          : workspace.coupleNames}
                      </span>
                    ) : (
                      <span>Shared Wedding{workspace.weddingDate ? ` (${new Date(workspace.weddingDate).toLocaleDateString()})` : ''}</span>
                    )}
                  </h4>
                  <p className="text-blue-600 text-sm">
                    {workspace.isOwner ? 'Created by you' : `Created by: ${workspace.ownerName || workspace.ownerEmail || 'Unknown'}`}
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {workspace.isOwner ? 'Owner' : (workspace.role === 'editor' ? 'Editor' : 'Viewer')}
                  </span>
                  
                  {/* Action buttons */}
                  <div className="flex gap-1 ml-2">
                    {workspace.isOwner ? (
                      <button 
                        className="p-1 text-red-600 hover:bg-red-50 rounded-full"
                        onClick={() => setDeleteWorkspaceDialog(workspace.weddingId)}
                        title="Delete Workspace"
                        type="button"
                      >
                        <Trash2 size={18} />
                      </button>
                    ) : (
                      <button
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded-full"
                        onClick={() => setLeaveWorkspaceDialog(workspace.id)}
                        title="Leave Workspace"
                        type="button"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-labelledby="leave-workspace-icon">
                          <title id="leave-workspace-icon">Leave Workspace</title>
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                      </button>
                    )}
                    <button
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded-full"
                      onClick={() => setExpandedWorkspace(prev => prev === workspace.weddingId ? null : workspace.weddingId)}
                      title={expandedWorkspace === workspace.weddingId ? "Hide Details" : "Show Details"}
                      type="button"
                    >
                      {expandedWorkspace === workspace.weddingId ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-labelledby="collapse-icon">
                          <title id="collapse-icon">Collapse Details</title>
                          <polyline points="18 15 12 9 6 15" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-labelledby="expand-icon">
                          <title id="expand-icon">Expand Details</title>
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Wedding Details */}
              <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-blue-100">
                {workspace.weddingDate && (
                  <div className="flex items-center gap-2">
                    <CalendarDays size={16} className="text-blue-600" />
                    <span className="text-sm">{new Date(workspace.weddingDate).toLocaleDateString()}</span>
                  </div>
                )}
                
                {workspace.location && (
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-blue-600" />
                    <span className="text-sm">{workspace.location}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Users2 size={16} className="text-blue-600" />
                  <span className="text-sm">
                    {workspace.isOwner ? (
                      workspace.membersCount > 0 ? (
                        <>{workspace.membersCount} {workspace.membersCount === 1 ? 'collaborator' : 'collaborators'}</>
                      ) : (
                        'No collaborators yet'
                      )
                    ) : (
                      // For members, we need different phrasing as they're not the owner
                      workspace.members && workspace.members.length > 1 ? (
                        <>{workspace.members.length - 1} other {workspace.members.length - 1 === 1 ? 'collaborator' : 'collaborators'}</>
                      ) : (
                        'You and the owner'
                      )
                    )}
                  </span>
                </div>
              </div>
              
              {/* Workspace Members - Only show when expanded */}
              {expandedWorkspace === workspace.weddingId && (
                <div className="p-4">
                  <h5 className="text-sm font-medium text-blue-800 mb-3">Workspace Members</h5>
                  
                  {/* Current user is owner - show members they can edit */}
                  {workspace.isOwner ? (
                    <div className="space-y-2">
                      {/* Show the members (if any) */}
                      {workspace.members && workspace.members.length > 0 ? (
                        workspace.members.map(member => (
                          <div key={member.id} className="flex justify-between items-center p-2 rounded bg-blue-50/50">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-800 text-sm font-medium mr-2">
                                {member.displayName ? member.displayName.charAt(0).toUpperCase() : '?'}
                              </div>
                              <div>
                                <div className="font-medium text-sm">{member.displayName || 'Unknown User'}</div>
                                <div className="text-xs text-blue-600">{member.email || 'No email'}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {member.role === 'editor' ? 'Editor' : 'Viewer'}
                              </span>
                              
                              <div className="flex gap-1 ml-2">
                                <button
                                  className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                  onClick={() => setChangeRoleDialog({
                                    workspaceId: workspace.weddingId,
                                    memberId: member.id,
                                    memberName: member.displayName || 'Unknown User',
                                    currentRole: member.role,
                                    newRole: member.role === 'editor' ? 'viewer' : 'editor'
                                  })}
                                  title={`Change to ${member.role === 'editor' ? 'Viewer' : 'Editor'}`}
                                  type="button"
                                >
                                  {member.role === 'editor' ? (
                                    <Eye size={16} className="text-blue-700" />
                                  ) : (
                                    <Edit2 size={16} className="text-blue-700" />
                                  )}
                                </button>
                                <button
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  onClick={() => setRemoveMemberDialog({
                                    workspaceId: workspace.weddingId,
                                    memberId: member.id, 
                                    memberName: member.displayName || 'Unknown User'
                                  })}
                                  title="Remove Member"
                                  type="button"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-blue-600 text-sm italic mb-3">No collaborators in this workspace yet</p>
                      )}
                      
                      {/* Show owner (yourself) as well */}
                      <div className="flex justify-between items-center p-2 rounded bg-blue-100/50">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-blue-300 flex items-center justify-center text-blue-800 text-sm font-medium mr-2">
                            {user?.displayName?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{user?.displayName || 'You'} <span className="text-xs">(You)</span></div>
                            <div className="text-xs text-blue-600">{user?.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full">
                            Owner
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Current user is a member - show all members including owner
                    <div className="space-y-2">
                      {/* Show the owner */}
                      {workspace.ownerName && (
                        <div className="flex justify-between items-center p-2 rounded bg-blue-100/50">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-blue-300 flex items-center justify-center text-blue-800 text-sm font-medium mr-2">
                              {workspace.ownerName?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <div className="font-medium text-sm">{workspace.ownerName || 'Unknown'}</div>
                              <div className="text-xs text-blue-600">{workspace.ownerEmail || 'No email'}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full">
                              Owner
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Show yourself */}
                      <div className="flex justify-between items-center p-2 rounded bg-blue-50/70 border border-blue-200">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-800 text-sm font-medium mr-2">
                            {user?.displayName?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{user?.displayName || 'You'} <span className="text-xs">(You)</span></div>
                            <div className="text-xs text-blue-600">{user?.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {workspace.role === 'editor' ? 'Editor' : 'Viewer'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Show other members */}
                      {workspace.members
                        ?.filter(member => member.userId !== user?.uid && member.userId !== workspace.ownerId)
                        .map(member => (
                          <div key={member.id} className="flex justify-between items-center p-2 rounded bg-blue-50/50">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-800 text-sm font-medium mr-2">
                                {member.displayName ? member.displayName.charAt(0).toUpperCase() : '?'}
                              </div>
                              <div>
                                <div className="font-medium text-sm">{member.displayName || 'Unknown User'}</div>
                                <div className="text-xs text-blue-600">{member.email || 'No email'}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {member.role === 'editor' ? 'Editor' : 'Viewer'}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Dialog: Delete Workspace */}
      <Dialog open={!!deleteWorkspaceDialog} onOpenChange={() => setDeleteWorkspaceDialog(null)}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif text-blue-800">Delete Workspace</DialogTitle>
            <DialogDescription className="text-blue-600">
              Are you sure you want to delete this workspace? This action is permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mb-2 font-medium text-blue-600">The following data will be permanently deleted:</div>
          <ul className="list-disc pl-5 text-sm space-y-1 mb-3 text-blue-600">
            <li>All wedding details and settings</li>
            <li>All expense records and budget information</li>
            <li>All gift records and contributor information</li>
            <li>All team member access and invitations</li>
            <li>All custom categories, notes, and tasks</li>
          </ul>
          <div className="text-red-600 font-medium text-sm mb-4">
            This data cannot be recovered after deletion.
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteWorkspaceDialog(null)}
              className="border-blue-200 text-blue-800"
              type="button"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteWorkspaceDialog && handleDeleteWorkspace(deleteWorkspaceDialog)}
              disabled={contextLoading}
              className="bg-red-600 hover:bg-red-700"
              type="button"
            >
              {contextLoading ? 'Deleting...' : 'Delete Workspace'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog: Leave Workspace */}
      <Dialog open={!!leaveWorkspaceDialog} onOpenChange={() => setLeaveWorkspaceDialog(null)}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif text-blue-800">Leave Workspace</DialogTitle>
            <DialogDescription className="text-blue-600">
              Are you sure you want to leave this workspace? You will lose access to all wedding planning data,
              and will need a new invitation to rejoin.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLeaveWorkspaceDialog(null)}
              className="border-blue-200 text-blue-800"
              type="button"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (leaveWorkspaceDialog) {
                  const workspace = workspaces.find(w => w.id === leaveWorkspaceDialog);
                  if (workspace) {
                    handleLeaveWorkspace(leaveWorkspaceDialog, workspace.weddingId);
                  }
                }
              }}
              disabled={contextLoading}
              className="bg-red-600 hover:bg-red-700"
              type="button"
            >
              {contextLoading ? 'Leaving...' : 'Leave Workspace'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog: Remove Member */}
      <Dialog open={!!removeMemberDialog} onOpenChange={() => setRemoveMemberDialog(null)}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif text-blue-800">Remove Member</DialogTitle>
            <DialogDescription className="text-blue-600">
              Are you sure you want to remove {removeMemberDialog?.memberName} from this workspace?
              They will lose all access to the wedding planning data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRemoveMemberDialog(null)}
              className="border-blue-200 text-blue-800"
              type="button"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (removeMemberDialog) {
                  handleRemoveMember(removeMemberDialog.workspaceId, removeMemberDialog.memberId);
                }
              }}
              disabled={contextLoading}
              className="bg-red-600 hover:bg-red-700"
              type="button"
            >
              {contextLoading ? 'Removing...' : 'Remove Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog: Change Role */}
      <Dialog open={!!changeRoleDialog} onOpenChange={() => setChangeRoleDialog(null)}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif text-blue-800">Change Member Role</DialogTitle>
            <DialogDescription className="text-blue-600">
              Are you sure you want to change {changeRoleDialog?.memberName}'s role to 
              {changeRoleDialog?.newRole === 'editor' ? ' Editor' : ' Viewer'}?
            </DialogDescription>
          </DialogHeader>
          
          <div className="text-blue-600 mb-4">
            {changeRoleDialog?.newRole === 'editor' 
              ? 'They will be able to edit wedding planning data.'
              : 'They will only be able to view wedding planning data.'}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setChangeRoleDialog(null)}
              className="border-blue-200 text-blue-800"
              type="button"
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleChangeRole}
              disabled={contextLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              type="button"
            >
              {contextLoading ? 'Updating...' : 'Change Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 