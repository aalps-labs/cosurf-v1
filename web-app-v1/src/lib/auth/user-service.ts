// Database operations for user linking - isolated module
// This won't interfere with other database operations

// Use the actual Privy User type from server-auth
interface PrivyUser {
  id: string;
  email?: { address: string };
  wallet?: { address: string };
  linkedAccounts?: any[];
  createdAt?: Date;
  [key: string]: any; // Allow additional properties from Privy
}

interface LinkResult {
  success: boolean;
  linked: boolean;
  user?: any;
  message: string;
  error?: string;
}

export async function linkPrivyUser(privyUser: PrivyUser): Promise<LinkResult> {
  const email = privyUser.email?.address;
  const privyId = privyUser.id;
  const walletAddress = privyUser.wallet?.address;

  try {
    // For hackathon: Simple mock implementation
    // Replace with your actual database calls
    
    // Strategy 1: Try to link by email (most common case)
    if (email) {
      // Mock: Check if email exists in users table
      const existingUser = await mockFindUserByEmail(email);
      
      if (existingUser) {
        // Mock: Update existing user with privy_id
        await mockUpdateUser(existingUser.id, {
          privy_id: privyId,
          wallet_address: walletAddress
        });

        return {
          success: true,
          linked: true,
          user: existingUser,
          message: `Welcome back! Found ${existingUser.channels?.length || 0} existing channels.`
        };
      }
    }

    // Strategy 2: Try to link by wallet (if no email match)
    if (walletAddress && !email) {
      const existingUser = await mockFindUserByWallet(walletAddress);
      
      if (existingUser) {
        await mockUpdateUser(existingUser.id, { privy_id: privyId });

        return {
          success: true,
          linked: true,
          user: existingUser,
          message: `Wallet linked! Found ${existingUser.channels?.length || 0} existing channels.`
        };
      }
    }

    // Strategy 3: Create new user in user_new table
    const newUser = await mockCreateNewUser({
      privy_id: privyId,
      email: email,
      primary_wallet: walletAddress,
      name: privyUser.name || email?.split('@')[0] || 'User',
      image_url: privyUser.image_url,
      privy_metadata: privyUser,
      is_active: true,
      email_verified: !!email, // Assume email is verified if provided by Privy
      login_count: 1,
      last_login_at: new Date()
    });

    return {
      success: true,
      linked: false,
      user: newUser,
      message: 'New account created! Start building your channels.'
    };

  } catch (error) {
    console.error('User linking error:', error);
    return {
      success: false,
      linked: false,
      error: 'Failed to link user account',
      message: 'Connection error. Please try again.'
    };
  }
}

export async function getUserByPrivyId(privyId: string) {
  try {
    // Mock: Check both tables for user
    const clerkUser = await mockFindUserByPrivyId(privyId, 'clerk');
    if (clerkUser) return { user: clerkUser, type: 'clerk' };

    const privyUser = await mockFindUserByPrivyId(privyId, 'privy');
    if (privyUser) return { user: privyUser, type: 'privy' };

    return null;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

export function clearUserData() {
  try {
    console.log('🧹 Clearing all user and channel data from localStorage...');
    
    // Clear specific channel data
    const channelKeys = [
      'connected_channels',
      'channel_connection_timestamp'
    ];
    
    channelKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`🗑️ Cleared localStorage: ${key}`);
      }
    });
    
    // Clear all Privy-prefixed items
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('privy:') || key.startsWith('privy_')) {
        localStorage.removeItem(key);
        console.log(`🗑️ Cleared Privy localStorage: ${key}`);
      }
    });
    
    console.log('✅ All user data cleared from localStorage');
  } catch (error) {
    console.warn('Failed to clear localStorage:', error);
  }
}

// Mock database functions - replace with your actual DB calls
async function mockFindUserByEmail(email: string): Promise<any> {
  // TODO: Replace with actual database query
  // return await db.user.findUnique({ where: { email }, include: { channels: true } });
  
  // Mock response for demo
  if (email.includes('existing')) {
    return {
      id: 'mock-user-1',
      email: email,
      name: 'Existing User',
      channels: [{ id: 'channel-1', name: 'My Channel' }]
    };
  }
  return null;
}

async function mockFindUserByWallet(walletAddress: string): Promise<any> {
  // TODO: Replace with actual database query
  // return await db.user.findUnique({ where: { wallet_address: walletAddress }, include: { channels: true } });
  return null;
}

async function mockFindUserByPrivyId(privyId: string, table: 'clerk' | 'privy'): Promise<any> {
  // TODO: Replace with actual database queries
  // if (table === 'clerk') {
  //   return await db.user.findUnique({ where: { privy_id: privyId }, include: { channels: true } });
  // } else {
  //   return await db.userNew.findUnique({ where: { privy_id: privyId }, include: { channels: true } });
  // }
  return null;
}

async function mockUpdateUser(userId: string, data: any): Promise<any> {
  // TODO: Replace with actual database update
  // return await db.user.update({ where: { id: userId }, data });
  console.log('Mock: Updating user', userId, 'with data', data);
  return { success: true };
}

async function mockCreateNewUser(userData: any): Promise<any> {
  // TODO: Replace with actual database create
  // return await db.userNew.create({ data: userData });
  
  // Mock response for demo
  return {
    id: 'mock-new-user-' + Date.now(),
    ...userData,
    channels: []
  };
}
