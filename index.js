const request = require('request');
const Discord = require('discord.js');
const db = require('quick.db');
const { chId, prefix, messages } = require('./general/config.json');
const { main, apiKey1, apiKey2, apiKey3 } = require('./general/token.json');

const client = new Discord.Client();

const time = (input) => {
  input = Math.floor((input / 1000) / 60);
  let result = '';
  if (input >= 525600) {
    result += `${Math.floor(input / 525600)}y `;
    input %= 525600;
  }
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

const astros = (id = '') => {
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
        if (body == null) return console.log('another iss pos null :(');
        let lon = body.iss_position.longitude;
        let lat = body.iss_position.latitude;
        var date = new Date();
        var embed = new Discord.MessageEmbed()
          .setColor('#0b3d91')
          .setTitle(`Updated on ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} EST`)
          .setImage(`https://image.maps.ls.hereapi.com/mia/1.6/mapview?apiKey=${apiKey2}&c=${lon},${lat}&sb=mk&t=1&z=1&w=500&h=300`);
        message.edit(embed);
      });
    });
};

const nextLaunch = () => {
  client.channels.cache.get('841137170525716480').messages.fetch('841137416278376448')
    .then(message => {
      request(`https://ll.thespacedevs.com/2.0.0/launch/upcoming/?format=json&limit=20`, { json: true }, (err, res, body) => {
        if (err) return console.log(err);
        var date = new Date();
        var id = 0;
        var temp = -1;
        for (let i = 0; i < body.results.length; ++i) {
          var tempDate = new Date(body.results[i].net);
          if (temp == -1 && (tempDate.getTime() - date.getTime()) > 0 || temp > (tempDate.getTime() - date.getTime()) && (tempDate.getTime() - date.getTime()) > 0) {
            id = i;
            temp = tempDate.getTime() - date.getTime();
          }
        }
        var launchTime = new Date(body.results[id].net);
        var embed = new Discord.MessageEmbed()
          .setColor('#0b3d91')
          .setAuthor(`Updated on ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} EST`)
          .setTitle(body.results[id].name)
          .setThumbnail(body.results[id].image)
          .addField(`Status and probability`, `Status: ${body.results[id].status.name}\nProbability: ${body.results[id].probability}`)
          .addField(`Provider: ${body.results[id].launch_service_provider.name}`, `Type: ${body.results[id].launch_service_provider.type}`)
          .setFooter(`T - ${time(launchTime.getTime() - date.getTime())}`)
          .setImage(body.results[id].ideographic);
        if (body.results[id].mission != null) {
          embed
            .setDescription(body.results[id].mission.description)
            .addField(`Mission ${body.results[id].mission.name}`, `Type: ${body.results[id].mission.type}`)
            .addField(`Orbit`, body.results[id].mission.orbit.name);
        }
        message.edit(embed);
      });
    });
};

const events = () => {
  var embeds = [];
  request(`https://ll.thespacedevs.com/2.0.0/event/upcoming/?format=json&limit=20`, { json: true }, (err, res, body) => {
    if (err) return console.log(err);
    var date = new Date();
    for (let i of body.results) {
      var launchTime = new Date(i.date);
      if (launchTime.getTime() - date.getTime() < 0) continue;
      var embed = new Discord.MessageEmbed()
        .setColor('#0b3d91')
        .setAuthor(`Updated on ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} EST`)
        .setTitle(i.name)
        .setURL(i.news_url)
        .setDescription(i.description)
        .addField('Type', i.type.name)
        .setImage(i.feature_image)
        .setFooter(`T - ${time(launchTime.getTime() - date.getTime())}`);
      embeds.push(embed);
    }
    for (let j = 0; j < messages.length; ++j) {
      client.channels.cache.get('841334897825415199').messages.fetch(messages[j])
        .then(message => {
          if (embeds[j] != null) {
            message.edit(embeds[j]);
          } else {
            message.edit(new Discord.MessageEmbed().setDescription('\u200B').setColor('#9e9d9d'));
          }
        });
    }
  });
};

const weather = () => {
  request(`https://api.openweathermap.org/data/2.5/onecall?lat=40.81012855585222&lon=-73.37373804360662&units=imperial&exclude=minutely,hourly&appid=${apiKey3}`, { json: true }, (err, res, body) => {
    if (err) return console.log(err);
    client.channels.cache.get('841383890971131914').messages.fetch('841392746974543902')
      .then(message => {
        var date = new Date();
        var embed = new Discord.MessageEmbed()
          .setColor('#0b3d91')
          .setAuthor(`Updated on ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} EST`)
          .setTitle(`Forecast for the owner's local area`);
        for (let i = 1; i < 4; ++i) {
          var forecast = new Date(body.daily[i].dt * 1000);
          let description = `Time: ${forecast}\n:thermometer: Temperature:\n- :arrow_up: High: ${body.daily[i].temp.max}℉\n- :arrow_down: Low: ${body.daily[i].temp.min}℉\n:sweat_drops: Humidity: ${body.daily[i].humidity}%\n:white_sun_cloud: Cloud Coverage: ${body.daily[i].clouds}%\n:cloud_tornado: Wind Speed: ${body.daily[i].wind_speed} mph\n\n**Weather Conditions**:`;
          for (let j of body.daily[i].weather) {
            description += `\n${parseIcon(j.icon)} ${j.main}: ${j.description}`;
          }
          description += `\n\n\u200B`;
          embed.addField(`${i} day(s) in the future`, description);
        }
        message.edit(embed);
      });
    client.channels.cache.get('841383890971131914').messages.fetch('841392760380063796')
      .then(message => {
        var date = new Date();
        var embed = new Discord.MessageEmbed()
          .setColor('#0b3d91')
          .setAuthor(`Updated on ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} EST`)
          .setTitle(`Current weather for the owner's local area`)
          .setDescription(`:thermometer: Temperature: ${body.current.temp}℉\n:hot_face: Feels Like: ${body.current.feels_like}℉\n:sweat_drops: Humidity: ${body.current.humidity}%\n:white_sun_cloud: Cloud Coverage: ${body.current.clouds}%\n:eyes: Visibility: ${Math.floor(body.current.visibility / 10) / 100} mi\n:cloud_tornado: Wind Speed: ${body.current.wind_speed} mph`)
        for (let i of body.current.weather) {
          embed.addField(`${parseIcon(i.icon)} ${i.main}`, i.description, true);
        }
        message.edit(embed);
      });
  });
};

const parseDate = (input = 0) => {
  const date = new Date(input);
  if (date.getHours() == 12) {
    if (date.getMinutes() < 10) {
      return `${date.getHours()}:0${date.getMinutes()} pm`;
    } else {
      return `${date.getHours()}:${date.getMinutes()} pm`;
    }
  } else if (date.getHours() > 12) {
    if (date.getMinutes() < 10) {
      return `${date.getHours() - 12}:0${date.getMinutes()} pm`;
    } else {
      return `${date.getHours() - 12}:${date.getMinutes()} pm`;
    }
  } else if (date.getHours() == 24) {
    if (date.getMinutes() < 10) {
      return `${date.getHours() - 12}:0${date.getMinutes()} am`;
    } else {
      return `${date.getHours() - 12}:${date.getMinutes()} am`;
    }
  } else {
    if (date.getMinutes() < 10) {
      return `${date.getHours()}:0${date.getMinutes()} am`;
    } else {
      return `${date.getHours()}:${date.getMinutes()} am`;
    }
  }
};

const parseMoon = (input = 0) => {
  if (input >= 0 && input <= 0.11 || input > 0.88 && input <= 1) {
    return ':new_moon:';
  } else if (input > 0.11 && input <= 0.22) {
    return ':waxing_crescent_moon:';
  } else if (input > 0.22 && input <= 0.33) {
    return ':first_quarter_moon:';
  } else if (input > 0.33 && input <= 0.44) {
    return ':waxing_gibbous_moon:';
  } else if (input > 0.44 && input <= 0.55) {
    return ':full_moon:';
  } else if (input > 0.55 && input <= 0.66) {
    return ':waning_gibbous_moon:';
  } else if (input > 0.66 && input <= 0.77) {
    return ':last_quarter_moon:';
  } else if (input > 0.77 && input <= 0.88) {
    return ':waning_crescent_moon:';
  }
};

const parseIcon = (input = '') => {
  if (['01d', '01n'].includes(input)) {
    return ':sunny:';
  } else if (['02d', '02n'].includes(input)) {
    return ':white_sun_small_cloud:';
  } else if (['03d', '03n'].includes(input)) {
    return ':partly_sunny:';
  } else if (['04d', '04n'].includes(input)) {
    return ':white_sun_cloud:';
  } else if (['09d', '09n'].includes(input)) {
    return ':white_sun_rain_cloud:';
  } else if (['10d', '10n'].includes(input)) {
    return ':cloud_rain:';
  } else if (['11d', '11n'].includes(input)) {
    return ':thunder_cloud_rain:';
  } else if (['13d', '13n'].includes(input)) {
    return ':cloud_snow:';
  } else if (['50d', '50n'].includes(input)) {
    return ':fog:';
  }
};

const sendAlerts = () => {
  request(`https://api.openweathermap.org/data/2.5/onecall?lat=40.81012855585222&lon=-73.37373804360662&units=imperial&exclude=minutely,hourly,current&appid=${apiKey3}`, { json: true }, (err, res, body) => {
    if (err) return console.log(err);
    const alerts = db.get(`discord.alerts`) || [];
    for (let i of alerts) {
      const user = client.users.cache.get(i);
      var date = new Date(body.daily[0].dt * 1000);
      var embed = new Discord.MessageEmbed()
        .setColor('#0b3d91')
        .setTitle(`Today's Weather`)
        .setDescription(`:thermometer: Temperature:\n- :arrow_up: Max: ${body.daily[0].temp.max}℉\n- :arrow_down: Min: ${body.daily[0].temp.min}℉\n- :city_sunset: Morning: ${body.daily[0].temp.morn}℉\n- :cityscape: Noon: ${body.daily[0].temp.day}℉\n- :city_dusk: Evening: ${body.daily[0].temp.eve}℉\n- :night_with_stars: Night: ${body.daily[0].temp.night}℉\n\n:sunny: Uv Index: ${body.daily[0].uvi}\n:sweat_drops: Humidity: ${body.daily[0].humidity}%\n:cloud_tornado: Wind Speed: ${body.daily[0].wind_speed} mph\n:dash: Wind Gust: ${body.daily[0].wind_gust} mph\n:white_sun_cloud: Cloud Coverage: ${body.daily[0].clouds}%\n:sunrise: Sunrise: ${parseDate(body.daily[0].sunrise * 1000)}\n:sunrise_over_mountains: Sunset: ${parseDate(body.daily[0].sunset * 1000)}\n\n:full_moon_with_face: Moon:\n- Phase: ${parseMoon(body.daily[0].moon_phase)}\n- Moonrise: ${parseDate(body.daily[0].moonrise * 1000)}\n- Moonset: ${parseDate(body.daily[0].moonset * 1000)}`)
        .setFooter(date);
      for(let i of body.daily[0].weather) {
        embed.addField(i.main, `${parseIcon(i.icon)} ${i.description}`, true);
      }
      user.send(embed)
    }
  });
};

const alertList = (add = true, id = '') => {
  const alerts = db.get(`discord.alerts`) || [];
  if (add) {
    if (!alerts.includes(id)) db.push(`discord.alerts`, id);
  } else {
    for (let i = 0; i < alerts.length; ++i) {
      if (alerts[i] == id) {
        alerts.splice(i, 1);
        db.set(`discord.alerts`, alerts);
        break;
      }
    }
  }
};

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  setInterval(() => {
    var date = new Date();
    if (date.getHours() == 7 && date.getMinutes() == 0) APOD();
  }, 60000);
  setInterval(ISS, 60000);
  setInterval(events, 900000);
  setInterval(nextLaunch, 900000);
  setInterval(weather, 600000)
  setInterval(() => {
    var date = new Date();
    if (date.getHours() == 6 && date.getMinutes() == 15) sendAlerts();
  }, 60000)
  console.log(`Bot init complete`);
});

client.on('message', (msg) => {
  if (msg.author.bot || msg.webhookID) return;

  if (msg.author.id == '473110112844644372' && msg.content == '!test' && msg.channel.type == 'dm') { weather(); };

  if (!msg.content.toLowerCase().startsWith(prefix)) return;
  const args = msg.content.slice(prefix.length).trim().split(' ');
  const command = args.shift().toLowerCase();

  if (command == 'apod' && msg.author.id == '473110112844644372') {
    APOD(msg.channel.id);
  } else if (command == 'astros') {
    astros(msg.channel.id);
  } else if (command == 'alerts') {
    const data = db.get(`discord.${msg.author.id}`);
    if (data != null && data.alerts != null && data.alerts == true) {
      db.set(`discord.${msg.author.id}.alerts`, false);
      alertList(false, msg.author.id);
      msg.channel.send(`Removed you from the alerts list`);
    } else {
      db.set(`discord.${msg.author.id}.alerts`, true);
      alertList(true, msg.author.id);
      msg.channel.send(`Added you to the alerts list`);
    }
  }
});

client.login(main);