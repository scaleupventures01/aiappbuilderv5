# Critical Blockers for Week 1-2 Implementation
## Founder MVP Sprint - Must Fix Before Usage

**Document Version**: 1.0  
**Date**: December 2024  
**Purpose**: Track critical technical blockers that must be resolved before founder can use the platform  
**Timeline**: Week 1-2 of Founder MVP Sprint

---

## 🚨 Critical Blockers Overview

These issues will prevent the founder from successfully using the platform and must be addressed immediately during the initial PostgreSQL setup phase.

---

## 1. Connection Pool Configuration Fix
**Estimated Time**: 2 hours  
**Owner**: Backend Engineer  
**PRD Reference**: PRD-1.1.1.1 (PostgreSQL Setup)  
**Priority**: CRITICAL

### Problem
Current configuration has max 20 connections but WebSocket implementation expects 100+ concurrent connections. This will cause connection exhaustion and chat failures.

### Implementation Tasks
- [ ] Update connection pool configuration from 20 to 50-100 connections
- [ ] Configure separate read/write pools if using read replicas
- [ ] Add connection retry logic with exponential backoff
- [ ] Implement connection pool monitoring
- [ ] Test with simulated 100 concurrent WebSocket connections

### Code Changes Required
```javascript
// Update database/connection.js
const pool = new Pool({
  max: 100, // Increased from 20
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  // Add retry logic
  retryConfig: {
    retries: 3,
    retryDelay: 1000,
    shouldRetry: (err) => err.code === 'ECONNREFUSED'
  }
});
```

### Success Criteria
- [ ] Platform handles 100+ concurrent WebSocket connections without exhaustion
- [ ] Connection failures automatically retry and recover
- [ ] No "too many connections" errors during normal usage

---

## 2. Basic Security Implementation
**Estimated Time**: 4 hours  
**Owner**: Backend Engineer  
**PRD Reference**: PRD-1.1.1.2 (Users Table) & PRD-1.1.2.1 (Express Server)  
**Priority**: CRITICAL

### Problem
Without basic security measures, the platform is vulnerable to SQL injection, password exposure, and data breaches even for single-user founder testing.

### Implementation Tasks

#### SQL Injection Prevention (1 hour)
- [ ] Use parameterized queries for all database operations
- [ ] Never concatenate user input into SQL strings
- [ ] Implement query validation layer
- [ ] Add SQL injection tests

```javascript
// CORRECT - Parameterized query
const result = await pool.query(
  'SELECT * FROM users WHERE email = $1',
  [userEmail]
);

// WRONG - Never do this
const result = await pool.query(
  `SELECT * FROM users WHERE email = '${userEmail}'`
);
```

#### Password Hashing with bcrypt (1 hour)
- [ ] Install and configure bcrypt
- [ ] Hash all passwords before storage
- [ ] Implement secure password comparison
- [ ] Never store plain text passwords

```javascript
// Password hashing implementation
const bcrypt = require('bcrypt');
const saltRounds = 10;

// Registration
const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
// Store hashedPassword in database

// Login
const isValid = await bcrypt.compare(plainPassword, hashedPassword);
```

#### Environment Variables Setup (1 hour)
- [ ] Create .env file for local development
- [ ] Configure Railway environment variables
- [ ] Never commit secrets to repository
- [ ] Document all required environment variables

```bash
# .env.example
DB_HOST=localhost
DB_PORT=5432
DB_NAME=elite_trading_coach_ai
DB_USER=trading_coach_user
DB_PASSWORD=<secure_password>
JWT_SECRET=<random_32_char_string>
OPENAI_API_KEY=<api_key>
```

#### Basic Input Validation (1 hour)
- [ ] Validate all user inputs before processing
- [ ] Sanitize inputs to prevent XSS
- [ ] Implement request body validation
- [ ] Add rate limiting to prevent abuse

```javascript
// Input validation middleware
const validator = require('validator');

function validateEmail(email) {
  if (!validator.isEmail(email)) {
    throw new Error('Invalid email format');
  }
  return validator.normalizeEmail(email);
}

function validateUsername(username) {
  if (!validator.isAlphanumeric(username.replace('_', ''))) {
    throw new Error('Username must be alphanumeric');
  }
  return validator.escape(username);
}
```

### Success Criteria
- [ ] All database queries use parameterized statements
- [ ] Passwords stored as bcrypt hashes only
- [ ] No secrets in codebase (all in environment variables)
- [ ] Input validation prevents malicious data entry

---

## 3. Minimal Backup Strategy
**Estimated Time**: 2 hours  
**Owner**: Backend Engineer / DevOps  
**PRD Reference**: PRD-1.1.1.1 (PostgreSQL Setup)  
**Priority**: HIGH

### Problem
Without backups, any database failure or corruption will result in complete data loss, even during founder testing phase.

### Implementation Tasks
- [ ] Set up automated daily pg_dump
- [ ] Configure backup storage (local folder or S3)
- [ ] Create backup script
- [ ] Test restore procedure
- [ ] Document recovery process

### Backup Script Implementation
```bash
#!/bin/bash
# backup-database.sh

# Load environment variables
source .env

# Set backup directory
BACKUP_DIR="/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Perform backup
PGPASSWORD=$DB_PASSWORD pg_dump \
  -h $DB_HOST \
  -p $DB_PORT \
  -U $DB_USER \
  -d $DB_NAME \
  --no-owner \
  --no-acl \
  > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.gz" -mtime +7 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

### Restore Procedure
```bash
#!/bin/bash
# restore-database.sh

# Uncompress backup
gunzip backup_file.sql.gz

# Restore database
PGPASSWORD=$DB_PASSWORD psql \
  -h $DB_HOST \
  -p $DB_PORT \
  -U $DB_USER \
  -d $DB_NAME \
  < backup_file.sql
```

### Cron Job Setup (for automated daily backups)
```bash
# Add to crontab
0 2 * * * /path/to/backup-database.sh >> /var/log/db-backup.log 2>&1
```

### Success Criteria
- [ ] Daily automated backups running successfully
- [ ] Backup files stored securely
- [ ] Restore procedure tested and documented
- [ ] Recovery time < 30 minutes

---

## 📅 Implementation Timeline

### Day 1-2: Database Setup (as planned)
- Complete PRD-1.1.1.1 through PRD-1.1.1.4
- Basic PostgreSQL and tables creation

### Day 3: Critical Fixes (NEW - 8 hours)
**Morning (4 hours):**
- Connection pool configuration fix
- Test with concurrent connections

**Afternoon (4 hours):**
- Implement all security measures
- Set up basic backup strategy
- Test backup and restore

### Day 4-6: Continue with Sprint Plan
- Resume chat + AI integration as originally planned
- All critical blockers resolved

---

## ✅ Definition of Done

All critical blockers are resolved when:

1. **Connection Pool**: Successfully handles 100+ concurrent connections
2. **Security**: All OWASP Top 10 basics implemented
3. **Backups**: Daily automated backups with tested restore
4. **Documentation**: All changes documented in code and README
5. **Testing**: Critical paths tested and verified

---

## 🔄 Post-Implementation

After resolving these blockers:
1. Update PRDs with implemented solutions
2. Add remaining items to Technical Debt Register
3. Continue with Founder MVP Sprint plan
4. Schedule security review before beta users

---

**Document Control**
- **Status**: Ready for Implementation
- **Priority**: MUST DO before founder usage
- **Owner**: Backend Engineer
- **Review**: After implementation completion