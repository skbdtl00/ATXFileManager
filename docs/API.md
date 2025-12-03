# ATX File Manager API Documentation

Base URL: `http://localhost:3001/api`

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Register

**POST** `/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "username": "johndoe",
  "full_name": "John Doe"
}
```

**Response:**
```json
{
  "message": "Registration successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "role": "user"
  },
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token"
}
```

### Login

**POST** `/auth/login`

Authenticate and receive access tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "role": "user"
  },
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token"
}
```

**Response (2FA Required):**
```json
{
  "message": "Two-factor authentication required",
  "requiresTwoFactor": true,
  "userId": "uuid"
}
```

### Get Profile

**GET** `/auth/profile`

Get authenticated user's profile.

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "full_name": "John Doe",
    "role": "user",
    "storage_quota": 10737418240,
    "storage_used": 1234567,
    "two_factor_enabled": false,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### Two-Factor Authentication

**POST** `/auth/2fa/setup`

Setup two-factor authentication.

**Response:**
```json
{
  "message": "Two-factor setup initiated",
  "secret": "base32-secret",
  "qrCode": "data:image/png;base64,..."
}
```

**POST** `/auth/2fa/enable`

Enable two-factor authentication.

**Request Body:**
```json
{
  "token": "123456"
}
```

**POST** `/auth/2fa/disable`

Disable two-factor authentication.

**POST** `/auth/verify-2fa`

Verify two-factor authentication code.

**Request Body:**
```json
{
  "userId": "uuid",
  "token": "123456"
}
```

**POST** `/auth/change-password`

Change user password.

**Request Body:**
```json
{
  "oldPassword": "currentpassword",
  "newPassword": "newsecurepassword"
}
```

## Files

### Upload File

**POST** `/files/upload`

Upload a new file.

**Request:** `multipart/form-data`
- `file`: File to upload
- `parentId`: (optional) Parent folder ID

**Response:**
```json
{
  "message": "File uploaded successfully",
  "file": {
    "id": "uuid",
    "name": "document.pdf",
    "path": "/users/uuid/document.pdf",
    "type": "file",
    "mime_type": "application/pdf",
    "size": 1234567,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### List Files

**GET** `/files?parentId=<uuid>`

List files in a directory.

**Query Parameters:**
- `parentId`: (optional) Parent folder ID

**Response:**
```json
{
  "files": [
    {
      "id": "uuid",
      "name": "Documents",
      "path": "/users/uuid/Documents",
      "type": "folder",
      "created_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": "uuid",
      "name": "report.pdf",
      "path": "/users/uuid/report.pdf",
      "type": "file",
      "mime_type": "application/pdf",
      "size": 1234567,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Get File

**GET** `/files/:id`

Get file details.

**Response:**
```json
{
  "file": {
    "id": "uuid",
    "name": "document.pdf",
    "path": "/users/uuid/document.pdf",
    "type": "file",
    "mime_type": "application/pdf",
    "size": 1234567,
    "hash_md5": "md5hash",
    "is_starred": false,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### Download File

**GET** `/files/:id/download`

Download a file.

**Response:** File download

### Create Folder

**POST** `/files/folder`

Create a new folder.

**Request Body:**
```json
{
  "name": "New Folder",
  "parentId": "uuid"
}
```

### Rename File

**PATCH** `/files/:id/rename`

Rename a file or folder.

**Request Body:**
```json
{
  "name": "New Name"
}
```

### Delete File

**DELETE** `/files/:id?permanent=false`

Delete a file or folder.

**Query Parameters:**
- `permanent`: (optional) Permanently delete (default: false)

### Move File

**POST** `/files/:id/move`

Move a file or folder.

**Request Body:**
```json
{
  "targetParentId": "uuid"
}
```

### Copy File

**POST** `/files/:id/copy`

Copy a file or folder.

**Request Body:**
```json
{
  "targetParentId": "uuid"
}
```

### Star/Unstar File

**POST** `/files/:id/star`

Toggle star status on a file.

### Search Files

**GET** `/files/search?q=<query>`

Search for files.

**Query Parameters:**
- `q`: Search query

**Response:**
```json
{
  "files": [...]
}
```

### Get Folder Size

**GET** `/files/:id/size`

Calculate folder size recursively.

**Response:**
```json
{
  "size": 1234567890
}
```

### File Tags

**GET** `/files/:id/tags`

Get file tags.

**Response:**
```json
{
  "tags": ["important", "work", "2024"]
}
```

**POST** `/files/:id/tags`

Add a tag to a file.

**Request Body:**
```json
{
  "tag": "important"
}
```

**DELETE** `/files/:id/tags/:tag`

Remove a tag from a file.

## Error Responses

All endpoints may return error responses:

```json
{
  "error": "Error message"
}
```

### Status Codes

- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## Rate Limiting

- Authentication endpoints: 5 requests per 15 minutes
- Upload endpoints: 50 requests per hour
- General API: 100 requests per 15 minutes

Rate limit information is returned in response headers:
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Time when limit resets
