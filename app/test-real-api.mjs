import fs from 'fs';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { createCanvas } from 'canvas';

async function testRealGPT4Vision() {
    console.log('\n🧪 Testing Real GPT-4 Vision API...\n');
    
    // Create a simple test chart image
    const canvas = createCanvas(800, 400);
    const ctx = canvas.getContext('2d');
    
    // Draw background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 800, 400);
    
    // Draw axes
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 350);
    ctx.lineTo(750, 350);
    ctx.moveTo(50, 50);
    ctx.lineTo(50, 350);
    ctx.stroke();
    
    // Draw an uptrend line (bullish)
    ctx.strokeStyle = 'green';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(100, 300);
    ctx.lineTo(200, 250);
    ctx.lineTo(300, 270);
    ctx.lineTo(400, 200);
    ctx.lineTo(500, 180);
    ctx.lineTo(600, 150);
    ctx.lineTo(700, 100);
    ctx.stroke();
    
    // Add some candlesticks
    ctx.fillStyle = 'green';
    for (let i = 0; i < 7; i++) {
        const x = 100 + i * 100;
        const heights = [30, 40, 35, 50, 45, 55, 60];
        ctx.fillRect(x - 10, 300 - i * 30, 20, -heights[i]);
    }
    
    // Add title
    ctx.fillStyle = 'black';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Test Trading Chart - Bullish Pattern', 200, 30);
    
    // Add labels
    ctx.font = '16px Arial';
    ctx.fillText('Price', 10, 200);
    ctx.fillText('Time', 400, 380);
    
    // Save the image
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync('test-chart-bullish.png', buffer);
    console.log('✅ Created test chart: test-chart-bullish.png');
    console.log('📏 Size:', (buffer.length / 1024).toFixed(2), 'KB\n');
    
    // Now test the API
    const form = new FormData();
    form.append('image', fs.createReadStream('test-chart-bullish.png'));
    form.append('description', 'Trading chart showing upward price movement with green candles');
    
    console.log('📤 Sending to Real GPT-4 Vision API...');
    console.log('💰 This will cost approximately $0.01-0.03\n');
    const startTime = Date.now();
    
    try {
        const response = await fetch('http://localhost:3001/api/test-analyze-trade', {
            method: 'POST',
            body: form
        });
        
        const result = await response.json();
        const elapsed = Date.now() - startTime;
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 GPT-4 VISION ANALYSIS RESULT:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        if (result.success && result.data) {
            console.log('\n🎯 VERDICT:', result.data.verdict);
            console.log('📈 CONFIDENCE:', result.data.confidence + '%');
            console.log('💭 ANALYSIS:\n  ', result.data.reasoning);
            
            if (result.metadata) {
                console.log('\n📊 METADATA:');
                console.log('  ⚡ Processing Time:', elapsed + 'ms');
                console.log('  🤖 Model:', result.metadata.model);
                console.log('  💰 Tokens Used:', result.metadata.tokensUsed || 'N/A');
                console.log('  🔧 Mode:', result.metadata.analysisMode || result.metadata.mockMode ? 'MOCK' : 'REAL API');
            }
            
            if (result.metadata && result.metadata.analysisMode === 'analysis' && !result.metadata.mockMode) {
                console.log('\n✨ SUCCESS: REAL GPT-4 VISION API USED ✨');
                console.log('💵 Estimated cost for this request: $0.01-0.03');
            } else {
                console.log('\n⚠️  Note: Response appears to be from mock mode');
            }
        } else {
            console.log('❌ Error:', result.error || 'Unknown error');
        }
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
    } catch (error) {
        console.error('❌ Error calling API:', error.message);
    }
}

testRealGPT4Vision();