# Database Schemas - Elite Trading Coach AI

This directory contains PostgreSQL schema definitions for the Elite Trading Coach AI platform.

## Schema Files

### 001-users-table.sql
**PRD Reference**: PRD-1.1.1.2-users-table.md

Creates the users table with proper authentication fields and security features:

- **Primary Key**: UUID for security and scalability
- **Authentication**: Email, username, password hash with proper constraints
- **Profile**: First/last name, avatar, timezone
- **Trading Context**: Experience level, subscription tier
- **Status Management**: Active status, email verification, soft deletes
- **Timestamps**: Created, updated, last login, last active
- **Performance**: 8 optimized indexes for common query patterns
- **Automation**: Trigger for automatic updated_at timestamp updates

#### Key Features:
- UUID primary keys for enhanced security
- Unique constraints on email and username
- Check constraints for enum-like fields
- Comprehensive indexing strategy
- Soft delete capability
- Automatic timestamp management
- Proper comments and documentation

## Usage

### Apply Schema
```bash
# Using migration script (recommended)
node ../migrations/001-create-users-table.js up

# Or apply directly
psql -d elite_trading_coach_ai -U trading_coach_user -f 001-users-table.sql
```

### Validate Schema
```bash
# Run validation script
node ../validate-schema.js
```

### Rollback Schema
```bash
# Using migration script
node ../migrations/001-create-users-table.js down
```

## Security Considerations

1. **UUID Primary Keys**: Prevents ID enumeration attacks
2. **Password Hashing**: Never stores plain text passwords (bcrypt required)
3. **Unique Constraints**: Prevents duplicate accounts
4. **Soft Deletes**: Maintains data integrity while allowing user removal
5. **Proper Permissions**: Limited to application user only

## Performance Optimization

### Indexes Created:
1. `idx_users_email` - Fast email lookups for authentication
2. `idx_users_username` - Fast username lookups and validation
3. `idx_users_active` - Efficient active user queries
4. `idx_users_subscription` - Subscription tier filtering
5. `idx_users_last_active` - User activity sorting
6. `idx_users_created_at` - Registration date ordering
7. `idx_users_trading_experience` - Experience level filtering
8. `idx_users_active_subscription` - Composite for common queries
9. `idx_users_email_verified_active` - Composite for user management

### Query Performance Targets:
- User authentication: < 50ms
- User profile lookup: < 30ms
- User listing/filtering: < 100ms

## Field Validation Rules

### Email
- Must be unique across the platform
- Valid email format required (enforced at application level)
- Case-insensitive storage recommended

### Username
- Must be unique across the platform
- 3-50 characters allowed
- Alphanumeric and underscores only
- Case-sensitive

### Password
- Minimum 8 characters (enforced at application level)
- Must be bcrypt hashed before storage
- Never store plain text passwords

### Trading Experience
- Allowed values: 'beginner', 'intermediate', 'advanced', 'professional'
- Used for personalized coaching recommendations

### Subscription Tier
- Allowed values: 'free', 'beta', 'founder', 'pro'
- Default: 'founder' for MVP launch
- Determines feature access levels

## Backup and Recovery

The schema includes:
- Full table structure recreation capability
- Proper constraint definitions for data integrity
- Index recreation for performance restoration
- Trigger recreation for automation

## Next Steps

1. **Add Users Table**: ✅ Complete
2. **Add Conversations Table**: Pending
3. **Add Messages Table**: Pending
4. **Add User Sessions Table**: Future
5. **Add User Preferences Table**: Future

## Testing

Run the validation script to ensure proper installation:

```bash
node ../validate-schema.js
```

Expected output:
- ✅ Table structure validation
- ✅ Constraint verification
- ✅ Index performance check
- ✅ Trigger functionality test
- ✅ Basic CRUD operations test