const db = require('../database/database');
const aiService = require('./aiService');

// Import the logging command if it exists
let loggingCommand = null;
try {
  loggingCommand = require('../commands/logging');
} catch (error) {
  // Ignore error if logging module is not loaded yet
}

/**
 * Check if logging is enabled
 * @returns {boolean} Whether logging is enabled
 */
function isLoggingEnabled() {
  return !loggingCommand || loggingCommand.isLoggingEnabled();
}

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
    let processedContent = message.content || '';
    processedContent = processedContent.replace(
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
    
    // Check for attachments (images or audio)
    const hasAttachments = message.attachments && message.attachments.length > 0;
    
    if (mentionsBot || isReplyToBot) {
      shouldRespond = true;
      reason = 'mentioned_or_replied';
    } else if (containsNyx) {
      shouldRespond = true;
      reason = 'contains_keyword';
    } else if (hasAttachments && (containsNyx || isReplyToBot)) {
      // Respond to attachments if the bot is mentioned or replied to
      shouldRespond = true;
      reason = 'attachment';
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
        // Process attachments if any
        let attachments = null;
        if (message.attachments && message.attachments.length > 0) {
          attachments = {};
          
          // Process attachments and find images or audio
          for (const attachment of message.attachments) {
            // Get the URL from the attachment
            let url = '';
            
            // Log attachment information to help with debugging
            if (isLoggingEnabled()) {
              console.log('Processing attachment:', JSON.stringify(attachment, null, 2));
            }
            
            // Handle different attachment structures from Revolt
            if (attachment.url) {
              url = attachment.url;
            } else if (attachment._id || attachment.id) {
              // Construct URL based on ID
              const attachmentId = attachment._id || attachment.id;
              url = `${process.env.REVOLT_SERVER_URL || 'https://autumn.revolt.chat'}/attachments/${attachmentId}`;
            } else if (typeof attachment === 'string' && attachment.includes('/')) {
              // Handle if attachment is directly a URL string
              url = attachment;
            }
            
            // Ensure URL is properly encoded if needed
            if (url && !url.startsWith('http')) {
              url = `https://${url}`;
            }
            
            if (isLoggingEnabled()) {
              console.log('Resolved attachment URL:', url);
            }
            
            if (!url) continue;
            
            // Check attachment type
            const contentType = attachment.content_type || '';
            if (contentType.startsWith('image/') || 
                url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
              attachments.image = url;
              console.log('Found image attachment:', url);
            } else if (contentType.startsWith('audio/') || 
                      contentType === 'audio/mpeg' || 
                      contentType === 'audio/mp3' ||
                      url.match(/\.(mp3|wav|ogg|m4a)$/i)) {
              attachments.audio = url;
              console.log('Found audio attachment:', url);
            }
          }
          
          // If no valid attachments found, set to null
          if (!attachments.image && !attachments.audio) {
            attachments = null;
          } else {
            console.log('Final attachments object:', JSON.stringify(attachments));
          }
        }
        
        // Get response from AI
        const response = await aiService.generateResponse(
          message.channel._id, 
          message.content || '',
          message.author._id,
          attachments
        );
        
        // Send response as a reply
        await message.reply({
          content: response
        });
        
        // Log if enabled
        if (isLoggingEnabled()) {
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