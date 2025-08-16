/**
 * Message Model - Elite Trading Coach AI
 * PRD Reference: PRD-1.1.1.4-messages-table.md
 * Task: BE-MSG-002 - Message model with validation and AI verdict system
 * Created: 2025-08-14
 * 
 * Implements secure message model with comprehensive validation,
 * AI verdict system, psychology coaching fields, and message threading functionality.
 */

// Validation constants
const VALIDATION_RULES = {
  content: {
    maxLength: 50000,  // 50KB limit for message content
    minLength: 1
  },
  type: ['user', 'ai', 'system', 'training'],
  verdict: ['diamond', 'fire', 'skull', null],
  analysisMode: ['analysis', 'psychology', 'training'],
  confidence: {
    min: 0,
    max: 100
  },
  imageFilename: {
    maxLength: 255,
    pattern: /^[\w\-. ]+\.(jpg|jpeg|png|gif|webp)$/i
  },
  imageSize: {
    maxSize: 50 * 1024 * 1024  // 50MB limit
  },
  emotionalState: ['confident', 'anxious', 'revenge', 'disciplined', 'fearful', 'greedy', 'impatient', 'focused', 'overwhelmed', 'calm'],
  coachingType: ['discipline', 'risk_management', 'emotional_control', 'patience', 'confidence_building', 'fear_management'],
  aiModel: ['gpt-4-vision', 'gpt-4', 'gpt-4-turbo', 'claude-3.5-sonnet', 'claude-3-opus'],
  status: ['sent', 'processing', 'completed', 'failed'],
  patternTags: {
    maxTags: 20,
    validTags: [
      'overtrading', 'revenge_trading', 'fomo', 'analysis_paralysis', 'risk_aversion',
      'overconfidence', 'confirmation_bias', 'anchoring', 'loss_aversion', 'recency_bias',
      'discipline_issues', 'emotional_trading', 'pattern_recognition', 'good_discipline',
      'proper_risk_management', 'patient_execution', 'objective_analysis'
    ]
  },
  retryCount: {
    max: 5
  }
};

// Default values
const DEFAULTS = {
  type: 'user',
  analysisMode: 'analysis',
  status: 'sent',
  retryCount: 0,
  imageMetadata: {},
  patternTags: []
};

class Message {
  constructor(messageData = {}) {
    this.id = messageData.id || null;
    this.conversationId = messageData.conversation_id || null;
    this.userId = messageData.user_id || null;
    this.parentMessageId = messageData.parent_message_id || null;
    
    // Message content
    this.content = messageData.content || null;
    this.type = messageData.type || DEFAULTS.type;
    
    // AI verdict system
    this.verdict = messageData.verdict || null;
    this.confidence = messageData.confidence || null;
    this.analysisMode = messageData.analysis_mode || DEFAULTS.analysisMode;
    
    // File attachments
    this.imageUrl = messageData.image_url || null;
    this.imageFilename = messageData.image_filename || null;
    this.imageSize = messageData.image_size || null;
    this.imageMetadata = messageData.image_metadata || { ...DEFAULTS.imageMetadata };
    
    // Psychology fields
    this.emotionalState = messageData.emotional_state || null;
    this.coachingType = messageData.coaching_type || null;
    this.patternTags = messageData.pattern_tags || [...DEFAULTS.patternTags];
    
    // AI processing metadata
    this.aiModel = messageData.ai_model || null;
    this.aiTokensUsed = messageData.ai_tokens_used || null;
    this.aiCostCents = messageData.ai_cost_cents || null;
    this.processingTimeMs = messageData.processing_time_ms || null;
    
    // Status and error handling
    this.status = messageData.status || DEFAULTS.status;
    this.errorMessage = messageData.error_message || null;
    this.retryCount = messageData.retry_count || DEFAULTS.retryCount;
    
    // Timestamps
    this.createdAt = messageData.created_at || null;
    this.updatedAt = messageData.updated_at || null;
    this.editedAt = messageData.edited_at || null;
  }

  /**
   * Validate message content
   * @param {string} content - Message content
   * @returns {boolean} True if valid
   */
  static validateContent(content) {
    if (!content && content !== '') return false; // Content required for user messages
    if (typeof content !== 'string') return false;
    if (content.length > VALIDATION_RULES.content.maxLength) return false;
    return true;
  }

  /**
   * Validate message type
   * @param {string} type - Message type
   * @returns {boolean} True if valid
   */
  static validateType(type) {
    if (!type) return false;
    return VALIDATION_RULES.type.includes(type);
  }

  /**
   * Validate AI verdict
   * @param {string} verdict - AI verdict
   * @returns {boolean} True if valid
   */
  static validateVerdict(verdict) {
    if (verdict === null || verdict === undefined) return true; // Verdict is optional
    return VALIDATION_RULES.verdict.includes(verdict);
  }

  /**
   * Validate confidence score
   * @param {number} confidence - Confidence score
   * @returns {boolean} True if valid
   */
  static validateConfidence(confidence) {
    if (confidence === null || confidence === undefined) return true; // Optional
    if (!Number.isInteger(confidence)) return false;
    return confidence >= VALIDATION_RULES.confidence.min && confidence <= VALIDATION_RULES.confidence.max;
  }

  /**
   * Validate analysis mode
   * @param {string} analysisMode - Analysis mode
   * @returns {boolean} True if valid
   */
  static validateAnalysisMode(analysisMode) {
    if (!analysisMode) return false;
    return VALIDATION_RULES.analysisMode.includes(analysisMode);
  }

  /**
   * Validate UUID format (for foreign keys)
   * @param {string} uuid - UUID string
   * @returns {boolean} True if valid
   */
  static validateUUID(uuid) {
    if (!uuid) return false;
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidPattern.test(uuid);
  }

  /**
   * Validate image filename
   * @param {string} filename - Image filename
   * @returns {boolean} True if valid
   */
  static validateImageFilename(filename) {
    if (!filename) return true; // Optional
    if (typeof filename !== 'string') return false;
    if (filename.length > VALIDATION_RULES.imageFilename.maxLength) return false;
    return VALIDATION_RULES.imageFilename.pattern.test(filename);
  }

  /**
   * Validate image size
   * @param {number} size - Image size in bytes
   * @returns {boolean} True if valid
   */
  static validateImageSize(size) {
    if (size === null || size === undefined) return true; // Optional
    if (!Number.isInteger(size) || size < 0) return false;
    return size <= VALIDATION_RULES.imageSize.maxSize;
  }

  /**
   * Validate image metadata JSONB
   * @param {Object} metadata - Image metadata object
   * @returns {boolean} True if valid
   */
  static validateImageMetadata(metadata) {
    if (!metadata) return true; // Optional
    if (typeof metadata !== 'object' || Array.isArray(metadata)) return false;
    
    try {
      const jsonString = JSON.stringify(metadata);
      if (jsonString.length > 10000) return false; // 10KB limit for metadata
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate emotional state
   * @param {string} emotionalState - Emotional state
   * @returns {boolean} True if valid
   */
  static validateEmotionalState(emotionalState) {
    if (!emotionalState) return true; // Optional
    return VALIDATION_RULES.emotionalState.includes(emotionalState);
  }

  /**
   * Validate coaching type
   * @param {string} coachingType - Coaching type
   * @returns {boolean} True if valid
   */
  static validateCoachingType(coachingType) {
    if (!coachingType) return true; // Optional
    return VALIDATION_RULES.coachingType.includes(coachingType);
  }

  /**
   * Validate pattern tags array
   * @param {Array} patternTags - Pattern tags array
   * @returns {boolean} True if valid
   */
  static validatePatternTags(patternTags) {
    if (!patternTags) return true; // Optional
    if (!Array.isArray(patternTags)) return false;
    if (patternTags.length > VALIDATION_RULES.patternTags.maxTags) return false;
    
    return patternTags.every(tag => 
      typeof tag === 'string' && 
      VALIDATION_RULES.patternTags.validTags.includes(tag)
    );
  }

  /**
   * Validate AI model
   * @param {string} aiModel - AI model name
   * @returns {boolean} True if valid
   */
  static validateAiModel(aiModel) {
    if (!aiModel) return true; // Optional
    return VALIDATION_RULES.aiModel.includes(aiModel);
  }

  /**
   * Validate processing status
   * @param {string} status - Processing status
   * @returns {boolean} True if valid
   */
  static validateStatus(status) {
    if (!status) return false;
    return VALIDATION_RULES.status.includes(status);
  }

  /**
   * Validate retry count
   * @param {number} retryCount - Retry count
   * @returns {boolean} True if valid
   */
  static validateRetryCount(retryCount) {
    if (retryCount === null || retryCount === undefined) return true;
    if (!Number.isInteger(retryCount) || retryCount < 0) return false;
    return retryCount <= VALIDATION_RULES.retryCount.max;
  }

  /**
   * Comprehensive validation of message data
   * @param {Object} messageData - Message data object
   * @returns {Object} Validation result with errors array
   */
  static validate(messageData) {
    const errors = [];

    // Required field validations
    if (!messageData.conversation_id) {
      errors.push('Conversation ID is required');
    } else if (!this.validateUUID(messageData.conversation_id)) {
      errors.push('Conversation ID must be a valid UUID');
    }

    if (!messageData.user_id) {
      errors.push('User ID is required');
    } else if (!this.validateUUID(messageData.user_id)) {
      errors.push('User ID must be a valid UUID');
    }

    if (!this.validateType(messageData.type)) {
      errors.push('Type must be one of: user, ai, system, training');
    }

    // Content validation - required for user messages, optional for others
    if (messageData.type === 'user') {
      if (!messageData.content || messageData.content.trim().length === 0) {
        errors.push('Content is required for user messages');
      }
    }
    
    if (messageData.content && !this.validateContent(messageData.content)) {
      errors.push('Content is too long or invalid');
    }

    // Optional field validations
    if (messageData.parent_message_id && !this.validateUUID(messageData.parent_message_id)) {
      errors.push('Parent message ID must be a valid UUID');
    }

    if (messageData.verdict && !this.validateVerdict(messageData.verdict)) {
      errors.push('Verdict must be one of: diamond, fire, skull');
    }

    if (messageData.confidence !== undefined && !this.validateConfidence(messageData.confidence)) {
      errors.push('Confidence must be an integer between 0 and 100');
    }

    if (messageData.analysis_mode && !this.validateAnalysisMode(messageData.analysis_mode)) {
      errors.push('Analysis mode must be one of: analysis, psychology, training');
    }

    if (messageData.image_filename && !this.validateImageFilename(messageData.image_filename)) {
      errors.push('Image filename is invalid or too long');
    }

    if (messageData.image_size !== undefined && !this.validateImageSize(messageData.image_size)) {
      errors.push('Image size is invalid or too large');
    }

    if (messageData.image_metadata && !this.validateImageMetadata(messageData.image_metadata)) {
      errors.push('Image metadata is invalid or too large');
    }

    if (messageData.emotional_state && !this.validateEmotionalState(messageData.emotional_state)) {
      errors.push('Emotional state is invalid');
    }

    if (messageData.coaching_type && !this.validateCoachingType(messageData.coaching_type)) {
      errors.push('Coaching type is invalid');
    }

    if (messageData.pattern_tags && !this.validatePatternTags(messageData.pattern_tags)) {
      errors.push('Pattern tags are invalid or too many');
    }

    if (messageData.ai_model && !this.validateAiModel(messageData.ai_model)) {
      errors.push('AI model is invalid');
    }

    if (messageData.status && !this.validateStatus(messageData.status)) {
      errors.push('Status must be one of: sent, processing, completed, failed');
    }

    if (messageData.retry_count !== undefined && !this.validateRetryCount(messageData.retry_count)) {
      errors.push('Retry count is invalid');
    }

    // Cross-field validations
    if (messageData.verdict && !messageData.confidence) {
      errors.push('Confidence score is required when verdict is provided');
    }

    if (messageData.image_url && !messageData.image_filename) {
      errors.push('Image filename is required when image URL is provided');
    }

    // AI processing field consistency
    if (messageData.ai_tokens_used !== undefined) {
      if (!Number.isInteger(messageData.ai_tokens_used) || messageData.ai_tokens_used < 0) {
        errors.push('AI tokens used must be a non-negative integer');
      }
    }

    if (messageData.ai_cost_cents !== undefined) {
      if (!Number.isInteger(messageData.ai_cost_cents) || messageData.ai_cost_cents < 0) {
        errors.push('AI cost must be a non-negative integer in cents');
      }
    }

    if (messageData.processing_time_ms !== undefined) {
      if (!Number.isInteger(messageData.processing_time_ms) || messageData.processing_time_ms < 0) {
        errors.push('Processing time must be a non-negative integer in milliseconds');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get message data for database storage
   * @returns {Object} Message data object for database
   */
  toDatabaseObject() {
    return {
      id: this.id,
      conversation_id: this.conversationId,
      user_id: this.userId,
      parent_message_id: this.parentMessageId,
      content: this.content,
      type: this.type,
      verdict: this.verdict,
      confidence: this.confidence,
      analysis_mode: this.analysisMode,
      image_url: this.imageUrl,
      image_filename: this.imageFilename,
      image_size: this.imageSize,
      image_metadata: this.imageMetadata,
      emotional_state: this.emotionalState,
      coaching_type: this.coachingType,
      pattern_tags: this.patternTags,
      ai_model: this.aiModel,
      ai_tokens_used: this.aiTokensUsed,
      ai_cost_cents: this.aiCostCents,
      processing_time_ms: this.processingTimeMs,
      status: this.status,
      error_message: this.errorMessage,
      retry_count: this.retryCount,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      edited_at: this.editedAt
    };
  }

  /**
   * Get message data for public API responses
   * @returns {Object} Safe message data object
   */
  toPublicObject() {
    return {
      id: this.id,
      conversation_id: this.conversationId,
      user_id: this.userId,
      parent_message_id: this.parentMessageId,
      content: this.content,
      type: this.type,
      verdict: this.verdict,
      confidence: this.confidence,
      analysis_mode: this.analysisMode,
      image_url: this.imageUrl,
      image_filename: this.imageFilename,
      image_size: this.imageSize,
      image_metadata: this.imageMetadata,
      emotional_state: this.emotionalState,
      coaching_type: this.coachingType,
      pattern_tags: this.patternTags,
      ai_model: this.aiModel,
      ai_tokens_used: this.aiTokensUsed,
      ai_cost_cents: this.aiCostCents,
      processing_time_ms: this.processingTimeMs,
      status: this.status,
      error_message: this.errorMessage,
      retry_count: this.retryCount,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      edited_at: this.editedAt
    };
  }

  /**
   * Check if message is from user
   * @returns {boolean} True if user message
   */
  isUserMessage() {
    return this.type === 'user';
  }

  /**
   * Check if message is from AI
   * @returns {boolean} True if AI message
   */
  isAiMessage() {
    return this.type === 'ai';
  }

  /**
   * Check if message has attachment
   * @returns {boolean} True if message has image attachment
   */
  hasAttachment() {
    return !!(this.imageUrl && this.imageFilename);
  }

  /**
   * Check if message has AI verdict
   * @returns {boolean} True if message has verdict
   */
  hasVerdict() {
    return !!(this.verdict && this.confidence !== null);
  }

  /**
   * Check if message is in psychology mode
   * @returns {boolean} True if psychology mode
   */
  isPsychologyMode() {
    return this.analysisMode === 'psychology';
  }

  /**
   * Check if message processing failed
   * @returns {boolean} True if processing failed
   */
  hasProcessingFailed() {
    return this.status === 'failed';
  }

  /**
   * Check if message is still processing
   * @returns {boolean} True if still processing
   */
  isProcessing() {
    return this.status === 'processing';
  }

  /**
   * Check if message processing is complete
   * @returns {boolean} True if processing completed
   */
  isProcessingComplete() {
    return this.status === 'completed';
  }

  /**
   * Get verdict emoji for display
   * @returns {string} Emoji representation of verdict
   */
  getVerdictEmoji() {
    const verdictEmojis = {
      diamond: '💎',
      fire: '🔥',
      skull: '💀'
    };
    return verdictEmojis[this.verdict] || '';
  }

  /**
   * Get confidence level description
   * @returns {string} Confidence level description
   */
  getConfidenceLevel() {
    if (this.confidence === null || this.confidence === undefined) return 'Unknown';
    if (this.confidence >= 90) return 'Very High';
    if (this.confidence >= 75) return 'High';
    if (this.confidence >= 50) return 'Medium';
    if (this.confidence >= 25) return 'Low';
    return 'Very Low';
  }

  /**
   * Get estimated cost in dollars from cents
   * @returns {number|null} Cost in dollars or null
   */
  getCostDollars() {
    return this.aiCostCents !== null ? this.aiCostCents / 100 : null;
  }

  /**
   * Update AI processing results
   * @param {Object} aiResults - AI processing results
   * @returns {boolean} True if update was successful
   */
  updateAiResults(aiResults) {
    try {
      if (aiResults.verdict) this.verdict = aiResults.verdict;
      if (aiResults.confidence !== undefined) this.confidence = aiResults.confidence;
      if (aiResults.emotional_state) this.emotionalState = aiResults.emotional_state;
      if (aiResults.coaching_type) this.coachingType = aiResults.coaching_type;
      if (aiResults.pattern_tags) this.patternTags = aiResults.pattern_tags;
      if (aiResults.ai_model) this.aiModel = aiResults.ai_model;
      if (aiResults.ai_tokens_used) this.aiTokensUsed = aiResults.ai_tokens_used;
      if (aiResults.ai_cost_cents) this.aiCostCents = aiResults.ai_cost_cents;
      if (aiResults.processing_time_ms) this.processingTimeMs = aiResults.processing_time_ms;
      
      this.status = 'completed';
      this.errorMessage = null;
      
      return true;
    } catch (error) {
      console.error('Failed to update AI results:', error);
      return false;
    }
  }

  /**
   * Mark message processing as failed
   * @param {string} errorMessage - Error message
   * @returns {void}
   */
  markAsFailed(errorMessage) {
    this.status = 'failed';
    this.errorMessage = errorMessage;
    this.retryCount += 1;
  }

  /**
   * Mark message as processing
   * @returns {void}
   */
  markAsProcessing() {
    this.status = 'processing';
    this.errorMessage = null;
  }

  /**
   * Check if message can be retried
   * @returns {boolean} True if can be retried
   */
  canRetry() {
    return this.status === 'failed' && this.retryCount < VALIDATION_RULES.retryCount.max;
  }

  /**
   * Get message summary for listings
   * @returns {Object} Message summary object
   */
  getSummary() {
    return {
      id: this.id,
      type: this.type,
      content: this.content ? this.content.substring(0, 100) + (this.content.length > 100 ? '...' : '') : null,
      verdict: this.verdict,
      confidence: this.confidence,
      has_attachment: this.hasAttachment(),
      status: this.status,
      created_at: this.createdAt
    };
  }
}

export default Message;