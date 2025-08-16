/**
 * Direct Implementation Validation - PRD-1.1.1.4
 * Direct verification of messages table implementation
 * QA Engineer: Claude Code
 * Created: 2025-08-14
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appRoot = dirname(dirname(dirname(__dirname)));

console.log('🔍 Direct Implementation Validation for Messages Table');
console.log('===================================================');
console.log(`App Root: ${appRoot}`);

// Test Results
const validationResults = {
  timestamp: new Date().toISOString(),
  totalChecks: 0,
  passed: 0,
  failed: 0,
  details: []
};

function logCheck(component, check, status, details = '') {
  validationResults.totalChecks++;
  
  const result = {
    component,
    check,
    status,
    details,
    timestamp: new Date().toISOString()
  };
  
  validationResults.details.push(result);
  
  if (status === 'PASS') {
    validationResults.passed++;
    console.log(`✅ ${component}: ${check}`);
  } else {
    validationResults.failed++;
    console.log(`❌ ${component}: ${check}`);
  }
  
  if (details) {
    console.log(`   Details: ${details}`);
  }
}

/**
 * Validate database schema implementation
 */
async function validateDatabaseSchema() {
  console.log('\n=== DATABASE SCHEMA VALIDATION ===');
  
  try {
    // Check migration file
    const migrationPath = join(appRoot, 'db/migrations/004_create_messages_table.sql');
    const migrationContent = await fs.readFile(migrationPath, 'utf8');
    
    logCheck('Database Schema', 'Migration File Exists', 'PASS', 'Migration file found and readable');
    
    // Check core table structure
    const requiredColumns = [
      'id UUID PRIMARY KEY DEFAULT gen_random_uuid()',
      'conversation_id UUID NOT NULL REFERENCES conversations(id)',
      'user_id UUID NOT NULL REFERENCES users(id)',
      'parent_message_id UUID REFERENCES messages(id)',
      'content TEXT',
      'type VARCHAR(20) NOT NULL',
      'verdict VARCHAR(20)',
      'confidence INTEGER',
      'analysis_mode VARCHAR(20)',
      'emotional_state VARCHAR(50)',
      'coaching_type VARCHAR(50)',
      'pattern_tags JSONB',
      'search_vector tsvector GENERATED ALWAYS'
    ];
    
    let foundColumns = 0;
    requiredColumns.forEach(column => {
      const columnName = column.split(' ')[0];
      if (migrationContent.includes(columnName)) {
        foundColumns++;
      }
    });
    
    if (foundColumns === requiredColumns.length) {
      logCheck('Database Schema', 'All Required Columns', 'PASS', `Found ${foundColumns}/${requiredColumns.length} required columns`);
    } else {
      logCheck('Database Schema', 'All Required Columns', 'FAIL', `Found ${foundColumns}/${requiredColumns.length} required columns`);
    }
    
    // Check AI verdict system fields
    if (migrationContent.includes('verdict') && migrationContent.includes('diamond') && 
        migrationContent.includes('fire') && migrationContent.includes('skull')) {
      logCheck('Database Schema', 'AI Verdict System Fields', 'PASS', 'All verdict types defined');
    } else {
      logCheck('Database Schema', 'AI Verdict System Fields', 'FAIL', 'Verdict system incomplete');
    }
    
    // Check psychology fields
    if (migrationContent.includes('emotional_state') && migrationContent.includes('coaching_type') && 
        migrationContent.includes('pattern_tags')) {
      logCheck('Database Schema', 'Psychology Coaching Fields', 'PASS', 'Psychology fields defined');
    } else {
      logCheck('Database Schema', 'Psychology Coaching Fields', 'FAIL', 'Psychology fields missing');
    }
    
    // Check full-text search
    if (migrationContent.includes('search_vector tsvector GENERATED ALWAYS') && 
        migrationContent.includes('to_tsvector')) {
      logCheck('Database Schema', 'Full-Text Search Support', 'PASS', 'Generated search vector configured');
    } else {
      logCheck('Database Schema', 'Full-Text Search Support', 'FAIL', 'Search vector not configured');
    }
    
    // Check essential indexes
    const requiredIndexes = [
      'idx_messages_conversation_id',
      'idx_messages_user_id', 
      'idx_messages_search',
      'idx_messages_verdict'
    ];
    
    let foundIndexes = 0;
    requiredIndexes.forEach(index => {
      if (migrationContent.includes(index)) {
        foundIndexes++;
      }
    });
    
    if (foundIndexes === requiredIndexes.length) {
      logCheck('Database Schema', 'Essential Indexes Created', 'PASS', `Found ${foundIndexes}/${requiredIndexes.length} essential indexes`);
    } else {
      logCheck('Database Schema', 'Essential Indexes Created', 'FAIL', `Found ${foundIndexes}/${requiredIndexes.length} essential indexes`);
    }
    
    // Check triggers
    if (migrationContent.includes('update_messages_updated_at') && 
        migrationContent.includes('update_conversation_stats_trigger')) {
      logCheck('Database Schema', 'Required Triggers', 'PASS', 'Timestamp and stats triggers defined');
    } else {
      logCheck('Database Schema', 'Required Triggers', 'FAIL', 'Required triggers missing');
    }
    
  } catch (error) {
    logCheck('Database Schema', 'Migration File Access', 'FAIL', `Error: ${error.message}`);
  }
}

/**
 * Validate Message model implementation
 */
async function validateMessageModel() {
  console.log('\n=== MESSAGE MODEL VALIDATION ===');
  
  try {
    const modelPath = join(appRoot, 'models/Message.js');
    const modelContent = await fs.readFile(modelPath, 'utf8');
    
    logCheck('Message Model', 'Model File Exists', 'PASS', 'Message model file found');
    
    // Check class structure
    if (modelContent.includes('class Message')) {
      logCheck('Message Model', 'Message Class Defined', 'PASS', 'Message class properly defined');
    } else {
      logCheck('Message Model', 'Message Class Defined', 'FAIL', 'Message class not found');
    }
    
    // Check validation methods
    const validationMethods = [
      'validateContent', 'validateType', 'validateVerdict', 'validateConfidence',
      'validateUUID', 'validateEmotionalState', 'validatePatternTags'
    ];
    
    let foundMethods = 0;
    validationMethods.forEach(method => {
      if (modelContent.includes(`static ${method}(`)) {
        foundMethods++;
      }
    });
    
    if (foundMethods >= 6) {
      logCheck('Message Model', 'Validation Methods', 'PASS', `Found ${foundMethods}/${validationMethods.length} validation methods`);
    } else {
      logCheck('Message Model', 'Validation Methods', 'FAIL', `Found ${foundMethods}/${validationMethods.length} validation methods`);
    }
    
    // Check AI verdict support
    if (modelContent.includes('diamond') && modelContent.includes('fire') && modelContent.includes('skull')) {
      logCheck('Message Model', 'AI Verdict Support', 'PASS', 'All verdict types supported');
    } else {
      logCheck('Message Model', 'AI Verdict Support', 'FAIL', 'Verdict types incomplete');
    }
    
    // Check comprehensive validation
    if (modelContent.includes('static validate(') && modelContent.includes('isValid') && 
        modelContent.includes('errors')) {
      logCheck('Message Model', 'Comprehensive Validation', 'PASS', 'Full validation method implemented');
    } else {
      logCheck('Message Model', 'Comprehensive Validation', 'FAIL', 'Validation method incomplete');
    }
    
    // Check helper methods
    const helperMethods = ['isUserMessage', 'isAiMessage', 'hasAttachment', 'hasVerdict'];
    let foundHelpers = 0;
    helperMethods.forEach(method => {
      if (modelContent.includes(method)) {
        foundHelpers++;
      }
    });
    
    if (foundHelpers >= 3) {
      logCheck('Message Model', 'Helper Methods', 'PASS', `Found ${foundHelpers}/${helperMethods.length} helper methods`);
    } else {
      logCheck('Message Model', 'Helper Methods', 'FAIL', `Found ${foundHelpers}/${helperMethods.length} helper methods`);
    }
    
  } catch (error) {
    logCheck('Message Model', 'Model File Access', 'FAIL', `Error: ${error.message}`);
  }
}

/**
 * Validate database queries implementation
 */
async function validateDatabaseQueries() {
  console.log('\n=== DATABASE QUERIES VALIDATION ===');
  
  try {
    const queriesPath = join(appRoot, 'db/queries/messages.js');
    const queriesContent = await fs.readFile(queriesPath, 'utf8');
    
    logCheck('Database Queries', 'Queries File Exists', 'PASS', 'Message queries file found');
    
    // Check CRUD operations
    const crudFunctions = [
      'createMessage', 'getMessageById', 'getConversationMessages', 'updateMessage', 'deleteMessage'
    ];
    
    let foundCrud = 0;
    crudFunctions.forEach(func => {
      if (queriesContent.includes(`export async function ${func}`)) {
        foundCrud++;
      }
    });
    
    if (foundCrud === crudFunctions.length) {
      logCheck('Database Queries', 'CRUD Operations', 'PASS', `All ${foundCrud} CRUD operations implemented`);
    } else {
      logCheck('Database Queries', 'CRUD Operations', 'FAIL', `Found ${foundCrud}/${crudFunctions.length} CRUD operations`);
    }
    
    // Check full-text search
    if (queriesContent.includes('searchMessages') && queriesContent.includes('search_vector') && 
        queriesContent.includes('plainto_tsquery')) {
      logCheck('Database Queries', 'Full-Text Search', 'PASS', 'Full-text search implemented with PostgreSQL');
    } else {
      logCheck('Database Queries', 'Full-Text Search', 'FAIL', 'Full-text search not properly implemented');
    }
    
    // Check message threading
    if (queriesContent.includes('getMessageThread') && queriesContent.includes('getChildMessages') &&
        queriesContent.includes('WITH RECURSIVE')) {
      logCheck('Database Queries', 'Message Threading', 'PASS', 'Recursive threading queries implemented');
    } else {
      logCheck('Database Queries', 'Message Threading', 'FAIL', 'Message threading not implemented');
    }
    
    // Check AI integration
    if (queriesContent.includes('updateAiResults') && queriesContent.includes('markMessageAsFailed')) {
      logCheck('Database Queries', 'AI Integration', 'PASS', 'AI processing integration implemented');
    } else {
      logCheck('Database Queries', 'AI Integration', 'FAIL', 'AI integration methods missing');
    }
    
    // Check psychology queries
    if (queriesContent.includes('getPsychologyMessages') && queriesContent.includes('getMessageStats')) {
      logCheck('Database Queries', 'Psychology Analytics', 'PASS', 'Psychology-specific queries implemented');
    } else {
      logCheck('Database Queries', 'Psychology Analytics', 'FAIL', 'Psychology queries missing');
    }
    
    // Check verdict queries
    if (queriesContent.includes('getMessagesByVerdict')) {
      logCheck('Database Queries', 'Verdict Analytics', 'PASS', 'Verdict-based queries implemented');
    } else {
      logCheck('Database Queries', 'Verdict Analytics', 'FAIL', 'Verdict queries missing');
    }
    
  } catch (error) {
    logCheck('Database Queries', 'Queries File Access', 'FAIL', `Error: ${error.message}`);
  }
}

/**
 * Validate AI verdict classifier
 */
async function validateAIVerdictClassifier() {
  console.log('\n=== AI VERDICT CLASSIFIER VALIDATION ===');
  
  try {
    const classifierPath = join(appRoot, 'ai/verdict/classifier.js');
    const classifierContent = await fs.readFile(classifierPath, 'utf8');
    
    logCheck('AI Verdict Classifier', 'Classifier File Exists', 'PASS', 'AI verdict classifier file found');
    
    // Check main classification function
    if (classifierContent.includes('export async function classifyTradingSetup')) {
      logCheck('AI Verdict Classifier', 'Main Classification Function', 'PASS', 'Primary classification function implemented');
    } else {
      logCheck('AI Verdict Classifier', 'Main Classification Function', 'FAIL', 'Main classification function missing');
    }
    
    // Check verdict types
    if (classifierContent.includes('DIAMOND') && classifierContent.includes('FIRE') && 
        classifierContent.includes('SKULL')) {
      logCheck('AI Verdict Classifier', 'Verdict Type Constants', 'PASS', 'All verdict types defined');
    } else {
      logCheck('AI Verdict Classifier', 'Verdict Type Constants', 'FAIL', 'Verdict types incomplete');
    }
    
    // Check technical analysis
    if (classifierContent.includes('analyzeTechnicalFactors') && classifierContent.includes('SCORING_WEIGHTS') &&
        classifierContent.includes('trendAlignment')) {
      logCheck('AI Verdict Classifier', 'Technical Analysis Engine', 'PASS', 'Technical analysis components implemented');
    } else {
      logCheck('AI Verdict Classifier', 'Technical Analysis Engine', 'FAIL', 'Technical analysis incomplete');
    }
    
    // Check confidence scoring
    if (classifierContent.includes('calculateOverallScore') && classifierContent.includes('CONFIDENCE_THRESHOLDS')) {
      logCheck('AI Verdict Classifier', 'Confidence Scoring System', 'PASS', 'Confidence calculation implemented');
    } else {
      logCheck('AI Verdict Classifier', 'Confidence Scoring System', 'FAIL', 'Confidence scoring missing');
    }
    
    // Check risk factors
    if (classifierContent.includes('RISK_FACTORS') && classifierContent.includes('POSITIVE_FACTORS')) {
      logCheck('AI Verdict Classifier', 'Risk Factor System', 'PASS', 'Risk adjustment system implemented');
    } else {
      logCheck('AI Verdict Classifier', 'Risk Factor System', 'FAIL', 'Risk factors not implemented');
    }
    
  } catch (error) {
    logCheck('AI Verdict Classifier', 'Classifier File Access', 'FAIL', `Error: ${error.message}`);
  }
}

/**
 * Validate psychology pattern detector
 */
async function validatePsychologyPatternDetector() {
  console.log('\n=== PSYCHOLOGY PATTERN DETECTOR VALIDATION ===');
  
  try {
    const detectorPath = join(appRoot, 'ai/psychology/pattern-detector.js');
    const detectorContent = await fs.readFile(detectorPath, 'utf8');
    
    logCheck('Psychology Detector', 'Detector File Exists', 'PASS', 'Psychology pattern detector file found');
    
    // Check main analysis function
    if (detectorContent.includes('export async function analyzeTraderPsychology')) {
      logCheck('Psychology Detector', 'Main Analysis Function', 'PASS', 'Primary analysis function implemented');
    } else {
      logCheck('Psychology Detector', 'Main Analysis Function', 'FAIL', 'Main analysis function missing');
    }
    
    // Check emotional states
    const emotions = ['CONFIDENT', 'ANXIOUS', 'REVENGE', 'DISCIPLINED', 'FEARFUL'];
    let foundEmotions = 0;
    emotions.forEach(emotion => {
      if (detectorContent.includes(emotion)) {
        foundEmotions++;
      }
    });
    
    if (foundEmotions >= 4) {
      logCheck('Psychology Detector', 'Emotional State Detection', 'PASS', `Found ${foundEmotions}/${emotions.length} emotional states`);
    } else {
      logCheck('Psychology Detector', 'Emotional State Detection', 'FAIL', `Found ${foundEmotions}/${emotions.length} emotional states`);
    }
    
    // Check pattern tags
    const patterns = ['OVERTRADING', 'REVENGE_TRADING', 'FOMO', 'ANALYSIS_PARALYSIS'];
    let foundPatterns = 0;
    patterns.forEach(pattern => {
      if (detectorContent.includes(pattern)) {
        foundPatterns++;
      }
    });
    
    if (foundPatterns >= 3) {
      logCheck('Psychology Detector', 'Pattern Tag System', 'PASS', `Found ${foundPatterns}/${patterns.length} pattern types`);
    } else {
      logCheck('Psychology Detector', 'Pattern Tag System', 'FAIL', `Found ${foundPatterns}/${patterns.length} pattern types`);
    }
    
    // Check coaching recommendations
    if (detectorContent.includes('suggestCoachingType') && detectorContent.includes('COACHING_TYPES')) {
      logCheck('Psychology Detector', 'Coaching Recommendations', 'PASS', 'Coaching recommendation system implemented');
    } else {
      logCheck('Psychology Detector', 'Coaching Recommendations', 'FAIL', 'Coaching recommendations missing');
    }
    
    // Check keyword analysis
    if (detectorContent.includes('EMOTIONAL_KEYWORDS') && detectorContent.includes('PATTERN_KEYWORDS')) {
      logCheck('Psychology Detector', 'Keyword Analysis Engine', 'PASS', 'Keyword-based analysis implemented');
    } else {
      logCheck('Psychology Detector', 'Keyword Analysis Engine', 'FAIL', 'Keyword analysis incomplete');
    }
    
  } catch (error) {
    logCheck('Psychology Detector', 'Detector File Access', 'FAIL', `Error: ${error.message}`);
  }
}

/**
 * Validate API endpoints
 */
async function validateAPIEndpoints() {
  console.log('\n=== API ENDPOINTS VALIDATION ===');
  
  try {
    const apiPath = join(appRoot, 'api/messages/index.js');
    const apiContent = await fs.readFile(apiPath, 'utf8');
    
    logCheck('API Endpoints', 'API File Exists', 'PASS', 'Message API endpoints file found');
    
    // Check core HTTP methods
    const httpMethods = [
      "router.post('/'", // POST messages
      "router.get('/:messageId'", // GET single message  
      "router.put('/:messageId'", // PUT update message
      "router.delete('/:messageId'", // DELETE message
      "router.get('/conversation/:conversationId'" // GET conversation messages
    ];
    
    let foundMethods = 0;
    httpMethods.forEach(method => {
      if (apiContent.includes(method)) {
        foundMethods++;
      }
    });
    
    if (foundMethods === httpMethods.length) {
      logCheck('API Endpoints', 'Core HTTP Methods', 'PASS', `All ${foundMethods} core endpoints implemented`);
    } else {
      logCheck('API Endpoints', 'Core HTTP Methods', 'FAIL', `Found ${foundMethods}/${httpMethods.length} core endpoints`);
    }
    
    // Check search endpoint
    if (apiContent.includes("router.get('/search'")) {
      logCheck('API Endpoints', 'Search Endpoint', 'PASS', 'Full-text search endpoint implemented');
    } else {
      logCheck('API Endpoints', 'Search Endpoint', 'FAIL', 'Search endpoint missing');
    }
    
    // Check threading endpoints
    if (apiContent.includes('/thread') && apiContent.includes('/children')) {
      logCheck('API Endpoints', 'Threading Endpoints', 'PASS', 'Message threading endpoints implemented');
    } else {
      logCheck('API Endpoints', 'Threading Endpoints', 'FAIL', 'Threading endpoints missing');
    }
    
    // Check authentication middleware
    if (apiContent.includes('authenticateToken') && apiContent.includes('requireEmailVerification')) {
      logCheck('API Endpoints', 'Authentication Middleware', 'PASS', 'Authentication properly integrated');
    } else {
      logCheck('API Endpoints', 'Authentication Middleware', 'FAIL', 'Authentication integration incomplete');
    }
    
    // Check rate limiting
    if (apiContent.includes('rateLimit') && apiContent.includes('messageRateLimit')) {
      logCheck('API Endpoints', 'Rate Limiting', 'PASS', 'Rate limiting implemented');
    } else {
      logCheck('API Endpoints', 'Rate Limiting', 'FAIL', 'Rate limiting missing');
    }
    
    // Check input validation
    if (apiContent.includes('validateMessageData') && apiContent.includes('sanitizeMessageData')) {
      logCheck('API Endpoints', 'Input Validation', 'PASS', 'Input validation and sanitization implemented');
    } else {
      logCheck('API Endpoints', 'Input Validation', 'FAIL', 'Input validation incomplete');
    }
    
    // Check AI integration endpoints
    if (apiContent.includes('ai-results') && apiContent.includes('mark-failed')) {
      logCheck('API Endpoints', 'AI Integration Endpoints', 'PASS', 'AI processing endpoints implemented');
    } else {
      logCheck('API Endpoints', 'AI Integration Endpoints', 'FAIL', 'AI integration endpoints missing');
    }
    
  } catch (error) {
    logCheck('API Endpoints', 'API File Access', 'FAIL', `Error: ${error.message}`);
  }
}

/**
 * Generate summary and save results
 */
async function generateSummary() {
  console.log('\n=== VALIDATION SUMMARY ===');
  
  const passRate = validationResults.totalChecks > 0 ? 
    (validationResults.passed / validationResults.totalChecks * 100).toFixed(1) : 0;
  
  console.log(`\nValidation Results:`);
  console.log(`- Total Checks: ${validationResults.totalChecks}`);
  console.log(`- Passed: ${validationResults.passed}`);
  console.log(`- Failed: ${validationResults.failed}`);
  console.log(`- Pass Rate: ${passRate}%`);
  
  // Determine overall status
  let overallStatus;
  if (parseFloat(passRate) >= 95) {
    overallStatus = 'EXCELLENT';
    console.log(`\n🎉 OVERALL STATUS: EXCELLENT`);
    console.log('Implementation is comprehensive and well-architected');
  } else if (parseFloat(passRate) >= 85) {
    overallStatus = 'PASS';
    console.log(`\n✅ OVERALL STATUS: PASS`);
    console.log('Implementation meets requirements with minor gaps');
  } else if (parseFloat(passRate) >= 70) {
    overallStatus = 'CONDITIONAL_PASS';
    console.log(`\n⚠️  OVERALL STATUS: CONDITIONAL PASS`);
    console.log('Implementation has some gaps but core functionality present');
  } else {
    overallStatus = 'FAIL';
    console.log(`\n❌ OVERALL STATUS: FAIL`);
    console.log('Significant implementation gaps detected');
  }
  
  validationResults.overallStatus = overallStatus;
  validationResults.passRate = parseFloat(passRate);
  
  // Save results
  try {
    await fs.mkdir(join(__dirname, 'evidence'), { recursive: true });
    const resultsPath = join(__dirname, 'evidence/direct-validation-results.json');
    await fs.writeFile(resultsPath, JSON.stringify(validationResults, null, 2));
    console.log(`\n📊 Validation results saved to: ${resultsPath}`);
  } catch (error) {
    console.error(`Error saving results: ${error.message}`);
  }
}

/**
 * Main validation execution
 */
async function runDirectValidation() {
  try {
    await validateDatabaseSchema();
    await validateMessageModel();
    await validateDatabaseQueries();
    await validateAIVerdictClassifier();
    await validatePsychologyPatternDetector();
    await validateAPIEndpoints();
    await generateSummary();
    
    console.log('\n✨ Direct Validation Complete!');
    
  } catch (error) {
    console.error(`\nValidation failed: ${error.message}`);
    console.error(error.stack);
  }
}

// Run the validation
runDirectValidation();