import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { fetchActivity } from '../../helpers/db.js';
import { formatLongDateString } from '../../helpers/utils.js';

export const data = new SlashCommandBuilder()
		.setName('view_activity')
		.setDescription('View details and participants of an activity.')
    .addIntegerOption(option => 
      option.setName("event_id")
        .setDescription("The Event ID of the event you want to view.")
        .setRequired(true)
    )

export const execute = async (interaction) => {
  await interaction.deferReply({ ephemeral: true })

  const eventId = interaction.options.getInteger("event_id")

  const { data, error } = await fetchActivity(eventId)

  if (error) {
    return await interaction.editReply({
      content: "Failed to view activity details. Please try again later.",
      ephemeral: true,
    })
  }

  const title = data.title
  const description = data.description
  const startDate = formatLongDateString(data.startDatetime)
  const endDate = formatLongDateString(data.endDatetime)
  const participants = data.participants

  const embedDescription = `${description}\n\n**Start**: ${startDate}\n**End**: ${endDate}\n\n**Participants**`
  let usernames = ['----']
  let accounts = ['----']
  let numbers = ['----']


  for (let i = 0; i < participants.length; i++) {
    const discordId = participants[i].discordId
    const leetcodeUsername = participants[i].leetcodeUsername
    const accountLink = `https://leetcode.com/u/${leetcodeUsername}/`
    const accountDisplay = `[${leetcodeUsername}](${accountLink})`
    const username = `<@${discordId}>`

    usernames.push(username)
    accounts.push(accountDisplay)
    numbers.push(i + 1)
  }

  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle(`🎟️\u3000${title}\u3000🎟️`)
    .setDescription(embedDescription)


  embed.addFields(
    { name: '#\u3000', value: numbers.join('\u3000\n'), inline: true },
    { name: 'Username\u3000', value: usernames.join('\u3000\n'), inline: true },
    { name: 'LeetCode Account\u3000', value: accounts.join('\u3000\n'), inline: true },
  );  

  await interaction.editReply({ 
		embeds: [embed],
		ephemeral: true,
	});
}
