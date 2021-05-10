const request = require('request');
const Discord = require('discord.js');
const { chId, prefix } = require('./general/config.json');
const { main, apiKey1, apiKey2 } = require('./general/token.json');

const client = new Discord.Client();

const time = (input = Number) => {
  input = Math.floor((input / 1000) / 60);
  let result = '';
  if (input >= 1440 && input < 525600) {
    result += `${Math.floor(input / 1440)}d `;
    input %= 1440;
  }
  if (input >= 60 && input < 1440) {
    result += `${Math.floor(input / 60)}h `;
    input %= 60;
  }
  if (input < 60) {
    result += `${Math.floor(input)}m`;
  }
  return result.trim();
};

const APOD = (id = chId) => {
  request(`https://api.nasa.gov/planetary/apod?api_key=${apiKey1}`, { json: true }, (err, res, body) => {
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
    for (let i of body.people) {
      embed.addField(i.name, `Craft: ${i.craft}`, true);
    }
    ch.send(embed);
  });
};

const ISS = () => {
  client.channels.cache.get('841103909070307368').messages.fetch('841103939302064199')
    .then(message => {
      request(`http://api.open-notify.org/iss-now.json`, { json: true }, (err, res, body) => {
        let lon = body.iss_position.longitude;
        let lat = body.iss_position.latitude;
        var date = new Date();
        var embed = new Discord.MessageEmbed()
          .setColor('#0b3d91')
          .setTitle(`ISS current location as of ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} EST`)
          .setImage(`https://image.maps.ls.hereapi.com/mia/1.6/mapview?apiKey=${apiKey2}&c=${lon},${lat}&sb=mk&t=1&z=1&w=500&h=300`);
        message.edit(embed);
      });
    })
    .catch(console.error);
};

const nextLaunch = () => {
  client.channels.cache.get('841137170525716480').messages.fetch('841137416278376448')
    .then(message => {
      request(`https://ll.thespacedevs.com/2.0.0/launch/upcoming/?format=json`, { json: true }, (err, res, body) => {
        var date = new Date();
        var id = 0;
        var temp = 0
        for(let i = 0; i < body.results.length; ++i) {
          var tempDate = new Date();
          if (temp == 0 || temp > (date.getTime() - tempDate.getTime()) && (date.getTime() - tempDate.getTime()) > 0) {
            id = i;
            temp = date.getTime() - tempDate.getTime();
          }
        }
        var launchTime = new Date(body.results[id].net);
        var embed = new Discord.MessageEmbed()
          .setColor('#0b3d91')
          .setAuthor(`Next space launch as of ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} EST`)
          .setTitle(body.results[id].name)
          .setDescription(body.results[id].mission.description)
          .setThumbnail(body.results[id].ideographic)
          .addField(body.results[id].mission.name, body.results[id].mission.type)
          .addField(`Status and probability`, `Status: ${body.results[id].status.name}\nProbability: ${body.results[id].probability}`)
          .addField(body.results[id].launch_service_provider.name, body.results[id].launch_service_provider.type)
          .addField(`Orbit`, body.results[id].mission.orbit.name)
          .setFooter(`T - ${time(launchTime.getTime() - date.getTime())}`)
          .setImage(body.results[id].image);
        message.edit(embed);
      });
    })
    .catch(console.error);
};

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  setInterval(() => {
    var date = new Date();
    if (date.getHours() == 6 && date.getMinutes() == 0) APOD();
  }, 60000);
  setInterval(ISS, 60000);
  setInterval(nextLaunch, 600000);
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
  } else if (command == 'test') {
    nextLaunch();
  }
});

client.login(main);