/*
 * OwO Bot for Discord
 * Copyright (C) 2019 Christopher Thai
 * This software is licensed under Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
 * For more information, see README.md and LICENSE
  */

const CommandInterface = require('../../commandinterface.js');

const dateUtil = require('../../../util/dateUtil.js');
const rings = require('../../../json/rings.json');
const yes = '✅';
const no = '❎';
const heartBreak = '💔';
const heartBeat = '💝';
const dateOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };

module.exports = new CommandInterface({

	alias:["divorce"],

	args:"",

	desc:"Escape your marriage",

	example:[],

	related:["ds marry","ds dm"],

	cooldown:3000,

	execute: async function(p){
		// Grab marriage information
		let sql = `SELECT 
				u1.id AS id1,u2.id AS id2,TIMESTAMPDIFF(DAY,marriedDate,NOW()) as days,marriage.* 
			FROM marriage 
				LEFT JOIN user AS u1 ON marriage.uid1 = u1.uid 
				LEFT JOIN user AS u2 ON marriage.uid2 = u2.uid 
			WHERE u1.id = ${p.msg.author.id} OR u2.id = ${p.msg.author.id};`;
		let result = await p.query(sql);

		if(result.length<1){
			p.errorMsg(", you can't divorce if you aren't married, silly butt!",3000);
			return;
		}

		// You can only divorce if you have married your SO for over a day
		let afterMid = dateUtil.afterMidnight(result[0].marriedDate);
		if(!afterMid.after){
			p.errorMsg(", you can only divorce after you have been with them for one day!",3000);
			return;
		}

		// Grab user and ring information
		let ring = rings[result[0].rid];
		let so = p.msg.author.id==result[0].id1?result[0].id2:result[0].id1;
		so = await p.global.getUser(so);

		// Ask for confirmation
		let embed = {
			"author": {
				"name": p.msg.author.username+", are you sure you want to divorce"+(so?" "+so.username:"")+"?",
				"icon_url": p.msg.author.avatarURL
			},
			"description":"You married on **"+(new Date(result[0].marriedDate)).toLocaleDateString("default",dateOptions)+"** and have been married for **"+result[0].days+"** days and claimed **"+result[0].dailies+"** dailies together... Once you divorce, the ring will break and disappear.",
			"thumbnail":{
				"url":"https://cdn.discordapp.com/emojis/"+ring.emoji.match(/[0-9]+/)[0]+"."+(ring.id>5?"gif":"png")
			},
			"color": p.config.embed_color
		}
		let msg = await p.send({embed});

		// Add reaction collector 
		await msg.react(yes);
		await msg.react(no);
		let filter = (reaction, user) => (reaction.emoji.name === yes||reaction.emoji.name === no) && user.id === p.msg.author.id;
		let collector = msg.createReactionCollector(filter,{time:60000});
		let reacted = false;
		collector.on('collect',r => {
			if(reacted) return;
			reacted = true;
			if(r.emoji.name==yes){
				embed.description = embed.description+"\n\n "+heartBreak+" You have decided to divorce.";
				collector.stop();
				let sql = `DELETE FROM marriage WHERE uid1 = (SELECT uid FROM user WHERE id = ${p.msg.author.id}) OR uid2 = (SELECT uid FROM user WHERE id = ${p.msg.author.id});`;
				p.query(sql);
			}else{
				embed.description = embed.description+"\n\n "+heartBeat+" You have decided to stay married!";
				collector.stop();
			}
		});

		// Once reaction collector ends, change color of embed message
		collector.on('end',async function(collected){
			embed.color = 6381923;
			await msg.edit({embed});
		});
	}
});
