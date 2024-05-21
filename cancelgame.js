const database = require('./database-functions');
const { addBalance } = require('./walletManager.js');


// database-functions.js

async function cancelgame(gamedata){





var gamedata__=await database.db.collection("games").updateOne({


    gameid:gamedata["gameid"],
    p1_id:gamedata["uid"],
    hash:gamedata["p1_hash"],
    status:0

},
{
  $set: {
    status:3
  },
})


if(gamedata__.acknowledged){

var gddd=await database.db.collection("games").findOne(
  {
    gameid:gamedata["gameid"],
    p1_id:gamedata["uid"],
    hash:gamedata["p1_hash"],
  },
  {
    projection: {
      _id: 0,
    },
  }
);


return await addBalance(gamedata["uid"],gddd["stake"]);

    
   



}
else{
    return false
}






}



module.exports={
    cancelgame
}