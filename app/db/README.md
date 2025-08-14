# Database Setup - Elite Trading Coach AI

## Overview
This directory contains the PostgreSQL database configuration and connection module for the Elite Trading Coach AI platform.

## Setup Complete
✅ PostgreSQL 14+ installed and running
✅ Database `elite_trading_coach_ai` created
✅ User `trading_coach_user` created with appropriate permissions
✅ Connection pool configured with pg library
✅ Environment variables configured
✅ Connection testing implemented

## Database Configuration

### Local Development
- **Database**: `elite_trading_coach_ai`
- **User**: `trading_coach_user`
- **Password**: `secure_password_123`
- **Host**: `localhost`
- **Port**: `5432`

### Connection Pool Settings
- **Max Connections**: 20
- **Idle Timeout**: 30 seconds
- **Connection Timeout**: 2 seconds
- **SSL**: Disabled for development, enabled for production

## Files Created

### `/db/connection.js`
Main database connection module using PostgreSQL connection pool. Exports:
- `pool`: PostgreSQL connection pool instance
- `query(text, params)`: Helper function for executing queries
- `getClient()`: Get client for transactions
- `testConnection()`: Test database connectivity
- `closePool()`: Graceful shutdown

### `/db/test-connection.js`
Test script to verify database connectivity and configuration. Run with:
```bash
node db/test-connection.js
```

### `/.env.local`
Environment variables for local development:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=elite_trading_coach_ai
DB_USER=trading_coach_user
DB_PASSWORD=secure_password_123
NODE_ENV=development
```

## Usage Example

```javascript
const { query, getClient } = require('./db/connection');

// Simple query
const users = await query('SELECT * FROM users WHERE active = $1', [true]);

// Transaction example
const client = await getClient();
try {
  await client.query('BEGIN');
  await client.query('INSERT INTO users (name) VALUES ($1)', ['John']);
  await client.query('COMMIT');
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
} finally {
  client.release();
}
```

## Next Steps
1. Create database tables (users, conversations, messages)
2. Implement database migration system
3. Add database seeding for development
4. Configure backup and recovery procedures
5. Set up production environment on Railway

## Production Deployment
For production deployment on Railway, the connection will automatically use:
- `DATABASE_URL` environment variable
- SSL encryption enabled
- Same connection pool configuration

## Troubleshooting

### Connection Issues
- Ensure PostgreSQL service is running: `brew services start postgresql@14`
- Verify credentials in `.env.local`
- Check firewall settings for port 5432

### Permission Issues
- Ensure user has proper database permissions
- Verify user can connect: `psql -U trading_coach_user -d elite_trading_coach_ai -h localhost`

### Performance Issues
- Monitor connection pool stats
- Adjust pool settings based on application load
- Enable query logging for debugging