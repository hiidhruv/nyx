/**
 * Simple ping command
 */
module.exports = {
  name: 'ping',
  description: 'Check the bot\'s response time',
  
  async execute(message, args, client) {
    const startTime = Date.now();
    const reply = await message.reply('Pinging...');
    const endTime = Date.now();
    
    // Calculate ping
    const botLatency = endTime - startTime;
    
    await reply.edit({ content: `Pong! Bot latency: ${botLatency}ms` });
  }
}; 