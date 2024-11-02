import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { fetchActivities } from '../../helpers/db.js';
import { formatDateString } from '../../helpers/utils.js';

export const data = new SlashCommandBuilder()
  .setName('show_activities')
  .setDescription('Shows the ongoing and upcoming activities of Competitive Programming branch.')

export const execute = async (interaction) => {
  await interaction.deferReply({ ephemeral: true })

  const { data, error } = await fetchActivities();

  if (error) {
    return await interaction.editReply({
      content: "Failed to fetch activities. Please try again later.",
      ephemeral: true,
    })
  }

  let ids = ['----']
  let titles = ['----']
  let descriptions = ['----']
  let datetimes = ['----']
  for (const row of data) {
    ids.push(row.id)
    titles.push(row.title)
    descriptions.push(row.description)

    const start = formatDateString(row.start_datetime)
    const end = formatDateString(row.end_datetime)
    const datetime = `${start}\u3000-\u3000${end}`
    datetimes.push(datetime)
  }

  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('📅\u3000Activity Schedule\u3000📅')
    .setDescription('Activities for Competitive Programming branch')


  embed.addFields(
    { name: 'Event ID\u3000', value: ids.join('\u3000\n'), inline: true },
    { name: 'Event Title\u3000', value: titles.join('\u3000\n'), inline: true },
    { name: 'Event Date & Time (Start - End)\u3000', value: datetimes.join('\u3000\n'), inline: true },
  );

  return await interaction.editReply({ embeds: [embed] , ephemeral: true });
}
