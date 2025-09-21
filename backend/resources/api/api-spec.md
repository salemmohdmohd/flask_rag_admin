# RAG Admin Dashboard API Specification

## Overview
The RAG Admin Dashboard provides a comprehensive REST API for managing retrieval-augmented generation systems, user interactions, and knowledge base operations.


**Base URL**: `https://api.rag-admin.example.com/v1`
**Authentication**: Bearer Token
**Content-Type**: `application/json`

## System vs User Data Separation

All resources and personas are now separated by `user_id`:
- `user_id=1`: Company default (system) resources/personas (read-only for users)
- `user_id≠1`: User-created resources/personas (editable/removable by owner)

Knowledge base endpoints and persona endpoints return both system and user data, with clear distinction in the response objects.

## Authentication


### POST /auth/login
Authenticate user and obtain access token.

**Request Body:**
```json
{
  "username": "admin",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "administrator"
  }
}
```

### POST /auth/refresh
Refresh access token using refresh token.

## Chat & RAG Operations

### POST /chat/query
Submit a query to the RAG system.

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "query": "How do I configure SSL certificates?",
  "session_id": "sess_abc123",
  "context_limit": 5,
  "include_sources": true
}
```

**Response:**
```json
{
  "response": "To configure SSL certificates...",
  "sources": [
    {
      "file": "security-guide.md",
      "section": "SSL Configuration",
      "relevance_score": 0.95
    }
  ],
  "session_id": "sess_abc123",
  "follow_up_suggestions": [
    "How do I renew SSL certificates?",
    "What are the security best practices?"
  ],
  "metadata": {
    "response_time_ms": 1250,
    "tokens_used": 890,
    "semantic_search": true
  }
}
```

### GET /chat/history/{session_id}
Retrieve chat history for a session.

**Response:**
```json
{
  "session_id": "sess_abc123",
  "messages": [
    {
      "id": 1,
      "timestamp": "2025-09-19T10:30:00Z",
      "type": "user",
      "content": "How do I configure SSL?"
    },
    {
      "id": 2,
      "timestamp": "2025-09-19T10:30:02Z",
      "type": "assistant",
      "content": "To configure SSL certificates...",
      "sources": ["security-guide.md"]
    }
  ],
  "total_messages": 2
}
```

## Knowledge Base Management

### POST /knowledge/upload
Upload documents to the knowledge base.

**Request (multipart/form-data):**
```
file: document.pdf
category: "security"
tags: ["ssl", "certificates", "configuration"]
```

**Response:**
```json
{
  "document_id": "doc_xyz789",
  "filename": "document.pdf",
  "status": "processing",
  "estimated_completion": "2025-09-19T10:35:00Z"
}
```


### GET /knowledge/documents
List all documents in the knowledge base. Returns both company (system) and user documents, with `user_id` field for separation.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `category`: Filter by category
- `search`: Search in document content
- `user_id`: (optional) Filter by user (e.g. `user_id=1` for system resources)

**Response:**
```json
{
  "documents": [
    {
      "id": "doc_xyz789",
      "filename": "security-guide.md",
      "category": "security",
      "upload_date": "2025-09-15T09:00:00Z",
      "size_bytes": 15420,
      "status": "indexed",
      "tags": ["ssl", "security", "configuration"],
      "user_id": 1
    },
    {
      "id": "doc_abc456",
      "filename": "user-manual.pdf",
      "category": "manual",
      "upload_date": "2025-09-16T10:00:00Z",
      "size_bytes": 20480,
      "status": "indexed",
      "tags": ["manual", "user"],
      "user_id": 3
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

### DELETE /knowledge/documents/{document_id}
Remove a document from the knowledge base.

**Response:**
```json
{
  "message": "Document deleted successfully",
  "document_id": "doc_xyz789"
}
```

## Analytics & Monitoring

### GET /analytics/usage
Get system usage analytics.

**Query Parameters:**
- `start_date`: Start date (ISO 8601)
- `end_date`: End date (ISO 8601)
- `granularity`: hour, day, week, month

**Response:**
```json
{
  "period": {
    "start": "2025-09-01T00:00:00Z",
    "end": "2025-09-19T23:59:59Z"
  },
  "metrics": {
    "total_queries": 1247,
    "avg_response_time_ms": 850,
    "successful_responses": 1198,
    "error_rate": 0.039,
    "unique_users": 89,
    "documents_indexed": 156
  },
  "daily_breakdown": [
    {
      "date": "2025-09-19",
      "queries": 67,
      "avg_response_time": 820,
      "unique_users": 12
    }
  ]
}
```

### GET /analytics/popular-queries
Get most popular queries.

**Response:**
```json
{
  "popular_queries": [
    {
      "query": "How to configure authentication",
      "count": 89,
      "avg_satisfaction": 4.2
    },
    {
      "query": "API rate limiting",
      "count": 76,
      "avg_satisfaction": 4.1
    }
  ]
}
```

## User Management

### GET /users
List all users (Admin only).

**Response:**
```json
{
  "users": [
    {
      "id": 123,
      "email": "admin@example.com",
      "role": "administrator",
      "created_at": "2025-08-15T09:00:00Z",
      "last_login": "2025-09-19T08:30:00Z",
      "status": "active"
    }
  ]
}
```

### POST /users
Create a new user.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "secure_password",
  "role": "user",
  "permissions": ["read_knowledge", "submit_queries"]
}
```

## Error Responses

All error responses follow this format:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request body is malformed",
    "details": {
      "field": "query",
      "issue": "cannot be empty"
    }
  },
  "request_id": "req_abc123"
}
```

**Common Error Codes:**
- `INVALID_REQUEST` (400): Malformed request
- `UNAUTHORIZED` (401): Invalid or expired token
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `RATE_LIMITED` (429): Too many requests
- `INTERNAL_ERROR` (500): Server error

## Rate Limiting

API requests are limited to:
- **Free tier**: 100 requests/hour
- **Pro tier**: 1000 requests/hour
- **Enterprise**: 10000 requests/hour

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1695123600
```


## Embeddings Caching

Embeddings cache is now per-user. Each user's queries and document embeddings are cached separately for privacy and scalability. No global cache is used.

## SDKs and Libraries

Official SDKs available for:
- **Python**: `pip install rag-admin-sdk`
- **JavaScript/Node.js**: `npm install @rag-admin/sdk`
- **Go**: `go get github.com/rag-admin/go-sdk`

Example Python usage:
```python
from rag_admin import Client

client = Client(api_key="your_api_key")
response = client.chat.query("How do I configure SSL?")
print(response.content)
```
