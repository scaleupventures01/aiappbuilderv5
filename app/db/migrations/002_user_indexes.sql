-- Migration: User Table Index Optimization
-- PRD Reference: PRD-1.1.1.2-users-table.md
-- Task: BE-002 - Index optimization for performance
-- Created: 2025-08-14
-- Description: Additional performance indexes and query optimization for users table

-- Prerequisites: Assumes users table exists from 001_create_users_table.sql

-- Additional performance indexes for complex queries
-- These indexes are created in addition to the core indexes in 001_create_users_table.sql

-- Index for user search and filtering operations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_fulltext_search 
ON users USING gin(to_tsvector('english', COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') || ' ' || username));

-- Index for timezone-based queries (for global user management)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_timezone 
ON users(timezone) WHERE deleted_at IS NULL;

-- Partial index for recently active users (last 30 days)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_recently_active 
ON users(last_active DESC) 
WHERE last_active >= (NOW() - INTERVAL '30 days') AND deleted_at IS NULL;

-- Index for email verification workflows
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_unverified_email 
ON users(created_at) 
WHERE email_verified = FALSE AND deleted_at IS NULL;

-- Index for user onboarding analytics (users who haven't completed profile)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_incomplete_profile 
ON users(created_at) 
WHERE (first_name IS NULL OR last_name IS NULL OR trading_experience IS NULL) 
AND deleted_at IS NULL;

-- Index for subscription tier analytics and reporting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_subscription_created 
ON users(subscription_tier, created_at) 
WHERE deleted_at IS NULL;

-- Index for user activity patterns (login frequency analysis)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_login_patterns 
ON users(last_login DESC, created_at) 
WHERE deleted_at IS NULL AND last_login IS NOT NULL;

-- Index for account management queries (admin operations)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_admin_management 
ON users(is_active, email_verified, subscription_tier, created_at) 
WHERE deleted_at IS NULL;

-- Covering index for user profile queries (includes frequently accessed columns)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_profile_cover 
ON users(id) 
INCLUDE (email, username, first_name, last_name, avatar_url, trading_experience, subscription_tier, is_active, email_verified, last_active)
WHERE deleted_at IS NULL;

-- Index for soft delete cleanup operations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_soft_deleted 
ON users(deleted_at) 
WHERE deleted_at IS NOT NULL;

-- Add index usage tracking comments
COMMENT ON INDEX idx_users_fulltext_search IS 'GIN index for full-text search across user name fields';
COMMENT ON INDEX idx_users_timezone IS 'Index for timezone-based user queries and analytics';
COMMENT ON INDEX idx_users_recently_active IS 'Partial index for recently active users (30 days)';
COMMENT ON INDEX idx_users_unverified_email IS 'Index for email verification workflow queries';
COMMENT ON INDEX idx_users_incomplete_profile IS 'Index for user onboarding analytics';
COMMENT ON INDEX idx_users_subscription_created IS 'Index for subscription analytics by tier and signup date';
COMMENT ON INDEX idx_users_login_patterns IS 'Index for user login frequency analysis';
COMMENT ON INDEX idx_users_admin_management IS 'Composite index for admin user management queries';
COMMENT ON INDEX idx_users_profile_cover IS 'Covering index for user profile queries with included columns';
COMMENT ON INDEX idx_users_soft_deleted IS 'Index for soft delete cleanup and recovery operations';

-- Performance analysis queries for monitoring index effectiveness
-- These can be used to monitor index usage and performance

-- Query to check index usage statistics
-- SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes 
-- WHERE tablename = 'users' 
-- ORDER BY idx_tup_read DESC;

-- Query to check index sizes
-- SELECT schemaname, tablename, indexname, pg_size_pretty(pg_relation_size(indexrelid)) as size
-- FROM pg_stat_user_indexes 
-- WHERE tablename = 'users' 
-- ORDER BY pg_relation_size(indexrelid) DESC;