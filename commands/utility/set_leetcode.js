import { SlashCommandBuilder } from 'discord.js';
import { getUsernameFromUrl, getUserPublicProfile, isValidUrl } from '../../helpers/utils.js';
import { upsertLeetCodeUsername } from '../../helpers/db.js';

export const data = new SlashCommandBuilder()
  .setName('set_leetcode')
  .setDescription('Link your LeetCode profile to your Discord account.')
  .addStringOption(option =>
    option.setName('account')
      .setDescription('Link to LeetCode profile or username')
      .setRequired(true));

export const execute = async (interaction) => {
  await interaction.deferReply({ ephemeral: true });

  const account = interaction.options.getString('account');

  let username = account;
  if (isValidUrl(account)) {
    try {
      username = getUsernameFromUrl(account);
    } catch (error) {
      return await interaction.editReply({
        content: `Error extracting username: ${error.message}`,
        ephemeral: true,
      });
    }
  }

  try {
    await interaction.editReply({
      content: "Validating LeetCode account...",
      ephemeral: true,
    })

    const response = await getUserPublicProfile(username);
    const json = await response.json();

    if (json.errors) {
      return await interaction.editReply({
        content: json.errors[0].message,
        ephemeral: true,
      });
    }

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return await interaction.editReply({
      content: 'There was an error fetching your LeetCode profile. Please try again later.',
      ephemeral: true,
    });
  }

  await interaction.editReply({
    content: "Updating database...",
    ephemeral: true,
  })

  const discordId = interaction.user.id;
  const { error } = await upsertLeetCodeUsername(username, discordId)

  if (error) {
    console.error('Error updating database:', error);
    return await interaction.editReply({
      content: "There was an error updating the database. Please try again later.",
      ephemeral: true,
    });
  }

  const profileLink = `https://leetcode.com/u/${username}/`

  const successMessage = `Successfully linked LeetCode account: ${profileLink}`;
  return await interaction.editReply({
    content: successMessage,
    ephemeral: true,
  });
}
