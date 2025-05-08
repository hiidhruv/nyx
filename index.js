const { Client } = require('revolt.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const commandHandler = require('./utils/commandHandler');
const messageHandler = require('./utils/messageHandler');

// Create necessary directories if they don't exist
const dataDir = path.join(__dirname, './data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Create Revolt client
const client = new Client();

// When the client is ready
client.on("ready", async () => {
  console.log(`Logged in as ${client.user.username}`);
  
  // Set custom status: Watching ur mom
  client.users.edit({
    status: {
      text: "ur mom",
      presence: "Busy", // Revolt uses "Online", "Idle", "Focus", "Busy", or "Invisible"
    },
  });

  // Load all commands
  await commandHandler.loadCommands(client);
});

// Handle messages
client.on("message", async (message) => {
  // Skip processing for messages from bots
  if (message.author?.bot) return;
  
  // Check if the message is a command
  if (message.content?.startsWith(process.env.PREFIX || '!')) {
    await commandHandler.handleCommand(message, client);
  } else {
    // Otherwise, process as a regular message
    await messageHandler.handleMessage(message, client);
  }
});

// Handle errors
client.on("error", (error) => {
  console.error('Revolt client error:', error);
});

// Login to Revolt
client.loginBot(process.env.REVOLT_TOKEN)
  .catch(error => {
    console.error('Error logging in to Revolt:', error);
    process.exit(1);
  });

// Handle process termination
process.on('SIGINT', () => {
  console.log('Bot shutting down...');
  // Close the database connection
  const db = require('./database/database');
  db.closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Bot shutting down...');
  // Close the database connection
  const db = require('./database/database');
  db.closeDatabase();
  process.exit(0);
}); 