/*
 * OwO Bot for Discord
 * Copyright (C) 2019 Christopher Thai
 * This software is licensed under Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
 * For more information, see README.md and LICENSE
  */

const CommandInterface = require('../../commandinterface.js');

const lootboxUtil = require('../zoo/lootboxUtil.js');
const ringUtil = require('../social/util/ringUtil.js');
const gemUtil = require('../zoo/gemUtil.js');
const shopUtil = require('./util/shopUtil.js');
const weaponUtil = require('../battle/util/weaponUtil.js');
const crateUtil = require('../battle/util/crateUtil.js');

module.exports = new CommandInterface({

	alias:["inventory","inv"],

	args:"",

	desc:"Displays your inventory! Use 'ds equip' to use them!",

	example:[],

	related:["ds equip"],

	cooldown:10000,
	half:80,
	six:500,

	execute: async function(p){
		var con=p.con,msg=p.msg;

		/* {emoji,id,count} */
		try{
			let ringItems = await ringUtil.getItems(p);
			let lootboxItems = await lootboxUtil.getItems(p);
			let gemItems = await gemUtil.getItems(p);
			let weaponItems = await weaponUtil.getItems(p);
			let crateItems = await crateUtil.getItems(p);
			var text = addToString([ringItems,lootboxItems,gemItems,weaponItems,crateItems]);
		}catch(err){
			console.error(err);
			return;
		}


		if(text=="") text = "Your inventory is empty :c";
		text = "**====== "+msg.author.username+"'s Inventory ======**\n"+text;
		p.send(text,null,{split:true});
	}

})

/* Converts an array of items to strings */
function addToString(items){
	var sorted = [];
	var itemsID = {};
	var maxCount = 0;
	/* Sort items by id and get largest count*/
	for(var i=0;i<items.length;i++){
		var itemList = items[i];
		for(var key in itemList){
			sorted.push(itemList[key].id);
			itemsID[itemList[key].id] = itemList[key];
			itemList[key].count = parseInt(itemList[key].count);
			if(itemList[key].count > maxCount) maxCount = itemList[key].count;
		}
	}
	sorted.sort((a,b) => a-b);
	items = [];
	for(var i=0;i<sorted.length;i++){
		items.push(itemsID[sorted[i]]);
	}
	var digits = Math.trunc(Math.log10(maxCount)+1);

	/* Add to text */
	var text = "";
	var count = 0;
	for(var i=0;i<items.length;i++){
		var item = items[i];
		text += "`"+((item.id<9)?"0":"")+item.id+"`"+item.emoji+ shopUtil.toSmallNum(item.count,digits);
		count++;
		if(count==4){
			text += "\n";
			count=0;
		}else
			text += "    ";
	}

	return text;
}
