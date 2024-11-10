import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { fetchActivity, fetchChallenges, getActivitySolves, getLeetcodeUsername, uploadActivitySolves } from '../../helpers/db.js';
import { formatDateString, getCurrentTime, getRecentSubmissions, toLocalTime, toUtcTime } from '../../helpers/utils.js';

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

  if (error) {
    console.error(error)
    return await interaction.editReply({
      content: "Failed to fetch activity. Please try again later.",
      ephemeral: true,
    })
  }

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

  ({ data, error } = await fetchChallenges(eventId));


  const { data: username_data, error: err } = await getLeetcodeUsername(discordId)
  const username = username_data.leetcode_username

  const json = await getRecentSubmissions(username)

  if (!json.data || !json.data.recentAcSubmissionList) {
    return await interaction.editReply({
      content: "Failed to get recent submissions. Please try again later.",
      ephemeral: true,
    })
  }

  // TK
  const submissions = json.data.recentAcSubmissionList;

  let mappedChallenges = {}

  for (const challenge of data) {
    const titleSlug = challenge.title_slug

    mappedChallenges[titleSlug] = challenge
  }

  let recentSolves = []

  for (const submission of submissions) {
    if (submission.titleSlug in mappedChallenges) {
      let timeOfSolve = new Date(new Number(submission.timestamp) * 1000)

      if (timeOfSolve < startDatetime) {
        continue
      }

      recentSolves.push({
        activityChallengeId: mappedChallenges[submission.titleSlug].id,
        discordId: discordId,
        submissionId: submission.id,
        solvedOn: timeOfSolve,
      })
    }

  }

  const { data: uploadData, error: uploadErr } = await uploadActivitySolves(recentSolves)

  if (uploadErr) {
    console.error(uploadErr)
    return await interaction.editReply({
      content: "Failed to update progress on activity. Please try again later.",
      ephemeral: true
    })
  }

  const { data: solvesData, error: solvesError } = await getActivitySolves(eventId, discordId)

  let solveSlugs = new Set()
  let userPoints = 0
  let lastSolved = null

  console.log(solvesData)

  for (const solve of solvesData) {
    if (!solve.activity_challenges) {
      continue
    }
    const challenge = solve.activity_challenges
    const timeOfSolve = new Date(solve.solved_on)

    solveSlugs.add(challenge.title_slug)
    userPoints += challenge.points

    if (lastSolved == null || timeOfSolve > lastSolved) {
      lastSolved = timeOfSolve
    }
  }

  if (solvesError) {
    console.error(solvesError)
    return await interaction.editReply({
      content: "Failed to fetch progress on activity. Please try again later.",
      ephemeral: true,
    })
  }

  let labels = ['----']
  let titles = ['----']
  let points = ['----']
  let overallPoints = 0

  for (let i = 0; i < data.length; i++) {
    const challenge = data[i]
    const title = challenge.display_title
    const link = `https://leetcode.com/problems/${challenge.title_slug}/`
    const point = challenge.points
    const status = solveSlugs.has(challenge.title_slug) ? '✅' : '\u3000'
    overallPoints += point

    const displayTitle = `[${title}](${link})`
    labels.push(status)
    titles.push(displayTitle)
    points.push(point)

  }

  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle(`⚔️\u3000${activity.title}\u3000⚔️`)
    .setDescription(activity.description)

  embed.addFields(
    { name: 'Status\u3000', value: labels.join('\u3000\n'), inline: true },
    { name: 'Challenge\u3000', value: titles.join('\u3000\n'), inline: true },
    { name: 'Points\u3000', value: points.join('\u3000\n'), inline: true },
    { name: 'Score\u3000', value: `${userPoints} / ${overallPoints}`, inline: true },
  );  

  if (lastSolved != null) {
    embed.addFields({ name: 'Last Solve\u3000', value: formatDateString(lastSolved), inline: true })
  }

  return await interaction.editReply({ 
		embeds: [embed],
		ephemeral: true,
	});
}
