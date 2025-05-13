/**
 * Handles AI response generation
 * This is a placeholder implementation as the original depends on Shapes Inc API
 * Replace with your preferred AI service
 */

const axios = require('axios');
const { OpenAI } = require('openai');
require('dotenv').config();

// Import the logging command if it exists (with a try/catch to handle circular dependencies)
let loggingCommand = null;
try {
  loggingCommand = require('../commands/logging');
} catch (error) {
  // Ignore error - logging module might not be loaded yet
}

function isLoggingEnabled() {
  return !loggingCommand || loggingCommand.isLoggingEnabled();
}

// Get API key and config
const shapesApiKey = process.env.SHAPESINC_API_KEY || process.env.SHAPES_API_KEY;
const shapesApiUrl = process.env.SHAPES_API_URL || 'https://api.shapes.inc/v1';
const shapesUsername = process.env.SHAPESINC_SHAPE_USERNAME || process.env.SHAPES_USERNAME || 'nyx';

console.log(`API: ${shapesApiUrl} | Shape: ${shapesUsername} | Key: ${shapesApiKey ? '✓' : '✗'}`);

// Message context storage
const messageContexts = new Map();

// Initialize the Shapes API client using OpenAI SDK
let shapes = null;
let isOpenAiSdkAvailable = false;
try {
  if (shapesApiKey) {
    shapes = new OpenAI({
      apiKey: shapesApiKey,
      baseURL: shapesApiUrl
    });
    isOpenAiSdkAvailable = true;
  } else {
    console.warn('No Shapes API key found.');
  }
} catch (error) {
  console.error('Error initializing OpenAI SDK client:', error.message);
}

const shapesApiConfig = {
  baseURL: shapesApiUrl,
  headers: {
    'Authorization': `Bearer ${shapesApiKey}`,
    'Content-Type': 'application/json',
  }
};
const shapesApi = axios.create(shapesApiConfig);

let shapesClient = isOpenAiSdkAvailable ? 'openai' : 'axios';

/**
 * Generate AI response using the configured API
 * @param {string} channelId - Channel ID
 * @param {string} prompt - User message
 * @param {string} userId - User ID for context tracking
 * @param {Object} attachments - Optional attachments (image or audio URLs)
 * @returns {Promise<string>} AI response
 */
async function generateResponse(channelId, prompt, userId, attachments = null) {
  try {
    if (!messageContexts.has(channelId)) {
      messageContexts.set(channelId, []);
    }
    const context = messageContexts.get(channelId);
    
    // Create content array for multimodal inputs
    let userContent = prompt;
    
    // For OpenAI SDK format, convert to content array if there are attachments
    if (attachments) {
      console.log(`Processing attachments for channel ${channelId}:`, JSON.stringify(attachments));
      
      userContent = [{ type: "text", text: prompt || "Describe this" }];
      
      if (attachments.image) {
        console.log(`Adding image URL to request: ${attachments.image}`);
        userContent.push({
          type: "image_url",
          image_url: { url: attachments.image }
        });
      }
      
      if (attachments.audio) {
        console.log(`Adding audio URL to request: ${attachments.audio}`);
        userContent.push({
          type: "audio_url",
          audio_url: { url: attachments.audio }
        });
      }
      
      console.log(`Final multimodal content:`, JSON.stringify(userContent));
    }
    
    context.push({
      role: 'user',
      content: userContent,
      userId: userId
    });
    
    while (context.length > 10) {
      context.shift();
    }
    
    // Format IDs for better tracking in Shapes
    const formattedUserId = `revolt-user-${userId}`;
    const formattedChannelId = `revolt-channel-${channelId}`;
    return await generateShapesResponse(formattedChannelId, userContent, formattedUserId, context);
  } catch (error) {
    console.error('Error generating AI response:', error.message);
    if (error.response) {
      console.error('API Error Details:', error.response.data);
    }
    return 'Something went wrong and nyx is cooked';
  }
}

/**
 * Generate response using Shapes Inc API
 * @param {string} channelId - Channel ID
 * @param {string|Array} prompt - User message or content array
 * @param {string} userId - User ID
 * @param {Array} context - Message context
 * @returns {Promise<string>} AI response
 */
async function generateShapesResponse(channelId, prompt, userId, context) {
  let aiMessage;
  if (shapesClient === 'openai' && isOpenAiSdkAvailable) {
    try {
      // Format messages correctly for the OpenAI SDK
      let messages;
      
      // Handle both string content and array content for multimodal
      if (Array.isArray(prompt)) {
        messages = [{ role: "user", content: prompt }];
      } else {
        messages = [{ role: "user", content: prompt }];
      }
      
      if (isLoggingEnabled()) {
        console.log('Sending request to Shapes API with:', 
          JSON.stringify({
            model: `shapesinc/${shapesUsername}`,
            messages: messages
          })
        );
      }
      
      const response = await shapes.chat.completions.create({
        model: `shapesinc/${shapesUsername}`,
        messages: messages,
        extra_headers: {
          "X-User-Id": userId,
          "X-Channel-Id": channelId
        }
      });
      
      if (isLoggingEnabled()) {
        console.log('Response from Shapes API:', JSON.stringify(response));
      }
      
      aiMessage = response.choices[0].message.content;
    } catch (error) {
      if (isLoggingEnabled()) {
        console.error('OpenAI SDK error:', error.message);
        if (error.response) {
          console.error('API Error Details:', JSON.stringify(error.response.data));
        }
      }
      if (!error.message.includes('unauthorized') && !error.message.includes('invalid_api_key')) {
        aiMessage = await useAxiosImplementation(channelId, prompt, userId);
      } else {
        throw error;
      }
    }
  } else {
    aiMessage = await useAxiosImplementation(channelId, prompt, userId);
  }
  if (aiMessage) {
    context.push({
      role: 'assistant',
      content: aiMessage
    });
    return aiMessage;
  }
  throw new Error('No valid response from Shapes API service');
}

/**
 * Helper function to use the Axios implementation for API calls
 * @param {string} channelId - Channel ID
 * @param {string|Array} prompt - User message or content array
 * @param {string} userId - User ID
 * @returns {Promise<string>} AI response
 */
async function useAxiosImplementation(channelId, prompt, userId) {
  try {
    // Create the request body in OpenAI format which Shapes API expects
    const requestBody = {
      model: `shapesinc/${shapesUsername}`,
      messages: [{
        role: "user",
        content: prompt
      }]
    };
    
    // Add extra headers as query parameters since we're using axios directly
    const headers = {
      ...shapesApiConfig.headers,
      "X-User-Id": userId,
      "X-Channel-Id": channelId
    };
    
    if (isLoggingEnabled()) {
      console.log('Sending Axios request to Shapes API:', JSON.stringify(requestBody));
    }
    
    const response = await shapesApi.post('/chat/completions', requestBody, { headers });
    
    if (isLoggingEnabled()) {
      console.log('Response from Shapes API (Axios):', JSON.stringify(response.data));
    }
    
    return response.data.choices[0].message.content;
  } catch (error) {
    if (isLoggingEnabled()) {
      console.error('Axios implementation error:', error.message);
      if (error.response && error.response.data) {
        console.error('API Error Details:', JSON.stringify(error.response.data));
      }
    }
    throw error;
  }
}

/**
 * Clear message context for a channel
 * @param {string} channelId - Channel ID
 * @returns {boolean} Success status
 */
function clearMessageContext(channelId) {
  if (messageContexts.has(channelId)) {
    messageContexts.set(channelId, []);
    return true;
  }
  return false;
}

const RANDOM_RESPONSE_CHANCE = 0.05;
function shouldRespondRandomly() {
  return Math.random() < RANDOM_RESPONSE_CHANCE;
}

module.exports = {
  generateResponse,
  clearMessageContext,
  shouldRespondRandomly
}; 