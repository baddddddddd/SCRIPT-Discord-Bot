import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { configDotenv } from 'dotenv';
configDotenv()

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let TOKEN = null
let CLIENT_ID = null
let GUILD_ID = null

if (process.env.DEV !== 'true') {
	console.log("Building production bot...")
	TOKEN = process.env.DISCORD_TOKEN
	CLIENT_ID = process.env.CLIENT_ID
	GUILD_ID = process.env.GUILD_ID
} else {
	console.log("Building development bot...")
	TOKEN = process.env.DISCORD_TOKEN_DEV
	CLIENT_ID = process.env.CLIENT_ID_DEV
	GUILD_ID = process.env.GUILD_ID_DEV
}

import { REST, Routes } from 'discord.js'
import fs from 'fs'
import path from 'path'


const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = await import(filePath);
		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

const rest = new REST().setToken(TOKEN);

(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		const data = await rest.put(
			Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
})();
