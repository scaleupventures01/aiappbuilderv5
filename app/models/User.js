/**
 * User Model - Elite Trading Coach AI
 * PRD Reference: PRD-1.1.1.2-users-table.md
 * Task: BE-004 - User model with bcrypt password hashing
 * Created: 2025-08-14
 * 
 * Implements secure user model with bcrypt password hashing (work factor 12),
 * input validation, and comprehensive user management functionality.
 */

import bcrypt from 'bcrypt';

// Security configuration - work factor 12 for 250-500ms hashing time
const BCRYPT_WORK_FACTOR = 12;

// Validation constants
const VALIDATION_RULES = {
  email: {
    maxLength: 255,
    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  },
  username: {
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_]+$/
  },
  password: {
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
  },
  firstName: {
    maxLength: 100,
    pattern: /^[a-zA-Z\s'-]+$/
  },
  lastName: {
    maxLength: 100,
    pattern: /^[a-zA-Z\s'-]+$/
  },
  timezone: {
    // IANA timezone identifiers
    validTimezones: [
      'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
      'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Zurich',
      'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Hong_Kong', 'Asia/Singapore',
      'Australia/Sydney', 'Australia/Melbourne', 'UTC'
    ]
  },
  tradingExperience: ['beginner', 'intermediate', 'advanced', 'professional'],
  subscriptionTier: ['free', 'beta', 'founder', 'pro']
};

class User {
  constructor(userData = {}) {
    this.id = userData.id || null;
    this.email = userData.email || null;
    this.username = userData.username || null;
    this.passwordHash = userData.password_hash || null;
    this.firstName = userData.first_name || null;
    this.lastName = userData.last_name || null;
    this.avatarUrl = userData.avatar_url || null;
    this.timezone = userData.timezone || 'America/New_York';
    this.tradingExperience = userData.trading_experience || null;
    this.subscriptionTier = userData.subscription_tier || 'founder';
    this.isActive = userData.is_active !== undefined ? userData.is_active : true;
    this.emailVerified = userData.email_verified !== undefined ? userData.email_verified : false;
    this.lastLogin = userData.last_login || null;
    this.lastActive = userData.last_active || null;
    this.createdAt = userData.created_at || null;
    this.updatedAt = userData.updated_at || null;
    this.deletedAt = userData.deleted_at || null;
  }

  /**
     * Hash password using bcrypt with work factor 12
     * @param {string} plainPassword - Plain text password
     * @returns {Promise<string>} Bcrypt hash
     * @throws {Error} If password is invalid or hashing fails
     */
  static async hashPassword(plainPassword) {
    try {
      if (!plainPassword) {
        throw new Error('Password is required');
      }

      // Validate password strength
      if (!this.validatePassword(plainPassword)) {
        throw new Error('Password does not meet security requirements');
      }

      // Generate salt and hash with work factor 12
      const hash = await bcrypt.hash(plainPassword, BCRYPT_WORK_FACTOR);
            
      // Verify hash was created properly
      if (!hash || hash.length < 60) {
        throw new Error('Failed to generate secure password hash');
      }

      return hash;
    } catch (error) {
      throw new Error(`Password hashing failed: ${error.message}`);
    }
  }

  /**
     * Verify password against stored hash
     * @param {string} plainPassword - Plain text password to verify
     * @param {string} hash - Stored bcrypt hash
     * @returns {Promise<boolean>} True if password matches
     */
  static async verifyPassword(plainPassword, hash) {
    try {
      if (!plainPassword || !hash) {
        return false;
      }

      return await bcrypt.compare(plainPassword, hash);
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }

  /**
     * Set password for user instance
     * @param {string} plainPassword - Plain text password
     * @returns {Promise<void>}
     */
  async setPassword(plainPassword) {
    this.passwordHash = await User.hashPassword(plainPassword);
  }

  /**
     * Verify password for user instance
     * @param {string} plainPassword - Plain text password
     * @returns {Promise<boolean>} True if password matches
     */
  async verifyPassword(plainPassword) {
    return User.verifyPassword(plainPassword, this.passwordHash);
  }

  /**
     * Validate email format and constraints
     * @param {string} email - Email address
     * @returns {boolean} True if valid
     */
  static validateEmail(email) {
    if (!email || typeof email !== 'string') return false;
    if (email.length > VALIDATION_RULES.email.maxLength) return false;
    return VALIDATION_RULES.email.pattern.test(email);
  }

  /**
     * Validate username format and constraints
     * @param {string} username - Username
     * @returns {boolean} True if valid
     */
  static validateUsername(username) {
    if (!username || typeof username !== 'string') return false;
    if (username.length < VALIDATION_RULES.username.minLength) return false;
    if (username.length > VALIDATION_RULES.username.maxLength) return false;
    return VALIDATION_RULES.username.pattern.test(username);
  }

  /**
     * Validate password strength
     * @param {string} password - Password
     * @returns {boolean} True if valid
     */
  static validatePassword(password) {
    if (!password || typeof password !== 'string') return false;
    if (password.length < VALIDATION_RULES.password.minLength) return false;
    return VALIDATION_RULES.password.pattern.test(password);
  }

  /**
     * Validate first name
     * @param {string} firstName - First name
     * @returns {boolean} True if valid
     */
  static validateFirstName(firstName) {
    if (!firstName) return true; // Optional field
    if (typeof firstName !== 'string') return false;
    if (firstName.length > VALIDATION_RULES.firstName.maxLength) return false;
    return VALIDATION_RULES.firstName.pattern.test(firstName);
  }

  /**
     * Validate last name
     * @param {string} lastName - Last name
     * @returns {boolean} True if valid
     */
  static validateLastName(lastName) {
    if (!lastName) return true; // Optional field
    if (typeof lastName !== 'string') return false;
    if (lastName.length > VALIDATION_RULES.lastName.maxLength) return false;
    return VALIDATION_RULES.lastName.pattern.test(lastName);
  }

  /**
     * Validate timezone
     * @param {string} timezone - IANA timezone identifier
     * @returns {boolean} True if valid
     */
  static validateTimezone(timezone) {
    if (!timezone) return true; // Will default to America/New_York
    return VALIDATION_RULES.timezone.validTimezones.includes(timezone);
  }

  /**
     * Validate trading experience level
     * @param {string} experience - Trading experience
     * @returns {boolean} True if valid
     */
  static validateTradingExperience(experience) {
    if (!experience) return true; // Optional field
    return VALIDATION_RULES.tradingExperience.includes(experience);
  }

  /**
     * Validate subscription tier
     * @param {string} tier - Subscription tier
     * @returns {boolean} True if valid
     */
  static validateSubscriptionTier(tier) {
    if (!tier) tier = 'founder'; // Default value
    return VALIDATION_RULES.subscriptionTier.includes(tier);
  }

  /**
     * Comprehensive validation of user data
     * @param {Object} userData - User data object
     * @returns {Object} Validation result with errors array
     */
  static validate(userData) {
    const errors = [];

    // Required field validations
    if (!userData.email) {
      errors.push('Email is required');
    } else if (!this.validateEmail(userData.email)) {
      errors.push('Email format is invalid');
    }

    if (!userData.username) {
      errors.push('Username is required');
    } else if (!this.validateUsername(userData.username)) {
      errors.push('Username must be 3-50 characters, alphanumeric and underscores only');
    }

    // Optional field validations
    if (userData.first_name && !this.validateFirstName(userData.first_name)) {
      errors.push('First name contains invalid characters');
    }

    if (userData.last_name && !this.validateLastName(userData.last_name)) {
      errors.push('Last name contains invalid characters');
    }

    if (userData.timezone && !this.validateTimezone(userData.timezone)) {
      errors.push('Invalid timezone identifier');
    }

    if (userData.trading_experience && !this.validateTradingExperience(userData.trading_experience)) {
      errors.push('Invalid trading experience level');
    }

    if (userData.subscription_tier && !this.validateSubscriptionTier(userData.subscription_tier)) {
      errors.push('Invalid subscription tier');
    }

    // Avatar URL validation (basic URL format)
    if (userData.avatar_url && typeof userData.avatar_url === 'string') {
      try {
        new URL(userData.avatar_url);
      } catch {
        errors.push('Avatar URL is not a valid URL');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
     * Get user data for database storage (excludes sensitive fields)
     * @returns {Object} User data object for database
     */
  toDatabaseObject() {
    return {
      id: this.id,
      email: this.email?.toLowerCase(), // Normalize email
      username: this.username?.toLowerCase(), // Normalize username
      password_hash: this.passwordHash,
      first_name: this.firstName,
      last_name: this.lastName,
      avatar_url: this.avatarUrl,
      timezone: this.timezone,
      trading_experience: this.tradingExperience,
      subscription_tier: this.subscriptionTier,
      is_active: this.isActive,
      email_verified: this.emailVerified,
      last_login: this.lastLogin,
      last_active: this.lastActive,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      deleted_at: this.deletedAt
    };
  }

  /**
     * Get user data for public API responses (excludes sensitive fields)
     * @returns {Object} Safe user data object
     */
  toPublicObject() {
    return {
      id: this.id,
      email: this.email,
      username: this.username,
      first_name: this.firstName,
      last_name: this.lastName,
      avatar_url: this.avatarUrl,
      timezone: this.timezone,
      trading_experience: this.tradingExperience,
      subscription_tier: this.subscriptionTier,
      is_active: this.isActive,
      email_verified: this.emailVerified,
      last_active: this.lastActive,
      created_at: this.createdAt,
      updated_at: this.updatedAt
    };
  }

  /**
     * Check if user account is active and not soft deleted
     * @returns {boolean} True if user is active
     */
  isActiveUser() {
    return this.isActive && !this.deletedAt;
  }

  /**
     * Check if user has completed basic profile
     * @returns {boolean} True if profile is complete
     */
  hasCompleteProfile() {
    return !!(this.firstName && this.lastName && this.tradingExperience);
  }

  /**
     * Get full display name
     * @returns {string} Full name or username fallback
     */
  getDisplayName() {
    if (this.firstName && this.lastName) {
      return `${this.firstName} ${this.lastName}`;
    }
    return this.username;
  }

  /**
     * Update last active timestamp
     * @returns {void}
     */
  updateLastActive() {
    this.lastActive = new Date();
  }

  /**
     * Mark user as soft deleted
     * @returns {void}
     */
  softDelete() {
    this.deletedAt = new Date();
    this.isActive = false;
  }

  /**
     * Restore soft deleted user
     * @returns {void}
     */
  restore() {
    this.deletedAt = null;
    this.isActive = true;
  }
}

export default User;