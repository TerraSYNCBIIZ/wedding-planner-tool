# Wedding Planner Tool Developer Guide

This guide is intended for developers who are maintaining or extending the Wedding Planner Tool application.

## Project Structure

```
wedding-planner-tool/
├── public/               # Static assets
├── src/
│   ├── app/              # Next.js app directory (pages)
│   │   ├── auth/         # Authentication pages
│   │   ├── invitation/   # Invitation handling pages
│   │   ├── migration/    # Migration page
│   │   ├── setup-wizard/ # Initial setup wizard
│   │   └── layout.tsx    # Root layout
│   ├── components/       # React components
│   │   ├── ui/           # UI components (buttons, inputs, etc.)
│   │   └── ...           # Feature-specific components
│   ├── context/          # React context providers
│   │   ├── AuthContext.tsx     # Authentication context
│   │   ├── WorkspaceContext.tsx # Workspace management context
│   │   └── InvitationContext.tsx # Invitation management context
│   ├── lib/              # Utilities and services
│   │   ├── firebase.ts   # Firebase initialization
│   │   ├── utils.ts      # Utility functions
│   │   └── services/     # Service classes
│   │       ├── workspace-service.ts
│   │       ├── invitation-service.ts
│   │       └── migration-service.ts
│   └── middleware.ts     # Next.js middleware
└── ...                   # Config files
```

## Development Workflow

### Setting Up the Development Environment

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env.local` file with Firebase configuration
4. Start the development server: `npm run dev`

### Key Technologies

- **Next.js**: React framework for the frontend
- **Firebase**: Backend services (authentication, database, storage)
- **Firestore**: NoSQL database
- **React Context**: State management
- **TypeScript**: Type checking

## Service Layer

All business logic is encapsulated in service classes located in `src/lib/services/`.

### Extending Services

When adding functionality to a service:

1. Define proper TypeScript interfaces for input/output
2. Use transactions for operations that modify multiple documents
3. Implement proper error handling
4. Update the corresponding context provider

Example:

```typescript
// Adding a new method to WorkspaceService
static async updateWorkspaceSettings(
  workspaceId: string, 
  userId: string, 
  settings: WorkspaceSettings
): Promise<boolean> {
  try {
    // Verify permissions
    // Update data
    // Return success
  } catch (error) {
    console.error('Error updating workspace settings:', error);
    return false;
  }
}
```

## Context Providers

Context providers are the bridge between services and UI components. They:

1. Manage state related to their domain
2. Provide methods to interact with services
3. Handle loading and error states

### Extending Context Providers

When adding functionality to a context provider:

1. Update the context type interface
2. Implement methods using the service layer
3. Add appropriate state management
4. Provide loading and error handling

Example:

```typescript
// Adding a method to WorkspaceContext
const updateSettings = useCallback(async (settings: WorkspaceSettings): Promise<boolean> => {
  if (!user || !currentWorkspaceId) {
    return false;
  }
  
  try {
    setIsLoading(true);
    return await WorkspaceService.updateWorkspaceSettings(
      currentWorkspaceId,
      user.uid,
      settings
    );
  } catch (error) {
    console.error('Error updating settings:', error);
    return false;
  } finally {
    setIsLoading(false);
  }
}, [user, currentWorkspaceId]);
```

## UI Components

UI components should:

1. Use context providers to access data and functionality
2. Handle loading states gracefully
3. Display appropriate error messages
4. Implement proper cleanup when unmounting

### Role-Based UI Elements

UI elements should respect user roles:

```tsx
function ActionButton() {
  const { currentWorkspaceId, workspaces } = useWorkspace();
  const workspace = workspaces.find(w => w.id === currentWorkspaceId);
  
  // Only show delete button for owners
  if (workspace?.isOwner) {
    return <Button onClick={handleDelete}>Delete Workspace</Button>;
  }
  
  return null;
}
```

## Common Fixes for Issues

### Workspace Management Issues

#### Problem: Workspace not updating in real-time
**Solution**: Ensure that listeners are set up correctly and cleanup functions are called on component unmount.

```tsx
useEffect(() => {
  if (!user) return;
  
  const unsubscribe = WorkspaceService.setupWorkspaceListeners(
    user.uid,
    setWorkspaces
  );
  
  return () => unsubscribe();
}, [user]);
```

#### Problem: Permissions issues
**Solution**: Verify that all service methods check user permissions before performing operations.

### Migration Issues

#### Problem: Migration failing
**Solution**: Check browser console for errors and verify that the MigrationService is handling all edge cases.

#### Problem: Data inconsistency after migration
**Solution**: Use the `runFullMigration` method which ensures all related data is migrated properly.

### Invitation Issues

#### Problem: Invitations not showing up
**Solution**: Verify that the sender has permissions to send invitations and that the email address is valid.

#### Problem: Unable to accept invitation
**Solution**: Check that the invitation token is valid and not expired.

## Performance Optimization

### Firestore Query Optimization

1. **Create Indexes**: For complex queries, create composite indexes in the Firebase console
2. **Limit Query Size**: Use pagination for large collections
3. **Denormalize Data**: Store frequently accessed data together to reduce the number of queries

### React Performance

1. **Memoize Components**: Use `React.memo` for components that render frequently
2. **useCallback and useMemo**: Memoize functions and computed values
3. **Virtualization**: Use virtualization for long lists

## Testing

### Unit Testing Services

Services should be tested in isolation:

```typescript
describe('WorkspaceService', () => {
  it('should create a workspace', async () => {
    // Mock Firestore methods
    // Call the service method
    // Assert the results
  });
});
```

### Integration Testing

Test the interaction between services and context providers:

```typescript
describe('WorkspaceContext', () => {
  it('should provide workspaces', async () => {
    // Render a component with the context provider
    // Assert that workspaces are provided
  });
});
```

## Deployment

### Staging Deployment

1. Create a staging Firebase project
2. Configure GitHub actions to deploy to staging on PR
3. Perform testing on staging environment

### Production Deployment

1. Merge to main branch
2. GitHub actions will deploy to production
3. Verify the deployment

## Troubleshooting

### Firebase Connection Issues

1. Check Firebase console for service disruptions
2. Verify that Firebase configuration is correct
3. Check that security rules are not blocking access

### Database Structure Issues

1. Use Firebase console to inspect database structure
2. Verify that migrations have completed successfully
3. Check for missing fields or incorrect types

### UI Rendering Issues

1. Check React DevTools for component state
2. Verify that context providers are properly nested
3. Check for React key warnings in the console

## Adding New Features

When adding new features:

1. Start by updating or creating service classes
2. Update or create context providers
3. Create or update UI components
4. Add proper documentation
5. Write tests

## Security Considerations

1. **Always validate user permissions** before performing operations
2. **Never trust client-side data** without validation
3. **Implement proper Firestore security rules**
4. **Use transactions** to maintain data consistency
5. **Sanitize user input** to prevent injection attacks 