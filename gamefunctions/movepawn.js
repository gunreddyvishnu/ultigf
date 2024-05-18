const database = require("../database-functions.js");

const auth = require("../auth.js");
const mqttClient = require("../mqtt-client.js");
const values = require("../values.js");
const app = require("fastify")({ logger: true });
const walletMaster = require("../walletManager.js");
const functionList = require("../functions.js");

const generateMoves = require("./generateMoves.js");
const dicemoves = require("./dicemoves.js");

const pointsTable = require("../pointsTable.js");

const parllelcoins = {
  p1_p1: "p2_p1",

  p1_p2: "p2_p2",
  p1_p3: "p2_p3",
  p1_p4: "p2_p4",

  p2_p1: "p1_p1",

  p2_p2: "p1_p2",
  p2_p3: "p1_p3",
  p2_p4: "p1_p4",
};

const movePawn = async (req, res) => {

  const player = req.body["player"];

  const hash = req.body["hash"];

  const gameid = req.body["gameid"];
  const pawn = req.body["pawn"];

  const pawnMap = {
    p1: 0,
    p2: 1,
    p3: 2,
    p4: 3,
  };

  var gamedata = await database.db.collection("games").findOne(
    {
      gameid: gameid,
    },
    {
      projection: {
        _id: 0,
      },
    }
  );

  if (gamedata) {

    if (player == "p1" || player == "p2") {


      var actiontime = Date.now();
      var iskilled = false;

      var reachedhome = false;

      if (gamedata["move"] == player) {
        
        console.log(gamedata[`${player}_hash`]);

        if (gamedata[`${player}_hash`] == hash) {
          /// auth passs

          console.log("hash pass");

          gamedata["p1_score"] = parseInt(gamedata["p1_score"]);

          gamedata["p2_score"] = parseInt(gamedata["p2_score"]);

          gamedata["dice_value"] = parseInt(gamedata["dice_value"]);
          //   var dice_value = functionList.rollDice();

          var possibleMoves = gamedata["moves"];

          console.log(gamedata["dice_value"].toString() + " samosssssaaa");

          console.log(" current : " + gamedata[`${player}_${pawn}_p`]);
          if (possibleMoves[pawnMap[pawn]]) {
            //// pawn move is possible

            var newposition = dicemoves.getnewPosition(
              player,
              gamedata[`${player}_${pawn}_p`],

              gamedata["dice_value"]
            );

            if (player == "p1") {
              if (newposition == 128) {
                iskilled = true;
                reachedhome = true;

                gamedata["p1_score"] =
                  gamedata["p1_score"] + pointsTable.points_reachingHome;
              }
            } else {
              if (newposition == 98) {
                iskilled = true;
                reachedhome = true;
                gamedata["p2_score"] =
                  gamedata["p2_score"] + pointsTable.points_reachingHome;
              }
            }

            var newdice = gamedata["move"] == "p1" ? "p2" : "p1";

            if (gamedata["dice_value"] == 6) {
              newdice = gamedata["move"];
            }

            gamedata[`${player}_${pawn}_p`] = newposition;
            //// check for kill

            console.log(
              "safe update " + dicemoves.safeZones.indexOf(newposition)
            );

            if (dicemoves.safeZones.indexOf(newposition) == -1) {
              console.log("NOT In Safe zone");

              if (
                gamedata[`${parllelcoins[`${player}_p1`]}_p`] == newposition
              ) {
                /// pawn 1 kill

                newdice = gamedata["move"];

                gamedata[`${parllelcoins[`${player}_p1`]}_p`] =
                  player == "p1" ? 24 : 202;

                gamedata[`${player}_score`] =
                  parseInt(gamedata[`${player}_score`]) +
                  pointsTable.points_kill;


                iskilled = true;

              
                if(player=="p1"){
                  gamedata["p2_score"] =
                  parseInt(gamedata["p2_score"]) +
                  pointsTable.points_pawnLost;

                }
                else if(player=="p2"){

                  gamedata["p1_score"] =
                  parseInt(gamedata["p1_score"]) +
                  pointsTable.points_pawnLost;
                }
                else{}




                console.log("pawn1 kill");
              }

              if (
                gamedata[`${parllelcoins[`${player}_p2`]}_p`] == newposition
              ) {
                newdice = gamedata["move"];

                gamedata[`${parllelcoins[`${player}_p2`]}_p`] =
                  player == "p1" ? 24 : 202;

                gamedata[`${player}_score`] =
                  parseInt(gamedata[`${player}_score`]) +
                  pointsTable.points_kill;

                  if(player=="p1"){
                    gamedata["p2_score"] =
                    parseInt(gamedata["p2_score"]) +
                    pointsTable.points_pawnLost;
  
                  }
                  else if(player=="p2"){
  
                    gamedata["p1_score"] =
                    parseInt(gamedata["p1_score"]) +
                    pointsTable.points_pawnLost;
                  }
                  else{}
  
                iskilled = true;
                /// pawn 2 kill
                console.log("pawn2 kill");
              }

              console.log(
                "kill test : " + gamedata[`${parllelcoins[`${player}_p3`]}_p`]
              );

              if (
                gamedata[`${parllelcoins[`${player}_p3`]}_p`] == newposition
              ) {
                newdice = gamedata["move"];

                gamedata[`${parllelcoins[`${player}_p3`]}_p`] =
                  player == "p1" ? 24 : 202;

                gamedata[`${player}_score`] =
                  parseInt(gamedata[`${player}_score`]) +
                  pointsTable.points_kill;

              

                  if(player=="p1"){
                    gamedata["p2_score"] =
                    parseInt(gamedata["p2_score"]) +
                    pointsTable.points_pawnLost;
  
                  }
                  else if(player=="p2"){
  
                    gamedata["p1_score"] =
                    parseInt(gamedata["p1_score"]) +
                    pointsTable.points_pawnLost;
                  }
                  else{}
  




                iskilled = true;
                /// pawn 3 kill
                console.log("pawn3 kill");
              }

              if (
                gamedata[`${parllelcoins[`${player}_p4`]}_p`] == newposition
              ) {
                newdice = gamedata["move"];

                gamedata[`${parllelcoins[`${player}_p4`]}_p`] =
                  player == "p1" ? 24 : 202;
                gamedata[`${player}_score`] =
                  parseInt(gamedata[`${player}_score`]) +
                  pointsTable.points_kill;
                  if(player=="p1"){
                    gamedata["p2_score"] =
                    parseInt(gamedata["p2_score"]) +
                    pointsTable.points_pawnLost;
  
                  }
                  else if(player=="p2"){
  
                    gamedata["p1_score"] =
                    parseInt(gamedata["p1_score"]) +
                    pointsTable.points_pawnLost;
                  }
                  else{}
  
                iskilled = true;
                /// pawn 4 kill
                console.log("pawn4 kill");
              }

              var update_ack = await database.db.collection("games").updateOne(
                {
                  // find

                  gameid: gameid,
                },
                {
                  $set: {
                    dice: newdice,

                    move: "-",

                    p1_p1_p: gamedata["p1_p1_p"],
                    p1_p2_p: gamedata["p1_p2_p"],
                    p1_p3_p: gamedata["p1_p3_p"],
                    p1_p4_p: gamedata["p1_p4_p"],

                    p2_p1_p: gamedata["p2_p1_p"],
                    p2_p2_p: gamedata["p2_p2_p"],
                    p2_p3_p: gamedata["p2_p3_p"],
                    p2_p4_p: gamedata["p2_p4_p"],
                    action_time: actiontime,

                    p1_score:
                      player == "p1"
                        ? parseInt(gamedata["p1_score"]) +
                          (iskilled == true
                            ? 0
                            : parseInt(gamedata["dice_value"]))
                        : gamedata["p1_score"],

                    p2_score:
                      player == "p2"
                        ? parseInt(gamedata["p2_score"]) +
                          (iskilled == true
                            ? 0
                            : parseInt(gamedata["dice_value"]))
                        : gamedata["p2_score"],

                    //  update values
                  },
                }
              );

              if (update_ack.acknowledged) {
                mqttClient.publishData(
                  gamedata["roomcode"],
                  JSON.stringify({
                    dice: newdice,

                    move: "-",
                    action_time: actiontime,
                    p1_p1_p: gamedata["p1_p1_p"],
                    p1_p2_p: gamedata["p1_p2_p"],
                    p1_p3_p: gamedata["p1_p3_p"],
                    p1_p4_p: gamedata["p1_p4_p"],

                    p2_p1_p: gamedata["p2_p1_p"],
                    p2_p2_p: gamedata["p2_p2_p"],
                    p2_p3_p: gamedata["p2_p3_p"],
                    p2_p4_p: gamedata["p2_p4_p"],

                    action: reachedhome ? "home" : "-",

                    p1_score:
                      player == "p1"
                        ? parseInt(gamedata["p1_score"]) +
                          (iskilled == true
                            ? 0
                            : parseInt(gamedata["dice_value"]))
                        : parseInt(gamedata["p1_score"]),

                    p2_score:
                      player == "p2"
                        ? parseInt(gamedata["p2_score"]) +
                          (iskilled == true
                            ? 0
                            : parseInt(gamedata["dice_value"]))
                        : parseInt(gamedata["p2_score"]),
                  })
                );
              } else {
                return false;
              }
            } else {
              console.log(" In Safe zone");

              console.log(
                " 001212 type of : " + player == "p1"
                  ? parseInt(gamedata["p1_score"]) +
                      (iskilled == true ? 0 : gamedata["dice_value"])
                  : parseInt(gamedata["p1_score"])
              );

              var update_ack = await database.db.collection("games").updateOne(
                {
                  // find

                  gameid: gameid,
                },
                {
                  $set: {
                    dice: newdice,

                    move: "-",

                    p1_p1_p: gamedata["p1_p1_p"],
                    p1_p2_p: gamedata["p1_p2_p"],
                    p1_p3_p: gamedata["p1_p3_p"],
                    p1_p4_p: gamedata["p1_p4_p"],
                    action_time: actiontime,

                    p2_p1_p: gamedata["p2_p1_p"],
                    p2_p2_p: gamedata["p2_p2_p"],
                    p2_p3_p: gamedata["p2_p3_p"],
                    p2_p4_p: gamedata["p2_p4_p"],
                    p1_score:
                      player == "p1"
                        ? parseInt(gamedata["p1_score"]) +
                          (iskilled == true ? 0 : gamedata["dice_value"])
                        : parseInt(gamedata["p1_score"]),

                    p2_score:
                      player == "p2"
                        ? parseInt(gamedata["p2_score"]) +
                          (iskilled == true ? 0 : gamedata["dice_value"])
                        : parseInt(gamedata["p2_score"]),

                    //  update values
                  },
                }
              );

              console.log("------------------ types ------------------");

              console.log(
                "points table points_reachingHome " +
                  typeof pointsTable.points_reachingHome
              );

              if (update_ack.acknowledged) {
                mqttClient.publishData(
                  gamedata["roomcode"],
                  JSON.stringify({
                    dice: newdice,

                    move: "-",

                    p1_p1_p: gamedata["p1_p1_p"],
                    p1_p2_p: gamedata["p1_p2_p"],
                    p1_p3_p: gamedata["p1_p3_p"],
                    p1_p4_p: gamedata["p1_p4_p"],
                    action_time: actiontime,
                    p2_p1_p: gamedata["p2_p1_p"],
                    p2_p2_p: gamedata["p2_p2_p"],
                    p2_p3_p: gamedata["p2_p3_p"],
                    p2_p4_p: gamedata["p2_p4_p"],

                    action: reachedhome ? "home" : "-",

                    p1_score:
                      player == "p1"
                        ? parseInt(gamedata["p1_score"]) +
                          (iskilled == true ? 0 : gamedata["dice_value"])
                        : parseInt(gamedata["p1_score"]),

                    p2_score:
                      player == "p2"
                        ? gamedata["p2_score"] +
                          (iskilled == true ? 0 : gamedata["dice_value"])
                        : gamedata["p2_score"],
                  })
                );
              } else {
                return false;
              }
            }
          } else {
            return false;
          }
        } else {
          return false;
        }
      } else {
        /// you are not authorized to roll
        return false;
      }
    } else {
      return false;
    }
  } else {
    return false;
  }
};

module.exports = {
  movePawn,
};
