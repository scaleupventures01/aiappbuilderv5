/**
 * Passport OAuth Configuration
 * Sets up Google, GitHub, and Microsoft OAuth 2.0 strategies
 */

import passport from 'passport';
import GoogleStrategy from 'passport-google-oauth20';
import GitHubStrategy from 'passport-github2';
import MicrosoftStrategy from 'passport-microsoft';

import { config } from './config.mjs';
import { database } from './database.mjs';
import { logger, logOAuthEvent, logSecurityEvent } from './logger.mjs';

/**
 * Serialize user for session
 */
passport.serializeUser((user, done) => {
  logger.debug('Serializing user for session', { userId: user.id });
  done(null, user.id);
});

/**
 * Deserialize user from session
 */
passport.deserializeUser(async (userId, done) => {
  try {
    const user = await database.models.User.findByPk(userId, {
      include: [
        { 
          model: database.models.OAuthProvider, 
          as: 'oauthProviders',
          where: { isActive: true },
          required: false
        }
      ]
    });
    
    if (!user) {
      logger.warn('User not found during deserialization', { userId });
      return done(null, false);
    }
    
    if (!user.isActive) {
      logger.warn('Inactive user attempted session access', { userId });
      return done(null, false);
    }
    
    logger.debug('User deserialized from session', { userId: user.id });
    done(null, user);
  } catch (error) {
    logger.error('Error deserializing user:', error);
    done(error, null);
  }
});

/**
 * Google OAuth Strategy
 */
const googleStrategy = new GoogleStrategy({
  clientID: config.oauth.google.clientId,
  clientSecret: config.oauth.google.clientSecret,
  callbackURL: config.oauth.google.callbackURL,
  scope: config.oauth.google.scope,
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    logOAuthEvent('google', 'authentication_attempt', {
      profileId: profile.id,
      email: profile.emails?.[0]?.value,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    // Validate profile data
    if (!profile.emails || profile.emails.length === 0) {
      logSecurityEvent('oauth_invalid_profile', {
        provider: 'google',
        profileId: profile.id,
        reason: 'No email provided',
        ip: req.ip
      });
      return done(new Error('Email not provided by Google'), null);
    }
    
    const email = profile.emails[0].value;
    
    // Check if email is verified
    if (!profile.emails[0].verified) {
      logSecurityEvent('oauth_unverified_email', {
        provider: 'google',
        email,
        ip: req.ip
      });
      return done(new Error('Email not verified by Google'), null);
    }
    
    // Find or create user
    const user = await database.findOrCreateUser('google', profile);
    
    // Update OAuth tokens
    const oauthProvider = user.oauthProviders.find(p => p.provider === 'google');
    if (oauthProvider) {
      await oauthProvider.updateTokens(accessToken, refreshToken);
    }
    
    // Update user login tracking
    await user.updateLastLogin(req.ip);
    
    logOAuthEvent('google', 'authentication_success', {
      userId: user.id,
      email: user.email,
      ip: req.ip,
      loginCount: user.loginCount
    });
    
    return done(null, user);
    
  } catch (error) {
    logOAuthEvent('google', 'authentication_error', {
      error: error.message,
      profileId: profile.id,
      ip: req.ip
    });
    
    logger.error('Google OAuth error:', error);
    return done(error, null);
  }
});

/**
 * GitHub OAuth Strategy
 */
const githubStrategy = new GitHubStrategy({
  clientID: config.oauth.github.clientId,
  clientSecret: config.oauth.github.clientSecret,
  callbackURL: config.oauth.github.callbackURL,
  scope: config.oauth.github.scope,
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    logOAuthEvent('github', 'authentication_attempt', {
      profileId: profile.id,
      username: profile.username,
      email: profile.emails?.[0]?.value,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    // Validate profile data
    if (!profile.emails || profile.emails.length === 0) {
      logSecurityEvent('oauth_invalid_profile', {
        provider: 'github',
        profileId: profile.id,
        username: profile.username,
        reason: 'No email provided',
        ip: req.ip
      });
      return done(new Error('Email not provided by GitHub'), null);
    }
    
    // GitHub may provide multiple emails, find the primary one
    const primaryEmail = profile.emails.find(email => email.primary) || profile.emails[0];
    
    if (!primaryEmail.verified) {
      logSecurityEvent('oauth_unverified_email', {
        provider: 'github',
        email: primaryEmail.value,
        ip: req.ip
      });
      return done(new Error('Primary email not verified by GitHub'), null);
    }
    
    // Enhance profile with primary email
    profile.emails = [primaryEmail];
    
    // Find or create user
    const user = await database.findOrCreateUser('github', profile);
    
    // Update OAuth tokens
    const oauthProvider = user.oauthProviders.find(p => p.provider === 'github');
    if (oauthProvider) {
      await oauthProvider.updateTokens(accessToken, refreshToken);
    }
    
    // Update user login tracking
    await user.updateLastLogin(req.ip);
    
    logOAuthEvent('github', 'authentication_success', {
      userId: user.id,
      email: user.email,
      username: profile.username,
      ip: req.ip,
      loginCount: user.loginCount
    });
    
    return done(null, user);
    
  } catch (error) {
    logOAuthEvent('github', 'authentication_error', {
      error: error.message,
      profileId: profile.id,
      username: profile.username,
      ip: req.ip
    });
    
    logger.error('GitHub OAuth error:', error);
    return done(error, null);
  }
});

/**
 * Microsoft OAuth Strategy
 */
const microsoftStrategy = new MicrosoftStrategy({
  clientID: config.oauth.microsoft.clientId,
  clientSecret: config.oauth.microsoft.clientSecret,
  callbackURL: config.oauth.microsoft.callbackURL,
  scope: config.oauth.microsoft.scope,
  tenant: config.oauth.microsoft.tenant,
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    logOAuthEvent('microsoft', 'authentication_attempt', {
      profileId: profile.id,
      email: profile.emails?.[0]?.value,
      upn: profile._json?.userPrincipalName,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    // Validate profile data
    if (!profile.emails || profile.emails.length === 0) {
      // Try to get email from userPrincipalName
      if (profile._json?.userPrincipalName) {
        profile.emails = [{ value: profile._json.userPrincipalName, verified: true }];
      } else {
        logSecurityEvent('oauth_invalid_profile', {
          provider: 'microsoft',
          profileId: profile.id,
          reason: 'No email provided',
          ip: req.ip
        });
        return done(new Error('Email not provided by Microsoft'), null);
      }
    }
    
    const email = profile.emails[0].value;
    
    // Microsoft OAuth returns verified emails by default
    if (!profile.emails[0].verified) {
      profile.emails[0].verified = true;
    }
    
    // Find or create user
    const user = await database.findOrCreateUser('microsoft', profile);
    
    // Update OAuth tokens
    const oauthProvider = user.oauthProviders.find(p => p.provider === 'microsoft');
    if (oauthProvider) {
      await oauthProvider.updateTokens(accessToken, refreshToken);
    }
    
    // Update user login tracking
    await user.updateLastLogin(req.ip);
    
    logOAuthEvent('microsoft', 'authentication_success', {
      userId: user.id,
      email: user.email,
      upn: profile._json?.userPrincipalName,
      ip: req.ip,
      loginCount: user.loginCount
    });
    
    return done(null, user);
    
  } catch (error) {
    logOAuthEvent('microsoft', 'authentication_error', {
      error: error.message,
      profileId: profile.id,
      upn: profile._json?.userPrincipalName,
      ip: req.ip
    });
    
    logger.error('Microsoft OAuth error:', error);
    return done(error, null);
  }
});

/**
 * Initialize all Passport strategies
 */
export async function initializePassport() {
  try {
    // Validate OAuth configuration
    validateOAuthConfig();
    
    // Register strategies
    passport.use('google', googleStrategy);
    passport.use('github', githubStrategy);
    passport.use('microsoft', microsoftStrategy);
    
    logger.info('Passport OAuth strategies initialized', {
      providers: ['Google', 'GitHub', 'Microsoft']
    });
    
  } catch (error) {
    logger.error('Failed to initialize Passport strategies:', error);
    throw error;
  }
}

/**
 * Validate OAuth configuration
 */
function validateOAuthConfig() {
  const requiredConfigs = [
    { provider: 'Google', clientId: config.oauth.google.clientId, clientSecret: config.oauth.google.clientSecret },
    { provider: 'GitHub', clientId: config.oauth.github.clientId, clientSecret: config.oauth.github.clientSecret },
    { provider: 'Microsoft', clientId: config.oauth.microsoft.clientId, clientSecret: config.oauth.microsoft.clientSecret }
  ];
  
  for (const providerConfig of requiredConfigs) {
    if (!providerConfig.clientId || !providerConfig.clientSecret) {
      throw new Error(`Missing OAuth configuration for ${providerConfig.provider}`);
    }
    
    if (providerConfig.clientId.length < 10 || providerConfig.clientSecret.length < 10) {
      throw new Error(`Invalid OAuth configuration for ${providerConfig.provider}: credentials too short`);
    }
  }
  
  // Validate callback URLs
  const callbackUrls = [
    config.oauth.google.callbackURL,
    config.oauth.github.callbackURL,
    config.oauth.microsoft.callbackURL
  ];
  
  for (const url of callbackUrls) {
    try {
      new URL(url);
    } catch (error) {
      throw new Error(`Invalid OAuth callback URL: ${url}`);
    }
  }
  
  logger.info('OAuth configuration validated successfully');
}

/**
 * Get OAuth provider info for client
 */
export function getOAuthProviders() {
  return {
    google: {
      name: 'Google',
      authUrl: '/api/auth/google',
      scope: config.oauth.google.scope
    },
    github: {
      name: 'GitHub',
      authUrl: '/api/auth/github',
      scope: config.oauth.github.scope
    },
    microsoft: {
      name: 'Microsoft',
      authUrl: '/api/auth/microsoft',
      scope: config.oauth.microsoft.scope
    }
  };
}

/**
 * Middleware to ensure user is authenticated
 */
export function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  
  logger.warn('Unauthenticated access attempt', {
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  return res.status(401).json({
    error: 'Authentication required',
    message: 'You must be logged in to access this resource',
    providers: getOAuthProviders()
  });
}

/**
 * Middleware to ensure user has specific OAuth provider
 */
export function ensureOAuthProvider(provider) {
  return (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      });
    }
    
    const hasProvider = req.user.oauthProviders.some(p => 
      p.provider === provider && p.isActive
    );
    
    if (!hasProvider) {
      logger.warn('Access denied - OAuth provider not linked', {
        userId: req.user.id,
        requiredProvider: provider,
        userProviders: req.user.oauthProviders.map(p => p.provider),
        ip: req.ip
      });
      
      return res.status(403).json({
        error: 'OAuth provider required',
        message: `You must link your ${provider} account to access this resource`,
        requiredProvider: provider
      });
    }
    
    next();
  };
}

/**
 * Get user's OAuth provider tokens (for API calls)
 */
export async function getOAuthTokens(userId, provider) {
  try {
    const oauthProvider = await database.models.OAuthProvider.findOne({
      where: {
        userId,
        provider,
        isActive: true
      }
    });
    
    if (!oauthProvider) {
      throw new Error(`OAuth provider ${provider} not found for user`);
    }
    
    if (oauthProvider.isTokenExpired()) {
      logger.warn('OAuth token expired', {
        userId,
        provider,
        expiresAt: oauthProvider.tokenExpiresAt
      });
      
      // In a real implementation, you'd refresh the token here
      throw new Error('OAuth token expired');
    }
    
    await oauthProvider.update({ lastUsedAt: new Date() });
    
    return {
      accessToken: oauthProvider.accessToken,
      refreshToken: oauthProvider.refreshToken,
      expiresAt: oauthProvider.tokenExpiresAt,
      scope: oauthProvider.scope
    };
    
  } catch (error) {
    logger.error('Error getting OAuth tokens:', error);
    throw error;
  }
}

export default passport;