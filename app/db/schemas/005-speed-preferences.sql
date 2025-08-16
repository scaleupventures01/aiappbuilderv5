-- Speed Preferences and Analytics Schema for Elite Trading Coach AI
-- PRD Reference: PRD-1.2.6-gpt5-speed-selection.md
-- Created: 2025-08-15
-- Description: Adds speed preferences to users table and creates speed analytics tracking

-- Add speed_preference column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS speed_preference VARCHAR(20) 
DEFAULT 'balanced' 
CHECK (speed_preference IN ('super_fast', 'fast', 'balanced', 'high_accuracy'));

-- Create speed_analytics table for tracking usage patterns
CREATE TABLE IF NOT EXISTS speed_analytics (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Reference to user and analysis
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    analysis_id UUID, -- Reference to message/analysis record
    request_id VARCHAR(50), -- For request correlation
    
    -- Speed configuration
    speed_mode VARCHAR(20) NOT NULL CHECK (speed_mode IN ('super_fast', 'fast', 'balanced', 'high_accuracy', 'thorough', 'maximum')),
    reasoning_effort VARCHAR(10) CHECK (reasoning_effort IN ('low', 'medium', 'high')),
    
    -- Performance metrics
    response_time_ms INTEGER NOT NULL,
    target_response_time VARCHAR(50), -- e.g., "1-3 seconds"
    within_target_time BOOLEAN DEFAULT FALSE,
    
    -- Cost tracking
    cost_multiplier DECIMAL(3,2) DEFAULT 1.0, -- Speed mode cost multiplier
    base_cost DECIMAL(8,4) DEFAULT 0.0, -- Base cost in USD
    total_cost DECIMAL(8,4) DEFAULT 0.0, -- Total cost in USD
    tokens_used INTEGER DEFAULT 0,
    
    -- Model and analysis metadata
    model_used VARCHAR(50) NOT NULL,
    fallback_used BOOLEAN DEFAULT FALSE,
    retry_count INTEGER DEFAULT 0,
    
    -- Request context
    endpoint VARCHAR(100), -- e.g., '/api/analyze-trade'
    user_agent TEXT,
    ip_address INET,
    
    -- Results
    verdict VARCHAR(20), -- Diamond, Fire, Skull
    confidence INTEGER, -- 0-100
    analysis_successful BOOLEAN DEFAULT TRUE,
    error_type VARCHAR(50), -- If analysis failed
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    
    -- Soft delete support
    deleted_at TIMESTAMP NULL
);

-- Performance indexes for speed_analytics
CREATE INDEX IF NOT EXISTS idx_speed_analytics_user_id ON speed_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_speed_analytics_speed_mode ON speed_analytics(speed_mode);
CREATE INDEX IF NOT EXISTS idx_speed_analytics_created_at ON speed_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_speed_analytics_model_used ON speed_analytics(model_used);
CREATE INDEX IF NOT EXISTS idx_speed_analytics_request_id ON speed_analytics(request_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_speed_analytics_user_speed_time ON speed_analytics(user_id, speed_mode, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_speed_analytics_performance ON speed_analytics(speed_mode, within_target_time, created_at DESC) WHERE analysis_successful = TRUE;
CREATE INDEX IF NOT EXISTS idx_speed_analytics_cost_tracking ON speed_analytics(user_id, created_at DESC, total_cost) WHERE deleted_at IS NULL;

-- Add index for speed_preference on users table
CREATE INDEX IF NOT EXISTS idx_users_speed_preference ON users(speed_preference) WHERE is_active = TRUE AND deleted_at IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN users.speed_preference IS 'User preferred analysis speed mode - super_fast, fast, balanced, or high_accuracy';

COMMENT ON TABLE speed_analytics IS 'Analytics tracking for GPT-5 speed mode usage and performance';
COMMENT ON COLUMN speed_analytics.id IS 'Primary key - UUID for tracking analytics records';
COMMENT ON COLUMN speed_analytics.user_id IS 'Reference to user who performed the analysis';
COMMENT ON COLUMN speed_analytics.analysis_id IS 'Reference to the analysis message/record if applicable';
COMMENT ON COLUMN speed_analytics.request_id IS 'Request correlation ID for debugging';
COMMENT ON COLUMN speed_analytics.speed_mode IS 'Speed mode used for this analysis';
COMMENT ON COLUMN speed_analytics.reasoning_effort IS 'Reasoning effort level used (low/medium/high)';
COMMENT ON COLUMN speed_analytics.response_time_ms IS 'Actual response time in milliseconds';
COMMENT ON COLUMN speed_analytics.target_response_time IS 'Target response time range for the speed mode';
COMMENT ON COLUMN speed_analytics.within_target_time IS 'Whether response time was within target range';
COMMENT ON COLUMN speed_analytics.cost_multiplier IS 'Cost multiplier for the speed mode (1.0 = base cost)';
COMMENT ON COLUMN speed_analytics.base_cost IS 'Base analysis cost in USD';
COMMENT ON COLUMN speed_analytics.total_cost IS 'Total cost including speed mode multiplier in USD';
COMMENT ON COLUMN speed_analytics.tokens_used IS 'Number of tokens consumed by the analysis';
COMMENT ON COLUMN speed_analytics.model_used IS 'AI model used for analysis (e.g., gpt-5, gpt-4o)';
COMMENT ON COLUMN speed_analytics.fallback_used IS 'Whether fallback model was used due to primary model failure';
COMMENT ON COLUMN speed_analytics.retry_count IS 'Number of retries attempted for this analysis';
COMMENT ON COLUMN speed_analytics.verdict IS 'Analysis verdict: Diamond, Fire, or Skull';
COMMENT ON COLUMN speed_analytics.confidence IS 'Analysis confidence score 0-100';
COMMENT ON COLUMN speed_analytics.analysis_successful IS 'Whether the analysis completed successfully';
COMMENT ON COLUMN speed_analytics.error_type IS 'Type of error if analysis failed';
COMMENT ON COLUMN speed_analytics.deleted_at IS 'Soft delete timestamp - null means not deleted';

-- Grant permissions to application user
GRANT SELECT, INSERT, UPDATE, DELETE ON speed_analytics TO trading_coach_user;
GRANT USAGE ON SEQUENCE speed_analytics_id_seq TO trading_coach_user;