[33mcommit bd208a6db269811bf608f99a80f60162ddf6710d[m[33m ([m[1;36mHEAD[m[33m -> [m[1;32mmain[m[33m)[m
Author: Wesley Pitts <wesleypitts@terrasync.biz>
Date:   Mon Mar 17 10:41:29 2025 -0400

    Enhance collaborative workspace functionality with improved multi-user support
    
    - Add ConnectionMonitor for network status tracking and recovery
    
    - Implement TabSync for cross-tab communication and coordination
    
    - Add WorkspaceSynchronizer for browser tab management
    
    - Create ConnectionStatus component for real-time status feedback
    
    - Create TabNavigation component for synchronized tab interfaces
    
    - Improve error handling with error boundaries
    
    - Enhance WorkspaceContext with better reconnection logic
    
    - Add FirestoreListener with debouncing and error recovery
    
    - Update docs with collaborative workspace details
