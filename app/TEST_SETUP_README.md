# Elite Trading Coach AI - Chart Upload Test Setup

## Quick Start (One Command)

### For Mac/Linux:
```bash
./start-test-server.sh
```

### For Windows:
```cmd
start-test-server.bat
```

### Manual Start:
```bash
npm run start:dev
```

## Test the Chart Upload Feature

Once the server is running, open your browser to:
**http://localhost:3001/api/test-analyze-trade**

This gives you a complete test interface with:
- Drag & drop file upload
- Live preview of uploaded charts
- Real-time analysis results
- Mock mode status indicator
- Detailed response information

## Test Endpoints

| Endpoint | Purpose | Authentication |
|----------|---------|---------------|
| `/api/test-analyze-trade` | Chart analysis test page | ❌ None required |
| `/api/test-analyze-trade` (POST) | Chart analysis API | ❌ None required |
| `/health` | Server health check | ❌ None required |
| `/health/openai` | OpenAI service status | ❌ None required |

## Configuration

The test setup uses **mock mode** by default:
- `USE_MOCK_OPENAI=true` in `.env.development`
- No real OpenAI API key required
- Generates realistic test responses
- Perfect for development and demos

## Features Enabled

✅ **Chart Upload**: PNG, JPG, JPEG files up to 10MB  
✅ **Mock AI Analysis**: Simulated GPT-4 Vision responses  
✅ **No Authentication**: Bypass login for testing  
✅ **Error Handling**: Comprehensive error messages  
✅ **Real-time UI**: Interactive test interface  
✅ **Health Monitoring**: Service status checks  

## File Structure

```
app/
├── start-test-server.sh        # Mac/Linux startup script
├── start-test-server.bat       # Windows startup script
├── test-chart-upload.mjs       # Automated test script
├── api/test-analyze-trade.js   # Test endpoint (no auth)
├── .env.development            # Development configuration
└── server.js                   # Main server file
```

## Testing Workflow

1. **Start Server**: Run startup script
2. **Open Browser**: Go to test page
3. **Upload Chart**: Drag & drop any trading chart image
4. **Get Analysis**: Receive instant AI analysis
5. **Review Results**: Check verdict, confidence, reasoning

## Automated Testing

Run the automated test suite:
```bash
node test-chart-upload.mjs
```

This will:
- Check server health
- Test all endpoints
- Upload a test image
- Verify analysis response
- Report any issues

## Mock Mode Responses

The mock service provides realistic responses like:
- **Verdict**: "BUY", "SELL", "HOLD"
- **Confidence**: 75-95%
- **Reasoning**: Detailed technical analysis
- **Processing Time**: Simulated timing
- **Model**: "gpt-4-vision-preview"

## Troubleshooting

### Server Won't Start
```bash
# Check for port conflicts
lsof -i :3001

# Install dependencies
npm install

# Check logs
npm run start:dev
```

### Upload Fails
- Check file size (max 10MB)
- Verify file type (PNG/JPG/JPEG only)
- Check browser console for errors

### Analysis Fails
- Verify mock mode is enabled
- Check `/health/openai` endpoint
- Review server logs

## Production Setup

To use with real OpenAI API:
1. Set `USE_MOCK_OPENAI=false`
2. Add real `OPENAI_API_KEY`
3. Use authenticated endpoints (`/api/analyze-trade`)
4. Enable rate limiting
5. Add proper database connection

## Development Notes

- Test endpoint bypasses all authentication
- Mock mode prevents API costs
- No database required for basic testing
- CORS configured for localhost
- Hot reload enabled in development

## Support

If you encounter issues:
1. Check server logs in console
2. Verify health endpoints respond
3. Test with different image files
4. Check browser network tab for API errors

---

**Ready to test!** 🚀 Open http://localhost:3001/api/test-analyze-trade and start uploading charts!