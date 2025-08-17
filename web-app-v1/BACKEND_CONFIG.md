# Backend API Configuration

## Overview
The frontend now makes real API calls to your backend server instead of using mock data.

## Environment Setup

Add this to your `.env.local` file:

```env
# Backend API Configuration
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

**Replace `http://localhost:8000` with your actual backend server URL.**

## API Endpoints

The frontend will make requests to these backend endpoints:

| Frontend Route | Backend Endpoint | Method | Purpose |
|---------------|------------------|--------|---------|
| `/api/v1/user_new` | `{BACKEND_URL}/api/v1/user_new` | POST | Create/update Privy user |
| `/api/v1/user_new/search-channels-by-privy` | `{BACKEND_URL}/api/v1/user_new/search-channels-by-privy` | POST | Search channels by Privy ID |
| `/api/v1/user_new/search-channels` | `{BACKEND_URL}/api/v1/user_new/search-channels` | POST | Search channels by email |
| `/api/v1/user_new/{user_id}/check-channel-conflict` | `{BACKEND_URL}/api/v1/user_new/{user_id}/check-channel-conflict` | POST | Check channel conflicts |
| `/api/v1/user_new/{user_id}/connect-channel` | `{BACKEND_URL}/api/v1/user_new/{user_id}/connect-channel` | POST | Connect channel to user |

## Request Flow

### New Smart Flow (handles all login types):

1. **User Login**: Frontend sends Privy user data to backend
2. **Check Existing Channels**: Frontend first checks if channels are already connected to this Privy ID
3. **Email-based Search**: If no channels found by Privy ID:
   - If user has email → search channels by email
   - If no email → ask user to input email, then search
4. **Channel Selection**: User selects which channels to connect
5. **Conflict Check**: Backend verifies ownership and prevents conflicts
6. **Channel Connection**: Backend migrates channel ownership from Clerk to Privy user

### Login Scenarios Handled:

- **Email Login**: User has email → direct search by email
- **Wallet Login**: No email → ask user to input email for channel search
- **Social Login**: May or may not have email → handle accordingly
- **Returning User**: Already has channels connected → show existing channels

## Error Handling

- **503**: Backend server unavailable
- **500**: Internal server error
- **400**: Validation errors
- **404**: Resource not found

## Testing

To test the API connection:

1. Start your backend server
2. Set `NEXT_PUBLIC_BACKEND_URL` in `.env.local`
3. Restart the Next.js dev server
4. Check browser console for API request logs

## Configuration File

The API configuration is centralized in `src/lib/api-config.ts`:

```typescript
export const API_CONFIG = {
  BACKEND_BASE_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000',
  // ... other config
};
```

## Debugging

All API requests are logged to the console with:
- Request URL
- Request method
- Response status
- Key response data

Check the browser console and server logs for debugging information.
