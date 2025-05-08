const aiService = require('../utils/aiService');

/**
 * Wack command to clear the AI message context in this channel
 */
module.exports = {
  name: 'wack',
  description: 'Clears the AI message context in this channel',

  async execute(message, args, client) {
    try {
      const channelId = message.channel._id;
      // Clear the message context
      const success = aiService.clearMessageContext(channelId);
      if (success) {
        return message.reply('Message context cleared! I\'ve forgotten our previous conversation.');
      } else {
        return message.reply('No message context found for this channel.');
      }
    } catch (error) {
      console.error('Error executing wack command:', error);
      return message.reply('An error occurred while clearing the message context.');
    }
  }
}; 