const readline = require('readline');
var TokenWizard = require('./public-script/NewToken.js')('.');
var path = require('path');
const { dirname } = require('path');
const RootFolder = dirname(require.main.filename);
const fs = require('fs');
var index = 10;

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

//Create a timeout for the set new token question.
TokenTimeout();
console.log('Skipping token wizard in ' + [index] + ' seconds. Be FAST to win the battle against the clock!');

//Create set timeout question.
rl.question('Set new token? y/n: ', function (Result) {
	if (Result === 'y') {
		index = 0;
		TokenWizard.new(function () {
			console.log('Completed token wizard!');
			BotInit();
		});
	}
	if (Result === 'n') {
		index = 0;
		BotInit();
	}
});

//Token timeout function
function TokenTimeout(){
	if(index === 0){
		rl.write("e\n");
		console.log('Skipped setting new token question...')
		BotInit();
	}else{
		setTimeout(function() {
			index = +[index] - 1;
			TokenTimeout();
		}, 1000);
	}
}


//Base bot functionality
function BotInit() {
	console.log('Successfully registered application commands!');
	console.log('Starting bot...');
	const { Client, Collection, Intents } = require('discord.js');
	const { token } = require(RootFolder + '/config.json');
	
	const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
	
	const eventFiles = fs.readdirSync(RootFolder + '/events').filter(file => file.endsWith('.js'));
	
	for (const file of eventFiles) {
		const event = require(RootFolder + `/events/${file}`);
		if (event.once) {
			client.once(event.name, (...args) => event.execute(...args));
		}
		else {
			client.on(event.name, (...args) => event.execute(...args));
		}
	}
	
	client.commands = new Collection();
	
	const commandFiles = fs.readdirSync(RootFolder + '/commands').filter(file => file.endsWith('.js'));
	
	for (const file of commandFiles) {
		const command = require(RootFolder + `/commands/${file}`);
		// Set a new item in the Collection
		// With the key as the command name and the value as the exported module
		client.commands.set(command.data.name, command);
	}
	
	client.on('interactionCreate', async interaction => {
		if (!interaction.isCommand()) return;
	
		const command = client.commands.get(interaction.commandName);
	
		if (!command) return;
	
		try {
			await command.execute(interaction);
		}
		catch (error) {
			console.error(error);
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	});
	
	client.login(token); 
}