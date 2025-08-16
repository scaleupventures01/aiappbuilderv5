import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../..');

console.log('🚀 Starting Basic Error Handling Validation');

try {
  // Check backend files
  const backendFiles = [
    'server/services/trade-analysis-error-handler.js',
    'api/analyze-trade.js', 
    'server/services/trade-analysis-service.js'
  ];
  
  console.log('\n📁 Checking backend files...');
  for (const file of backendFiles) {
    const fullPath = join(projectRoot, file);
    try {
      await fs.access(fullPath);
      console.log(`✅ ${file} - EXISTS`);
    } catch {
      console.log(`❌ ${file} - NOT FOUND`);
    }
  }
  
  // Check frontend files
  const frontendFiles = [
    'src/components/ui/ErrorMessage.tsx',
    'src/components/chat/TradeAnalysisError.tsx',
    'src/components/chat/TradeAnalysisErrorBoundary.tsx',
    'src/components/ui/ToastNotification.tsx',
    'src/services/tradeAnalysisAPI.ts',
    'src/types/error.ts'
  ];
  
  console.log('\n📁 Checking frontend files...');
  for (const file of frontendFiles) {
    const fullPath = join(projectRoot, file);
    try {
      await fs.access(fullPath);
      console.log(`✅ ${file} - EXISTS`);
    } catch {
      console.log(`❌ ${file} - NOT FOUND`);
    }
  }
  
  console.log('\n✅ Basic validation completed');
  
} catch (error) {
  console.error('❌ Validation failed:', error.message);
}