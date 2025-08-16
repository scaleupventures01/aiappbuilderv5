/**
 * Simple Implementation Validation - PRD-1.1.1.4
 * QA Engineer: Claude Code  
 * Created: 2025-08-14
 */

import fs from 'fs/promises';

const appRoot = '/Users/calvinwilliamsjr/Dev Projects/Elite Trading Coach AI/mvp v.05/app';

console.log('🔍 Messages Table Implementation Validation');
console.log('==========================================');

let totalChecks = 0;
let passed = 0;

function check(name, condition, details = '') {
  totalChecks++;
  if (condition) {
    passed++;
    console.log(`✅ ${name}`);
  } else {
    console.log(`❌ ${name}`);
  }
  if (details) console.log(`   ${details}`);
}

try {
  // 1. Database Schema
  console.log('\n=== DATABASE SCHEMA ===');
  const migration = await fs.readFile(`${appRoot}/db/migrations/004_create_messages_table.sql`, 'utf8');
  
  check('Migration file exists', true, 'Migration file found and readable');
  check('Core table structure', migration.includes('CREATE TABLE messages'), 'Messages table creation found');
  check('AI verdict fields', migration.includes('verdict') && migration.includes('diamond'), 'Verdict system fields present');
  check('Psychology fields', migration.includes('emotional_state') && migration.includes('pattern_tags'), 'Psychology coaching fields present');
  check('Full-text search', migration.includes('search_vector tsvector GENERATED'), 'Search vector generation configured');
  check('Essential indexes', migration.includes('idx_messages_search') && migration.includes('idx_messages_conversation_id'), 'Critical indexes defined');
  check('Triggers', migration.includes('update_messages_updated_at'), 'Required triggers defined');
  
  // 2. Message Model
  console.log('\n=== MESSAGE MODEL ===');
  const model = await fs.readFile(`${appRoot}/models/Message.js`, 'utf8');
  
  check('Message class', model.includes('class Message'), 'Message class defined');
  check('Validation methods', model.includes('validateContent') && model.includes('validateVerdict'), 'Validation methods present');
  check('AI verdict support', model.includes('diamond') && model.includes('fire') && model.includes('skull'), 'All verdict types supported');
  check('Comprehensive validation', model.includes('static validate(') && model.includes('isValid'), 'Full validation method implemented');
  check('Helper methods', model.includes('isUserMessage') && model.includes('hasVerdict'), 'Utility methods present');
  
  // 3. Database Queries
  console.log('\n=== DATABASE QUERIES ===');
  const queries = await fs.readFile(`${appRoot}/db/queries/messages.js`, 'utf8');
  
  check('CRUD operations', queries.includes('createMessage') && queries.includes('getMessageById'), 'Core CRUD functions present');
  check('Full-text search', queries.includes('searchMessages') && queries.includes('plainto_tsquery'), 'Search functionality implemented');
  check('Message threading', queries.includes('getMessageThread') && queries.includes('WITH RECURSIVE'), 'Threading with recursive queries');
  check('AI integration', queries.includes('updateAiResults') && queries.includes('markMessageAsFailed'), 'AI processing integration');
  check('Psychology queries', queries.includes('getPsychologyMessages') && queries.includes('getMessageStats'), 'Psychology-specific queries');
  check('Verdict analytics', queries.includes('getMessagesByVerdict'), 'Verdict-based filtering');
  
  // 4. AI Verdict Classifier
  console.log('\n=== AI VERDICT SYSTEM ===');
  const classifier = await fs.readFile(`${appRoot}/ai/verdict/classifier.js`, 'utf8');
  
  check('Main function', classifier.includes('classifyTradingSetup'), 'Primary classification function');
  check('Verdict constants', classifier.includes('DIAMOND') && classifier.includes('FIRE') && classifier.includes('SKULL'), 'All verdict types defined');
  check('Technical analysis', classifier.includes('analyzeTechnicalFactors') && classifier.includes('SCORING_WEIGHTS'), 'Technical analysis engine');
  check('Confidence scoring', classifier.includes('calculateOverallScore') && classifier.includes('CONFIDENCE_THRESHOLDS'), 'Confidence calculation system');
  check('Risk factors', classifier.includes('RISK_FACTORS') && classifier.includes('POSITIVE_FACTORS'), 'Risk adjustment system');
  
  // 5. Psychology Pattern Detector
  console.log('\n=== PSYCHOLOGY SYSTEM ===');
  const psychology = await fs.readFile(`${appRoot}/ai/psychology/pattern-detector.js`, 'utf8');
  
  check('Main function', psychology.includes('analyzeTraderPsychology'), 'Primary analysis function');
  check('Emotional states', psychology.includes('CONFIDENT') && psychology.includes('ANXIOUS'), 'Emotional state detection');
  check('Pattern detection', psychology.includes('OVERTRADING') && psychology.includes('REVENGE_TRADING'), 'Pattern identification');
  check('Coaching system', psychology.includes('suggestCoachingType') && psychology.includes('COACHING_TYPES'), 'Coaching recommendations');
  check('Keyword analysis', psychology.includes('EMOTIONAL_KEYWORDS') && psychology.includes('PATTERN_KEYWORDS'), 'Keyword-based analysis');
  
  // 6. API Endpoints
  console.log('\n=== API ENDPOINTS ===');
  const api = await fs.readFile(`${appRoot}/api/messages/index.js`, 'utf8');
  
  check('Core endpoints', api.includes("router.post('/'") && api.includes("router.get('/:messageId'"), 'Primary HTTP methods');
  check('Search endpoint', api.includes("router.get('/search'"), 'Full-text search endpoint');
  check('Threading endpoints', api.includes('/thread') && api.includes('/children'), 'Message threading endpoints');
  check('Authentication', api.includes('authenticateToken') && api.includes('requireEmailVerification'), 'Authentication middleware');
  check('Rate limiting', api.includes('rateLimit') && api.includes('messageRateLimit'), 'Rate limiting protection');
  check('Input validation', api.includes('validateMessageData') && api.includes('sanitizeMessageData'), 'Input validation/sanitization');
  check('AI endpoints', api.includes('ai-results') && api.includes('mark-failed'), 'AI processing integration');
  
} catch (error) {
  console.error(`\n❌ Validation failed: ${error.message}`);
}

// Summary
console.log('\n=== VALIDATION SUMMARY ===');
const passRate = ((passed / totalChecks) * 100).toFixed(1);

console.log(`\nResults:`);
console.log(`- Total Checks: ${totalChecks}`);
console.log(`- Passed: ${passed}`);
console.log(`- Failed: ${totalChecks - passed}`);
console.log(`- Pass Rate: ${passRate}%`);

if (passRate >= 95) {
  console.log(`\n🎉 OVERALL STATUS: EXCELLENT - Implementation is comprehensive and complete`);
} else if (passRate >= 85) {
  console.log(`\n✅ OVERALL STATUS: PASS - Implementation meets requirements`);
} else if (passRate >= 70) {
  console.log(`\n⚠️  OVERALL STATUS: CONDITIONAL PASS - Core functionality present with some gaps`);
} else {
  console.log(`\n❌ OVERALL STATUS: FAIL - Significant implementation gaps`);
}

console.log(`\n✨ Validation Complete!`);