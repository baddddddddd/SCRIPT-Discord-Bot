import { SlashCommandBuilder } from 'discord.js';
import { uploadParticipant } from '../../helpers/db.js';

export const data = new SlashCommandBuilder()
  .setName('join_activity')
  .setDescription('Join an activity to start viewing challenges.')
  .addIntegerOption(option => 
    option.setName("event_id")
      .setDescription("The Event ID of the event you want to join.")
      .setRequired(true)
  )

export const execute = async (interaction) => {
  await interaction.deferReply({ ephemeral: true })

  const discordId = interaction.user.id
  const eventId = interaction.options.getInteger("event_id")

  const { data, error } = await uploadParticipant(discordId, eventId)

  if (error) {
    if (error.code == 23505) {
      return await interaction.editReply({
        content: `You already joined this activity. Use command \`/view_challenges event_id:${eventId}\` to view the challenges.`,
        ephemeral: true,
      })
    }

    else if (error.code == 23503) {
      return await interaction.editReply({
        content: "Failed to join the activity. Either the activity does not exist, or you still haven't linked your LeetCode account using `/set_leetcode`",
        ephemeral: true,
      })
    }

    return await interaction.editReply({
      content: "Failed to join the activity. Please try again later.",
      ephemeral: true,
    })
  }

  await interaction.editReply({ 
		content: `Successfully joined activity. Use command \`/view_challenges event_id:${eventId}\` to view the challenges.`,
		ephemeral: true,
	});
}
