import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { fetchLeaderboard } from '../../helpers/utils.js';

export const data = new SlashCommandBuilder()
  .setName('show_leaderboard')
  .setDescription('Shows the leaderboard based on total problems solved on LeetCode.');

export const execute = async (interaction) => {
  await interaction.deferReply({ ephemeral: true });

  const leaderboard = await fetchLeaderboard()

  const topTen = leaderboard.slice(0, 10)

  let data = []
  
  for (let i = 0; i < topTen.length; i++) {
    const rank = i + 1;
    const discordId = topTen[i].discordId
    const solved = topTen[i].solves
    const username = `<@${discordId}>`

    data.push({
      rank: rank,
      username: username,
      solved: solved,
    })
  }

  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('🏆\u3000LeetCode Leaderboard\u3000🏆')
    .setDescription('Top 10 members with most challenges solved')
    .setTimestamp()


  let ranks = ['----']
  let usernames = ['----']
  let solves = ['----']

  for (const user of data) {
    ranks.push(user.rank)
    usernames.push(user.username)
    solves.push(user.solved)
  }

  embed.addFields(
    { name: 'Rank', value: ranks.join('\u3000\n'), inline: true },
    { name: 'Username', value: usernames.join('\u3000\n'), inline: true },
    { name: 'Problems Solved', value: solves.join('\u3000\n'), inline: true },
  );

  await interaction.editReply({ embeds: [embed] , ephemeral: true });
};
