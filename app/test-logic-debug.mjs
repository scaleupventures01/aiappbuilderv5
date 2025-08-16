#!/usr/bin/env node
/**
 * Debug Selection Logic
 */

// Test the logic directly
function testSelectionLogic() {
  const mockResponses = [
    { name: 'Diamond', verdict: 'Diamond' },
    { name: 'Skull', verdict: 'Skull' },
    { name: 'Fire', verdict: 'Fire' }
  ];

  const testCases = [
    'strong bullish breakout pattern please analyze this...',
    'bearish downtrend with volume please analyze this...',
    'weak support levels failing please analyze this...'
  ];

  testCases.forEach(textToAnalyze => {
    console.log(`\n🧪 Testing: "${textToAnalyze.substring(0, 30)}..."`);
    
    let selectedResponse;
    
    if (textToAnalyze.includes('bull') || textToAnalyze.includes('strong') || textToAnalyze.includes('up') || textToAnalyze.includes('breakout')) {
      selectedResponse = mockResponses[0]; // Diamond
      console.log('   → Matched bullish keywords');
    } else if (textToAnalyze.includes('bear') || textToAnalyze.includes('down') || textToAnalyze.includes('weak') || textToAnalyze.includes('fail')) {
      selectedResponse = mockResponses[1]; // Skull
      console.log('   → Matched bearish keywords');
    } else {
      selectedResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      console.log('   → No keywords matched, random selection');
    }
    
    console.log(`   Selected: ${selectedResponse.verdict}`);
    
    // Debug keyword detection
    console.log(`   Contains 'bear': ${textToAnalyze.includes('bear')}`);
    console.log(`   Contains 'weak': ${textToAnalyze.includes('weak')}`);
    console.log(`   Contains 'strong': ${textToAnalyze.includes('strong')}`);
    console.log(`   Contains 'bull': ${textToAnalyze.includes('bull')}`);
  });
}

testSelectionLogic();