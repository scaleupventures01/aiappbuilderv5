/**
 * Speed Preference API Endpoints - Elite Trading Coach AI
 * PRD Reference: PRD-1.2.6-gpt5-speed-selection.md
 * Description: API endpoints for managing user speed preferences
 * Created: 2025-08-15
 */

import express from 'express';
import { authenticateToken, requireEmailVerification } from '../../middleware/auth.js';
import { asyncHandler } from '../../server/middleware/error-handler.js';
import { 
  getUserSpeedPreference, 
  updateUserSpeedPreference 
} from '../../db/queries/speed-preferences.js';
import { updateLastActive } from '../../db/queries/users.js';

const router = express.Router();

/**
 * Input validation middleware for speed preference
 */
const validateSpeedPreference = (req, res, next) => {
  const { speedPreference } = req.body;
  
  if (!speedPreference) {
    return res.status(400).json({
      success: false,
      error: 'speedPreference is required',
      code: 'VALIDATION_ERROR'
    });
  }
  
  const validSpeedModes = ['super_fast', 'fast', 'balanced', 'high_accuracy'];
  if (!validSpeedModes.includes(speedPreference)) {
    return res.status(400).json({
      success: false,
      error: `Invalid speed preference. Must be one of: ${validSpeedModes.join(', ')}`,
      code: 'VALIDATION_ERROR',
      validOptions: validSpeedModes
    });
  }
  
  next();
};

/**
 * GET /api/users/speed-preference
 * Get current user's speed preference
 */
router.get('/',
  authenticateToken,
  requireEmailVerification,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    try {
      console.log(`🔧 Getting speed preference for user ${userId}`);
      
      const preferenceData = await getUserSpeedPreference(userId);
      
      // Update user's last active timestamp (non-blocking)
      updateLastActive(userId).catch(error => {
        console.warn('Failed to update last active:', error.message);
      });
      
      res.json({
        success: true,
        data: {
          speedPreference: preferenceData.speedPreference,
          subscriptionTier: preferenceData.subscriptionTier,
          updatedAt: preferenceData.updatedAt
        },
        metadata: {
          userId: preferenceData.userId,
          timestamp: new Date().toISOString(),
          availableOptions: [
            {
              value: 'super_fast',
              displayName: 'Super Fast',
              description: 'Instant analysis with minimal reasoning',
              targetTime: '0.5-1.5 seconds'
            },
            {
              value: 'fast',
              displayName: 'Fast',
              description: 'Quick analysis focusing on obvious signals',
              targetTime: '1-2 seconds'
            },
            {
              value: 'balanced',
              displayName: 'Balanced',
              description: 'Thorough analysis considering multiple indicators',
              targetTime: '2-4 seconds'
            },
            {
              value: 'high_accuracy',
              displayName: 'High Accuracy',
              description: 'Comprehensive analysis with deep reasoning',
              targetTime: '4-8 seconds'
            }
          ]
        }
      });
      
    } catch (error) {
      console.error(`❌ Failed to get speed preference for user ${userId}:`, error.message);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve speed preference',
        code: 'GET_PREFERENCE_FAILED',
        timestamp: new Date().toISOString()
      });
    }
  })
);

/**
 * PUT /api/users/speed-preference
 * Update current user's speed preference
 */
router.put('/',
  authenticateToken,
  requireEmailVerification,
  validateSpeedPreference,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { speedPreference } = req.body;
    
    try {
      console.log(`🔧 Updating speed preference for user ${userId} to: ${speedPreference}`);
      
      const updatedData = await updateUserSpeedPreference(userId, speedPreference);
      
      // Update user's last active timestamp (non-blocking)
      updateLastActive(userId).catch(error => {
        console.warn('Failed to update last active:', error.message);
      });
      
      res.json({
        success: true,
        message: 'Speed preference updated successfully',
        data: {
          speedPreference: updatedData.speedPreference,
          subscriptionTier: updatedData.subscriptionTier,
          updatedAt: updatedData.updatedAt
        },
        metadata: {
          userId: updatedData.userId,
          timestamp: new Date().toISOString(),
          previousValue: req.body.previousValue || null, // Client can send previous value for change tracking
          changeReason: req.body.reason || 'user_preference' // Client can send reason for the change
        }
      });
      
    } catch (error) {
      console.error(`❌ Failed to update speed preference for user ${userId}:`, error.message);
      
      let statusCode = 500;
      let errorCode = 'UPDATE_PREFERENCE_FAILED';
      
      if (error.message.includes('Invalid speed preference')) {
        statusCode = 400;
        errorCode = 'VALIDATION_ERROR';
      } else if (error.message.includes('User not found')) {
        statusCode = 404;
        errorCode = 'USER_NOT_FOUND';
      }
      
      res.status(statusCode).json({
        success: false,
        error: error.message,
        code: errorCode,
        timestamp: new Date().toISOString()
      });
    }
  })
);

/**
 * GET /api/users/speed-preference/options
 * Get available speed preference options with details
 */
router.get('/options',
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: {
        speedModes: [
          {
            value: 'super_fast',
            displayName: 'Super Fast',
            description: 'Instant analysis with minimal reasoning',
            targetTime: '0.5-1.5 seconds',
            costMultiplier: 0.8,
            reasoningEffort: 'low',
            useCase: 'Quick decisions, obvious patterns'
          },
          {
            value: 'fast',
            displayName: 'Fast',
            description: 'Quick analysis focusing on obvious signals',
            targetTime: '1-2 seconds',
            costMultiplier: 0.9,
            reasoningEffort: 'low',
            useCase: 'Standard trading decisions'
          },
          {
            value: 'balanced',
            displayName: 'Balanced',
            description: 'Thorough analysis considering multiple indicators',
            targetTime: '2-4 seconds',
            costMultiplier: 1.0,
            reasoningEffort: 'medium',
            useCase: 'Most trading scenarios (recommended)',
            recommended: true
          },
          {
            value: 'high_accuracy',
            displayName: 'High Accuracy',
            description: 'Comprehensive analysis with deep reasoning',
            targetTime: '4-8 seconds',
            costMultiplier: 1.3,
            reasoningEffort: 'high',
            useCase: 'Complex patterns, high-stakes trades'
          }
        ],
        defaultMode: 'balanced',
        notes: [
          'Cost multipliers are applied to base analysis pricing',
          'Target times may vary based on chart complexity and server load',
          'Higher accuracy modes provide more detailed reasoning'
        ]
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
  })
);

export default router;