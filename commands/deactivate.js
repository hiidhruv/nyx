const db = require('../database/database');

/**
 * Deactivate the bot in the current channel
 */
module.exports = {
  name: 'deactivate',
  description: 'Deactivate the bot\'s automatic responses in this channel',
  permissions: ['ManageServer'], // Revolt permissions to check
  
  async execute(message, args, client) {
    try {
      const channelId = message.channel._id;
      
      // Check if the channel is active
      const isActive = await db.isChannelActive(channelId);
      
      if (!isActive) {
        return message.reply('The bot is not active in this channel.');
      }
      
      // Deactivate the channel
      const result = await db.deactivateChannel(channelId);
      
      if (result.changes > 0) {
        return message.reply('Bot deactivated in this channel. I will only respond when mentioned or randomly.');
      } else {
        return message.reply('Failed to deactivate the bot in this channel.');
      }
    } catch (error) {
      console.error('Error executing deactivate command:', error);
      return message.reply('There was an error deactivating the bot in this channel.');
    }
  }
}; 