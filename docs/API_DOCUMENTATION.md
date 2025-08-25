# PawnBroker Pro API Documentation

## Overview

The PawnBroker Pro API is a comprehensive REST API for managing pawn shop operations, market data analysis, and user authentication. This API provides secure endpoints for item management, market research, and user account operations.

## Base URL

- **Development**: `http://localhost:5000`
- **Production**: `https://yourdomain.com`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Authentication Flow

1. **Register/Login**: Get JWT token
2. **Use Token**: Include in subsequent requests
3. **Refresh Token**: Use refresh endpoint when token expires
4. **Logout**: Invalidate token

## Error Handling

All API responses follow a consistent error format:

```json
{
  "error": "Error message",
  "code": 4001,
  "details": "Additional error details",
  "timestamp": "2024-12-19T10:30:00Z"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `429` - Rate Limited
- `500` - Internal Server Error

## Rate Limiting

- **General API**: 100 requests per 15 minutes
- **Image Processing**: 5 requests per 15 minutes
- **Authentication**: 10 requests per 15 minutes

## Endpoints

### Authentication

#### POST /api/auth/register

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "businessName": "John's Pawn Shop",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "businessName": "John's Pawn Shop",
    "role": "user",
    "isActive": true
  }
}
```

#### POST /api/auth/login

Authenticate user and get JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  }
}
```

#### POST /api/auth/refresh

Refresh JWT token.

**Headers:**
```
Authorization: Bearer <current-token>
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST /api/auth/logout

Logout and invalidate token.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### GET /api/auth/me

Get current user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "businessName": "John's Pawn Shop",
    "role": "user",
    "settings": {
      "pawnPercentage": 30,
      "maxSearchResults": 20,
      "enableNotifications": true,
      "theme": "dark",
      "currency": "USD"
    }
  }
}
```

### Items Management

#### GET /api/items

Get all items for the authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `status` (string): Filter by status (active, sold, expired, returned)
- `category` (string): Filter by category
- `search` (string): Search in item name and description

**Response:**
```json
{
  "success": true,
  "items": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "iPhone 13 Pro",
      "description": "Excellent condition iPhone 13 Pro",
      "category": "Electronics",
      "condition": "Excellent",
      "estimatedValue": 800,
      "pawnAmount": 240,
      "status": "active",
      "imageUrl": "https://example.com/image.jpg",
      "createdAt": "2024-12-19T10:30:00Z",
      "updatedAt": "2024-12-19T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

#### POST /api/items

Create a new item.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "iPhone 13 Pro",
  "description": "Excellent condition iPhone 13 Pro",
  "category": "Electronics",
  "condition": "Excellent",
  "estimatedValue": 800,
  "notes": "Customer wants to pawn for 30 days"
}
```

**Response:**
```json
{
  "success": true,
  "item": {
    "id": "507f1f77bcf86cd799439011",
    "name": "iPhone 13 Pro",
    "description": "Excellent condition iPhone 13 Pro",
    "category": "Electronics",
    "condition": "Excellent",
    "estimatedValue": 800,
    "pawnAmount": 240,
    "status": "active",
    "createdAt": "2024-12-19T10:30:00Z"
  }
}
```

#### GET /api/items/:id

Get a specific item by ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "item": {
    "id": "507f1f77bcf86cd799439011",
    "name": "iPhone 13 Pro",
    "description": "Excellent condition iPhone 13 Pro",
    "category": "Electronics",
    "condition": "Excellent",
    "estimatedValue": 800,
    "pawnAmount": 240,
    "status": "active",
    "imageUrl": "https://example.com/image.jpg",
    "createdAt": "2024-12-19T10:30:00Z",
    "updatedAt": "2024-12-19T10:30:00Z"
  }
}
```

#### PUT /api/items/:id

Update an item.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "iPhone 13 Pro Max",
  "estimatedValue": 900,
  "status": "sold"
}
```

**Response:**
```json
{
  "success": true,
  "item": {
    "id": "507f1f77bcf86cd799439011",
    "name": "iPhone 13 Pro Max",
    "estimatedValue": 900,
    "status": "sold",
    "updatedAt": "2024-12-19T10:30:00Z"
  }
}
```

#### DELETE /api/items/:id

Delete an item.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Item deleted successfully"
}
```

### Market Data

#### GET /api/market/search

Search for market data on items.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `query` (string, required): Search query
- `category` (string): Filter by category
- `condition` (string): Filter by condition
- `limit` (number): Number of results (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "source": "eBay",
      "title": "iPhone 13 Pro 128GB",
      "price": 750,
      "condition": "Used - Excellent",
      "url": "https://ebay.com/item/123",
      "imageUrl": "https://example.com/image.jpg",
      "location": "New York, NY",
      "soldDate": "2024-12-15T10:30:00Z"
    }
  ],
  "summary": {
    "averagePrice": 750,
    "priceRange": {
      "min": 650,
      "max": 850
    },
    "totalResults": 15
  }
}
```

#### POST /api/market/estimate

Get market value estimation for an item.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "iPhone 13 Pro",
  "category": "Electronics",
  "condition": "Excellent",
  "description": "128GB, Space Gray, Excellent condition"
}
```

**Response:**
```json
{
  "success": true,
  "estimation": {
    "itemName": "iPhone 13 Pro",
    "estimatedValue": 750,
    "confidence": 0.85,
    "priceRange": {
      "low": 650,
      "high": 850
    },
    "dataPoints": 15,
    "sources": ["eBay", "Amazon", "Local Market"],
    "lastUpdated": "2024-12-19T10:30:00Z"
  }
}
```

### Image Management

#### POST /api/images/upload

Upload an image for an item.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `image` (file): Image file (JPEG, PNG, max 10MB)
- `itemId` (string): Associated item ID

**Response:**
```json
{
  "success": true,
  "image": {
    "id": "507f1f77bcf86cd799439011",
    "url": "https://example.com/uploads/image.jpg",
    "filename": "image_123.jpg",
    "size": 2048576,
    "mimeType": "image/jpeg",
    "uploadedAt": "2024-12-19T10:30:00Z"
  }
}
```

#### DELETE /api/images/:id

Delete an image.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

### User Management

#### GET /api/users/profile

Get user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "businessName": "John's Pawn Shop",
    "phone": "+1234567890",
    "role": "user",
    "settings": {
      "pawnPercentage": 30,
      "maxSearchResults": 20,
      "enableNotifications": true,
      "theme": "dark",
      "currency": "USD"
    },
    "stats": {
      "totalItems": 25,
      "activeItems": 15,
      "totalValue": 15000,
      "lastLogin": "2024-12-19T10:30:00Z"
    }
  }
}
```

#### PUT /api/users/profile

Update user profile.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "businessName": "John's Pawn Shop",
  "phone": "+1234567890",
  "settings": {
    "pawnPercentage": 35,
    "theme": "light"
  }
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Smith",
    "businessName": "John's Pawn Shop",
    "settings": {
      "pawnPercentage": 35,
      "theme": "light"
    },
    "updatedAt": "2024-12-19T10:30:00Z"
  }
}
```

#### POST /api/users/change-password

Change user password.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### Statistics

#### GET /api/stats/dashboard

Get dashboard statistics.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "items": {
      "total": 25,
      "active": 15,
      "sold": 8,
      "expired": 2
    },
    "value": {
      "total": 15000,
      "active": 9000,
      "sold": 6000
    },
    "recentActivity": [
      {
        "type": "item_created",
        "itemName": "iPhone 13 Pro",
        "timestamp": "2024-12-19T10:30:00Z"
      }
    ],
    "monthlyTrends": {
      "itemsCreated": [5, 8, 12, 15],
      "itemsSold": [3, 6, 8, 10],
      "revenue": [1500, 2400, 3200, 4000]
    }
  }
}
```

### Health Check

#### GET /health

Check API health status.

**Response:**
```json
{
  "status": "OK",
  "message": "PawnBroker Pro API is running",
  "environment": "production",
  "timestamp": "2024-12-19T10:30:00Z",
  "version": "1.0.0",
  "uptime": 3600,
  "database": {
    "connected": true
  }
}
```

## Webhooks

### eBay Webhooks

#### POST /api/ebay-webhooks/notifications

Receive eBay webhook notifications.

**Headers:**
```
X-EBAY-SIGNATURE: <signature>
Content-Type: application/json
```

**Request Body:**
```json
{
  "metadata": {
    "topic": "ITEM_SOLD",
    "schemaVersion": "1.0",
    "deprecated": false
  },
  "data": {
    "itemId": "123456789",
    "title": "iPhone 13 Pro",
    "price": 750,
    "soldDate": "2024-12-19T10:30:00Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

## Data Models

### User Model

```json
{
  "id": "string",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "businessName": "string",
  "phone": "string (encrypted)",
  "role": "user | admin",
  "isActive": "boolean",
  "settings": {
    "pawnPercentage": "number",
    "maxSearchResults": "number",
    "enableNotifications": "boolean",
    "theme": "light | dark",
    "currency": "string"
  },
  "lastLogin": "date",
  "loginCount": "number",
  "createdAt": "date",
  "updatedAt": "date"
}
```

### Item Model

```json
{
  "id": "string",
  "userId": "string",
  "name": "string",
  "description": "string",
  "category": "string",
  "condition": "Excellent | Good | Fair | Poor",
  "estimatedValue": "number",
  "pawnAmount": "number",
  "status": "active | sold | expired | returned",
  "imageUrl": "string",
  "notes": "string",
  "createdAt": "date",
  "updatedAt": "date"
}
```

## Security

### Authentication

- JWT tokens with 24-hour expiration
- Automatic token refresh
- Secure password hashing (bcrypt)
- Account lockout after failed attempts

### Data Protection

- Field-level encryption for sensitive data
- Data masking in logs
- GDPR compliance features
- Data retention policies

### API Security

- Rate limiting
- Input validation and sanitization
- CORS protection
- Security headers
- Webhook signature verification

## Rate Limits

| Endpoint Category | Rate Limit | Window |
|------------------|------------|---------|
| Authentication | 10 requests | 15 minutes |
| General API | 100 requests | 15 minutes |
| Image Upload | 5 requests | 15 minutes |
| Market Data | 50 requests | 15 minutes |

## Support

For API support and questions:

- **Email**: api-support@pawnbrokerpro.com
- **Documentation**: https://docs.pawnbrokerpro.com
- **Status Page**: https://status.pawnbrokerpro.com

## Changelog

### Version 1.0.0 (2024-12-19)
- Initial API release
- Authentication system
- Item management
- Market data integration
- Image upload functionality
- User profile management
- Statistics and reporting
- Webhook support
