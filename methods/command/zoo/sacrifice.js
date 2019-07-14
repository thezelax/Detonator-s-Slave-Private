/*
 * OwO Bot for Discord
 * Copyright (C) 2019 Christopher Thai
 * This software is licensed under Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
 * For more information, see README.md and LICENSE
  */

const CommandInterface = require('../../commandinterface.js');

const essence = "<a:essence:451638978299428875>";

module.exports = new CommandInterface({

	alias:["sacrifice","essence","butcher","sac","sc"],

	args:"{animal|rank} {count}",

	desc:"Sacrifice an animal to turn them into animal essence! Animal essence is used to upgrade your huntbot!",

	example:["ds sacrifice dog","ds sacrifice rare","ds sacrifice bug 100","ds sacrifice all"],

	related:["ds autohunt","ds upgrade"],

	cooldown:1000,
	half:120,
	six:500,
	bot:true,

	execute: function(p){
		var global=p.global,con=p.con,msg=p.msg,args=p.args;

		var name = undefined;
		var count = 1;
		var ranks;

		/* If no args */
		if(args.length==0){
			p.send("**🚫 | "+msg.author.username+"**, Please specify what rank/animal to sacrifice!",3000);
			return;

		/* if arg0 is a count */
		}else if(args.length==2&&(global.isInt(args[0])||args[0].toLowerCase()=="all")){
			if(args[0].toLowerCase()!="all") count = parseInt(args[0]);
			else count = "all";
			name = args[1];

		/* if arg1 is a count (or not) */
		}else if(args.length==2&&(global.isInt(args[1])||args[1].toLowerCase()=="all")){
			if(args[1].toLowerCase()!="all") count = parseInt(args[1]);
			else count = "all";
			name = args[0];

		/* Only one argument */
		}else if(args.length==1){
			if(args[0].toLowerCase()=="all")
				ranks = global.getAllRanks();
			else
				name = args[0];

		/* Multiple ranks */
		}else{
			ranks = {}
			for(i=0;i<args.length;i++){
				let tempRank = global.validRank(args[i].toLowerCase());
				if(!tempRank){
					p.send("**🚫 | "+msg.author.username+"**, Invalid arguments!",3000);
					return;
				}
				if(!(tempRank in ranks)){
					ranks[tempRank.rank] = tempRank;
				}
			}
		}

		if(name) name = name.toLowerCase();

		/* If multiple ranks */
		if(ranks){
			sellRanks(p,msg,con,ranks,p.send,global,p);

		//if its an animal...
		}else if(animal = global.validAnimal(name)){
			if(args.length<3)
				sellAnimal(msg,con,animal,count,p.send,global);
			else
				p.send("**🚫 | "+msg.author.username+"**, The correct syntax for sacrificing ranks is `owo sacrifice {animal} {count}`!",3000);

		//if rank...
		}else if(rank = global.validRank(name)){
			if(args.length!=1)
				p.send("**🚫 | "+msg.author.username+"**, The correct syntax for sacrificing ranks is `owo sacrifice {rank}`!",3000);
			else
				sellRank(p,msg,con,rank,p.send,global);

		//if neither...
		}else{
			p.send("**🚫 |** I could not find that animal or rank!",3000);
		}
	}

})

function sellAnimal(msg,con,animal,count,send,global){
	if(count!="all"&&count<=0){
		send("**🚫 |** You need to sacrifice more than 1 silly~",3000);
		return;
	}
	var sql = "SELECT count FROM animal WHERE id = "+msg.author.id+" AND name = '"+animal.value+"';";
	if(count=="all"){
		sql += "INSERT INTO autohunt (id,essence) VALUES ("+msg.author.id+",((SELECT COALESCE(SUM(count),0) FROM animal WHERE id = "+msg.author.id+" AND name = '"+animal.value+"')*"+animal.essence+")) ON DUPLICATE KEY UPDATE essence = essence + ((SELECT COALESCE(SUM(count),0) FROM animal WHERE id = "+msg.author.id+" AND name = '"+animal.value+"')*"+animal.essence+");";
		sql += "UPDATE animal SET saccount = saccount + count, count = 0 WHERE id = "+msg.author.id+" AND name = '"+animal.value+"' AND count > 0;";
	}else{
		var points = "(IF((SELECT COALESCE(SUM(count),0) FROM animal WHERE id = "+msg.author.id+" AND name = '"+animal.value+"' AND count >= "+count+")>="+count+","+count+",0))";
		sql += "INSERT INTO autohunt (id,essence) VALUES ("+msg.author.id+","+points+"*"+animal.essence+") ON DUPLICATE KEY UPDATE essence = essence + ("+points+"*"+animal.essence+");";
		sql += "UPDATE animal SET count = count - "+count+", saccount = saccount + "+count+" WHERE id = "+msg.author.id+" AND name = '"+animal.value+"' AND count >= "+count+";";
	}
	con.query(sql,function(err,result){
		if(err) {console.error(err);return;}
		if(count=="all"){
			if(!result[0][0]||result[0][0].count<=0){
				send("**🚫 | "+msg.author.username+"**, You don't have enough animals! >:c",3000);
			}else{
				count = result[0][0].count;
				send("**🔪 | "+msg.author.username+"** sacrificed **"+global.unicodeAnimal(animal.value)+"x"+count+"** for **"+essence+" "+(global.toFancyNum(count*animal.essence))+"**");
			}
		}else if(result[2]&&result[2].affectedRows>0){
			send("**🔪 | "+msg.author.username+"** sacrificed **"+global.unicodeAnimal(animal.value)+"x"+count+"** for **"+essence+" "+(global.toFancyNum(count*animal.essence))+"**");
		}else{
			send("**🚫 | "+msg.author.username+"**, You can't sacrifice more than you have silly! >:c",3000);
		}
	});
}

async function sellRank(p,msg,con,rank,send,global){
	let sql = `SELECT * FROM autohunt WHERE id = ${msg.author.id};`;
	let result = await p.query(sql);
	if(!result[0]) await p.query(`INSERT IGNORE INTO autohunt (id,essence) VALUES (${msg.author.id},0);`);

	let animals = "('"+rank.animals.join("','")+"')";
	let points = "(SELECT COALESCE(SUM(count),0) AS sum FROM animal WHERE id = "+msg.author.id+" AND name IN "+animals+")";
	sql = "SELECT COALESCE(SUM(count),0) AS total FROM animal WHERE id = "+msg.author.id+" AND name IN "+animals+";";
	sql += "UPDATE animal INNER JOIN autohunt ON animal.id = autohunt.id INNER JOIN "+points+" s SET essence = essence + (s.sum*"+rank.essence+"), saccount = saccount + count, count = 0 WHERE animal.id = "+msg.author.id+" AND name IN "+animals+" AND count > 0;";

	result = await p.query(sql);
	if(result[1].affectedRows<=0){
		send("**🚫 | "+msg.author.username+"**, You don't have enough animals! >:c",3000);
	}else{
		count = result[0][0].total;
		send("**🔪 | "+msg.author.username+"** sacrificed **"+rank.emoji+"x"+count+"** for **"+essence+" "+(global.toFancyNum(count*rank.essence))+"**");
	}
}

async function sellRanks(p,msg,con,ranks,send,global,p){
	let sql = `SELECT * FROM autohunt WHERE id = ${msg.author.id};`;
	let result = await p.query(sql);
	if(!result[0]) await p.query(`INSERT IGNORE INTO autohunt (id,essence) VALUES (${msg.author.id},0);`);

	sql = "";
	for(i in ranks){
		let rank = ranks[i];
		let animals = "('"+rank.animals.join("','")+"')";
		let points = "(SELECT COALESCE(SUM(count),0) AS sum FROM animal WHERE id = "+msg.author.id+" AND name IN "+animals+")";
		sql += "SELECT COALESCE(SUM(count),0) AS total FROM animal WHERE id = "+msg.author.id+" AND name IN "+animals+";";
		sql += "UPDATE animal INNER JOIN autohunt ON animal.id = autohunt.id INNER JOIN "+points+" s SET essence = essence + (s.sum*"+rank.essence+"), saccount = saccount + count, count = 0 WHERE animal.id = "+msg.author.id+" AND name IN "+animals+" AND count > 0;";
	}
	result = await p.query(sql);

	let sold = "";
	let total = 0;
	let count = 0;
	for(i in ranks){
		let rank = ranks[i];
		let sellCount = result[count*2][0].total;
		if(sellCount>0){
			sold += rank.emoji+"x"+result[count*2][0].total+" ";
			total += sellCount * rank.essence;
		}
		count++;
	}
	if(sold!=""){
		sold = sold.slice(0,-1);
		send("**🔪 | "+msg.author.username+"** sacrificed **"+sold+"** for **"+essence+" "+(global.toFancyNum(total))+"**");
	}else
		send("**🚫 | "+msg.author.username+"**, You don't have enough animals! >:c",3000);
}
