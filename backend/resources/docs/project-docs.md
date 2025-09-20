# RAG Admin Dashboard - Technical Documentation

## Project Overview

The RAG Admin Dashboard is a modern web application that provides an intuitive interface for managing and interacting with Retrieval-Augmented Generation (RAG) systems. Built with Flask (backend) and React (frontend), it offers real-time chat capabilities, semantic search, and comprehensive analytics.

### Key Features
- **Intelligent Chat Interface**: Natural language queries with context-aware responses
- **Semantic Search**: Vector embeddings for finding relevant information
- **Document Management**: Upload, index, and manage knowledge base documents
- **Real-time Analytics**: Monitor usage patterns and system performance
- **Session Management**: Conversation history and context preservation
- **Multi-user Support**: Role-based access control and user management

## Architecture

### System Architecture Diagram
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │◄──►│  Flask Backend  │◄──►│    Database     │
│   (Vite + React)│    │  (Python 3.11) │    │  (PostgreSQL)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │              ┌─────────────────┐
         │                       └─────────────►│  Vector Store   │
         │                                      │   (Embeddings)  │
         │              ┌─────────────────┐     └─────────────────┘
         └─────────────►│   Google AI     │
                        │  (Gemini API)   │
                        └─────────────────┘
```

### Technology Stack

**Backend:**
- **Framework**: Flask 2.3.x with Flask-SQLAlchemy
- **Database**: PostgreSQL 15+ with Alembic migrations
- **AI Integration**: Google Gemini API for text generation
- **Vector Search**: Google Text Embedding (text-embedding-004)
- **Authentication**: JWT tokens with Flask-JWT-Extended
- **File Processing**: Python-multipart for document uploads

**Frontend:**
- **Framework**: React 18 with Vite build system
- **Styling**: CSS Modules with modern CSS features
- **HTTP Client**: Axios for API communication
- **Markdown Rendering**: react-markdown with syntax highlighting
- **State Management**: React hooks (useState, useEffect, useContext)

**Infrastructure:**
- **Deployment**: Docker containers with docker-compose
- **Reverse Proxy**: Nginx for static file serving
- **SSL/TLS**: Let's Encrypt certificates
- **Monitoring**: Prometheus + Grafana stack
- **Logging**: Structured logging with Python's logging module

## Database Schema

### Core Tables

```sql
-- Users table for authentication and authorization
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Chat sessions for conversation tracking
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER REFERENCES users(id),
    session_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat history for storing conversations
CREATE TABLE chat_history (
    id SERIAL PRIMARY KEY,
    session_id UUID REFERENCES chat_sessions(id),
    user_id INTEGER REFERENCES users(id),
    query TEXT NOT NULL,
    response TEXT NOT NULL,
    source_file VARCHAR(255),
    metadata JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Knowledge base documents
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(100),
    file_size INTEGER,
    category VARCHAR(100),
    tags TEXT[],
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by INTEGER REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'processing',
    indexed_at TIMESTAMP
);

-- Document chunks for vector search
CREATE TABLE document_chunks (
    id SERIAL PRIMARY KEY,
    document_id UUID REFERENCES documents(id),
    chunk_text TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    embedding VECTOR(768),  -- Google's embedding dimension
    metadata JSONB
);
```

### Indexes for Performance

```sql
-- Indexes for efficient querying
CREATE INDEX idx_chat_history_session_id ON chat_history(session_id);
CREATE INDEX idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX idx_chat_history_timestamp ON chat_history(timestamp);
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);

-- Vector similarity search index (using pgvector extension)
CREATE INDEX idx_document_chunks_embedding ON document_chunks
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

## API Design Patterns

### RESTful Conventions
- **GET**: Retrieve resources (idempotent)
- **POST**: Create new resources
- **PUT**: Update entire resource (idempotent)
- **PATCH**: Partial resource updates
- **DELETE**: Remove resources (idempotent)

### Response Format Standards
```json
{
  "data": { /* actual response data */ },
  "metadata": {
    "timestamp": "2025-09-19T10:30:00Z",
    "request_id": "req_abc123",
    "version": "1.0.0"
  },
  "pagination": { /* for paginated responses */ },
  "errors": [ /* error objects if any */ ]
}
```

### Error Handling Strategy
- **4xx errors**: Client-side issues (validation, auth, etc.)
- **5xx errors**: Server-side issues (database, external APIs, etc.)
- **Consistent error objects** with code, message, and details
- **Request IDs** for debugging and support

## Security Implementation

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication with secure signing
- **Role-Based Access Control (RBAC)**: Admin, Editor, User roles
- **Token Expiration**: 1-hour access tokens, 7-day refresh tokens
- **Password Security**: bcrypt hashing with salt rounds

### Data Protection
- **Input Validation**: Pydantic models for request validation
- **SQL Injection Prevention**: SQLAlchemy ORM with parameterized queries
- **XSS Protection**: Content Security Policy headers
- **CSRF Protection**: SameSite cookies and CSRF tokens

### API Security
- **Rate Limiting**: Per-user and per-IP request limits
- **CORS Configuration**: Restricted origins for production
- **HTTPS Enforcement**: TLS 1.2+ required
- **API Key Management**: Secure storage and rotation

## Development Workflow

### Local Development Setup
```bash
# Backend setup
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
export GOOGLE_GEMINI_API_KEY="your_api_key_here"
export DATABASE_URL="postgresql://user:pass@localhost/ragdb"
flask db upgrade
flask run

# Frontend setup
cd frontend
npm install
npm run dev
```

### Testing Strategy
- **Unit Tests**: pytest for backend, Jest for frontend
- **Integration Tests**: API endpoint testing with pytest
- **E2E Tests**: Playwright for full user journey testing
- **Performance Tests**: Load testing with locust
- **Security Tests**: OWASP ZAP for vulnerability scanning

### CI/CD Pipeline
```yaml
# GitHub Actions workflow
stages:
  - Lint & Format (black, flake8, prettier, eslint)
  - Unit Tests (pytest, jest)
  - Integration Tests (API testing)
  - Security Scan (bandit, npm audit)
  - Build Docker Images
  - Deploy to Staging
  - E2E Tests on Staging
  - Deploy to Production (manual approval)
```

## Performance Optimization

### Backend Optimizations
- **Database Connection Pooling**: SQLAlchemy pool configuration
- **Query Optimization**: Eager loading and proper indexing
- **Caching Strategy**: Redis for API responses and embeddings
- **Background Tasks**: Celery for document processing
- **Compression**: gzip compression for API responses

### Frontend Optimizations
- **Code Splitting**: Dynamic imports for route-based splitting
- **Bundle Optimization**: Vite's tree-shaking and minification
- **Image Optimization**: WebP format with fallbacks
- **Lazy Loading**: Components and images loaded on demand
- **Caching**: Browser caching with proper cache headers

### Vector Search Optimization
- **Embedding Caching**: Persistent storage for computed embeddings
- **Batch Processing**: Process multiple documents efficiently
- **Index Optimization**: pgvector IVFFLAT index tuning
- **Similarity Threshold**: Filter low-relevance results

## Monitoring & Observability

### Application Metrics
- **Response Times**: API endpoint performance tracking
- **Error Rates**: 4xx/5xx error monitoring
- **Usage Patterns**: Query frequency and user behavior
- **Resource Utilization**: CPU, memory, and database metrics

### Logging Strategy
```python
# Structured logging example
import structlog

logger = structlog.get_logger()
logger.info("Query processed",
           query=query,
           user_id=user_id,
           response_time_ms=response_time,
           source_documents=len(sources))
```

### Health Checks
- **Database Connectivity**: PostgreSQL health check
- **External APIs**: Google AI API availability
- **Background Services**: Celery worker status
- **Resource Limits**: Memory and disk usage monitoring

## Deployment Guide

### Docker Deployment
```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci --only=production
COPY frontend/ .
RUN npm run build

FROM python:3.11-slim AS backend
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .
COPY --from=frontend-build /app/dist ./static/
EXPOSE 8000
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "app:app"]
```

### Environment Configuration
```bash
# Production environment variables
FLASK_ENV=production
DATABASE_URL=postgresql://user:pass@db:5432/ragdb
REDIS_URL=redis://redis:6379/0
GOOGLE_GEMINI_API_KEY=your_production_key
SECRET_KEY=your_secure_secret_key
JWT_SECRET_KEY=your_jwt_secret
```

### Scaling Considerations
- **Horizontal Scaling**: Multiple backend instances behind load balancer
- **Database Scaling**: Read replicas for query-heavy workloads
- **Caching Layer**: Redis cluster for distributed caching
- **CDN Integration**: CloudFlare for static asset delivery

## Troubleshooting Guide

### Common Issues

**"Database connection failed"**
- Check PostgreSQL service status
- Verify DATABASE_URL environment variable
- Check firewall and network connectivity

**"Gemini API rate limited"**
- Implement exponential backoff retry logic
- Monitor API quota usage
- Consider request batching

**"Vector search returning poor results"**
- Regenerate embeddings with updated content
- Adjust similarity threshold values
- Review document chunking strategy

**"High memory usage"**
- Profile application with memory profiler
- Optimize document processing batch size
- Check for memory leaks in long-running processes

### Performance Debugging
```python
# SQL query performance debugging
from flask_sqlalchemy import get_debug_queries

@app.after_request
def sql_debug(response):
    queries = get_debug_queries()
    for query in queries:
        if query.duration >= 0.1:  # Log slow queries
            logger.warning("Slow query",
                         query=query.statement,
                         duration=query.duration)
    return response
```

## Future Roadmap

### Planned Features
- **Advanced Analytics**: Custom dashboards and reporting
- **Multi-language Support**: i18n for global users
- **Advanced RAG**: Graph-based knowledge representation
- **Integration APIs**: Webhooks and third-party connectors
- **Mobile App**: React Native companion app

### Technical Debt & Improvements
- **Database Migration**: Evaluate vector-native databases
- **API Versioning**: Implement proper versioning strategy
- **Microservices**: Split monolith into domain services
- **Advanced Security**: Implement OAuth2/OIDC
- **Real-time Features**: WebSocket support for live updates
