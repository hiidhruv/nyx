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
 * @returns {Promise<string>} AI response
 */
async function generateResponse(channelId, prompt, userId) {
  try {
    if (!messageContexts.has(channelId)) {
      messageContexts.set(channelId, []);
    }
    const context = messageContexts.get(channelId);
    context.push({
      role: 'user',
      content: prompt,
      userId: userId
    });
    while (context.length > 10) {
      context.shift();
    }
    // Format IDs for better tracking in Shapes
    const formattedUserId = `revolt-user-${userId}`;
    const formattedChannelId = `revolt-channel-${channelId}`;
    return await generateShapesResponse(formattedChannelId, prompt, formattedUserId, context);
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
 * @param {string} prompt - User message
 * @param {string} userId - User ID
 * @param {Array} context - Message context
 * @returns {Promise<string>} AI response
 */
async function generateShapesResponse(channelId, prompt, userId, context) {
  let aiMessage;
  if (shapesClient === 'openai' && isOpenAiSdkAvailable) {
    try {
      const response = await shapes.chat.completions.create({
        model: `shapesinc/${shapesUsername}`,
        messages: [
          { role: "user", content: prompt }
        ],
        extra_headers: {
          "X-User-Id": userId,
          "X-Channel-Id": channelId
        }
      });
      aiMessage = response.choices[0].message.content;
    } catch (error) {
      if (isLoggingEnabled()) {
        console.error('OpenAI SDK error:', error.message);
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
 * @param {string} prompt - User message
 * @param {string} userId - User ID
 * @returns {Promise<string>} AI response
 */
async function useAxiosImplementation(channelId, prompt, userId) {
  try {
    const response = await shapesApi.post('/chat/completions', {
      content: prompt,
      platform: "revolt",
      platform_user_id: userId,
      channel_id: channelId
    });
    return response.data.content;
  } catch (error) {
    if (isLoggingEnabled()) {
      console.error('Axios implementation error:', error.message);
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