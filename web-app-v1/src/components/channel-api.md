# Channel API Endpoints

Base URL: `/api/v1/channels`

## Channel Management

### Create Channel
- **Endpoint:** `POST /channels`
- **Purpose:** Create a new channel with automatic default bookmark folder
- **Request Body:** ChannelCreateRequest (name, channel_handle, user_id, description)
- **Response:** ChannelCreateResponse with created channel details
- **Status Codes:** 201 (Created), 400 (Bad Request), 404 (User Not Found), 422 (Validation Error), 500 (Server Error)

### Get Channel
- **Endpoint:** `GET /channels/{channel_id}`
- **Purpose:** Retrieve channel details by ID
- **Path Parameter:** `channel_id` (UUID) - The unique identifier of the channel
- **Response:** ChannelResponse with channel details
- **Status Codes:** 200 (Success), 404 (Channel Not Found), 422 (Validation Error), 500 (Server Error)

### Update Channel
- **Endpoint:** `PUT /channels/{channel_id}`
- **Purpose:** Update existing channel information (partial updates supported)
- **Path Parameter:** `channel_id` (UUID) - The unique identifier of the channel
- **Request Body:** ChannelUpdateRequest (user_id, optional fields: name, channel_handle, description)
- **Response:** ChannelUpdateResponse with updated channel details
- **Status Codes:** 200 (Success), 400 (Bad Request), 404 (Channel Not Found or Access Denied), 422 (Validation Error), 500 (Server Error)

### Delete Channel
- **Endpoint:** `DELETE /channels/{channel_id}`
- **Purpose:** Delete/deactivate a channel (soft delete)
- **Path Parameter:** `channel_id` (UUID) - The unique identifier of the channel
- **Query Parameter:** `user_id` (UUID) - User ID who owns the channel (required)
- **Response:** ChannelDeleteResponse with success status and deleted channel details
- **Status Codes:** 200 (Success), 404 (Channel Not Found or Access Denied), 422 (Validation Error), 500 (Server Error)

## Channel Discovery

### Search Channels
- **Endpoint:** `GET /channels`
- **Purpose:** Search and browse channels with advanced filtering and multiple search modes
- **Query Parameters:**
  - `query` (string, optional) - Search term for fuzzy matching
  - `search_type` (string, optional) - Search algorithm: trgm (recommended), hybrid, vector, bm25
  - `page` (int, default: 1) - Page number for pagination
  - `size` (int, default: 10) - Number of channels per page
  - `user_ids` (array, optional) - Filter by specific user IDs
  - `is_active` (bool, optional) - Filter by channel active status
  - `min_followers` (int, optional) - Minimum follower count filter
  - `min_rep_score` (float, optional) - Minimum reputation score filter
  - `sort_by` (string, optional) - Sort field (created_at, followers_count, rep_score, etc.)
  - `sort_order` (string, optional) - Sort direction (asc, desc)
- **Response:** ChannelSearchResponse with paginated channel list and metadata
- **Status Codes:** 200 (Success), 400 (Bad Request), 422 (Validation Error), 500 (Server Error)
- **Search Modes:**
  - **Search Mode:** Provide `query` for TRGM fuzzy search (finds partial matches)
  - **Browse Mode:** Omit `query` to browse/filter channels by criteria only

## Channel Following

### Follow/Unfollow Channel
- **Endpoint:** `PUT /channels/{channel_id}/follow`
- **Purpose:** Follow, unfollow, mute, or unmute a channel
- **Path Parameter:** `channel_id` (UUID) - Channel ID performing the follow action
- **Request Body:** ChannelFollowRequest (follower_id, followed_id, action)
- **Actions:** follow, unfollow, mute, unmute
- **Response:** ChannelFollowResponse with relationship details
- **Status Codes:** 200 (Success), 400 (Bad Request), 404 (Channel Not Found), 422 (Validation Error), 500 (Server Error)

### Bulk Follow Operations
- **Endpoint:** `POST /channels/follows/bulk`
- **Purpose:** Perform multiple follow/unfollow operations in a single request
- **Request Body:** ChannelFollowsBulkRequest (operations array with follower_id, followed_id, action)
- **Response:** ChannelFollowsBulkResponse with results for each operation
- **Status Codes:** 200 (Success), 400 (Bad Request), 422 (Validation Error), 500 (Server Error)

### Get Follow Status
- **Endpoint:** `GET /channels/{channel_id}/follow-status`
- **Purpose:** Check the follow relationship status between two channels
- **Path Parameter:** `channel_id` (UUID) - Channel ID to check follow status for
- **Query Parameter:** `follower_id` (UUID) - Channel ID of potential follower
- **Response:** ChannelFollowStatusResponse with relationship details
- **Status Codes:** 200 (Success), 404 (Channel Not Found), 422 (Validation Error), 500 (Server Error)

### Get Channel Followers
- **Endpoint:** `GET /channels/{channel_id}/followers`
- **Purpose:** Get paginated list of channels following this channel
- **Path Parameter:** `channel_id` (UUID) - Channel ID to get followers for
- **Query Parameters:**
  - `page` (int, default: 1) - Page number for pagination
  - `size` (int, default: 10) - Number of followers per page
  - `sort_by` (string, optional) - Sort field for followers list
  - `sort_order` (string, optional) - Sort direction (asc, desc)
- **Response:** ChannelFollowersListResponse with paginated followers list
- **Status Codes:** 200 (Success), 400 (Bad Request), 404 (Channel Not Found), 422 (Validation Error), 500 (Server Error)

### Get Channel Following
- **Endpoint:** `GET /channels/{channel_id}/following`
- **Purpose:** Get paginated list of channels that this channel is following
- **Path Parameter:** `channel_id` (UUID) - Channel ID to get following list for
- **Query Parameters:**
  - `page` (int, default: 1) - Page number for pagination
  - `size` (int, default: 10) - Number of following per page
  - `sort_by` (string, optional) - Sort field for following list
  - `sort_order` (string, optional) - Sort direction (asc, desc)
- **Response:** ChannelFollowersListResponse with paginated following list
- **Status Codes:** 200 (Success), 400 (Bad Request), 404 (Channel Not Found), 422 (Validation Error), 500 (Server Error)

## Channel Activity

### Get Channel Post Reactions
- **Endpoint:** `GET /channels/{channel_id}/post-reactions`
- **Purpose:** Get paginated list of posts that this channel has reacted to (liked/disliked)
- **Path Parameter:** `channel_id` (UUID) - Channel ID to get post reactions for
- **Query Parameters:**
  - `reaction_type` (string, optional) - Filter by reaction type (like, dislike)
  - `page` (int, default: 1) - Page number for pagination
  - `size` (int, default: 10) - Number of reactions per page
  - `sort_by` (string, optional) - Sort field for reactions list
  - `sort_order` (string, optional) - Sort direction (asc, desc)
- **Response:** ChannelPostReactionsResponse with paginated post reactions
- **Status Codes:** 200 (Success), 400 (Bad Request), 404 (Channel Not Found), 422 (Validation Error), 500 (Server Error)

## Authentication & Authorization
- All endpoints require proper authentication
- Channel operations require ownership verification (user_id validation)
- Follow operations require valid channel relationships
- Search operations are generally public but may have rate limits

## Error Handling
All endpoints return consistent error responses:
- 400: Bad Request (business logic errors, invalid operations)
- 404: Not Found (channel doesn't exist, access denied)
- 409: Conflict (duplicate channel handle, invalid state transitions)
- 422: Unprocessable Entity (Pydantic validation errors, malformed request data)
- 500: Internal Server Error (unexpected server issues)

## Search Types Explained
- **trgm**: Trigram fuzzy search - best for channel handles and names (recommended)
- **hybrid**: Combines multiple search methods for comprehensive results
- **vector**: Semantic search using AI embeddings (limited effectiveness for channels)
- **bm25**: Keyword search algorithm (limited effectiveness for channels)

## Pagination
All list endpoints support pagination with consistent parameters:
- `page`: Page number (1-based indexing)
- `size`: Items per page (typically 10-100)
- Response includes: `total`, `page`, `size`, `total_pages`
