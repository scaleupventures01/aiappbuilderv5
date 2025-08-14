# Railway Deployment Guide

This guide covers the complete deployment process for the Elite Trading Coach AI platform on Railway.

## Prerequisites

1. **Railway Account**: Create an account at [railway.app](https://railway.app)
2. **Railway CLI**: Install the Railway CLI
   ```bash
   npm install -g @railway/cli
   # or
   curl -fsSL https://railway.app/install.sh | sh
   ```
3. **Git Repository**: Your code should be in a Git repository
4. **Node.js 18+**: Ensure your local environment matches the deployment environment

## Quick Deployment

For a quick deployment, use our automated script:

```bash
./scripts/deploy-railway.sh
```

This script will handle the entire deployment process automatically.

## Manual Deployment Steps

### 1. Install and Login to Railway CLI

```bash
# Install Railway CLI (if not already installed)
npm install -g @railway/cli

# Login to Railway
railway login
```

### 2. Create a New Railway Project

```bash
# Create a new project
railway init

# Or link to existing project
railway link
```

### 3. Add PostgreSQL Database Service

```bash
# Add PostgreSQL addon
railway add postgresql
```

This will automatically create a PostgreSQL database and set the required environment variables.

### 4. Configure Environment Variables

Railway automatically provides database environment variables when you add PostgreSQL:
- `DATABASE_URL`
- `PGHOST`
- `PGPORT` 
- `PGDATABASE`
- `PGUSER`
- `PGPASSWORD`

Add any additional environment variables you need:

```bash
# Set additional environment variables
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=your-jwt-secret
railway variables set SESSION_SECRET=your-session-secret
```

### 5. Deploy the Application

```bash
# Deploy your application
railway deploy
```

### 6. Get Deployment Information

```bash
# Check deployment status
railway status

# Get your application URL
railway domain

# View logs
railway logs
```

## Configuration Files

### railway.json

The `railway.json` file in the project root configures the Railway deployment:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run install:all && npm run app:build"
  },
  "deploy": {
    "startCommand": "node orch/auth/server.mjs",
    "healthcheckPath": "/health"
  }
}
```

### Database Configuration

The application automatically detects Railway deployment and uses the optimized Railway database configuration:

- **Connection Pooling**: Optimized for Railway's network latency
- **SSL**: Automatically enabled for production
- **Retry Logic**: Built-in connection retry with exponential backoff
- **Error Handling**: Enhanced error handling for Railway environment

## Environment Variables Mapping

| Local Development | Railway Production | Description |
|-------------------|-------------------|-------------|
| `DB_HOST` | `PGHOST` | PostgreSQL host |
| `DB_PORT` | `PGPORT` | PostgreSQL port |
| `DB_NAME` | `PGDATABASE` | Database name |
| `DB_USER` | `PGUSER` | Database user |
| `DB_PASSWORD` | `PGPASSWORD` | Database password |
| N/A | `DATABASE_URL` | Complete connection string |

## Health Checks

The application includes a health check endpoint at `/health` that verifies:
- Database connectivity
- Application startup status
- Environment configuration

Railway will automatically check this endpoint to ensure your deployment is healthy.

## Database Migrations

After deployment, you may need to run database migrations:

```bash
# Connect to your Railway project
railway connect

# Run migrations (adjust command as needed)
npm run migrate
```

## Monitoring and Logs

### View Application Logs
```bash
railway logs
```

### Monitor Resource Usage
```bash
railway status
```

### Database Connection
```bash
# Connect to PostgreSQL directly
railway connect postgresql
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check that all dependencies are listed in `package.json`
   - Verify build command in `railway.json`
   - Check build logs: `railway logs --deployment`

2. **Database Connection Issues**
   - Verify PostgreSQL service is running
   - Check environment variables: `railway variables`
   - Test connection with health endpoint

3. **Application Startup Issues**
   - Check start command in `railway.json`
   - Verify main application file exists
   - Check application logs for startup errors

### Debug Commands

```bash
# Check environment variables
railway variables

# View deployment history
railway deployments

# Check service status
railway status

# View build logs
railway logs --deployment

# View application logs
railway logs
```

## Production Considerations

### Security
- All database connections use SSL/TLS encryption
- Environment variables are securely managed by Railway
- No sensitive data is stored in the codebase

### Performance
- Connection pooling is optimized for Railway's infrastructure
- Health checks prevent traffic to unhealthy instances
- Automatic restart on failures

### Scaling
- Railway provides automatic scaling based on usage
- Connection pool settings are tuned for Railway's environment
- Database connections are efficiently managed

## Cost Optimization

- Railway provides a generous free tier for development
- Production usage is billed based on resource consumption
- Database connections are pooled to minimize resource usage
- Health checks are lightweight to reduce monitoring overhead

## Backup and Recovery

Railway automatically backs up PostgreSQL databases. To manually backup:

```bash
# Export database
railway connect postgresql -- pg_dump > backup.sql

# Restore database (be careful!)
railway connect postgresql -- psql < backup.sql
```

## Support

For Railway-specific issues:
- [Railway Documentation](https://docs.railway.app)
- [Railway Discord Community](https://discord.gg/railway)
- [Railway GitHub](https://github.com/railwayapp/railway)

For application-specific issues, check the application logs and database connectivity first.