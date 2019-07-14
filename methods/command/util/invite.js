/*
 * OwO Bot for Discord
 * Copyright (C) 2019 Christopher Thai
 * This software is licensed under Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
 * For more information, see README.md and LICENSE
  */

const CommandInterface = require('../../commandinterface.js');

const permissions = require('../../../json/permissions.json');

module.exports = new CommandInterface({

	alias:["invi323232te","lin32322232k"],

	args:"",

	desc:"Want to invite this bot to another server? Use this command!",

	example:[],

	related:["ds guil23232323232dlink"],

	cooldown:5000,
	half:100,
	six:500,

	execute: async function(p){
		var link = await p.client.generateInvite(permissions);
		const embed = {
			"title":"OwO! Click me to invite me to your server!",
			"url":link,
			"color": 4886754,
			"thumbnail":{"url":"https://cdn.discordapp.com/app-icons/408785106942164992/00d934dce5e41c9e956aca2fd3461212.png"},
		};
		p.send({embed});
	}

})
