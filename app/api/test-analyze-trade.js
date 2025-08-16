/**
 * Test Trade Analysis API Endpoint - No Authentication Required
 * Elite Trading Coach AI - Demo/Testing Version
 * Created: 2025-08-15
 * 
 * This endpoint is designed for testing the chart upload feature without authentication.
 * WARNING: This is for development/demo purposes only. DO NOT use in production.
 */

import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler } from '../server/middleware/error-handler.js';
import { tradeAnalysisService } from '../server/services/trade-analysis-service.js';

const router = express.Router();

/**
 * Configure multer for image uploads (same as main endpoint)
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only allow single file upload
  },
  fileFilter: (req, file, cb) => {
    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.mimetype)) {
      const error = new Error('Invalid file type. Only PNG, JPG, and JPEG are allowed.');
      error.code = 'INVALID_FILE_FORMAT';
      return cb(error, false);
    }
    
    // Additional file validation
    if (!file.originalname || file.originalname.trim() === '') {
      const error = new Error('File must have a valid name.');
      error.code = 'INVALID_FILE_NAME';
      return cb(error, false);
    }
    
    cb(null, true);
  }
});

/**
 * Input validation middleware (simplified for testing)
 */
const validateTestRequest = (req, res, next) => {
  const errors = [];
  
  // Check if file was uploaded
  if (!req.file) {
    errors.push('Image file is required');
  } else {
    // Validate file size
    if (req.file.size > 10 * 1024 * 1024) {
      errors.push('File size too large (max 10MB)');
    }
    
    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      errors.push('Invalid file type (PNG, JPG, JPEG only)');
    }
  }
  
  // Validate description if provided
  if (req.body.description) {
    const description = req.body.description.trim();
    if (description.length > 1000) {
      errors.push('Description too long (max 1000 characters)');
    }
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors,
      code: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

/**
 * Convert uploaded file to base64 data URL
 */
const processImageFile = (file) => {
  try {
    const base64Data = file.buffer.toString('base64');
    const dataUrl = `data:${file.mimetype};base64,${base64Data}`;
    
    return {
      dataUrl,
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    };
  } catch (error) {
    throw new Error('Failed to process image file');
  }
};

/**
 * GET /api/test-analyze-trade
 * Test page with upload form
 */
router.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Elite Trading Coach AI - Chart Analysis Test</title>
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                max-width: 800px; 
                margin: 0 auto; 
                padding: 20px; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                color: #333;
            }
            .container {
                background: white;
                border-radius: 12px;
                padding: 30px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            }
            h1 { 
                color: #4f46e5; 
                text-align: center; 
                margin-bottom: 30px;
                font-size: 2.5em;
                font-weight: 700;
            }
            .subtitle {
                text-align: center;
                color: #6b7280;
                margin-bottom: 30px;
                font-size: 1.1em;
            }
            .upload-area {
                border: 2px dashed #d1d5db;
                border-radius: 8px;
                padding: 40px;
                text-align: center;
                margin: 20px 0;
                transition: all 0.3s ease;
                background: #f9fafb;
            }
            .upload-area:hover {
                border-color: #4f46e5;
                background: #f3f4f6;
            }
            .upload-area.dragover {
                border-color: #4f46e5;
                background: #eef2ff;
            }
            input[type="file"] {
                margin: 10px 0;
                padding: 8px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                width: 100%;
                max-width: 300px;
            }
            textarea {
                width: 100%;
                padding: 12px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                margin: 10px 0;
                min-height: 100px;
                font-family: inherit;
                resize: vertical;
            }
            button {
                background: #4f46e5;
                color: white;
                padding: 12px 24px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 16px;
                font-weight: 600;
                transition: background 0.2s;
                width: 100%;
                margin-top: 10px;
            }
            button:hover { background: #4338ca; }
            button:disabled { 
                background: #9ca3af; 
                cursor: not-allowed; 
            }
            .result {
                margin-top: 20px;
                padding: 20px;
                border-radius: 8px;
                display: none;
            }
            .result.success {
                background: #ecfdf5;
                border: 1px solid #d1fae5;
                color: #065f46;
            }
            .result.error {
                background: #fef2f2;
                border: 1px solid #fecaca;
                color: #991b1b;
            }
            .loading {
                display: none;
                text-align: center;
                padding: 20px;
                color: #4f46e5;
            }
            .spinner {
                border: 2px solid #f3f3f3;
                border-top: 2px solid #4f46e5;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                animation: spin 1s linear infinite;
                display: inline-block;
                margin-right: 10px;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            .preview {
                max-width: 300px;
                max-height: 200px;
                margin: 10px auto;
                display: block;
                border-radius: 6px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .file-info {
                font-size: 0.9em;
                color: #6b7280;
                margin-top: 10px;
            }
            .status-badge {
                display: inline-block;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 0.8em;
                font-weight: 600;
                text-transform: uppercase;
                margin-left: 10px;
            }
            .status-mock {
                background: #fbbf24;
                color: #92400e;
            }
            .status-live {
                background: #10b981;
                color: #065f46;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 Elite Trading Coach AI</h1>
            <div class="subtitle">
                Chart Analysis Test Platform
                <span id="status-badge" class="status-badge">Loading...</span>
            </div>
            
            <form id="uploadForm" enctype="multipart/form-data">
                <div class="upload-area" id="uploadArea">
                    <div>📊 Drop your chart image here or click to select</div>
                    <input type="file" id="imageFile" name="image" accept="image/*" required>
                    <div class="file-info" id="fileInfo" style="display: none;"></div>
                    <img id="preview" class="preview" style="display: none;">
                </div>
                
                <div>
                    <label for="description">📝 Additional Context (Optional):</label>
                    <textarea 
                        id="description" 
                        name="description" 
                        placeholder="Describe what you'd like analyzed in this chart (e.g., 'Should I buy or sell at this level?', 'Is this a good entry point?', etc.)"
                    ></textarea>
                </div>
                
                <button type="submit" id="submitBtn">🔍 Analyze Chart</button>
            </form>
            
            <div class="loading" id="loading">
                <div class="spinner"></div>
                Analyzing your chart... This may take a few moments.
            </div>
            
            <div class="result" id="result"></div>
        </div>

        <script>
            const form = document.getElementById('uploadForm');
            const fileInput = document.getElementById('imageFile');
            const uploadArea = document.getElementById('uploadArea');
            const preview = document.getElementById('preview');
            const fileInfo = document.getElementById('fileInfo');
            const result = document.getElementById('result');
            const loading = document.getElementById('loading');
            const submitBtn = document.getElementById('submitBtn');
            const statusBadge = document.getElementById('status-badge');

            // Check API status on load
            fetch('/health/openai')
                .then(response => response.json())
                .then(data => {
                    if (data.data.useMockMode) {
                        statusBadge.textContent = 'Mock Mode';
                        statusBadge.className = 'status-badge status-mock';
                    } else {
                        statusBadge.textContent = 'Live API';
                        statusBadge.className = 'status-badge status-live';
                    }
                })
                .catch(() => {
                    statusBadge.textContent = 'Unknown';
                    statusBadge.className = 'status-badge';
                });

            // Drag and drop functionality
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });

            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    fileInput.files = files;
                    handleFileSelect();
                }
            });

            uploadArea.addEventListener('click', () => {
                fileInput.click();
            });

            fileInput.addEventListener('change', handleFileSelect);

            function handleFileSelect() {
                const file = fileInput.files[0];
                if (file) {
                    // Show file info
                    fileInfo.textContent = \`\${file.name} (\${formatFileSize(file.size)})\`;
                    fileInfo.style.display = 'block';

                    // Show preview if it's an image
                    if (file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            preview.src = e.target.result;
                            preview.style.display = 'block';
                        };
                        reader.readAsDataURL(file);
                    }
                }
            }

            function formatFileSize(bytes) {
                if (bytes === 0) return '0 Bytes';
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
            }

            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(form);
                
                // Show loading
                loading.style.display = 'block';
                result.style.display = 'none';
                submitBtn.disabled = true;
                submitBtn.textContent = '🔄 Analyzing...';
                
                try {
                    const response = await fetch('/api/test-analyze-trade', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const data = await response.json();
                    
                    // Hide loading
                    loading.style.display = 'none';
                    submitBtn.disabled = false;
                    submitBtn.textContent = '🔍 Analyze Chart';
                    
                    // Show result
                    result.style.display = 'block';
                    
                    if (data.success) {
                        result.className = 'result success';
                        result.innerHTML = \`
                            <h3>✅ Analysis Complete</h3>
                            <div><strong>Verdict:</strong> \${data.data.verdict}</div>
                            <div><strong>Confidence:</strong> \${data.data.confidence}%</div>
                            <div><strong>Reasoning:</strong></div>
                            <p>\${data.data.reasoning}</p>
                            <div style="margin-top: 15px; font-size: 0.9em; color: #6b7280;">
                                <div><strong>Processing Time:</strong> \${data.data.processingTime}ms</div>
                                <div><strong>Model:</strong> \${data.metadata.model}</div>
                                <div><strong>Request ID:</strong> \${data.metadata.requestId}</div>
                                \${data.metadata.retryCount > 0 ? \`<div><strong>Retries:</strong> \${data.metadata.retryCount}</div>\` : ''}
                            </div>
                        \`;
                    } else {
                        result.className = 'result error';
                        result.innerHTML = \`
                            <h3>❌ Analysis Failed</h3>
                            <div><strong>Error:</strong> \${data.error}</div>
                            \${data.details ? \`<div><strong>Details:</strong> \${data.details.join(', ')}</div>\` : ''}
                            \${data.guidance ? \`<div><strong>Guidance:</strong> \${data.guidance}</div>\` : ''}
                            <div style="margin-top: 15px; font-size: 0.9em;">
                                <div><strong>Error Code:</strong> \${data.code}</div>
                                \${data.requestId ? \`<div><strong>Request ID:</strong> \${data.requestId}</div>\` : ''}
                            </div>
                        \`;
                    }
                } catch (error) {
                    // Hide loading
                    loading.style.display = 'none';
                    submitBtn.disabled = false;
                    submitBtn.textContent = '🔍 Analyze Chart';
                    
                    // Show error
                    result.style.display = 'block';
                    result.className = 'result error';
                    result.innerHTML = \`
                        <h3>❌ Request Failed</h3>
                        <div><strong>Error:</strong> \${error.message}</div>
                        <div>Please check your connection and try again.</div>
                    \`;
                }
            });
        </script>
    </body>
    </html>
  `);
});

/**
 * POST /api/test-analyze-trade
 * Test endpoint for trade analysis (NO AUTHENTICATION REQUIRED)
 */
router.post('/',
  upload.single('image'),
  validateTestRequest,
  asyncHandler(async (req, res) => {
    const startTime = Date.now();
    const requestId = uuidv4();
    
    console.log(`🧪 TEST: Trade analysis request ${requestId} (no auth)`);

    try {
      // Process uploaded image
      const imageData = processImageFile(req.file);
      const description = req.body.description?.trim() || '';
      
      // Call trade analysis service (same as authenticated endpoint)
      const analysisResult = await tradeAnalysisService.analyzeChart(
        imageData.dataUrl,
        description,
        {
          requestId,
          userId: 'test-user', // Fake user ID for testing
          retryCount: 0
        }
      );
      
      const totalTime = Date.now() - startTime;
      
      console.log(`✅ TEST: Trade analysis completed for ${requestId} in ${totalTime}ms`);
      
      // Return successful response (same format as authenticated endpoint)
      res.json({
        success: true,
        data: {
          verdict: analysisResult.data.verdict,
          confidence: analysisResult.data.confidence,
          reasoning: analysisResult.data.reasoning,
          processingTime: totalTime
        },
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          model: analysisResult.metadata.model,
          tokensUsed: analysisResult.metadata.tokensUsed,
          retryCount: 0,
          totalProcessingTime: totalTime,
          testMode: true
        }
      });
      
    } catch (error) {
      console.error(`❌ TEST: Trade analysis failed for ${requestId}:`, error.message);
      
      const processingTime = Date.now() - startTime;
      
      // Return error response
      res.status(500).json({
        success: false,
        error: error.message || 'Analysis failed',
        code: error.code || 'ANALYSIS_FAILED',
        requestId,
        processingTime,
        timestamp: new Date().toISOString(),
        testMode: true,
        guidance: 'This is a test endpoint. Check server logs for detailed error information.'
      });
    }
  })
);

/**
 * GET /api/test-analyze-trade/health
 * Health check for test endpoint
 */
router.get('/health', asyncHandler(async (req, res) => {
  try {
    const healthStatus = await tradeAnalysisService.healthCheck();
    
    res.json({
      success: true,
      service: 'test-trade-analysis',
      testMode: true,
      ...healthStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      service: 'test-trade-analysis',
      testMode: true,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}));

export default router;