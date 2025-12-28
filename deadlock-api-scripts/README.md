# Deadlock API Scripts

This folder contains Rust scripts for interacting with the [Deadlock API](https://api.deadlock-api.com).

## Script Structure

Each script corresponds to a separate API endpoint and follows a unified structure:

### 1. Script Name

Format: `{script_name}.rs: {API endpoint name from documentation}`

Example: `batch_steam_profile.rs: Batch Steam Profile`

### 2. API Documentation Reference

- Brief description from the official API documentation
- Link to the specific endpoint section in the documentation

Example:

```rust
// This endpoint returns Steam profiles of players.
// Documentation: https://api.deadlock-api.com/docs#tag/players/GET/v1/players/steam
```

### 3. Script Purpose

Description of the script's role in the application logic:

#### Business Logic (non-technical)

- What the script does from a user/application perspective

#### Technical Details

- Specific data points retrieved with field names and types

#### Output Format

- Display script name at the beginning
- Show retrieved data fields based on technical details (each field on a new line)
- For multiple records (lists): display in blocks, separated visually

Example:

```
Business Logic:
- Get Steam profile information for players

Technical Details:
- Retrieve full avatar URL (`avatarfull`: String)
- Retrieve Steam profile URL (`profileurl`: String)
- Retrieve last update date (`last_updated`: String)

Output Format:
- Script name: "Batch Steam Profile"
- For each profile (multiple records):
  - avatarfull
  - profileurl
  - last_updated
  - (visual separator between blocks)
```

### 4. Endpoint Constants

- `BASE_URL` - API base URL (`https://api.deadlock-api.com`)
- `ENDPOINT` - path to the specific endpoint

### 5. Input Data

Depending on the endpoint, the script accepts:

#### Single ID (Path Parameter)

```rust
const ACCOUNT_ID: i32 = 123456;
```

#### Multiple IDs (Query Parameter)

```rust
const ACCOUNT_IDS: &[i32] = &[123456, 789012, 345678];
```

### 6. Response Structure

API response is mapped to Rust structs using `serde` for deserialization.

Example:

```rust
#[derive(Debug, Serialize, Deserialize)]
struct SteamProfile {
    account_id: i32,
    avatar: String,
    // ... other fields
}
```

## Error Codes

- **200** - Successful request
- **400** - Invalid parameters
- **404** - Data not found
- **429** - Rate limit exceeded
- **500** - Internal server error

## Other Links

- [GitHub Repository](https://github.com/deadlock-api/deadlock-api-rust)
- [OpenAPI Clients](https://github.com/deadlock-api/openapi-clients)
