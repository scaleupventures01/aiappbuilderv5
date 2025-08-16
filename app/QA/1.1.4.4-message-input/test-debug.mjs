console.log('Test script starting...');
console.log('Node version:', process.version);
console.log('Current directory:', process.cwd());

try {
  console.log('Script executed successfully');
  process.exit(0);
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}