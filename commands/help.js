/**
 * Help command to list all available commands
 */
module.exports = {
  name: 'help',
  description: 'List all available commands',
  
  async execute(message, args, client) {
    const commands = client.commands;
    const prefix = process.env.PREFIX || '!';
    
    // Create a help message with all commands
    let helpMessage = '**Nyx Bot Help**\n\n';
    helpMessage += 'Nyx is an AI-powered chat bot for Revolt, powered by Shapes Inc.\n';
    helpMessage += 'Her job is to make your server more fun and enjoyable—not to be helpful!\n';
    helpMessage += '\n**How Nyx Works:**\n';
    helpMessage += '- Nyx responds if you mention her (e.g. @Nyx)\n';
    helpMessage += '- She responds if you reply to one of her messages\n';
    helpMessage += "- She responds if you say 'nyx' anywhere in your message\n";
    helpMessage += '- She uses AI to generate her replies, and can remember context in each channel.\n';
    helpMessage += "- Use `!wack` to make her forget the conversation in a channel.\n";
    helpMessage += '\n**Commands:**\n';
    helpMessage += '- `!help` - Display help information\n';
    helpMessage += '- `!ping` - Check bot latency\n';
    helpMessage += '- `!activate` - Make the bot respond to all messages in a channel\n';
    helpMessage += '- `!deactivate` - Make the bot only respond when mentioned, replied to, or randomly\n';
    helpMessage += '- `!blacklist @user` or `!blacklist #channel` - Prevent a user or channel from using the bot\n';
    helpMessage += '- `!whitelist @user` or `!whitelist #channel` - Allow a blacklisted user or channel to use the bot\n';
    helpMessage += '- `!logging` - Toggle detailed console logging\n';
    helpMessage += '- `!wack` - Clear the AI message context for the current channel\n';
    
    // Show specific command help if requested
    if (args.length > 0) {
      const commandName = args[0].toLowerCase();
      const command = commands.get(commandName);
      
      if (command) {
        let detail = `**Command: ${prefix}${command.name}**\n`;
        detail += `Description: ${command.description || 'No description available'}\n`;
        
        // Show usage if available
        if (command.usage) {
          detail += `Usage: ${prefix}${command.name} ${command.usage}\n`;
        }
        
        // Show aliases if available
        if (command.aliases && command.aliases.length) {
          detail += `Aliases: ${command.aliases.join(', ')}\n`;
        }
        
        return message.reply({ content: detail });
      } else {
        return message.reply({ content: `Command "${commandName}" not found. Use ${prefix}help to see all commands.` });
      }
    }
    
    // Only show the bullet list, not the second block
    return message.reply({ content: helpMessage });
  }
};