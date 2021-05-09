const request = require('request');
const Discord = require('discord.js');
const { chId, prefix } = require('./general/config.json');
const { main, apiKey } = require('./general/token.json');

const client = new Discord.Client();

const APOD = (id = chId) => {
  request(`https://api.nasa.gov/planetary/apod?api_key=${apiKey}`, { json: true }, (err, res, body) => {
    if (err) return console.log(err);
    const ch = client.channels.cache.get(id);
    var embed = new Discord.MessageEmbed()
      .setImage(body.hdurl)
      .setAuthor(`Credit to NASA for providing the APOD(Astronomy Picture of the Day) <3`)
      .setTitle(body.title)
      .setURL(body.hdurl)
      .setDescription(body.explanation)
      .setColor(`#0b3d91`)
      .setFooter(body.date);
    ch.send(embed);
  });
};

const astros = (id = String) => {
  request(`http://api.open-notify.org/astros.json`, { json: true }, (err, res, body) => {
    if (err) return console.log(err);
    const ch = client.channels.cache.get(id);
    var embed = new Discord.MessageEmbed()
      .setAuthor(`Credit to Open Notify <3`)
      .setTitle(`Current People in Space`)
      .setColor('#0b3d91');
    for(let i of body.people) {
      embed.addField(i.name, `Craft: ${i.craft}`, true);
    }
    ch.send(embed);
  });
};

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  setInterval(() => {
    var date = new Date();
    if (date.getHours() == 6 && date.getMinutes() == 0) APOD();
  }, 60000);
  console.log(`Bot init complete`);
});

client.on('message', (msg) => {
  if (msg.author.bot || msg.webhookID) return;

  if (msg.author.id == '473110112844644372' && msg.content == '!test' && msg.channel.type == 'dm') { APOD(); }

  if (!msg.content.toLowerCase().startsWith(prefix)) return;
  const args = msg.content.slice(prefix.length).trim().split(' ');
  const command = args.shift().toLowerCase();

  if (command == 'apod') {
    APOD(msg.channel.id);
  } else if (command == 'astros') {
    astros(msg.channel.id);
  }
});

client.login(main);