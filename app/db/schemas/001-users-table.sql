-- Users Table Schema for Elite Trading Coach AI
-- PRD Reference: PRD-1.1.1.2-users-table.md
-- Created: 2025-08-14
-- Description: Creates the users table with proper authentication fields and indexes

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    -- Primary key - UUID for security and scalability
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Authentication fields
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Profile information
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    
    -- Trading-specific fields
    trading_experience VARCHAR(20) CHECK (trading_experience IN ('beginner', 'intermediate', 'advanced', 'professional')),
    subscription_tier VARCHAR(20) DEFAULT 'founder' CHECK (subscription_tier IN ('free', 'beta', 'founder', 'pro')),
    
    -- Status and verification
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE NOT NULL,
    
    -- Timestamps
    last_login TIMESTAMP NULL,
    last_active TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP NULL -- For soft deletes
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(id) WHERE is_active = TRUE AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_subscription ON users(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active DESC);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_trading_experience ON users(trading_experience);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_users_active_subscription ON users(is_active, subscription_tier) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_email_verified_active ON users(email_verified, is_active) WHERE deleted_at IS NULL;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on row updates
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE users IS 'User accounts for Elite Trading Coach AI platform';
COMMENT ON COLUMN users.id IS 'Primary key - UUID for security and scalability';
COMMENT ON COLUMN users.email IS 'User email address - must be unique and valid format';
COMMENT ON COLUMN users.username IS 'Unique username, 3-50 characters, alphanumeric and underscores only';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password - never store plain text';
COMMENT ON COLUMN users.trading_experience IS 'User self-reported trading experience level';
COMMENT ON COLUMN users.subscription_tier IS 'User subscription level';
COMMENT ON COLUMN users.is_active IS 'Whether user account is active';
COMMENT ON COLUMN users.email_verified IS 'Whether user has verified their email address';
COMMENT ON COLUMN users.last_login IS 'Timestamp of user last login';
COMMENT ON COLUMN users.last_active IS 'Timestamp of user last activity';
COMMENT ON COLUMN users.deleted_at IS 'Soft delete timestamp - null means not deleted';

-- Grant permissions to application user
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO trading_coach_user;
GRANT USAGE ON SEQUENCE users_id_seq TO trading_coach_user;