import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { configDotenv } from 'dotenv';
configDotenv()

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Setup Discord Bot

let TOKEN = null
let CLIENT_ID = null
let GUILD_ID = null

if (process.env.DEV !== 'true') {
	console.log("Launching production bot...")
	TOKEN = process.env.DISCORD_TOKEN
	CLIENT_ID = process.env.CLIENT_ID
	GUILD_ID = process.env.GUILD_ID
} else {
	console.log("Launching development bot...")
	TOKEN = process.env.DISCORD_TOKEN_DEV
	CLIENT_ID = process.env.CLIENT_ID_DEV
	GUILD_ID = process.env.GUILD_ID_DEV
}

import { Client, Collection, Events, GatewayIntentBits } from 'discord.js'
import fs from 'fs';
import path from 'path';
import { updateLeaderboard } from './helpers/utils.js';
import { log } from 'util';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = await import(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		const formatDate = () => {
			const now = new Date();
			const options = { 
				month: 'short', 
				day: '2-digit', 
				hour: '2-digit', 
				minute: '2-digit', 
				second: '2-digit',
				hour12: false, 
				timeZone: 'Asia/Manila'
			};
			return now.toLocaleString('en-US', options).replace(',', '');
		};
		
		let logMessage = `[${formatDate()}] Executing /${interaction.commandName} by ${interaction.user.username}`
		console.log(logMessage)

		await command.execute(interaction);

		logMessage = `[${formatDate()}] Finished /${interaction.commandName} by ${interaction.user.username}`
		console.log(logMessage)

	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});


client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});


setInterval(updateLeaderboard, 10 * 60 * 1000);

client.login(TOKEN);


// Setup endpoint for UptimeRobot
// import express from 'express';
// const app = express();
// const port = 3000;

// app.get('/', (req, res) => {
//   res.send('The slave is running!');
// });

// app.listen(port, () => {
//   console.log(`Server is listening on port ${port}`);
// });
