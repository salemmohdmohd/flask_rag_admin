# DevOps & Infrastructure Guide

## Cloud Infrastructure

### AWS Architecture Overview

**Production Environment**:
- **Region**: us-west-2 (Primary), us-east-1 (DR)
- **VPC**: 10.0.0.0/16 with 3 availability zones
- **Subnets**: Public (web tier), Private (app tier), Database (data tier)
- **NAT Gateways**: High availability across AZs
- **Load Balancers**: Application Load Balancer (ALB) with SSL termination

**Instance Configuration**:
```yaml
Production:
  Web Tier:
    - Instance Type: t3.large
    - Auto Scaling: 2-10 instances
    - Load Balancer: ALB with health checks

  Application Tier:
    - Instance Type: c5.xlarge
    - Auto Scaling: 3-15 instances
    - Container Platform: ECS Fargate

  Database Tier:
    - Primary: RDS PostgreSQL db.r5.2xlarge
    - Read Replicas: 2x db.r5.xlarge
    - Backup: 30-day retention
```

### Container Orchestration

**Docker Configuration**:
```dockerfile
# Multi-stage build for Python application
FROM python:3.11-slim as base
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM base as production
COPY . .
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "app:app"]
```

**Kubernetes Deployment** (for staging environment):
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rag-admin-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: rag-admin-backend
  template:
    metadata:
      labels:
        app: rag-admin-backend
    spec:
      containers:
      - name: backend
        image: techcorp/rag-admin:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
```

### Infrastructure as Code

**Terraform Configuration**:
```hcl
# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "rag-admin-vpc"
    Environment = var.environment
  }
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier     = "rag-admin-db"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.r5.2xlarge"

  allocated_storage     = 500
  max_allocated_storage = 1000
  storage_encrypted     = true

  db_name  = "ragadmin"
  username = var.db_username
  password = var.db_password

  backup_retention_period = 30
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  skip_final_snapshot = false
  final_snapshot_identifier = "rag-admin-final-snapshot"

  tags = {
    Name        = "rag-admin-database"
    Environment = var.environment
  }
}
```

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  AWS_REGION: us-west-2
  ECR_REPOSITORY: techcorp/rag-admin

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3

    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'

    - name: Install dependencies
      run: |
        pip install -r backend/requirements.txt
        pip install pytest pytest-cov

    - name: Run tests
      run: |
        cd backend
        pytest --cov=. --cov-report=xml

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3

  security-scan:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Run Bandit Security Scan
      run: |
        pip install bandit
        bandit -r backend/ -f json -o bandit-report.json

    - name: Run npm audit
      run: |
        cd frontend
        npm audit --audit-level high

  build:
    needs: [test, security-scan]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - uses: actions/checkout@v3

    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}

    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v1

    - name: Build and push Docker image
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        IMAGE_TAG: ${{ github.sha }}
      run: |
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
        docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production

    steps:
    - name: Deploy to ECS
      run: |
        aws ecs update-service \
          --cluster rag-admin-cluster \
          --service rag-admin-service \
          --force-new-deployment
```

### Deployment Strategy

**Blue-Green Deployment**:
1. **Blue Environment**: Current production
2. **Green Environment**: New version deployment
3. **Health Checks**: Automated validation
4. **Traffic Switch**: Gradual traffic migration
5. **Rollback Plan**: Instant switch back if issues detected

**Canary Deployment**:
```yaml
# ECS Service with canary deployment
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: rag-admin-rollout
spec:
  replicas: 10
  strategy:
    canary:
      steps:
      - setWeight: 10  # 10% traffic to new version
      - pause: {duration: 10m}
      - setWeight: 30  # 30% traffic
      - pause: {duration: 10m}
      - setWeight: 50  # 50% traffic
      - pause: {duration: 10m}
      - setWeight: 100 # Full rollout
  selector:
    matchLabels:
      app: rag-admin
  template:
    spec:
      containers:
      - name: rag-admin
        image: techcorp/rag-admin:latest
```

## Monitoring & Observability

### Application Performance Monitoring

**Prometheus Metrics**:
```python
# Backend metrics collection
from prometheus_client import Counter, Histogram, Gauge, generate_latest

REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
REQUEST_LATENCY = Histogram('http_request_duration_seconds', 'HTTP request latency')
ACTIVE_USERS = Gauge('active_users_total', 'Number of active users')
DB_CONNECTIONS = Gauge('database_connections_active', 'Active database connections')

@app.before_request
def before_request():
    request.start_time = time.time()

@app.after_request
def after_request(response):
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.endpoint,
        status=response.status_code
    ).inc()

    request_latency = time.time() - request.start_time
    REQUEST_LATENCY.observe(request_latency)

    return response
```

**Grafana Dashboards**:
- Application performance metrics
- Infrastructure resource utilization
- Business metrics (user engagement, feature usage)
- Error tracking and alerting
- SLA/SLO monitoring

**Alert Rules**:
```yaml
groups:
- name: rag-admin-alerts
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High error rate detected"
      description: "Error rate is {{ $value }}% over the last 5 minutes"

  - alert: HighResponseTime
    expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
    for: 10m
    labels:
      severity: warning
    annotations:
      summary: "High response time detected"
      description: "95th percentile response time is {{ $value }}s"

  - alert: DatabaseConnectionsHigh
    expr: database_connections_active > 80
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High database connection usage"
      description: "Database connections at {{ $value }}% of limit"
```

### Logging Strategy

**Structured Logging**:
```python
import structlog
import json

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Usage in application
@app.route('/api/query', methods=['POST'])
def handle_query():
    start_time = time.time()
    query_id = str(uuid.uuid4())

    logger.info("Query received",
                query_id=query_id,
                user_id=request.user.id,
                query_length=len(request.json.get('query', '')))

    try:
        result = process_query(request.json['query'])

        logger.info("Query processed successfully",
                    query_id=query_id,
                    processing_time=time.time() - start_time,
                    result_length=len(result['response']))

        return jsonify(result)

    except Exception as e:
        logger.error("Query processing failed",
                     query_id=query_id,
                     error=str(e),
                     processing_time=time.time() - start_time,
                     exc_info=True)
        raise
```

**Log Aggregation with ELK Stack**:
```yaml
# Filebeat configuration
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/rag-admin/*.log
  json.keys_under_root: true
  json.add_error_key: true

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
  index: "rag-admin-logs-%{+yyyy.MM.dd}"

# Logstash pipeline
input {
  beats {
    port => 5044
  }
}

filter {
  if [fields][app] == "rag-admin" {
    json {
      source => "message"
    }

    date {
      match => [ "timestamp", "ISO8601" ]
    }

    if [level] == "ERROR" {
      mutate {
        add_tag => [ "error" ]
      }
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "rag-admin-logs-%{+yyyy.MM.dd}"
  }
}
```

## Database Management

### PostgreSQL Configuration

**Production Settings**:
```postgresql
# postgresql.conf optimizations
shared_buffers = 256MB                # 25% of total RAM
effective_cache_size = 1GB           # 75% of total RAM
work_mem = 4MB                       # Per connection work memory
maintenance_work_mem = 64MB          # Maintenance operations
checkpoint_completion_target = 0.9    # Checkpoint tuning
wal_buffers = 16MB                   # WAL buffer size
max_connections = 200                # Connection limit
effective_io_concurrency = 200       # SSD optimization

# Logging configuration
log_destination = 'csvlog'
logging_collector = on
log_directory = 'pg_log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_min_duration_statement = 1000    # Log queries > 1 second
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
```

**Backup Strategy**:
```bash
#!/bin/bash
# Automated backup script

BACKUP_DIR="/backup/postgresql"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="ragadmin"

# Full backup
pg_dump -h localhost -U postgres -d $DB_NAME \
  --verbose --clean --no-owner --no-privileges \
  --format=custom > $BACKUP_DIR/full_backup_$TIMESTAMP.dump

# Incremental backup using WAL-E
envdir /etc/wal-e.d/env wal-e backup-push /var/lib/postgresql/15/main

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "*.dump" -mtime +30 -delete

# Upload to S3
aws s3 cp $BACKUP_DIR/full_backup_$TIMESTAMP.dump \
  s3://techcorp-db-backups/postgresql/
```

### Database Migrations

**Alembic Configuration**:
```python
# alembic/env.py
from alembic import context
from sqlalchemy import engine_from_config, pool
from logging.config import fileConfig
import logging

# Import your models
from myapp.models import Base

config = context.config
fileConfig(config.config_file_name)
logger = logging.getLogger('alembic.env')

def run_migrations_online():
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix='sqlalchemy.',
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=Base.metadata,
            compare_type=True,
            compare_server_default=True,
            include_schemas=True
        )

        with context.begin_transaction():
            context.run_migrations()

run_migrations_online()
```

**Migration Best Practices**:
```python
"""Add user_preferences table

Revision ID: abc123def456
Revises: def456abc123
Create Date: 2025-09-19 10:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'abc123def456'
down_revision = 'def456abc123'
branch_labels = None
depends_on = None

def upgrade():
    # Create new table
    op.create_table(
        'user_preferences',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('preferences', postgresql.JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes
    op.create_index('idx_user_preferences_user_id', 'user_preferences', ['user_id'])

    # Populate with default data
    op.execute("""
        INSERT INTO user_preferences (user_id, preferences, created_at)
        SELECT id, '{}', NOW() FROM users
        WHERE id NOT IN (SELECT user_id FROM user_preferences)
    """)

def downgrade():
    op.drop_table('user_preferences')
```

## Security & Compliance

### Infrastructure Security

**Network Security**:
```yaml
# Security Group Configuration
SecurityGroupWeb:
  Type: AWS::EC2::SecurityGroup
  Properties:
    GroupDescription: Web tier security group
    VpcId: !Ref VPC
    SecurityGroupIngress:
      - IpProtocol: tcp
        FromPort: 80
        ToPort: 80
        SourceSecurityGroupId: !Ref SecurityGroupALB
      - IpProtocol: tcp
        FromPort: 443
        ToPort: 443
        SourceSecurityGroupId: !Ref SecurityGroupALB
    SecurityGroupEgress:
      - IpProtocol: tcp
        FromPort: 5432
        ToPort: 5432
        DestinationSecurityGroupId: !Ref SecurityGroupDB
      - IpProtocol: tcp
        FromPort: 443
        ToPort: 443
        CidrIp: 0.0.0.0/0  # HTTPS to external APIs
```

**Secrets Management**:
```python
# AWS Secrets Manager integration
import boto3
from botocore.exceptions import ClientError

def get_secret(secret_name, region_name="us-west-2"):
    session = boto3.session.Session()
    client = session.client(
        service_name='secretsmanager',
        region_name=region_name
    )

    try:
        get_secret_value_response = client.get_secret_value(
            SecretId=secret_name
        )
    except ClientError as e:
        logger.error(f"Failed to retrieve secret {secret_name}: {e}")
        raise e

    return json.loads(get_secret_value_response['SecretString'])

# Usage in application
db_credentials = get_secret("rag-admin/database")
DATABASE_URL = f"postgresql://{db_credentials['username']}:{db_credentials['password']}@{db_credentials['host']}/{db_credentials['database']}"
```

### Compliance Automation

**Security Scanning**:
```yaml
# AWS Config Rules
Resources:
  S3BucketEncryptionRule:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: s3-bucket-server-side-encryption-enabled
      Source:
        Owner: AWS
        SourceIdentifier: S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED
      DependsOn: ConfigurationRecorder

  RDSEncryptionRule:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: rds-storage-encrypted
      Source:
        Owner: AWS
        SourceIdentifier: RDS_STORAGE_ENCRYPTED
      DependsOn: ConfigurationRecorder
```

**Automated Compliance Checks**:
```python
# Compliance checker script
import boto3
import json
from datetime import datetime

def check_s3_encryption():
    s3 = boto3.client('s3')
    compliance_report = []

    buckets = s3.list_buckets()['Buckets']

    for bucket in buckets:
        bucket_name = bucket['Name']
        try:
            encryption = s3.get_bucket_encryption(Bucket=bucket_name)
            compliance_report.append({
                'resource': bucket_name,
                'type': 'S3 Bucket',
                'compliant': True,
                'encryption': 'AES256' if encryption else None
            })
        except ClientError:
            compliance_report.append({
                'resource': bucket_name,
                'type': 'S3 Bucket',
                'compliant': False,
                'issue': 'No encryption configured'
            })

    return compliance_report

def generate_compliance_report():
    report = {
        'timestamp': datetime.utcnow().isoformat(),
        'checks': {
            's3_encryption': check_s3_encryption(),
            # Add more compliance checks
        }
    }

    # Store report in S3
    s3 = boto3.client('s3')
    s3.put_object(
        Bucket='techcorp-compliance-reports',
        Key=f"compliance-report-{datetime.utcnow().strftime('%Y%m%d')}.json",
        Body=json.dumps(report, indent=2)
    )

    return report
```

---

*Document Classification: Internal*
*Last Updated: September 19, 2025*
*Review Cycle: Monthly*
*Owner: DevOps Engineering Team*