const db = require('../database/database');

/**
 * Activate the bot in the current channel
 */
module.exports = {
  name: 'activate',
  description: 'Activate the bot to respond to all messages in this channel',
  permissions: ['ManageServer'], // Revolt permissions to check
  
  async execute(message, args, client) {
    try {
      const channelId = message.channel._id;
      
      // Check if the channel is already active
      const isActive = await db.isChannelActive(channelId);
      
      if (isActive) {
        return message.reply('The bot is already active in this channel.');
      }
      
      // Activate the channel
      await db.activateChannel(channelId);
      
      return message.reply('Bot activated in this channel! I will now respond to all messages.');
    } catch (error) {
      console.error('Error executing activate command:', error);
      return message.reply('There was an error activating the bot in this channel.');
    }
  }
}; 