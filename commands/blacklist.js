const db = require('../database/database');

/**
 * Command to blacklist users or channels from using the bot
 */
module.exports = {
  name: 'blacklist',
  description: 'Blacklist a user or channel from using the bot',
  usage: '<@user|#channel>',
  permissions: ['ManageServer'], // Revolt permissions to check
  
  async execute(message, args, client) {
    try {
      // If a channel is mentioned or a channel ID is provided
      const channelMention = args.find(arg => arg.startsWith('<#') && arg.endsWith('>'));
      const channelIdArg = args.find(arg => arg.match(/^01[A-Z0-9]{22,}$/)); // Revolt channel IDs
      if (channelMention || channelIdArg) {
        let channelId = channelIdArg;
        if (channelMention) {
          channelId = channelMention.replace(/[<#>]/g, '');
        }
        await db.blacklistChannel(channelId);
        return message.reply(`Channel <#${channelId}> has been blacklisted.`);
      }
      // Otherwise, treat as user blacklist
      if (!message.mentions?.users?.length && !args.find(arg => arg.match(/^01[A-Z0-9]{22,}$/))) {
        return message.reply('You need to mention a user or channel to blacklist them.');
      }
      // Get mentioned user
      const userId = message.mentions?.users?.[0] || args.find(arg => arg.match(/^01[A-Z0-9]{22,}$/));
      const mentionedUser = await client.users.fetch(userId);
      if (!mentionedUser) {
        return message.reply('Could not find the mentioned user.');
      }
      // Check if the user is already blacklisted
      const isBlacklisted = await db.isUserBlacklisted(userId);
      if (isBlacklisted) {
        return message.reply(`User ${mentionedUser.username} is already blacklisted.`);
      }
      // Blacklist the user
      await db.blacklistUser(userId);
      return message.reply(`User ${mentionedUser.username} has been blacklisted.`);
    } catch (error) {
      console.error('Error executing blacklist command:', error);
      return message.reply('There was an error executing this command.');
    }
  }
}; 