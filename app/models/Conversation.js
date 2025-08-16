/**
 * Conversation Model - Elite Trading Coach AI
 * PRD Reference: PRD-1.1.1.3-conversations-table.md
 * Task: BE-004 - Conversation model with validation and context management
 * Created: 2025-08-14
 * 
 * Implements secure conversation model with comprehensive validation,
 * JSONB context data management, and conversation lifecycle functionality.
 */

// Validation constants
const VALIDATION_RULES = {
  title: {
    maxLength: 255,
    pattern: /^[\w\s\-.,!?()]+$/  // Alphanumeric, spaces, and common punctuation
  },
  mode: ['analysis', 'psychology', 'training', 'planning'],
  status: ['active', 'archived', 'deleted'],
  contextData: {
    maxSize: 50000  // 50KB limit for JSONB context data
  }
};

// Default context data structure
const DEFAULT_CONTEXT = {
  trading_session_id: null,
  market_hours: null,
  trading_instruments: [],
  session_type: null,
  coaching_focus: [],
  last_mode_switch: null,
  preferences: {}
};

class Conversation {
  constructor(conversationData = {}) {
    this.id = conversationData.id || null;
    this.userId = conversationData.user_id || null;
    this.title = conversationData.title || null;
    this.mode = conversationData.mode || 'analysis';
    this.status = conversationData.status || 'active';
    this.contextData = conversationData.context_data || { ...DEFAULT_CONTEXT };
    this.lastMessageAt = conversationData.last_message_at || null;
    this.messageCount = conversationData.message_count || 0;
    this.createdAt = conversationData.created_at || null;
    this.updatedAt = conversationData.updated_at || null;
    this.archivedAt = conversationData.archived_at || null;
  }

  /**
   * Validate conversation title format and constraints
   * @param {string} title - Conversation title
   * @returns {boolean} True if valid
   */
  static validateTitle(title) {
    if (!title) return true; // Title is optional - can be auto-generated
    if (typeof title !== 'string') return false;
    if (title.length > VALIDATION_RULES.title.maxLength) return false;
    return VALIDATION_RULES.title.pattern.test(title);
  }

  /**
   * Validate conversation mode
   * @param {string} mode - Conversation mode
   * @returns {boolean} True if valid
   */
  static validateMode(mode) {
    if (!mode) return false; // Mode is required
    return VALIDATION_RULES.mode.includes(mode);
  }

  /**
   * Validate conversation status
   * @param {string} status - Conversation status
   * @returns {boolean} True if valid
   */
  static validateStatus(status) {
    if (!status) status = 'active'; // Default status
    return VALIDATION_RULES.status.includes(status);
  }

  /**
   * Validate user ID format (UUID)
   * @param {string} userId - User UUID
   * @returns {boolean} True if valid
   */
  static validateUserId(userId) {
    if (!userId) return false;
    // More flexible UUID pattern to accept any version
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidPattern.test(userId);
  }

  /**
   * Validate context data structure and size
   * @param {Object} contextData - JSONB context data
   * @returns {boolean} True if valid
   */
  static validateContextData(contextData) {
    if (!contextData) return true; // Context data is optional
    if (contextData === null) return true; // null is also acceptable
    if (typeof contextData !== 'object' || Array.isArray(contextData)) return false;
    
    try {
      const jsonString = JSON.stringify(contextData);
      if (jsonString.length > VALIDATION_RULES.contextData.maxSize) return false;
      
      // Validate known fields if present
      if (contextData.trading_instruments && !Array.isArray(contextData.trading_instruments)) return false;
      if (contextData.coaching_focus && !Array.isArray(contextData.coaching_focus)) return false;
      if (contextData.market_hours !== null && contextData.market_hours !== undefined && typeof contextData.market_hours !== 'boolean') return false;
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate message count
   * @param {number} messageCount - Message count
   * @returns {boolean} True if valid
   */
  static validateMessageCount(messageCount) {
    if (messageCount === null || messageCount === undefined) return true;
    return Number.isInteger(messageCount) && messageCount >= 0;
  }

  /**
   * Comprehensive validation of conversation data
   * @param {Object} conversationData - Conversation data object
   * @returns {Object} Validation result with errors array
   */
  static validate(conversationData) {
    const errors = [];

    // Required field validations
    if (!conversationData.user_id) {
      errors.push('User ID is required');
    } else if (!this.validateUserId(conversationData.user_id)) {
      errors.push('User ID must be a valid UUID');
    }

    // Optional field validations
    if (conversationData.title && !this.validateTitle(conversationData.title)) {
      errors.push('Title contains invalid characters or is too long');
    }

    if (conversationData.mode && !this.validateMode(conversationData.mode)) {
      errors.push('Mode must be one of: analysis, psychology, training, planning');
    }

    if (conversationData.status && !this.validateStatus(conversationData.status)) {
      errors.push('Status must be one of: active, archived, deleted');
    }

    if (conversationData.context_data && !this.validateContextData(conversationData.context_data)) {
      errors.push('Context data is invalid or too large');
    }

    if (conversationData.message_count !== undefined && !this.validateMessageCount(conversationData.message_count)) {
      errors.push('Message count must be a non-negative integer');
    }

    // Date field validations
    if (conversationData.last_message_at && !(conversationData.last_message_at instanceof Date) && isNaN(Date.parse(conversationData.last_message_at))) {
      errors.push('Last message timestamp is invalid');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get conversation data for database storage
   * @returns {Object} Conversation data object for database
   */
  toDatabaseObject() {
    return {
      id: this.id,
      user_id: this.userId,
      title: this.title,
      mode: this.mode,
      status: this.status,
      context_data: this.contextData,
      last_message_at: this.lastMessageAt,
      message_count: this.messageCount,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      archived_at: this.archivedAt
    };
  }

  /**
   * Get conversation data for public API responses
   * @returns {Object} Safe conversation data object
   */
  toPublicObject() {
    return {
      id: this.id,
      user_id: this.userId,
      title: this.title,
      mode: this.mode,
      status: this.status,
      context_data: this.contextData,
      last_message_at: this.lastMessageAt,
      message_count: this.messageCount,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      archived_at: this.archivedAt
    };
  }

  /**
   * Check if conversation is active (not archived or deleted)
   * @returns {boolean} True if conversation is active
   */
  isActive() {
    return this.status === 'active' && !this.archivedAt;
  }

  /**
   * Check if conversation is archived
   * @returns {boolean} True if conversation is archived
   */
  isArchived() {
    return this.status === 'archived' || this.archivedAt !== null;
  }

  /**
   * Check if conversation is deleted (soft delete)
   * @returns {boolean} True if conversation is deleted
   */
  isDeleted() {
    return this.status === 'deleted';
  }

  /**
   * Get conversation display title (fallback to auto-generated)
   * @returns {string} Display title
   */
  getDisplayTitle() {
    if (this.title) {
      return this.title;
    }
    
    // Generate fallback title based on mode and creation date
    const modeTitle = {
      analysis: 'Trade Analysis',
      psychology: 'Psychology Session',
      training: 'Training Session',
      planning: 'Trading Plan'
    };
    
    const date = this.createdAt ? new Date(this.createdAt).toLocaleDateString() : 'New';
    return `${modeTitle[this.mode] || 'Conversation'} - ${date}`;
  }

  /**
   * Update context data with validation
   * @param {Object} newContextData - New context data to merge
   * @returns {boolean} True if update was successful
   */
  updateContextData(newContextData) {
    // Create merged object for validation
    const mergedData = {
      ...this.contextData,
      ...newContextData
    };
    
    if (!Conversation.validateContextData(mergedData)) {
      return false;
    }
    
    // Merge with existing context data
    this.contextData = mergedData;
    
    return true;
  }

  /**
   * Set trading instruments in context
   * @param {Array<string>} instruments - Trading instruments array
   * @returns {boolean} True if update was successful
   */
  setTradingInstruments(instruments) {
    if (!Array.isArray(instruments)) return false;
    
    this.contextData = {
      ...this.contextData,
      trading_instruments: instruments
    };
    
    return true;
  }

  /**
   * Set coaching focus areas in context
   * @param {Array<string>} focusAreas - Coaching focus areas
   * @returns {boolean} True if update was successful
   */
  setCoachingFocus(focusAreas) {
    if (!Array.isArray(focusAreas)) return false;
    
    this.contextData = {
      ...this.contextData,
      coaching_focus: focusAreas
    };
    
    return true;
  }

  /**
   * Switch conversation mode and track the change
   * @param {string} newMode - New conversation mode
   * @returns {boolean} True if mode switch was successful
   */
  switchMode(newMode) {
    if (!Conversation.validateMode(newMode)) return false;
    if (this.mode === newMode) return true; // No change needed
    
    const oldMode = this.mode;
    this.mode = newMode;
    
    // Track mode switch in context data
    this.contextData = {
      ...this.contextData,
      last_mode_switch: new Date().toISOString(),
      previous_mode: oldMode
    };
    
    return true;
  }

  /**
   * Archive the conversation
   * @returns {void}
   */
  archive() {
    this.status = 'archived';
    this.archivedAt = new Date();
  }

  /**
   * Restore archived conversation to active
   * @returns {void}
   */
  restore() {
    if (this.status === 'archived') {
      this.status = 'active';
      this.archivedAt = null;
    }
  }

  /**
   * Soft delete the conversation
   * @returns {void}
   */
  softDelete() {
    this.status = 'deleted';
  }

  /**
   * Increment message count (called when new message is added)
   * @param {Date} messageTimestamp - Timestamp of the new message
   * @returns {void}
   */
  incrementMessageCount(messageTimestamp = new Date()) {
    this.messageCount += 1;
    this.lastMessageAt = messageTimestamp;
  }

  /**
   * Check if conversation has recent activity (within specified days)
   * @param {number} days - Number of days to check for activity
   * @returns {boolean} True if conversation has recent activity
   */
  hasRecentActivity(days = 7) {
    if (!this.lastMessageAt) return false;
    
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);
    
    return new Date(this.lastMessageAt) > daysAgo;
  }

  /**
   * Get conversation age in days
   * @returns {number} Age in days since creation
   */
  getAgeInDays() {
    if (!this.createdAt) return 0;
    
    const now = new Date();
    const created = new Date(this.createdAt);
    const diffTime = Math.abs(now - created);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Generate summary object for conversation listings
   * @returns {Object} Conversation summary object
   */
  getSummary() {
    return {
      id: this.id,
      title: this.getDisplayTitle(),
      mode: this.mode,
      status: this.status,
      message_count: this.messageCount,
      last_message_at: this.lastMessageAt,
      created_at: this.createdAt,
      has_recent_activity: this.hasRecentActivity(),
      age_days: this.getAgeInDays()
    };
  }
}

export default Conversation;