import { SlashCommandBuilder } from 'discord.js';
import { EXECUTIVE_IDS } from '../../helpers/constants.js';
import { isValidDateTime } from '../../helpers/utils.js';
import { uploadActivity } from '../../helpers/db.js';

export const data = new SlashCommandBuilder()
  .setName('create_activity')
  .setDescription('Create an activity comprising LeetCode challenges.')
  .addStringOption(option => 
    option.setName("title")
      .setDescription("The title for the activity.")
      .setRequired(true)
  )
  .addStringOption(option => 
    option.setName("description")
      .setDescription("The description for the activity.")
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName("start_datetime")
      .setDescription("Datetime for when the event starts in YYYY-MM-DD HH:MM format.")
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName("end_datetime")
      .setDescription("Datetime for when the event ends in YYYY-MM-DD HH:MM format.")
      .setRequired(true)
  )


export const execute = async (interaction) => {
  await interaction.deferReply({ ephemeral: true })

  const userId = interaction.user.id

  if (!EXECUTIVE_IDS.includes(userId)) {
    return await interaction.editReply({
      content: "Bawal >:(",
      ephemeral: true,
    })
  }

  const title = interaction.options.getString('title')
  const description = interaction.options.getString('description')
  const startDatetime = interaction.options.getString('start_datetime')
  const endDatetime = interaction.options.getString('end_datetime')

  if (!isValidDateTime(startDatetime) || !isValidDateTime(endDatetime)) {
    return await interaction.editReply("You entered an invalid datetime string, please follow format: YYYY-MM-DD HH:MM")
  }

  await interaction.editReply({
    content: "Updating database...",
    ephemeral: true,
  })


  const { data, error } = await uploadActivity(title, description, startDatetime, endDatetime)

  if (error) {
    console.error(error)
    return await interaction.editReply({
      content: "Error creating activity. Please try again later.",
      ephemeral: true,
    })
  }

  const eventId = data[0].id

  return await interaction.editReply({
    content: `Successfully created event with **EventID: ${eventId}**`,
    ephemeral: true,
  })
}
