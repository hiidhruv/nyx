# Nyx

A Revolt.chat bot built with revolt.js.

## Features

- Message responses when mentioned, replied to, or when 'nyx' is in the message
- Channel activation/deactivation
- User and channel blacklisting/whitelisting
- Clear AI context with `!wack`
- Simple permission system
- MongoDB integration for data persistence

## How Nyx Responds

Nyx will respond if you:
- Mention her (e.g. @Nyx)
- Reply to one of her messages
- Say 'nyx' anywhere in your message

## Setup

1. **Clone this repository**
   ```
   git clone https://github.com/yourusername/nyx.git
   cd nyx
   ```

2. **Install dependencies**
   ```
   npm install
   ```

3. **Configure environment variables**
   - Copy `env.example` to `.env`
   - Fill in your Revolt bot token and MongoDB URI

4. **Start the bot**
   ```
   npm start
   ```

## Commands

- `!help` - Display help information
- `!ping` - Check bot latency
- `!activate` - Make the bot respond to all messages in a channel
- `!deactivate` - Make the bot only respond when mentioned, replied to, or randomly
- `!blacklist @user` or `!blacklist #channel` - Prevent a user or channel from using the bot
- `!whitelist @user` or `!whitelist #channel` - Allow a blacklisted user or channel to use the bot
- `!logging` - Toggle detailed console logging
- `!wack` - Clear the AI message context for the current channel

## Development

For development with auto-restart on file changes:
```
npm run dev
```

## Creating Your Own Commands

Create a new file in the `commands` directory with this structure:

```js
module.exports = {
  name: 'commandname',
  description: 'Description of what the command does',
  usage: '[arguments]', // Optional
  permissions: ['ManageServer'], // Optional - permissions required
  
  async execute(message, args, client) {
    // Command logic here
    return message.reply('Response message');
  }
};
``` 