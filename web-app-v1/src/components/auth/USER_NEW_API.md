# User New API Documentation

This API handles Privy-authenticated users and their channel connection operations.

## Base URL
All endpoints are prefixed with `/api/v1/user_new`

## Endpoints

### User Management

#### Create/Update User (Upsert)
- **POST** `/`
- **Description**: Create or update a Privy user from authentication data
- **Request Body**: `UserNewCreateRequest`
- **Response**: `UserNewCreateResponse`
- **Status Codes**: 200 (success), 400 (validation error), 409 (conflict), 500 (server error)

#### Get User by ID
- **GET** `/{user_id}`
- **Description**: Retrieve Privy user by UUID
- **Parameters**: `user_id` (UUID)
- **Response**: `UserNewResponse`
- **Status Codes**: 200 (success), 404 (not found), 500 (server error)

#### Get User by Privy ID
- **GET** `/privy/{privy_id}`
- **Description**: Retrieve Privy user by Privy DID
- **Parameters**: `privy_id` (string)
- **Response**: `UserNewResponse`
- **Status Codes**: 200 (success), 404 (not found), 500 (server error)

#### Get User by Email
- **GET** `/email/{email}`
- **Description**: Retrieve Privy user by email address
- **Parameters**: `email` (string)
- **Response**: `UserNewResponse`
- **Status Codes**: 200 (success), 404 (not found), 500 (server error)

#### Get User by Wallet
- **GET** `/wallet/{wallet_address}`
- **Description**: Retrieve Privy user by wallet address
- **Parameters**: `wallet_address` (string)
- **Response**: `UserNewResponse`
- **Status Codes**: 200 (success), 404 (not found), 500 (server error)

#### Update User
- **PUT** `/{user_id}`
- **Description**: Update Privy user information
- **Parameters**: `user_id` (UUID)
- **Request Body**: `UserNewUpdateRequest`
- **Response**: `UserNewUpdateResponse`
- **Status Codes**: 200 (success), 400 (validation error), 404 (not found), 409 (conflict), 500 (server error)

#### Delete User
- **DELETE** `/{user_id}`
- **Description**: Delete Privy user
- **Parameters**: `user_id` (UUID)
- **Response**: `UserNewDeleteResponse`
- **Status Codes**: 200 (success), 404 (not found), 500 (server error)

### Channel Operations

#### Search Channels by Email
- **POST** `/search-channels`
- **Description**: Find channels associated with an email address
- **Request Body**: `ChannelSearchRequest`
- **Response**: `ChannelSearchResponse`
- **Status Codes**: 200 (success), 400 (validation error), 500 (server error)

#### Check Channel Ownership Conflict
- **POST** `/{user_id}/check-channel-conflict`
- **Description**: Check for ownership conflicts before connecting a channel
- **Parameters**: `user_id` (UUID), `channel_id` (UUID, query parameter)
- **Response**: `ChannelConflictResponse`
- **Status Codes**: 200 (success), 404 (not found), 500 (server error)

#### Connect Channel to User
- **POST** `/{user_id}/connect-channel`
- **Description**: Connect a channel to a Privy user
- **Parameters**: `user_id` (UUID)
- **Request Body**: `ChannelConnectionRequest`
- **Response**: `ChannelConnectionResponse`
- **Status Codes**: 200 (success), 400 (validation error), 404 (not found), 409 (conflict), 500 (server error)

## Request/Response Schemas

### UserNewCreateRequest
```json
{
  "privy_data": {
    "id": "did:privy:clp123abc...",
    "email": {"address": "user@example.com"},
    "wallet": {"address": "0x..."},
    "linkedAccounts": [...],
    // Complete Privy user object
  }
}
```

### UserNewResponse
```json
{
  "id": "uuid",
  "privy_id": "did:privy:clp123abc...",
  "email": "user@example.com",
  "phone_number": "+1234567890",
  "primary_wallet": "0x...",
  "name": "User Name",
  "image_url": "https://...",
  "is_active": true,
  "email_verified": true,
  "phone_verified": false,
  "login_count": 5,
  "last_login_at": "2025-01-01T00:00:00Z",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

### ChannelSearchResponse
```json
{
  "email": "user@example.com",
  "channels": [
    {
      "id": "channel-uuid",
      "name": "Channel Name",
      "channel_handle": "@handle",
      "description": "Channel description",
      "followers_count": 100,
      "rep_score": 1000,
      "created_at": "2025-01-01T00:00:00Z",
      "ownership": {
        "auth_type": "clerk",
        "user_id": "user-uuid",
        "user_name": "Owner Name",
        "user_email": "owner@example.com",
        "is_clerk_user": true,
        "is_privy_user": false
      }
    }
  ],
  "total": 1,
  "message": "Found 1 channels for email user@example.com"
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "detail": "Error message describing what went wrong"
}
```

Common error scenarios:
- **400**: Validation errors (invalid email format, missing required fields)
- **404**: Resource not found (user, channel)
- **409**: Conflicts (email/wallet already associated with different account)
- **500**: Internal server errors

## Usage Flow

1. **User Login**: POST to `/` with Privy data to create/update user
2. **Channel Discovery**: POST to `/search-channels` with email to find existing channels
3. **Conflict Check**: POST to `/{user_id}/check-channel-conflict` to verify ownership
4. **Channel Connection**: POST to `/{user_id}/connect-channel` to link channel to Privy user
