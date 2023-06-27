require('dotenv/config');
const express = require('express');
const { Client, IntentsBitField } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

client.on('ready', () => {
  console.log('Huevin online!');
});

const configuration = new Configuration({
  apiKey: process.env.API_KEY,
});

const openai = new OpenAIApi(configuration);

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== process.env.CHANNEL_ID) return;
  if (message.content.startsWith('!')) return;

  let conversationLog = [
    { role: 'system', content: 'You are a helpful assistant.' },
    {
      role: 'system',
      content:
        "You work by accumulating context everytime someone says 'Huevin,' in a channel and respond acccordingly",
    },
    {
      role: 'system',
      content: 'Whenever you are asked to write, generate, or provide code or code snippets, format it like this example: ```python\nprint("hello world")\n``` (type the name of the language after the first 3 backticks)',
    },
    {
      role: 'system',
      content:
        "Make sure your responses are 2000 characters max. If it would've been more, make that clear and be ready to finish the response.",
    },
    { role: 'assistant', content: "Hello, I am the evil AI model.\nStart your prompt with 'Huevin,' to unleash my darkness." },
  ];

  if (message.content.startsWith('Huevin,')) {
    try {
      await message.channel.sendTyping();
      let prevMessages = await message.channel.messages.fetch({ limit: 15 });
      prevMessages.reverse();

      prevMessages.forEach((msg) => {
        if (msg.content.startsWith('!')) return;
        if (msg.author.id !== client.user.id && message.author.bot) return;
        if (msg.author.id == client.user.id) {
          conversationLog.push({
            role: 'assistant',
            content: msg.content,
            name: msg.author.username.replace(/\s+/g, '_').replace(/[^\w\s]/gi, ''),
          });
        }

        if (msg.author.id == message.author.id) {
          conversationLog.push({
            role: 'user',
            content: msg.content,
            name: message.author.username.replace(/\s+/g, '_').replace(/[^\w\s]/gi, ''),
          });
        }
      });

      if (message.content.slice(10).length >= 2000) {
        await message.channel.send('Your request is too long, please limit it to at most 2000 characters.');
      } else {
        const result = await openai.createChatCompletion({
          model: 'gpt-3.5-turbo',
          messages: conversationLog,
          max_tokens: 400,
          temperature: 0,
        });

        const response = result.data.choices[0];
        if (response.message && response.message.content) {
          const responseContent = response.message.content;
          message.reply(responseContent.replace(/^Huevin,/i, ''));
        } else {
          console.log('Invalid response from OpenAI:', response);
        }
      }
    } catch (error) {
      console.log(`ERR: ${error}`);
    }
  }
});

client.login(process.env.TOKEN);

app.get('/', (req, res) => {
  res.send('Bot is alive!');
});
