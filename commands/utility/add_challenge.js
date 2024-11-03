import { SlashCommandBuilder } from 'discord.js';
import { EXECUTIVE_IDS } from '../../helpers/constants.js';
import { uploadChallenge } from '../../helpers/db.js';
import { extractTitleSlug, fetchChallengeDetails } from '../../helpers/utils.js';

export const data = new SlashCommandBuilder()
  .setName('add_challenge')
  .setDescription('[ADMIN] Add challenge to an activity.')
  .addIntegerOption(option =>
    option.setName("event_id")
      .setDescription("The Event ID of the activity you want to add a challenge to.")
      .setRequired(true)
  )
  .addStringOption(option => 
    option.setName("challenge_link")
      .setDescription("The link to the LeetCode problem that you want to add as the challenge.")
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option.setName("points")
      .setDescription("The amount of points to reward for solving the challenge.")
      .setRequired(true)
  )

export const execute = async (interaction) => {
  await interaction.deferReply({ ephemeral: true })

  const discordId = interaction.user.id

  if (!EXECUTIVE_IDS.includes(discordId)) {
    return await interaction.editReply({
      content: "You are not allowed to use that >:((",
      ephemeral: true,
    })
  }

  const eventId = interaction.options.getInteger("event_id")
  const challengeLink = interaction.options.getString("challenge_link")
  const points = interaction.options.getInteger("points")

  const titleSlug = extractTitleSlug(challengeLink)

  if (!titleSlug) {
    return await interaction.editReply({
      content: "You entered an invalid link to a LeetCode problem.",
      ephemeral: true,
    })
  }

  const details = await fetchChallengeDetails(titleSlug)

  if (!details) {
    return await interaction.editReply({
      content: "You entered an invalid link to a LeetCode problem.",
      ephemeral: true,
    })
  }

  const id = details.questionId
  const title = details.title
  const difficulty = details.difficulty

  const { data, error } = await uploadChallenge(eventId, id, titleSlug, title, difficulty, points)

  if (error) {
    if (error.code == 23505) {
      return await interaction.editReply({
        content: `[${title}](${challengeLink}) is already included in the activity.`,
        ephemeral: true,
      })
    } else {
      return await interaction.editReply({
        content: "Failed to add challenge to activity. Please try again later.",
        ephemeral: true,
      })
    }
  }

  return await interaction.editReply({ 
		content: `Successfully added [${title}](${challengeLink}) to event.`,
		ephemeral: true,
	});
}
