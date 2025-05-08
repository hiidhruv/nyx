const db = require('../database/database');

/**
 * Command to whitelist users or channels, allowing them to use the bot
 */
module.exports = {
  name: 'whitelist',
  description: 'Remove a user or channel from the bot\'s blacklist',
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
        const result = await db.whitelistChannel(channelId);
        if (result.changes > 0) {
          return message.reply(`Channel <#${channelId}> has been whitelisted.`);
        } else {
          return message.reply(`Channel <#${channelId}> is not blacklisted.`);
        }
      }
      // Otherwise, treat as user whitelist
      if (!message.mentions?.users?.length && !args.find(arg => arg.match(/^01[A-Z0-9]{22,}$/))) {
        return message.reply('You need to mention a user or channel to whitelist them.');
      }
      // Get mentioned user
      const userId = message.mentions?.users?.[0] || args.find(arg => arg.match(/^01[A-Z0-9]{22,}$/));
      const mentionedUser = await client.users.fetch(userId);
      if (!mentionedUser) {
        return message.reply('Could not find the mentioned user.');
      }
      // Check if the user is already whitelisted
      const isBlacklisted = await db.isUserBlacklisted(userId);
      if (!isBlacklisted) {
        return message.reply(`User ${mentionedUser.username} is not blacklisted.`);
      }
      // Whitelist the user
      const result = await db.whitelistUser(userId);
      if (result.changes > 0) {
        return message.reply(`User ${mentionedUser.username} has been whitelisted.`);
      } else {
        return message.reply(`Failed to whitelist user ${mentionedUser.username}.`);
      }
    } catch (error) {
      console.error('Error executing whitelist command:', error);
      return message.reply('There was an error executing this command.');
    }
  }
}; 