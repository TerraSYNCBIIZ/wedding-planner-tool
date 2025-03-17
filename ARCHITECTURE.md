# Wedding Planner Tool Architecture

## System Overview

The Wedding Planner Tool is a collaborative platform for planning weddings. It allows users to create workspaces, invite collaborators with different permission levels, and manage wedding-related data such as expenses, gifts, tasks, and guest lists.

## Core Concepts

### Workspaces

Workspaces are the central organizational unit in the application. Each workspace represents a wedding being planned and contains all related data. Users can:

- Create multiple workspaces
- Invite collaborators with different roles (editor/viewer)
- Manage workspace settings and details

### Members and Roles

Each workspace has members with specific roles:

- **Owner**: The creator of the workspace with full control
- **Editor**: Can modify data but cannot delete the workspace or manage members
- **Viewer**: Can only view data without making changes

### Invitations

Users can be invited to join workspaces through an invitation system:

- Invitations are sent via email
- Each invitation has a unique token
- Invitations can be accepted, declined, or canceled
- Invitations expire after a certain period

## Data Structure

### Firebase Collections

The application uses Firebase Firestore as its database with the following collections:

#### `workspaces`

Contains workspace documents with the following structure:

```typescript
{
  id: string;                   // Workspace ID
  name: string;                 // Workspace name
  ownerId: string;              // User ID of the owner
  ownerName: string;            // Display name of the owner
  ownerEmail: string;           // Email of the owner
  coupleNames?: string;         // Names of the couple
  weddingDate?: Timestamp;      // Wedding date
  location?: string;            // Wedding location
  createdAt: Timestamp;         // Creation timestamp
  updatedAt: Timestamp;         // Last update timestamp
  membersCount: number;         // Number of members
}
```

#### `workspaceMembers`

Contains members of workspaces:

```typescript
{
  id: string;                   // Member document ID
  workspaceId: string;          // ID of the workspace
  userId: string;               // User ID of the member
  displayName: string;          // Display name of the member
  email: string;                // Email of the member
  role: 'owner' | 'editor' | 'viewer'; // Role in the workspace
  joinedAt: Timestamp;          // When the user joined
  createdAt: Timestamp;         // Creation timestamp
  updatedAt: Timestamp;         // Last update timestamp
}
```

#### `invitations`

Contains workspace invitations:

```typescript
{
  id: string;                   // Invitation ID
  email: string;                // Invitee email address
  workspaceId: string;          // Workspace ID
  invitedBy: string;            // User ID who sent the invitation
  invitedByName?: string;       // Name of the user who sent the invitation
  invitedByEmail?: string;      // Email of the user who sent the invitation
  role: 'editor' | 'viewer';    // Assigned role
  status: 'pending' | 'accepted' | 'declined' | 'expired'; // Invitation status
  token: string;                // Unique token for accepting/declining
  createdAt: Timestamp;         // Creation timestamp
  expiresAt: Timestamp;         // Expiration timestamp
  acceptedAt?: Timestamp;       // When the invitation was accepted
  acceptedBy?: {                // User who accepted the invitation
    userId: string;
    displayName?: string;
    email?: string;
  };
  declinedAt?: Timestamp;       // When the invitation was declined
  message?: string;             // Optional message
}
```

### Related Collections

The following collections store data related to workspaces:

- `expenses`: Wedding expenses
- `gifts`: Wedding gifts
- `contributors`: Contributors to expenses or gifts
- `categories`: Expense categories
- `settings`: Workspace settings
- `notes`: Planning notes
- `tasks`: Wedding to-do items
- `vendors`: Wedding vendors
- `guestList`: Wedding guests
- `budgetItems`: Budget planning items

## Service Architecture

The application uses a service-based architecture where all business logic is encapsulated in service classes. This provides a clean separation between data manipulation and UI components.

### Core Services

#### WorkspaceService

Manages workspaces and their members:

- Creating workspaces
- Deleting workspaces and all related data
- Adding/removing members
- Updating member roles
- Retrieving workspace data
- Setting up real-time listeners

#### InvitationService

Manages the invitation workflow:

- Sending invitations
- Accepting invitations
- Declining invitations
- Canceling invitations
- Retrieving invitations

#### MigrationService

Handles migration from the old wedding-based system to the new workspace-based system:

- Checking if migration is needed
- Migrating user data
- Migrating related data
- Completing and verifying migration

## Context Providers

The application uses React Context for state management. Each major feature has its own context provider:

### WorkspaceContext

Provides workspace-related functionality to components:

- Access to the current workspace and list of workspaces
- Methods for creating and deleting workspaces
- Methods for managing workspace members
- Loading state for workspace operations

### InvitationContext

Provides invitation-related functionality:

- Access to invitation data
- Methods for sending, accepting, declining, and canceling invitations
- Loading state for invitation operations

### AuthContext

Manages user authentication:

- User login/signup
- Password reset
- Access to current user data

## Security Rules

Firestore security rules enforce the following permissions:

1. Users can only read/write data for workspaces they are members of
2. Only workspace owners can delete workspaces
3. Only workspace owners can manage member roles
4. Members can only perform actions according to their role

## Migration System

The application includes a migration system to transition users from the old wedding-based data structure to the new workspace-based structure:

1. The system checks if a user needs migration
2. If needed, a migration page guides the user through the process
3. Data is migrated while preserving all relationships
4. After migration, the user is redirected to the main application

## Error Handling

The application implements comprehensive error handling:

1. Service methods catch and log errors
2. Transactions ensure data consistency
3. UI components display appropriate error messages
4. Network errors are handled gracefully

## Real-time Updates

The application uses Firestore's real-time capabilities:

1. Workspaces and their members update in real-time
2. Changes made by one user are immediately visible to others
3. Listeners are properly managed to prevent memory leaks

## Usage Examples

### Using WorkspaceService

```typescript
// Create a new workspace
const workspaceId = await WorkspaceService.createWorkspace({
  ownerId: currentUserId,
  ownerName: "Jane Doe",
  ownerEmail: "jane@example.com",
  coupleNames: "Jane & John",
  weddingDate: new Date("2024-06-15")
});

// Delete a workspace
const success = await WorkspaceService.deleteWorkspace(workspaceId, currentUserId);

// Add a member to a workspace
const memberId = await WorkspaceService.addMember({
  workspaceId: workspaceId,
  ownerId: currentUserId,
  userId: newMemberId,
  displayName: "New Member",
  email: "member@example.com",
  role: "editor"
});

// Set up real-time listeners
const unsubscribe = WorkspaceService.setupWorkspaceListeners(
  currentUserId,
  (workspaces) => {
    console.log("Workspaces updated:", workspaces);
  }
);

// Cleanup listeners when done
unsubscribe();
```

### Using InvitationService

```typescript
// Send an invitation
const result = await InvitationService.sendInvitation({
  email: "friend@example.com",
  workspaceId: workspaceId,
  invitedBy: currentUserId,
  invitedByName: "Jane Doe",
  invitedByEmail: "jane@example.com",
  role: "editor"
});

// Accept an invitation
const acceptResult = await InvitationService.acceptInvitation(
  invitationToken,
  {
    userId: currentUserId,
    displayName: "Jane Doe",
    email: "jane@example.com"
  }
);

// Get invitations for a workspace
const invitations = await InvitationService.getWorkspaceInvitations(
  workspaceId,
  currentUserId
);
```

### Using React Contexts

```tsx
// Using WorkspaceContext
import { useWorkspace } from '@/context/WorkspaceContext';

function MyComponent() {
  const { 
    workspaces, 
    currentWorkspaceId, 
    createWorkspace,
    deleteWorkspace 
  } = useWorkspace();
  
  return (
    <div>
      <h1>My Workspaces ({workspaces.length})</h1>
      {/* Component content */}
    </div>
  );
}

// Using InvitationContext
import { useInvitations } from '@/context/InvitationContext';

function InvitationsComponent() {
  const { 
    invitations, 
    sendInvitation, 
    cancelInvitation 
  } = useInvitations();
  
  return (
    <div>
      <h1>Pending Invitations ({invitations.length})</h1>
      {/* Component content */}
    </div>
  );
}
```

## Best Practices

1. **Always use transactions** for operations that modify multiple documents
2. **Clean up listeners** when components unmount
3. **Handle loading states** in the UI to provide feedback during async operations
4. **Implement proper error handling** for all service calls
5. **Validate user permissions** before performing operations
6. **Use batched writes** for operations that modify many documents
7. **Test thoroughly** after making changes to service classes 