// Simple in-memory logging state
let loggingEnabled = false;

/**
 * Command to toggle logging
 */
module.exports = {
  name: 'logging',
  description: 'Toggle detailed bot logging on or off',
  permissions: ['ManageServer'], // Revolt permissions to check
  
  async execute(message, args, client) {
    // Toggle the logging state
    loggingEnabled = !loggingEnabled;
    
    if (loggingEnabled) {
      return message.reply('Detailed logging enabled. Bot activities will be logged to console.');
    } else {
      return message.reply('Detailed logging disabled. Only errors will be logged to console.');
    }
  },
  
  // Method to check if logging is enabled
  isLoggingEnabled() {
    return loggingEnabled;
  }
}; 