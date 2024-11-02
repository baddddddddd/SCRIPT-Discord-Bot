import { SlashCommandBuilder } from 'discord.js';
import { updateLeaderboard } from '../../helpers/utils.js';

export const data = new SlashCommandBuilder()
		.setName('refresh_leaderboard')
		.setDescription('Refreshes the leaderboard manually. Use sparingly.')

export const execute = async (interaction) => {
	await interaction.deferReply({ ephemeral: true })

	await updateLeaderboard()

  await interaction.editReply('Successfully refreshed leaderboard.');
}
