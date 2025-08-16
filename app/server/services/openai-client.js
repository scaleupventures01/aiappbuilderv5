/**
 * OpenAI Client Wrapper with GPT-5 Support
 * Handles both GPT-5 (responses API) and GPT-4 (chat completions API)
 * Created: 2025-08-15
 */

import OpenAI from 'openai';

class OpenAIClientWrapper {
  constructor() {
    this.client = null;
    this.initialized = false;
  }

  initialize(apiKey) {
    this.client = new OpenAI({ apiKey });
    this.initialized = true;
  }

  /**
   * Create a vision completion with GPT-5 or GPT-4 support
   * @param {Array} messages - Messages array
   * @param {Object} options - Completion options
   * @returns {Promise<Object>} API response
   */
  async createVisionCompletion(messages, options = {}) {
    if (!this.initialized) {
      throw new Error('OpenAI client not initialized');
    }

    const model = options.model || 'gpt-5';
    const isGPT5 = model.includes('gpt-5');
    
    try {
      if (isGPT5) {
        // GPT-5 uses the responses API
        return await this.createGPT5Response(messages, options);
      } else {
        // GPT-4 and others use chat completions
        return await this.createGPT4Completion(messages, options);
      }
    } catch (error) {
      // If GPT-5 fails, fallback to GPT-4o
      if (isGPT5 && options.fallbackModel) {
        console.log('⚠️ GPT-5 failed, falling back to', options.fallbackModel);
        return await this.createGPT4Completion(messages, {
          ...options,
          model: options.fallbackModel,
          fallbackUsed: true
        });
      }
      throw error;
    }
  }

  /**
   * Create GPT-5 response using the responses API
   * @param {Array} messages - Messages array
   * @param {Object} options - Completion options
   * @returns {Promise<Object>} API response
   */
  async createGPT5Response(messages, options = {}) {
    console.log('🚀 Using GPT-5 responses API with FULL VISION support');
    
    // Check if we have images
    const hasImage = messages.some(msg => 
      Array.isArray(msg.content) && 
      msg.content.some(c => c.type === 'image_url')
    );
    
    let input;
    
    if (hasImage) {
      console.log('🖼️ GPT-5 Vision: Processing image with full vision capabilities');
      // Convert to GPT-5 multimodal format with images
      input = this.convertMessagesToGPT5VisionFormat(messages);
    } else {
      // Text-only format
      input = this.convertMessagesToGPT5TextFormat(messages);
    }
    
    // Prepare GPT-5 specific parameters
    const gpt5Params = {
      model: options.model || 'gpt-5',
      input: input,
      reasoning: {
        effort: 'minimal' // CRITICAL: GPT-5 responses API requires nested reasoning.effort
      }
    };

    // Add verbosity if specified
    if (options.verbosity) {
      gpt5Params.verbosity = options.verbosity;
    }

    // Use max_output_tokens for GPT-5 (not max_tokens or max_completion_tokens)
    if (options.max_tokens) {
      gpt5Params.max_output_tokens = options.max_tokens;
    }

    console.log('📊 GPT-5 params:', {
      model: gpt5Params.model,
      reasoning_effort: gpt5Params.reasoning.effort,
      max_output_tokens: gpt5Params.max_output_tokens
    });

    // Call GPT-5 responses API
    const response = await this.client.responses.create(gpt5Params);
    
    // Convert GPT-5 response to standard format
    return this.convertGPT5ResponseToStandard(response);
  }

  /**
   * Create GPT-4 completion using chat completions API
   * @param {Array} messages - Messages array
   * @param {Object} options - Completion options
   * @returns {Promise<Object>} API response
   */
  async createGPT4Completion(messages, options = {}) {
    console.log('📦 Using GPT-4 chat completions API');
    
    const params = {
      model: options.model || 'gpt-4o',
      messages: messages,
      max_tokens: options.max_tokens || 1000,
      temperature: options.temperature || 0.3
    };

    return await this.client.chat.completions.create(params);
  }

  /**
   * Convert messages to GPT-5 vision format with full image support
   * @param {Array} messages - Standard messages array with images
   * @returns {Array} GPT-5 formatted input with vision support
   */
  convertMessagesToGPT5VisionFormat(messages) {
    const formattedInput = [];
    
    for (const message of messages) {
      const content = [];
      
      if (Array.isArray(message.content)) {
        // Process each content item
        for (const item of message.content) {
          if (item.type === 'text') {
            content.push({
              type: 'input_text',
              text: item.text
            });
          } else if (item.type === 'image_url') {
            // GPT-5 responses API format: Use image_url directly
            const imageUrl = item.image_url.url;
            
            content.push({
              type: 'input_image',
              image_url: imageUrl  // Use image_url directly (supports base64 and URLs)
            });
          }
        }
      } else {
        // Simple text message
        content.push({
          type: 'input_text',
          text: message.content
        });
      }
      
      formattedInput.push({
        role: message.role === 'system' ? 'developer' : message.role,
        content: content
      });
    }
    
    return formattedInput;
  }

  /**
   * Convert messages to GPT-5 text-only format
   * @param {Array} messages - Standard messages array
   * @returns {string} GPT-5 formatted input string
   */
  convertMessagesToGPT5TextFormat(messages) {
    let formattedInput = '';
    
    for (const message of messages) {
      const role = message.role === 'system' ? 'System' : 
                   message.role === 'assistant' ? 'Assistant' : 'User';
      
      if (Array.isArray(message.content)) {
        // Extract text from multi-modal content
        const textContent = message.content
          .filter(c => c.type === 'text')
          .map(c => c.text)
          .join(' ');
        
        if (textContent) {
          formattedInput += `${role}: ${textContent}\n`;
        }
        
        // Note if there was an image
        const hasImage = message.content.some(c => c.type === 'image_url');
        if (hasImage) {
          formattedInput += '[Note: User provided a chart image for analysis]\n';
        }
      } else {
        // Simple text message
        formattedInput += `${role}: ${message.content}\n`;
      }
    }
    
    return formattedInput.trim();
  }

  /**
   * Convert messages array to GPT-5 input format (legacy, for future vision support)
   * @param {Array} messages - Standard messages array
   * @returns {Array|string} GPT-5 formatted input
   */
  convertMessagesToGPT5Format(messages) {
    // For vision tasks with images, we need to handle them specially
    const formattedMessages = [];
    
    for (const message of messages) {
      if (Array.isArray(message.content)) {
        // Handle multi-modal content (text + image)
        const textContent = message.content.find(c => c.type === 'text');
        const imageContent = message.content.find(c => c.type === 'image_url');
        
        if (textContent) {
          formattedMessages.push({
            role: message.role === 'system' ? 'developer' : message.role,
            content: textContent.text
          });
        }
        
        if (imageContent) {
          // GPT-5 handles images differently - add as separate message
          formattedMessages.push({
            role: 'user',
            content: [
              {
                type: 'image',
                url: imageContent.image_url.url
              }
            ]
          });
        }
      } else {
        // Simple text message
        formattedMessages.push({
          role: message.role === 'system' ? 'developer' : message.role,
          content: message.content
        });
      }
    }
    
    return formattedMessages;
  }

  /**
   * Convert GPT-5 response to standard chat completion format
   * @param {Object} gpt5Response - GPT-5 response object
   * @returns {Object} Standard format response
   */
  convertGPT5ResponseToStandard(gpt5Response) {
    // Extract text from GPT-5 response
    let outputText = '';
    
    // Handle output_text if available
    if (gpt5Response.output_text) {
      outputText = gpt5Response.output_text;
    } 
    // Handle structured output format
    else if (gpt5Response.output) {
      for (const item of gpt5Response.output) {
        if (item.content) {
          for (const content of item.content) {
            if (content.text) {
              outputText += content.text;
            }
          }
        }
      }
    }
    
    // Return in standard format
    return {
      choices: [{
        message: {
          content: outputText
        },
        finish_reason: gpt5Response.finish_reason || 'stop'
      }],
      model: gpt5Response.model,
      usage: {
        prompt_tokens: gpt5Response.usage?.input_tokens || 0,
        completion_tokens: gpt5Response.usage?.output_tokens || 0,
        total_tokens: (gpt5Response.usage?.input_tokens || 0) + (gpt5Response.usage?.output_tokens || 0),
        reasoning_tokens: gpt5Response.usage?.reasoning_tokens || 0
      },
      reasoning_effort: gpt5Response.reasoning_effort,
      fallbackUsed: false
    };
  }
}

// Create singleton instance
export const openaiClientWrapper = new OpenAIClientWrapper();

// Initialize with API key if available
if (process.env.OPENAI_API_KEY) {
  openaiClientWrapper.initialize(process.env.OPENAI_API_KEY);
}

export default openaiClientWrapper;