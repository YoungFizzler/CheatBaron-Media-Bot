const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs').promises;
require('dotenv').config();

const DEFAULT_MODEL = 'openai/chatgpt-4o-latest';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
  ],
});

const LOGO_URL = 'https://cheatbaron.com/cdn/shop/files/Artboard_1.png';

client.on('error', error => {
  console.error('Discord client error:', error);
});

client.on('warn', warning => {
  console.warn('Discord client warning:', warning);
});


process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

client.on('interactionCreate', async interaction => {
  try {
    if (interaction.isCommand()) {
      const { commandName } = interaction;

      if (commandName === 'start') {
        const welcomeEmbed = new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle('🎮 CheatBaron Media Generator')
          .setDescription('Make sure grab a promo code first!')
          .setFooter({ text: 'Made with ❤️ by CheatBaron X YoungFizz' });

        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('create_title')
              .setLabel('Generate Title')
              .setStyle(ButtonStyle.Primary)
              .setEmoji('📝'),
            new ButtonBuilder()
              .setCustomId('create_description')
              .setLabel('Generate Description')
              .setStyle(ButtonStyle.Primary)
              .setEmoji('📋'),
            new ButtonBuilder()
              .setCustomId('help')
              .setLabel('Help')
              .setStyle(ButtonStyle.Secondary)
              .setEmoji('❓')
          );

        await interaction.reply({
          embeds: [welcomeEmbed],
          components: [row]
        });
      }
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'promo_modal') {
        const promoCode = interaction.fields.getTextInputValue('promo_code');
        const content = await generateContent('description', 'fortnite', promoCode);
        const buffer = Buffer.from(content, 'utf8');
        
        const descEmbed = new EmbedBuilder()
          .setColor(0x9b59b6)
          .setTitle('🎮 FORTNITE Description')
          .setDescription(`Promo code: ${promoCode}`)
          .setThumbnail(LOGO_URL)
          .setFooter({ text: 'Description attached as text file' });

        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('generate_description_no_promo')
              .setLabel('Generate Another')
              .setStyle(ButtonStyle.Primary)
              .setEmoji('🔄'),
            new ButtonBuilder()
              .setCustomId('back_to_main')
              .setLabel('Back to Main Menu')
              .setStyle(ButtonStyle.Secondary)
              .setEmoji('◀️')
          );
        
        await interaction.reply({
          embeds: [descEmbed],
          files: [{
            attachment: buffer,
            name: 'fortnite_description.txt'
          }],
          components: [row]
        });
      }
    }

    if (interaction.isButton()) {
      const { customId } = interaction;

      if (customId === 'help') {
        const helpEmbed = new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle('🤖 CheatBaron Media Bot Help')
          .setDescription('Generate titles and descriptions for your media!')
          .setThumbnail(LOGO_URL)
          .addFields(
            { 
              name: '📝 Available Options', 
              value: '• Generate Titles\n• Generate Descriptions\n• Custom Promo Codes' 
            },
            {
              name: '🎮 Supported Games',
              value: '• Fortnite'
            },
            {
              name: '💡 How to Start',
              value: 'Use `/start` to begin generating content!'
            }
          )
          .setFooter({ text: 'Made with ❤️ by CheatBaron X YoungFizz' });

        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('back_to_main')
              .setLabel('Back to Main Menu')
              .setStyle(ButtonStyle.Secondary)
              .setEmoji('◀️')
          );

        await interaction.update({
          embeds: [helpEmbed],
          components: [row]
        });
      }

      if (customId === 'back_to_main') {
        const welcomeEmbed = new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle('🎮 CheatBaron Media Generator')
          .setThumbnail(LOGO_URL)
          .setFooter({ text: 'Made with ❤️ by CheatBaron X YoungFizz' });

        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('create_title')
              .setLabel('Generate Title')
              .setStyle(ButtonStyle.Primary)
              .setEmoji('📝'),
            new ButtonBuilder()
              .setCustomId('create_description')
              .setLabel('Generate Description')
              .setStyle(ButtonStyle.Primary)
              .setEmoji('📋'),
            new ButtonBuilder()
              .setCustomId('help')
              .setLabel('Help')
              .setStyle(ButtonStyle.Secondary)
              .setEmoji('❓')
          );

        await interaction.update({
          embeds: [welcomeEmbed],
          components: [row]
        });
      }

      if (customId === 'create_title' || customId === 'create_description') {
        const type = customId === 'create_title' ? 'title' : 'description';
        
        if (type === 'title') {
          const content = await generateContent('title', 'fortnite', null);
          const cleanTitle = content
            .replace(/\[.*?\]/g, '')
            .replace(/🔥|🏆|⚡️|[^\x00-\x7F]/g, '')
            .replace(/\(.*?\)/g, '')
            .replace(/\s+/g, ' ')
            .trim();

          const titleEmbed = new EmbedBuilder()
            .setColor(0x9b59b6)
            .setTitle('🎮 FORTNITE Title')
            .setDescription('```\n' + cleanTitle + '\n```')
            .setThumbnail(LOGO_URL)
            .setFooter({ text: 'Generated by CheatBaron Media Bot' });

          const row = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('generate_title_no_promo')
                .setLabel('Generate Another')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🔄'),
              new ButtonBuilder()
                .setCustomId('back_to_main')
                .setLabel('Back to Main Menu')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('◀️')
            );

          await interaction.update({
            embeds: [titleEmbed],
            components: [row]
          });
        } else {
          const promoRow = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId(`generate_description_no_promo`)
                .setLabel('Generate Without Promo')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🎯'),
              new ButtonBuilder()
                .setCustomId(`add_promo_description`)
                .setLabel('Add Promo Code')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🎫'),
              new ButtonBuilder()
                .setCustomId('back_to_main')
                .setLabel('Back')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('◀️')
            );

          const typeEmbed = new EmbedBuilder()
            .setColor(0x9b59b6)
            .setTitle('📝 Generate Description')
            .setDescription('Would you like to include a promo code?')
            .setThumbnail(LOGO_URL)
            .setFooter({ text: 'Made with ❤️ by CheatBaron X YoungFizz' });

          await interaction.update({
            embeds: [typeEmbed],
            components: [promoRow]
          });
        }
      }

      if (customId === 'add_promo_description') {
        const modal = new ModalBuilder()
          .setCustomId('promo_modal')
          .setTitle('Enter Promo Code');

        const promoInput = new TextInputBuilder()
          .setCustomId('promo_code')
          .setLabel('Promo Code')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Enter your promo code')
          .setRequired(true)
          .setMaxLength(20);

        const firstActionRow = new ActionRowBuilder().addComponents(promoInput);
        modal.addComponents(firstActionRow);

        await interaction.showModal(modal);
      }

      if (customId.startsWith('generate_')) {
        const [_, type, promo] = customId.split('_');
        const content = await generateContent(type, 'fortnite', null);

        if (type === 'description') {
          const buffer = Buffer.from(content, 'utf8');
          
          const descEmbed = new EmbedBuilder()
            .setColor(0x9b59b6)
            .setTitle('🎮 FORTNITE Description')
            .setDescription('No promo code specified')
            .setThumbnail(LOGO_URL)
            .setFooter({ text: 'Description attached as text file' });

          const row = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('generate_description_no_promo')
                .setLabel('Generate Another')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🔄'),
              new ButtonBuilder()
                .setCustomId('back_to_main')
                .setLabel('Back to Main Menu')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('◀️')
            );
          
          await interaction.update({
            embeds: [descEmbed],
            files: [{
              attachment: buffer,
              name: 'fortnite_description.txt'
            }],
            components: [row]
          });
        } else {
          const cleanTitle = content
            .replace(/\[.*?\]/g, '')
            .replace(/🔥|🏆|⚡️|[^\x00-\x7F]/g, '')
            .replace(/\(.*?\)/g, '')
            .replace(/\s+/g, ' ')
            .trim();

          const titleEmbed = new EmbedBuilder()
            .setColor(0x9b59b6)
            .setTitle('🎮 FORTNITE Title')
            .setDescription('```\n' + cleanTitle + '\n```')
            .setThumbnail(LOGO_URL)
            .setFooter({ text: 'Generated by CheatBaron Media Bot' });

          const row = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('generate_title_no_promo')
                .setLabel('Generate Another')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🔄'),
              new ButtonBuilder()
                .setCustomId('back_to_main')
                .setLabel('Back to Main Menu')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('◀️')
            );

          await interaction.update({
            embeds: [titleEmbed],
            components: [row]
          });
        }
      }
    }
  } catch (error) {
    await handleError(error, interaction);
  }
});

const commands = [
  new SlashCommandBuilder()
    .setName('start')
    .setDescription('Start generating content with CheatBaron Media Bot'),
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('🔄 Refreshing slash commands...');
    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_APPLICATION_ID),
      { body: commands }
    );
    console.log('✅ Slash commands registered successfully.');
  } catch (error) {
    console.error('❌ Error registering slash commands:', error);
  }
})();

const gameTemplates = {
  fortnite: {
    modes: ['Arena', 'Zero Build', 'Ranked BR', 'Reload Cup', 'Unreal Ranked', 'Champion League'],
    terms: ['Victory Royale', 'Battle Bus', 'Storm', 'Mats', 'Edits', 'Unreal', 'Champion'],
    achievements: ['Champion League', 'Unreal Rank', 'Top 100', '40 Bomb', '50 Bomb', 'Tournament Win'],
    features: ['Aimbot', 'ESP', 'Soft Aim', 'No Recoil', 'Build Assist'],
    titleFormats: [
      "DROPPING {kills} KILLS while BLATANTLY CHEATING in {mode}",
      "Using Fortnite Cheats To Speedrun {achievement}...",
      "CHEATING With The BEST Fortnite CHEAT in {mode} 🏆",
      "{achievement} in 24 HOURS using CHEATS",
      "Road to {achievement} with PRIVATE CHEATS Ep.{episode}"
    ],
    episodeNumbers: ['S1E1', 'S2E3', 'EP.4', 'Part 5', 'Episode 6'],
    killCounts: ['30', '40', '50', '60', '70'],
    tags: [
      'fortnite soft aim', 'fortnite aimbot', 'fortnite esp', 'fortnite hacks',
      'fortnite cheats', 'aim assist', 'controller aim assist', 'keyboard aim assist',
      'fortnite chapter', 'fortnite season', 'zero build hacks', 'arena cheats',
      'tournament cheats', 'champion league cheats', 'unreal rank', 'private fortnite',
      'softaim', 'soft aim', 'fortnite private', 'undetected fortnite'
    ]
  },
  rust: {
    modes: ['Official', 'Vanilla', '600 POP', 'Main', 'Monthly', 'Weekly'],
    terms: ['Wipe Day', 'Raid', 'Compound', 'Monuments', 'Loot', 'PVP', 'Vanilla'],
    achievements: ['Server Domination', 'Raid Success', 'PvP God', 'Loot Control'],
    features: ['ESP', 'No Recoil', 'Silent Aim', 'Spider Climb', 'Admin ESP'],
    titleFormats: [
      "I Helped a RUST NOOB on WIPE DAY with the BEST RUST CHEAT...",
      "HOW TO DOMINATE {mode} SERVER with BEST RUST CHEAT..",
      "SOLO Legit Cheating on {mode} Server | ft. {feature}",
      "RAGE CHEATING Till Im Banned On Rust...",
      "{hours}h Rust Player | SOLO Legit Cheating | ft. {provider}"
    ],
    providers: ['Arctic', 'Division', 'Lumen', 'Hyperion'],
    hours: ['1000', '2000', '3000', '5000'],
    tags: [
      'rust scripts', 'rust recoil', 'rust esp', 'rust hacks', 'rust cheats',
      'rust pvp', 'rust raid', 'rust wipe', 'rust monthly', 'rust weekly',
      'rust official', 'rust vanilla', 'rust modded', 'rust aim', 'rust private',
      'rust undetected', 'rust silent aim', 'rust no recoil', 'rust admin esp',
      'rust spider climb'
    ]
  },
  warzone: {
    modes: ['Battle Royale', 'Resurgence', 'Plunder', 'DMZ', 'Ranked', 'MW3'],
    terms: ['Gulag', 'Loadout', 'Buy Station', 'Contracts', 'Warzone', 'MW3'],
    achievements: ['Win Streak', '30+ Kills', '40 Bomb', 'World Record'],
    features: ['Aimbot', 'ESP', 'UAV', 'No Recoil', 'Unlock All'],
    titleFormats: [
      "Warzone {version} Cheating gameplay with {provider} cheat",
      "DROPPING {kills} in {mode} with PRIVATE CHEATS",
      "The BEST Warzone Cheat in 2025 | Gameplay",
      "How Long Until Ban? {mode} Cheating EP.{episode}",
      "INSANE {kills} KILL GAME with {feature}"
    ],
    providers: ['Capyhax', 'Hyperion', 'Arctic', 'Blitz'],
    versions: ['2', '3', 'MW3'],
    tags: [
      'warzone hacks', 'warzone cheats', 'warzone aimbot', 'warzone esp',
      'warzone unlock all', 'warzone mw3', 'warzone season', 'warzone battle royale',
      'warzone resurgence', 'warzone plunder', 'warzone dmz', 'warzone ranked',
      'warzone private', 'warzone undetected', 'warzone silent aim', 'warzone no recoil',
      'warzone uav hack', 'warzone wallhack'
    ]
  },
  r6: {
    modes: ['Ranked', 'Unranked', 'Quick Match', 'Events', 'Premiere'],
    terms: ['Plant', 'Breach', 'Roam', 'Anchor', 'Siege'],
    achievements: ['Champion Rank', 'Diamond', 'Ace', 'Perfect Game'],
    features: ['Wallhacks', 'No Recoil', 'ESP', 'Trigger Bot', 'Silent Aim'],
    titleFormats: [
      "The best R6 cheat | {provider}.cc siege gameplay/showcase",
      "[NEW] RAINBOW SIX SIEGE HACK 2025 🔥",
      "UNDETECTED R6 Cheats | Road to {achievement}",
      "How Long Until Ban? {mode} Cheating EP.{episode}",
      "BLATANT R6 Cheating in {mode} | ft. {provider}"
    ],
    providers: ['Blitz', 'Arctic', 'Hyperion', 'Division'],
    tags: [
      'rainbow six siege hacks', 'r6 cheats', 'r6s hacks', 'siege aimbot',
      'siege wallhack', 'siege esp', 'r6 ranked cheats', 'siege ranked hacks',
      'r6 champion cheats', 'siege diamond hacks', 'r6 private', 'siege undetected',
      'r6 silent aim', 'siege no recoil', 'r6 triggerbot', 'siege wallhacks'
    ]
  }
};

async function generateContent(type, game, promocode) {
  if (type === 'description') {
    try {
      let description = await fs.readFile('disc.txt', 'utf8');
      
      const parts = description.split('ignore tags\n\n');
      let mainContent = parts[0];
      
      if (promocode) {
        mainContent = mainContent.replace(/❤️USE CODE .* FOR 10% OFF❤️\n/, `❤️USE CODE ${promocode} FOR 10% OFF❤️\n`);
      } else {
        mainContent = mainContent.replace(/❤️USE CODE .* FOR 10% OFF❤️\n/, '');
      }
      
      const template = gameTemplates[game];
      const tags = new Set(); 
      
      const commonTags = [
        'hack', 'cheat', 'cheats', 'hacks', 'private', 'undetected',
        'gameplay', 'showcase', 'tutorial', 'download', 'free'
      ];
      
      const gameTags = template.tags;
      for (let i = 0; i < 20; i++) {
        tags.add(gameTags[Math.floor(Math.random() * gameTags.length)]);
      }

      for (let i = 0; i < 10; i++) {
        tags.add(commonTags[Math.floor(Math.random() * commonTags.length)]);
      }
      
      const gameElements = [
        ...template.modes,
        ...template.terms,
        ...template.achievements,
        ...template.features,
        ...(template.providers || [])
      ];
      
      for (let i = 0; i < 10; i++) {
        const element = gameElements[Math.floor(Math.random() * gameElements.length)];
        tags.add(`${game} ${element.toLowerCase()}`);
      }

      const currentYear = new Date().getFullYear();
      tags.add(`${game} ${currentYear}`);
      tags.add(`${game} hack ${currentYear}`);
      tags.add(`${game} cheat ${currentYear}`);
      
      const tagString = Array.from(tags)
        .map(tag => tag.replace(/\s+/g, ' ').trim())
        .join(',');

      return mainContent.replace(/{GAME}/g, game.toUpperCase()) + 'ignore tags\n\n' + tagString;
    } catch (error) {
      console.error('Error reading description file:', error);
      return '⚠️ Failed to load description template.';
    }
  }

  const template = gameTemplates[game];
  const randomMode = template.modes[Math.floor(Math.random() * template.modes.length)];
  const randomTerm = template.terms[Math.floor(Math.random() * template.terms.length)];
  const randomAchievement = template.achievements[Math.floor(Math.random() * template.achievements.length)];
  
  const commonTitles = [
    "Dropping 70 KILLS while BLATANTLY CHEATING | Road To Overwatch Ban S4E4 ft. Hyperion.vip",
    "How Long Can You Cheat In CS2 Before Getting Banned?",
    "I Used AIMBOT To CHEAT Versus My Friends",
    "Legit Cheating in Valorant Plat Ranked",
    "Testing VACNET VS Rage Cheating... I got banned",
    "CHEATING With The BEST Fortnite CHEAT in Reload Cup … 🏆 ($200)",
    "I Helped a RUST NOOB on WIPE DAY with the BEST RUST CHEAT..",
    "Using Fortnite Cheats To Speed run From Unranked To UNREAL In Ranked...",
    "Warzone 2 Cheating gameplay with Capyhax MW3 cheat with Aimbot, ESP, Unlock All & more",
    "RAGE Cheating In CS2 Premiere Beta | Ragebot | Aimware.net",
    "Cheating until I get banned... (ft. The #1 Cheater)",
    "BLATANTLY Cheating in PRIME with FREE CHEATS | Road To Ban Episode 4",
    "The best R6 cheat | Blitz.cc seige gameplay/showcase",
    "HOW A DOMINATE RUST SERVER with BEST RUST CHEAT..",
    "I USED CHEAT on RUST OFFICAL SERVER (ft. Rust Lumen)",
    "Rust Legit CHEATING on 600 POP Vanilla Server with the BEST rust Cheats | Arctic Cheats",
    "I'm Going GLOBAL ELITE in CS2 with THIS Legit Cheat! (Midnight CS2 Cheat)",
    "3000h Rust Player | SOLO Legit Cheating | ft. Division",
    "HIGH TRUSTFACTOR CHEATING [CS2] [Pellix] [Green Trustfactor]",
    "[OVERPOWERED!] New Best Free Rivals Script (AIMBOT) (RAGE) + MORE!"
  ];

  const gameSpecificTitles = {
    fortnite: [
      "CHEATING With The BEST Fortnite CHEAT in Reload Cup … 🏆 ($200)",
      "Using Fortnite Cheats To Speed run From Unranked To UNREAL In Ranked..."
    ],
    rust: [
      "I Helped a RUST NOOB on WIPE DAY with the BEST RUST CHEAT..",
      "HOW A DOMINATE RUST SERVER with BEST RUST CHEAT..",
      "I USED CHEAT on RUST OFFICAL SERVER (ft. Rust Lumen)",
      "Rust Legit CHEATING on 600 POP Vanilla Server with the BEST rust Cheats | Arctic Cheats",
      "3000h Rust Player | SOLO Legit Cheating | ft. Division"
    ],
    warzone: [
      "Warzone 2 Cheating gameplay with Capyhax MW3 cheat with Aimbot, ESP, Unlock All & more"
    ],
    r6: [
      "The best R6 cheat | Blitz.cc seige gameplay/showcase",
      "[NEW] RAINBOW SIX SIEGE HACK 2025 / R6S FREE CHEAT 2025 / WH/ESP, AIM /UNDETECTED"
    ]
  };

  const prompt = `Generate 1 attention-grabbing YouTube title for a ${game.toUpperCase()} cheat video. Here are some successful examples of cheat video titles (study their format and style):

General Examples:
${commonTitles.slice(0, 5).join('\n')}

${game.toUpperCase()}-Specific Examples:
${gameSpecificTitles[game]?.join('\n') || commonTitles[0]}

Title Requirements:
- Study the patterns in the example titles above
- Use similar formatting and style
- Include numbers when relevant (kills, hours played)
- Use CAPS for emphasis like the examples
- Add emojis where appropriate (🔥, 🏆, ⚡️)
- Include "ft. [provider]" if mentioning a cheat provider
- Optional: Add episode numbers (S4E4, EP.4) if it's a series
- Optional: Add [UNDETECTED] or [NEW] if relevant
- Keep it dramatic and exciting
- Use "..." for suspense like many examples do

Available Elements:
- Game Mode: ${randomMode}
- Achievement: ${randomAchievement}
- Features: ${template.features.join(', ')}

Create a title that matches the style and impact of the examples above while being unique.`;

  try {
    console.log(`🤖 Using model: ${process.env.OPENROUTER_MODEL || DEFAULT_MODEL}`);
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/yourusername/titlebot',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenRouter API Error:', error);
      throw new Error(`API request failed: ${error.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0]?.message?.content?.trim();
    
    if (!generatedContent) {
      throw new Error('Generated content was empty');
    }
    
    return generatedContent;
  } catch (error) {
    console.error('❌ Error generating content:', error);
    return '⚠️ Failed to generate content. Please try again later. Error: ' + error.message;
  }
}

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log(`🤖 Using model: ${process.env.OPENROUTER_MODEL || DEFAULT_MODEL}`);
});

client.login(process.env.DISCORD_TOKEN).catch(error => {
  console.error('Failed to login to Discord:', error);
});

process.on('SIGINT', () => {
  console.log('Bot is shutting down...');
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Bot is shutting down...');
  client.destroy();
  process.exit(0);
});