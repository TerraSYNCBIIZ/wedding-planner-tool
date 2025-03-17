# Wedding Planner Tool

A collaborative financial planning tool for weddings and honeymoons that allows multiple users to work together in real-time.

## Features

- **Multi-user Collaboration**: Work together with your partner, wedding planner, or family members in real-time
- **Financial Planning**: Track expenses, gifts, and budgets for your wedding
- **Contributor Management**: Keep track of who's contributing what
- **Workspace Sharing**: Share your wedding workspace with anyone you choose
- **Real-time Updates**: See changes as they happen across all connected devices
- **Offline Support**: Continue working even when your connection drops, with automatic synchronization when you're back online

## Technical Overview

The application is built with:

- **Next.js 15**: For the frontend and API routes
- **Firebase/Firestore**: For real-time database and authentication
- **TypeScript**: For type safety and better developer experience
- **Tailwind CSS**: For styling

## Collaboration Features

The app includes several advanced features to enable smooth multi-user collaboration:

### Connection Monitoring

The `ConnectionMonitor` class tracks network connectivity and provides:
- Automatic detection of online/offline status
- Periodic ping checks to verify actual connectivity
- Smart reconnection with exponential backoff
- Event system for notifying components of connection changes

### Tab Synchronization

The `TabSync` utility helps coordinate between multiple browser tabs:
- Cross-tab communication using `localStorage`
- Heartbeat mechanism to track active/inactive tabs
- Debounced updates to prevent excessive state changes
- Automatic cleanup when tabs close

### Workspace Context

The `WorkspaceContext` provides a unified interface for:
- Real-time updates from Firestore
- User activity tracking across tabs and devices
- Workspace state management with error recovery
- Automated reconnection after network issues

### UI Components

- **ConnectionStatus**: Visual indicator of connection state
- **TabNavigation**: Synchronized tab navigation across users
- **WorkspaceSynchronizer**: Core component managing collaboration

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/wedding-planner-tool.git
cd wedding-planner-tool
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with your Firebase configuration:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

4. Start the development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

## Collaborative Architecture

The application uses a multi-layered approach to ensure reliable collaboration:

1. **Firebase Realtime Updates**: Core data synchronization
2. **Connection Monitoring**: Network status tracking and recovery
3. **Tab Synchronization**: Cross-tab coordination
4. **Error Boundaries**: Isolated error handling to prevent cascading failures
5. **Debounced Updates**: Prevention of excessive database operations
6. **Local Storage Fallback**: Temporary state maintenance during connectivity issues

## Troubleshooting Collaboration Issues

If you experience issues with real-time collaboration:

1. **Connection Issues**: Check the connection indicator in the top-right. If it shows offline, check your internet connection.
2. **Data Not Syncing**: Try refreshing the page. If the issue persists, check if another user has made conflicting changes.
3. **Inconsistent UI**: If different users see different states, try clicking on a different tab and then back to synchronize views.

## Recent Improvements

We've recently made significant improvements to the collaborative workspace functionality:

- Added robust connection monitoring and recovery
- Implemented tab synchronization for consistent UI state
- Enhanced error handling and recovery
- Optimized Firestore listeners to reduce database operations
- Added visual indicators for connection status
- Improved tab navigation synchronization across users

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributors

- Wesley Pitts - Lead Developer
