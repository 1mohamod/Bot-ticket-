const { Client, GatewayIntentBits, Partials, Events, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, SlashCommandBuilder, REST, Routes, PermissionFlagsBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  partials: [Partials.Channel]
});

// ✅ أمر /setup
const commands = [
  new SlashCommandBuilder()
    .setName('setup')
    .setDescription('إرسال بانل التذاكر')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
].map(cmd => cmd.toJSON());

// 🟢 تسجيل الأوامر
client.once(Events.ClientReady, async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  try {
    await rest.put(Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID), { body: commands });
    console.log('📦 Commands registered.');
  } catch (err) {
    console.error(err);
  }
});

// 📩 التفاعل مع الأوامر والأزرار
client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'setup') {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('create_ticket')
          .setLabel('🎫 فتح تذكرة')
          .setStyle(ButtonStyle.Primary)
      );
      await interaction.reply({ content: 'اضغط الزر لفتح تذكرة جديدة:', components: [row] });
    }
  }

  if (interaction.isButton()) {
    if (interaction.customId === 'create_ticket') {
      const existing = interaction.guild.channels.cache.find(c => c.name === `ticket-${interaction.user.id}`);
      if (existing) return interaction.reply({ content: '✅ عندك تذكرة مفتوحة بالفعل.', ephemeral: true });

      const channel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.id}`,
        type: ChannelType.GuildText,
        parent: process.env.CATEGORY_ID,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: interaction.user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
          },
          {
            id: process.env.STAFF_ROLE_ID,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
          }
        ]
      });

      const closeRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('🔒 إغلاق التذكرة')
          .setStyle(ButtonStyle.Danger)
      );

      await channel.send({
        content: `مرحباً <@${interaction.user.id}>، يرجى شرح مشكلتك وسيرد عليك الفريق.`, 
        components: [closeRow]
      });

      await interaction.reply({ content: `📬 تم فتح تذكرتك هنا: ${channel}`, ephemeral: true });
    }

    if (interaction.customId === 'close_ticket') {
      await interaction.reply({ content: '🔒 سيتم إغلاق التذكرة خلال 5 ثواني.', ephemeral: true });
      setTimeout(() => interaction.channel.delete().catch(console.error), 5000);
    }
  }
});

client.login(process.env.TOKEN);
const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Bot is running'));
app.listen(process.env.PORT || 3000);
