const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Map to store all commands
const commands = new Map();

/**
 * Loads all command files
 * @param {Object} client - Revolt client instance
 */
async function loadCommands(client) {
  const commandsPath = path.join(__dirname, '../commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  
  let loadedCount = 0;
  
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    // Set a new item in the Map with the command name as the key
    if ('name' in command && 'execute' in command) {
      commands.set(command.name, command);
      loadedCount++;
    } else {
      console.log(`[WARNING] Command ${file} missing "name" or "execute" property.`);
    }
  }
  
  // Log all loaded commands in one line
  if (loadedCount > 0) {
    console.log(`Loaded ${loadedCount} commands: ${Array.from(commands.keys()).join(', ')}`);
  }
  
  // Attach commands to client
  client.commands = commands;
}

/**
 * Handles command messages
 * @param {Object} message - Revolt message object
 * @param {Object} client - Revolt client instance
 */
async function handleCommand(message, client) {
  const prefix = process.env.PREFIX || '!';
  
  // Check if message starts with prefix
  if (!message.content.startsWith(prefix)) return;
  
  // Extract command and arguments
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  
  // Find the command
  const command = commands.get(commandName);
  
  if (!command) return;
  
  try {
    // Check permissions if needed
    if (command.permissions) {
      // Only check permissions if in a server context
      const server = message.channel.server;
      if (server && server.members) {
        const member = server.members.get(message.author._id);
        if (!member || !hasPermissions(member, command.permissions)) {
          return message.reply('You do not have permission to use this command.');
        }
      }
      // If not in a server, skip permission check (allow in DMs)
    }
    
    // Execute command
    await command.execute(message, args, client);
  } catch (error) {
    console.error(`Error executing command ${commandName}:`, error);
    try {
      await message.reply('There was an error while executing this command!');
    } catch (replyError) {
      console.error('Failed to send error reply:', replyError);
    }
    // Extra debug info
    console.error('Command:', commandName, 'Args:', args);
    if (error && error.stack) {
      console.error(error.stack);
    }
  }
}

/**
 * Checks if a member has specified permissions
 * @param {Object} member - Server member
 * @param {Array} requiredPermissions - Array of required permission strings
 * @returns {Boolean} Whether member has permissions
 */
function hasPermissions(member, requiredPermissions) {
  // Implementation depends on Revolt's permission system
  // This is a simplified example
  // If the member is the server owner, they have all permissions
  if (member.server.owner === member.user._id) return true;
  
  // For regular members, check permissions based on roles
  // This implementation would need to be expanded based on your needs
  return true; // Simplification for now
}

module.exports = {
  loadCommands,
  handleCommand
}; 