# Frontend Integration Guide - Privy User & Channel Management

This guide explains how to integrate the user_new API with your frontend application for Privy authentication and channel management.

## Overview

The integration follows this flow:
1. **User Login** → Create/update user in database
2. **Channel Discovery** → Find existing channels by email
3. **Channel Connection** → Link channels to Privy account
4. **User State Management** → Keep user info synchronized

---

## 1. User Authentication & Storage

### After Privy Login Success

When Privy authentication completes, immediately create/update the user:

```typescript
// After successful Privy login
const handlePrivyLoginSuccess = async (privyUser: any) => {
  try {
    // 1. Create/update user in database (upsert operation)
    const response = await fetch('/api/v1/user_new', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        privy_data: privyUser // Complete Privy user object
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create user: ${response.statusText}`);
    }

    const userData = await response.json();
    
    // 2. Store user info in your state management
    setUser({
      id: userData.user.id,
      privyId: userData.user.privy_id,
      email: userData.user.email,
      name: userData.user.name,
      wallet: userData.user.primary_wallet,
      isNewUser: userData.is_new_user
    });

    // 3. Proceed to channel discovery
    await discoverAndConnectChannels(userData.user);
    
  } catch (error) {
    console.error('User creation failed:', error);
    // Handle error appropriately
  }
};
```

### User Info Updates

When Privy user data changes (new linked accounts, profile updates):

```typescript
const updateUserInfo = async (updatedPrivyData: any) => {
  try {
    // Option 1: Full upsert (recommended for major changes)
    const response = await fetch('/api/v1/user_new', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ privy_data: updatedPrivyData })
    });

    // Option 2: Partial update (for specific field changes)
    const response = await fetch(`/api/v1/user_new/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: updatedPrivyData.name,
        email: updatedPrivyData.email?.address,
        privy_metadata: updatedPrivyData
      })
    });

    const userData = await response.json();
    setUser(userData.user);
    
  } catch (error) {
    console.error('User update failed:', error);
  }
};
```

---

## 2. Channel Discovery & Connection Flow

### Check for Existing Channels

After user login, discover channels associated with their email:

```typescript
const discoverAndConnectChannels = async (user: UserInfo) => {
  if (!user.email) {
    console.log('No email available for channel discovery');
    return;
  }

  try {
    // 1. Search for channels by email
    const response = await fetch('/api/v1/user_new/search-channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email })
    });

    const channelData = await response.json();
    
    if (channelData.total === 0) {
      // No existing channels found
      console.log('No existing channels found for this email');
      setChannels([]);
      return;
    }

    // 2. Process found channels
    await processFoundChannels(user, channelData.channels);
    
  } catch (error) {
    console.error('Channel discovery failed:', error);
  }
};
```

### Process Found Channels

Analyze channel ownership and handle connections:

```typescript
const processFoundChannels = async (user: UserInfo, channels: ChannelInfo[]) => {
  const connectableChannels = [];
  const conflictChannels = [];
  const alreadyConnected = [];

  for (const channel of channels) {
    const ownership = channel.ownership;
    
    if (ownership.is_privy_user && ownership.privy_id === user.privyId) {
      // Already connected to this Privy account
      alreadyConnected.push(channel);
      
    } else if (ownership.is_clerk_user) {
      // Clerk user channel - can be connected
      connectableChannels.push(channel);
      
    } else if (ownership.is_privy_user && ownership.privy_id !== user.privyId) {
      // Different Privy account owns this - conflict
      conflictChannels.push(channel);
    }
  }

  // Update UI state
  setChannels({
    connected: alreadyConnected,
    connectable: connectableChannels,
    conflicts: conflictChannels
  });

  // Auto-connect Clerk channels (optional)
  if (connectableChannels.length > 0) {
    await showChannelConnectionDialog(user, connectableChannels);
  }
};
```

### Channel Connection Dialog

Present user with connection options:

```typescript
const showChannelConnectionDialog = async (user: UserInfo, channels: ChannelInfo[]) => {
  // Show UI dialog with channel list
  const userChoice = await showDialog({
    title: 'Connect Existing Channels',
    message: `We found ${channels.length} channels associated with your email. Would you like to connect them to your Privy account?`,
    channels: channels,
    options: ['Connect All', 'Select Channels', 'Skip']
  });

  switch (userChoice.action) {
    case 'connect_all':
      await connectMultipleChannels(user.id, channels);
      break;
      
    case 'select_channels':
      await connectMultipleChannels(user.id, userChoice.selectedChannels);
      break;
      
    case 'skip':
      // User chose not to connect now
      break;
  }
};
```

---

## 3. Channel Connection Implementation

### Check Connection Conflicts

Before connecting, verify no conflicts exist:

```typescript
const checkChannelConflict = async (userId: string, channelId: string) => {
  try {
    const response = await fetch(
      `/api/v1/user_new/${userId}/check-channel-conflict?channel_id=${channelId}`,
      { method: 'POST' }
    );

    const conflictInfo = await response.json();
    return conflictInfo;
    
  } catch (error) {
    console.error('Conflict check failed:', error);
    return { conflict_info: { has_conflict: true, can_connect: false } };
  }
};
```

### Connect Single Channel

Connect one channel to the Privy user:

```typescript
const connectChannel = async (userId: string, channelId: string, force = false) => {
  try {
    // 1. Check for conflicts first (unless forcing)
    if (!force) {
      const conflictCheck = await checkChannelConflict(userId, channelId);
      if (!conflictCheck.conflict_info.can_connect) {
        throw new Error(conflictCheck.conflict_info.message);
      }
    }

    // 2. Perform the connection
    const response = await fetch(`/api/v1/user_new/${userId}/connect-channel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel_id: channelId,
        force: force
      })
    });

    if (!response.ok) {
      throw new Error(`Connection failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    // 3. Update local state
    updateConnectedChannels(result.channel);
    
    return result;
    
  } catch (error) {
    console.error('Channel connection failed:', error);
    throw error;
  }
};
```

### Connect Multiple Channels

Batch connect multiple channels:

```typescript
const connectMultipleChannels = async (userId: string, channels: ChannelInfo[]) => {
  const results = {
    successful: [],
    failed: []
  };

  // Show progress indicator
  setConnectionProgress({ total: channels.length, completed: 0 });

  for (const channel of channels) {
    try {
      const result = await connectChannel(userId, channel.id);
      results.successful.push({ channel, result });
      
    } catch (error) {
      results.failed.push({ channel, error: error.message });
    }
    
    // Update progress
    setConnectionProgress(prev => ({ 
      ...prev, 
      completed: prev.completed + 1 
    }));
  }

  // Hide progress and show results
  setConnectionProgress(null);
  showConnectionResults(results);
  
  return results;
};
```

---

## 4. State Management Integration

### User State Structure

Recommended user state structure:

```typescript
interface UserState {
  // Core user info
  id: string;
  privyId: string;
  email?: string;
  name?: string;
  wallet?: string;
  
  // Authentication state
  isAuthenticated: boolean;
  isNewUser: boolean;
  lastLoginAt?: string;
  
  // Channel state
  channels: {
    connected: ChannelInfo[];
    connectable: ChannelInfo[];
    conflicts: ChannelInfo[];
  };
  
  // UI state
  isLoadingChannels: boolean;
  connectionProgress?: {
    total: number;
    completed: number;
  };
}
```

### State Updates

Keep user state synchronized:

```typescript
// On login success
const handleLoginSuccess = (userData: any) => {
  dispatch({
    type: 'SET_USER',
    payload: {
      ...userData.user,
      isAuthenticated: true,
      isNewUser: userData.is_new_user
    }
  });
};

// On channel discovery
const handleChannelsDiscovered = (channelData: any) => {
  dispatch({
    type: 'SET_CHANNELS',
    payload: processChannelsByOwnership(channelData.channels)
  });
};

// On successful channel connection
const handleChannelConnected = (connectionResult: any) => {
  dispatch({
    type: 'CONNECT_CHANNEL',
    payload: connectionResult.channel
  });
};
```

---

## 5. Error Handling

### Common Error Scenarios

```typescript
const handleApiError = (error: any, context: string) => {
  switch (error.status) {
    case 400:
      // Validation errors
      showError(`Invalid data: ${error.detail}`);
      break;
      
    case 404:
      // Resource not found
      if (context === 'user_lookup') {
        // User doesn't exist, this is normal for first login
        return;
      }
      showError(`Resource not found: ${error.detail}`);
      break;
      
    case 409:
      // Conflicts (email/wallet already taken, channel ownership)
      if (context === 'channel_connection') {
        showChannelConflictDialog(error.detail);
      } else {
        showError(`Conflict: ${error.detail}`);
      }
      break;
      
    case 500:
      // Server errors
      showError('Server error occurred. Please try again.');
      break;
      
    default:
      showError('An unexpected error occurred.');
  }
};
```

---

## 6. Complete Integration Example

### React Hook Example

```typescript
const usePrivyUserManagement = () => {
  const [user, setUser] = useState<UserState | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePrivyLogin = async (privyUser: any) => {
    setLoading(true);
    try {
      // Create/update user
      const userData = await createOrUpdateUser(privyUser);
      setUser(userData);
      
      // Discover and connect channels
      await discoverAndConnectChannels(userData.user);
      
    } catch (error) {
      handleApiError(error, 'login');
    } finally {
      setLoading(false);
    }
  };

  const connectChannel = async (channelId: string) => {
    if (!user) return;
    
    try {
      const result = await connectChannelToUser(user.id, channelId);
      // Update local state
      setUser(prev => ({
        ...prev,
        channels: {
          ...prev.channels,
          connected: [...prev.channels.connected, result.channel]
        }
      }));
      
    } catch (error) {
      handleApiError(error, 'channel_connection');
    }
  };

  return {
    user,
    loading,
    handlePrivyLogin,
    connectChannel
  };
};
```

---

## 7. Best Practices

### Performance Optimization
- Cache user data locally to avoid repeated API calls
- Debounce user updates to prevent excessive requests
- Use optimistic updates for better UX

### Security Considerations
- Always validate Privy tokens on the backend
- Never store sensitive data in local storage
- Implement proper error boundaries

### User Experience
- Show loading states during API operations
- Provide clear feedback for connection results
- Allow users to retry failed operations
- Implement offline handling where appropriate

---

## API Endpoints Summary

| Operation | Method | Endpoint | Purpose |
|-----------|--------|----------|---------|
| Create/Update User | POST | `/api/v1/user_new` | Upsert user from Privy data |
| Get User | GET | `/api/v1/user_new/{user_id}` | Retrieve user by ID |
| Search Channels | POST | `/api/v1/user_new/search-channels` | Find channels by email |
| Check Conflicts | POST | `/api/v1/user_new/{user_id}/check-channel-conflict` | Verify connection safety |
| Connect Channel | POST | `/api/v1/user_new/{user_id}/connect-channel` | Link channel to user |

This integration guide provides a complete foundation for implementing Privy user management and channel connection in your frontend application.
