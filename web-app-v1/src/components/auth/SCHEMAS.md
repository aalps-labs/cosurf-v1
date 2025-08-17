# User New API - Request & Response Schemas

This document provides detailed specifications for all request and response schemas used in the Privy User Management API.

## Table of Contents

- [User New API - Request \& Response Schemas](#user-new-api---request--response-schemas)
  - [Table of Contents](#table-of-contents)
  - [Request Schemas](#request-schemas)
    - [UserNewCreateRequest](#usernewcreaterequest)
    - [UserNewUpdateRequest](#usernewupdaterequest)
    - [ChannelSearchRequest](#channelsearchrequest)
    - [ChannelConnectionRequest](#channelconnectionrequest)
  - [Response Schemas](#response-schemas)
    - [UserNewResponse](#usernewresponse)
    - [UserNewCreateResponse](#usernewcreateresponse)
    - [UserNewUpdateResponse](#usernewupdateresponse)
    - [UserNewDeleteResponse](#usernewdeleteresponse)
    - [ChannelSearchResponse](#channelsearchresponse)
    - [ChannelConflictResponse](#channelconflictresponse)
    - [ChannelConnectionResponse](#channelconnectionresponse)
  - [Nested Schemas](#nested-schemas)
    - [ChannelSearchResult](#channelsearchresult)
    - [ChannelOwnershipInfo](#channelownershipinfo)
    - [OwnerInfo](#ownerinfo)
    - [ConflictInfo](#conflictinfo)
  - [Common Validation Rules](#common-validation-rules)
    - [UUID Format](#uuid-format)
    - [Privy DID Format](#privy-did-format)
    - [Email Format](#email-format)
    - [Wallet Address Format](#wallet-address-format)
    - [Timestamp Format](#timestamp-format)
  - [Error Response Format](#error-response-format)

---

## Request Schemas

### UserNewCreateRequest

**Purpose**: Create or update a Privy user from authentication data (upsert operation)

```json
{
  "privy_data": {
    "id": "did:privy:clp123abc456def789ghi012jkl345mno678pqr901stu234vwx567yz",
    "email": {
      "address": "user@example.com"
    },
    "wallet": {
      "address": "0x742d35Cc6634C0532925a3b8D4C9db96590c4Ac5"
    },
    "google": {
      "name": "John Doe",
      "email": "user@example.com"
    },
    "linkedAccounts": [
      {
        "type": "google_oauth",
        "subject": "google-oauth2|123456789"
      }
    ],
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Field Descriptions**:
- `privy_data` (required): Complete Privy user object from authentication
  - `id` (required): Privy DID (Decentralized Identifier)
  - `email` (optional): Email authentication object
  - `wallet` (optional): Wallet authentication object
  - `google` (optional): Google OAuth profile information
  - `linkedAccounts` (optional): Array of linked authentication methods
  - Additional Privy fields are preserved in `privy_metadata`

**Validation Rules**:
- `privy_data.id` must be a valid Privy DID format
- Email address must be valid format if provided
- Wallet address must be valid Ethereum address format if provided

---

### UserNewUpdateRequest

**Purpose**: Update specific fields of an existing Privy user

```json
{
  "email": "newemail@example.com",
  "phone_number": "+1234567890",
  "name": "Updated Name",
  "image_url": "https://example.com/avatar.jpg",
  "is_active": true
}
```

**Field Descriptions**:
- `email` (optional): New email address
- `phone_number` (optional): New phone number
- `primary_wallet` (optional): New primary wallet address
- `name` (optional): Updated display name
- `image_url` (optional): Profile image URL
- `is_active` (optional): Account active status
- `email_verified` (optional): Email verification status
- `phone_verified` (optional): Phone verification status

**Validation Rules**:
- Email must be unique across all Privy users
- Phone number must be in international format
- Wallet address must be valid Ethereum format
- Image URL must be valid HTTP/HTTPS URL
- At least one field must be provided for update

**Non-Editable Fields**:
- `id`, `privy_id`, `created_at`, `updated_at`, `login_count`, `last_login_at`

---

### ChannelSearchRequest

**Purpose**: Search for channels by email and/or Privy ID with flexible criteria

```json
{
  "email": "user@example.com",
  "privy_id": "did:privy:clp123abc456def789ghi012jkl345mno678pqr901stu234vwx567yz"
}
```

**Search Patterns**:

**Email Only**:
```json
{
  "email": "user@example.com"
}
```

**Privy ID Only**:
```json
{
  "privy_id": "did:privy:clp123abc456def789ghi012jkl345mno678pqr901stu234vwx567yz"
}
```

**Combined Search** (finds channels matching either criteria):
```json
{
  "email": "user@example.com",
  "privy_id": "did:privy:clp123abc456def789ghi012jkl345mno678pqr901stu234vwx567yz"
}
```

**Field Descriptions**:
- `email` (optional): Email address to search for
- `privy_id` (optional): Privy DID to search for

**Validation Rules**:
- At least one of `email` or `privy_id` must be provided
- Email must be valid format if provided
- Privy ID must be valid DID format if provided
- Both fields can be provided for comprehensive search

---

### ChannelConnectionRequest

**Purpose**: Connect a channel to a Privy user account

```json
{
  "channel_id": "550e8400-e29b-41d4-a716-446655440000",
  "force": false
}
```

**Field Descriptions**:
- `channel_id` (required): UUID of the channel to connect
- `force` (optional, default: false): Force connection even if conflicts exist

**Validation Rules**:
- `channel_id` must be a valid UUID format
- Channel must exist in the database
- Force flag allows overriding ownership conflicts

---

## Response Schemas

### UserNewResponse

**Purpose**: Standard user information response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "privy_id": "did:privy:clp123abc456def789ghi012jkl345mno678pqr901stu234vwx567yz",
  "email": "user@example.com",
  "phone_number": "+1234567890",
  "primary_wallet": "0x742d35Cc6634C0532925a3b8D4C9db96590c4Ac5",
  "name": "John Doe",
  "image_url": "https://example.com/avatar.jpg",
  "is_active": true,
  "email_verified": true,
  "phone_verified": false,
  "login_count": 15,
  "last_login_at": "2025-01-01T12:30:45.123Z",
  "created_at": "2024-12-01T10:15:30.456Z",
  "updated_at": "2025-01-01T12:30:45.123Z"
}
```

**Field Descriptions**:
- `id`: System-generated UUID for the user
- `privy_id`: Privy DID (unique identifier from Privy)
- `email`: Primary email address
- `phone_number`: Phone number in international format
- `primary_wallet`: Primary Ethereum wallet address
- `name`: Display name
- `image_url`: Profile image URL
- `is_active`: Account active status
- `email_verified`: Email verification status
- `phone_verified`: Phone verification status
- `login_count`: Total number of logins
- `last_login_at`: Timestamp of last login
- `created_at`: Account creation timestamp
- `updated_at`: Last modification timestamp

---

### UserNewCreateResponse

**Purpose**: Response after creating/updating a user

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "privy_id": "did:privy:clp123abc456def789ghi012jkl345mno678pqr901stu234vwx567yz",
    "email": "user@example.com",
    "name": "John Doe",
    "is_active": true,
    "login_count": 1,
    "created_at": "2025-01-01T12:30:45.123Z"
  },
  "message": "User created successfully"
}
```

**Field Descriptions**:
- `user`: Complete user object (UserNewResponse format)
- `message`: Success message describing the operation

---

### UserNewUpdateResponse

**Purpose**: Response after updating user information

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "newemail@example.com",
    "name": "Updated Name",
    "updated_at": "2025-01-01T12:35:20.789Z"
  },
  "message": "User updated successfully"
}
```

**Field Descriptions**:
- `user`: Updated user object (UserNewResponse format)
- `message`: Success message describing the operation

---

### UserNewDeleteResponse

**Purpose**: Response after deleting a user

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "privy_id": "did:privy:clp123abc456def789ghi012jkl345mno678pqr901stu234vwx567yz",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "message": "User deleted successfully"
}
```

**Field Descriptions**:
- `user`: Copy of the deleted user object
- `message`: Success message confirming deletion

---

### ChannelSearchResponse

**Purpose**: Results from channel search operations

```json
{
  "email": "user@example.com",
  "channels": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Tech Insights",
      "channel_handle": "@techinsights",
      "description": "Latest technology trends and insights",
      "followers_count": 1250,
      "rep_score": 8500,
      "created_at": "2024-11-15T09:20:30.456Z",
      "ownership": {
        "auth_type": "clerk",
        "user_id": "550e8400-e29b-41d4-a716-446655440002",
        "user_name": "John Doe",
        "user_email": "user@example.com",
        "privy_id": null,
        "is_clerk_user": true,
        "is_privy_user": false
      }
    }
  ],
  "total": 1,
  "message": "Found 1 channels for email user@example.com"
}
```

**Field Descriptions**:
- `email`: Search criteria used (for backward compatibility)
- `channels`: Array of channel results (ChannelSearchResult format)
- `total`: Total number of channels found
- `message`: Descriptive message about search results

---

### ChannelConflictResponse

**Purpose**: Information about channel ownership conflicts

```json
{
  "has_conflict": true,
  "conflict_type": "different_privy_user",
  "channel_info": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Tech Insights",
    "channel_handle": "@techinsights"
  },
  "current_owner": {
    "auth_type": "privy",
    "user_id": "550e8400-e29b-41d4-a716-446655440003",
    "email": "other@example.com",
    "name": "Other User",
    "privy_id": "did:privy:clp987zyx654wvu321tsr098qpo765nml432kji109hgf876edc543ba"
  },
  "can_connect": false,
  "message": "Channel is already owned by a different Privy account"
}
```

**Field Descriptions**:
- `has_conflict`: Boolean indicating if conflict exists
- `conflict_type`: Type of conflict ("clerk_owned", "different_privy_user", "same_privy_user", "no_owner")
- `channel_info`: Basic channel information
- `current_owner`: Current owner information (OwnerInfo format)
- `can_connect`: Whether connection is allowed
- `message`: Human-readable conflict description

---

### ChannelConnectionResponse

**Purpose**: Result of channel connection operation

```json
{
  "success": true,
  "channel": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Tech Insights",
    "channel_handle": "@techinsights"
  },
  "new_owner": {
    "auth_type": "privy",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "privy_id": "did:privy:clp123abc456def789ghi012jkl345mno678pqr901stu234vwx567yz"
  },
  "previous_owner": {
    "auth_type": "clerk",
    "user_id": "550e8400-e29b-41d4-a716-446655440002",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "message": "Channel successfully connected to Privy account"
}
```

**Field Descriptions**:
- `success`: Boolean indicating operation success
- `channel`: Connected channel information
- `new_owner`: New owner information (OwnerInfo format)
- `previous_owner`: Previous owner information (OwnerInfo format, null if no previous owner)
- `message`: Success message describing the operation

---

## Nested Schemas

### ChannelSearchResult

**Purpose**: Individual channel result in search responses

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Tech Insights",
  "channel_handle": "@techinsights",
  "description": "Latest technology trends and insights",
  "followers_count": 1250,
  "rep_score": 8500,
  "created_at": "2024-11-15T09:20:30.456Z",
  "ownership": {
    "auth_type": "privy",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "user_name": "John Doe",
    "user_email": "user@example.com",
    "privy_id": "did:privy:clp123abc456def789ghi012jkl345mno678pqr901stu234vwx567yz",
    "is_clerk_user": false,
    "is_privy_user": true
  }
}
```

---

### ChannelOwnershipInfo

**Purpose**: Ownership details for channels

```json
{
  "auth_type": "privy",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_name": "John Doe",
  "user_email": "user@example.com",
  "privy_id": "did:privy:clp123abc456def789ghi012jkl345mno678pqr901stu234vwx567yz",
  "is_clerk_user": false,
  "is_privy_user": true
}
```

**Auth Types**:
- `"clerk"`: Owned by Clerk user (not linked to Privy)
- `"clerk_linked"`: Owned by Clerk user linked to Privy account
- `"privy"`: Owned by Privy user

---

### OwnerInfo

**Purpose**: User information in ownership contexts

```json
{
  "auth_type": "privy",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "John Doe",
  "privy_id": "did:privy:clp123abc456def789ghi012jkl345mno678pqr901stu234vwx567yz"
}
```

---

### ConflictInfo

**Purpose**: Detailed conflict information (extends OwnerInfo)

```json
{
  "auth_type": "different_privy_user",
  "user_id": "550e8400-e29b-41d4-a716-446655440003",
  "email": "other@example.com",
  "name": "Other User",
  "privy_id": "did:privy:clp987zyx654wvu321tsr098qpo765nml432kji109hgf876edc543ba"
}
```

---

## Common Validation Rules

### UUID Format
All UUID fields must follow the standard UUID v4 format:
```
550e8400-e29b-41d4-a716-446655440000
```

### Privy DID Format
Privy DIDs follow the format:
```
did:privy:clp[64-character-string]
```

### Email Format
Standard email validation with domain verification:
```
user@example.com
```

### Wallet Address Format
Ethereum wallet addresses (42 characters, starts with 0x):
```
0x742d35Cc6634C0532925a3b8D4C9db96590c4Ac5
```

### Timestamp Format
ISO 8601 format with timezone:
```
2025-01-01T12:30:45.123Z
```

---

## Error Response Format

All endpoints return errors in this consistent format:

```json
{
  "detail": "Descriptive error message explaining what went wrong"
}
```

**Common HTTP Status Codes**:
- `400`: Bad Request (validation errors, invalid input)
- `404`: Not Found (user, channel not found)
- `409`: Conflict (email/wallet already taken, ownership conflicts)
- `500`: Internal Server Error (database errors, unexpected failures)
