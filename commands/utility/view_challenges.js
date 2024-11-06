import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { fetchActivity, fetchChallenges } from '../../helpers/db.js';
import { getCurrentTime, toLocalTime } from '../../helpers/utils.js';

export const data = new SlashCommandBuilder()
  .setName('view_challenges')
  .setDescription('View the challenge set of an activity.')
  .addIntegerOption(option =>
    option.setName("event_id")
      .setDescription("The Event ID of the activity you want to view the challenge set of.")
      .setRequired(true)
  )

export const execute = async (interaction) => {
  await interaction.deferReply({ ephemeral: true })

  // Check if user is participant of the activity first
  const discordId = interaction.user.id
  const eventId = interaction.options.getInteger("event_id")

  let { data, error }  = await fetchActivity(eventId)

  if (data?.length === 0) {
    return await interaction.editReply({
      content: `That Event ID does not exist! Use \`/show_activities\` to list the Event IDs of activities.`,
      ephemeral: true,
    })
  }

  let isParticipant = false
  for (const participant of data.participants) {
    const participantId = participant.discordId
    if (participantId == discordId) {
      isParticipant = true
    }
  }

  if (!isParticipant) {
    return await interaction.editReply({
      content: `You are not yet a participant for this activity. Please join using \`/join_activity event_id:${eventId}\` to continue.`,
      ephemeral: true,
    })
  }

  // Check current time if it is during the event duration
  const startDatetime = new Date(data.startDatetime)
  const endDatetime = new Date(data.endDatetime)
  const currentDatetime = new Date()

  if (currentDatetime < startDatetime) {
    return await interaction.editReply({
      content: `This event has not started yet. Viewing challenges is disabled until then.`,
      ephemeral: true,
    })
  }

  if (currentDatetime > endDatetime) {
    return await interaction.editReply({
      content: `This event has ended. Thank you for participating!`,
      ephemeral: true,
    })
  }

  const activity = data;
  // Fetch challenge set
  ({ data, error } = await fetchChallenges(eventId))

  let labels = ['----']
  let titles = ['----']
  let points = ['----']

  for (let i = 0; i < data.length; i++) {
    const challenge = data[i]
    const title = challenge.display_title
    const link = `https://leetcode.com/problems/${challenge.title_slug}/`
    const point = challenge.points

    const displayTitle = `[${title}](${link})`
    labels.push(i + 1)
    titles.push(displayTitle)
    points.push(point)

  }

  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle(`⚔️\u3000${activity.title}\u3000⚔️`)
    .setDescription(activity.description)

  embed.addFields(
    { name: '#\u3000', value: labels.join('\u3000\n'), inline: true },
    { name: 'Challenge\u3000', value: titles.join('\u3000\n'), inline: true },
    { name: 'Points\u3000', value: points.join('\u3000\n'), inline: true },
  );  

  return await interaction.editReply({ 
		embeds: [embed],
		ephemeral: true,
	});
}
