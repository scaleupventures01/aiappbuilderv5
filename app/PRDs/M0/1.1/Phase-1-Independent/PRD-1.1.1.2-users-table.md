# PRD-1.1.1.2: Users Table Schema Creation

**Status**: Not Started
**Owner**: Backend Engineer
**Estimated Hours**: 3
**Dependencies**: PRD-1.1.1.1-postgresql-setup.md

## 1. Problem Statement
The platform needs a secure user management system to handle authentication, user profiles, and session management. Without a properly designed users table, the platform cannot support user registration, login, or personalized trading coaching experiences.

## 2. User Story
As a trader using the platform, I want to create a secure account and maintain my profile information so that I can access personalized trading analysis and coaching that's tailored to my trading history and patterns.

## 3. Success Metrics
- KPI 1: User registration completes in <3 seconds
- KPI 2: Authentication queries execute in <50ms
- KPI 3: User data integrity maintained with 100% accuracy

## 4. Functional Requirements
- [ ] Users table created with all required fields
- [ ] UUID primary keys for security and scalability
- [ ] Password hashing implementation (bcrypt)
- [ ] Unique constraints on email and username
- [ ] Timestamp tracking for creation and updates
- [ ] Soft delete capability for data retention
- [ ] Indexes for performance optimization

## 5. Non-Functional Requirements
- Performance: User lookup queries complete in <50ms
- Security: Passwords never stored in plain text, UUID primary keys
- Reliability: Data integrity constraints prevent duplicate accounts

## 6. Technical Specifications

### Preconditions
- PostgreSQL database installed and configured
- Database connection established from application
- User permissions configured for table creation

### Postconditions  
- Users table exists with proper schema
- All constraints and indexes applied
- Sample test users can be created and authenticated

### Implementation Details
**Table Schema:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  trading_experience VARCHAR(20) CHECK (trading_experience IN ('beginner', 'intermediate', 'advanced', 'professional')),
  subscription_tier VARCHAR(20) DEFAULT 'founder' CHECK (subscription_tier IN ('free', 'beta', 'founder', 'pro')),
  is_active BOOLEAN DEFAULT TRUE,
  email_verified BOOLEAN DEFAULT FALSE,
  last_active TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_active ON users(id) WHERE is_active = TRUE AND deleted_at IS NULL;
CREATE INDEX idx_users_subscription ON users(subscription_tier);
CREATE INDEX idx_users_last_active ON users(last_active DESC);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

**Validation Rules:**
- Email must be valid format
- Username 3-50 characters, alphanumeric and underscores only
- Password minimum 8 characters (enforced in application)
- Timezone must be valid IANA timezone identifier

## 7. Testing Requirements

### 7.1 Unit Tests
- [ ] Test user creation with valid data
- [ ] Test unique constraint violations (email/username)
- [ ] Test password hashing functionality
- [ ] Test timestamp auto-generation

### 7.2 Integration Tests
- [ ] Test user registration flow end-to-end
- [ ] Test user authentication with correct/incorrect passwords
- [ ] Test user profile updates
- [ ] Test soft delete functionality

### 7.3 Acceptance Criteria
- [ ] Criteria 1: Can create new user with all required fields populated correctly
- [ ] Criteria 2: Cannot create duplicate users with same email or username
- [ ] Criteria 3: Password is never stored in plain text (bcrypt hash verification)

## 8. Rollback Plan
1. Create table creation script backup
2. Document any existing user data before schema changes
3. Create DROP TABLE script for emergency rollback
4. Test rollback procedure in development environment

## 9. Documentation Requirements
- [ ] User table schema documentation
- [ ] Field descriptions and validation rules
- [ ] Index strategy documentation
- [ ] Authentication flow documentation

## 10. Sign-off
- [ ] Product Manager Review
- [ ] Technical Lead Review
- [ ] QA Review
- [ ] Implementation Complete