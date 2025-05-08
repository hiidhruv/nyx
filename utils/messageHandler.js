const db = require('../database/database');
const aiService = require('./aiService');

/**
 * Handles incoming messages and determines if the bot should respond
 * @param {Object} message - Revolt message object
 * @param {Object} client - Revolt client instance
 * @returns {Promise<void>}
 */
async function handleMessage(message, client) {
  try {
    // Ignore messages from bots
    if (message.author.bot) return;
    
    // Check if user is blacklisted
    const isUserBlacklisted = await db.isUserBlacklisted(message.author._id);
    if (isUserBlacklisted) return;
    
    // Check if channel is blacklisted
    const isChannelBlacklisted = await db.isChannelBlacklisted(message.channel._id);
    if (isChannelBlacklisted) return;
    
    // Variables to determine if we should respond
    let shouldRespond = false;
    let reason = '';
    
    // Replace all bot mention tags with the bot's name (case-insensitive)
    let processedContent = message.content.replace(
      new RegExp(`<@${client.user._id}>`, 'gi'),
      'nyx'
    );
    const containsNyx = processedContent.toLowerCase().includes('nyx');
    
    // Check if the message is a reply to the bot
    let isReplyToBot = false;
    if (message.replyMessageId && message.channel && typeof message.channel.fetchMessage === 'function') {
      try {
        const repliedMessage = await message.channel.fetchMessage(message.replyMessageId);
        if (repliedMessage && repliedMessage.author && repliedMessage.author._id === client.user._id) {
          isReplyToBot = true;
        }
      } catch (err) {
        // Ignore fetch errors
      }
    }
    
    // Check if the message contains "nyx" or mentions the bot
    const mentions = message.mentions || [];
    // Debug log for mentions
    console.log('Mentions:', mentions, 'Bot user ID:', client.user._id);
    // Support both user ID strings and user objects
    const mentionsBot = mentions.some(m => (typeof m === 'string' ? m === client.user._id : m?._id === client.user._id));
    
    if (mentionsBot || isReplyToBot) {
      shouldRespond = true;
      reason = 'mentioned_or_replied';
    } else if (containsNyx) {
      shouldRespond = true;
      reason = 'contains_keyword';
    } else {
      // Check if channel is in active mode
      const isChannelActive = await db.isChannelActive(message.channel._id);
      if (isChannelActive) {
        shouldRespond = true;
        reason = 'active_channel';
      } else {
        // Random response chance
        shouldRespond = aiService.shouldRespondRandomly();
        if (shouldRespond) {
          reason = 'random';
        }
      }
    }
    
    // If we should respond, generate a response
    if (shouldRespond) {
      try {
        // Get response from AI
        const response = await aiService.generateResponse(
          message.channel._id, 
          message.content,
          message.author._id
        );
        
        // Send response as a reply
        await message.reply({
          content: response
        });
        
        // Log if enabled
        const loggingCommand = require('../commands/logging');
        if (loggingCommand.isLoggingEnabled()) {
          const channelName = message.channel.name || message.channel._id;
          console.log(`Msg (${reason}): ${channelName}`);
        }
      } catch (error) {
        // Always log errors regardless of logging setting
        console.error('Error generating response:', error);
      }
    }
  } catch (error) {
    // Always log errors regardless of logging setting
    console.error('Error in message handler:', error);
  }
}

module.exports = {
  handleMessage
}; 