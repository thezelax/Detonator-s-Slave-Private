/*
 * OwO Bot for Discord
 * Copyright (C) 2019 Christopher Thai
 * This software is licensed under Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
 * For more information, see README.md and LICENSE
  */

const CommandInterface = require('../../commandinterface.js');

module.exports = new CommandInterface({

	alias:["enable"],

	args:"{command}",

	desc:"Enable a command in the current channel",

	example:["ds enable hunt","ds enable all"],

	related:["ds disable"],

	cooldown:1000,
	half:100,
	six:500,

	execute: function(p){
		/* Checks if the user has permission */
		if(!p.msg.member.permissions.has('MANAGE_CHANNELS')){
			p.send("**🚫 | "+p.msg.author.username+"**, You are not an admin!",3000);
			return;
		}

		var msg=p.msg,con=p.con;

		/* Parse commands */
		var commands = p.args.slice();
		for(let i = 0;i<commands.length;i++)
			commands[i] = commands[i].toLowerCase();

		/* If the user wants to enable all commands */
		if(commands.includes("all")){
			var list = "";
			for(var key in p.mcommands){
				list += "('"+key+"'),";
			}
			list = list.slice(0,-1);
			var sql = "DELETE FROM disabled WHERE channel = "+msg.channel.id+" AND command IN ("+list+");";
			con.query(sql,function(err,rows,field){
				if(err){console.error(err);return;}
				p.send("**⚙ | All** commands have been **enable** for this channel!");
			});
			return;
		}

		/* Construct query statement */
		var sql = "DELETE FROM disabled WHERE channel = "+msg.channel.id+" AND command IN (";
		var validCommand = false;
		for(let i=0;i<commands.length;i++){
			/* Convert command name to proper name */
			let command = p.aliasToCommand[commands[i]];
			if(command&&command!="disabled"&&command!="enable"){
				validCommand = true;
				sql += "'"+command+"',";
			}
		}
		sql = sql.slice(0,-1) + ");";
		if(!validCommand) sql = "";
		sql += "SELECT * FROM disabled WHERE channel = "+msg.channel.id+";";

		/* Query */
		con.query(sql,function(err,rows,field){
			if(err){console.error(err);return;}

			if(validCommand)
				rows = rows[1];

			/* Construct message */
			var enabled = Object.keys(p.mcommands);
			var disabled = [];

			for(let i=0;i<rows.length;i++){
				let command = rows[i].command;
				if(enabled.includes(command)){
					disabled.push(command);
					enabled.splice(enabled.indexOf(command),1);
				}
			}

			if(enabled.length==0) enabled.push("NONE");
			if(disabled.length==0) disabled.push("NONE");

			let desc = "**❎ Disabled Commands for this channel:**";
			desc += "\n`"+disabled.join("`  `")+"`";
			desc += "\n**✅ Enabled Commands for this channel:**";
			desc += "\n`"+enabled.join("`  `")+"`";

			const embed = {
				"color":4886754,
				"description":desc
			}
			p.send({embed});
		});
	}

})
