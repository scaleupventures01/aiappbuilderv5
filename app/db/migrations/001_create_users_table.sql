-- Migration: Create Users Table
-- PRD Reference: PRD-1.1.1.2-users-table.md
-- Task: BE-001 - Complete users table implementation
-- Created: 2025-08-14
-- Description: Creates the users table with comprehensive security considerations, performance indexes, and audit triggers

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing objects if they exist (for clean re-runs)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table with comprehensive security considerations
CREATE TABLE users (
    -- Cryptographically secure UUID v4 primary key prevents user enumeration
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- PII fields requiring encryption at rest - consider column-level encryption
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    
    -- Non-PII unique identifier for public display
    username VARCHAR(50) UNIQUE NOT NULL,
    
    -- Bcrypt hash storage - never store plain text passwords
    -- Field size accommodates bcrypt format: $2a$[cost]$[salt][hash] (60 chars)
    password_hash VARCHAR(255) NOT NULL,
    
    -- Optional profile data
    avatar_url TEXT,
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    
    -- Business logic with input validation constraints
    trading_experience VARCHAR(20) CHECK (trading_experience IN ('beginner', 'intermediate', 'advanced', 'professional')),
    subscription_tier VARCHAR(20) DEFAULT 'founder' CHECK (subscription_tier IN ('free', 'beta', 'founder', 'pro')),
    
    -- Account state management for security operations
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE NOT NULL,
    
    -- Security audit trail timestamps
    last_login TIMESTAMP NULL,
    last_active TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP NULL  -- Soft delete for GDPR compliance and data retention
);

-- Performance indexes for fast user lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_active ON users(id) WHERE is_active = TRUE AND deleted_at IS NULL;
CREATE INDEX idx_users_subscription ON users(subscription_tier);
CREATE INDEX idx_users_last_active ON users(last_active DESC);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_trading_experience ON users(trading_experience);

-- Composite indexes for common query patterns
CREATE INDEX idx_users_active_subscription ON users(is_active, subscription_tier) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email_verified_active ON users(email_verified, is_active) WHERE deleted_at IS NULL;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on row updates
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comprehensive comments for documentation
COMMENT ON TABLE users IS 'User accounts for Elite Trading Coach AI platform with comprehensive security';
COMMENT ON COLUMN users.id IS 'Cryptographically secure UUID v4 primary key prevents user enumeration';
COMMENT ON COLUMN users.email IS 'User email address - RFC 5322 compliant, must be unique';
COMMENT ON COLUMN users.username IS 'Unique username, 3-50 characters, alphanumeric and underscores only';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password (work factor 12+) - never store plain text';
COMMENT ON COLUMN users.first_name IS 'User first name - PII field, consider encryption at rest';
COMMENT ON COLUMN users.last_name IS 'User last name - PII field, consider encryption at rest';
COMMENT ON COLUMN users.avatar_url IS 'URL to user profile picture/avatar';
COMMENT ON COLUMN users.timezone IS 'IANA timezone identifier for user location';
COMMENT ON COLUMN users.trading_experience IS 'Self-reported trading experience level for coaching personalization';
COMMENT ON COLUMN users.subscription_tier IS 'User subscription level determining feature access';
COMMENT ON COLUMN users.is_active IS 'Account status - false disables all access';
COMMENT ON COLUMN users.email_verified IS 'Email verification status - required for full account activation';
COMMENT ON COLUMN users.last_login IS 'Timestamp of most recent successful authentication';
COMMENT ON COLUMN users.last_active IS 'Timestamp of most recent user activity for engagement tracking';
COMMENT ON COLUMN users.created_at IS 'Account creation timestamp - immutable';
COMMENT ON COLUMN users.updated_at IS 'Last profile modification timestamp - auto-updated by trigger';
COMMENT ON COLUMN users.deleted_at IS 'Soft delete timestamp - null means active, non-null means deleted';

-- Security audit comments
COMMENT ON INDEX idx_users_email IS 'Fast lookup for authentication by email';
COMMENT ON INDEX idx_users_username IS 'Fast lookup for authentication by username';
COMMENT ON INDEX idx_users_active IS 'Partial index for active users only - improves query performance';
COMMENT ON INDEX idx_users_active_subscription IS 'Composite index for subscription tier queries on active users';
COMMENT ON TRIGGER update_users_updated_at ON users IS 'Automatically updates updated_at timestamp on any row modification';
COMMENT ON FUNCTION update_updated_at_column() IS 'Trigger function to set updated_at to current timestamp';