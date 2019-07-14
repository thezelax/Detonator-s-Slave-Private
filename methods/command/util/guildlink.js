/*
 * OwO Bot for Discord
 * Copyright (C) 2019 Christopher Thai
 * This software is licensed under Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
 * For more information, see README.md and LICENSE
  */

const CommandInterface = require('../../commandinterface.js');

module.exports = new CommandInterface({

	alias:["guildlink"],

	args:"",

	desc:"Come join our guild! You might be awarded with special gifts once in awhile!",

	example:[],

	related:["ds link"],

	cooldown:5000,
	half:100,
	six:500,

	execute: function(p){
		var text = "** |** Something is missing here\n";
		text += "**<:blank:427371936482328596> |** "+p.config.guildlink;
		p.send(text);
	}

})
