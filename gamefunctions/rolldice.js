const database = require("../database-functions.js");

const auth = require("../auth.js");
const mqttClient = require("../mqtt-client.js");
const values = require("../values.js");
const app = require("fastify")({ logger: true });
const walletMaster = require("../walletManager.js");
const functionList = require("../functions.js");

const generateMoves = require("./generateMoves.js");

const rollDice = async (req, res) => {
  console.log("Roll Dice Strated !");

  const player = req.body["player"];

  const hash = req.body["hash"];

  const gameid = req.body["gameid"];

  console.log(`----------- Details -------`);

  console.log(req.body);

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

  console.log(gamedata);

  if (gamedata) {
    if (player == "p1" || player == "p2") {
      if (gamedata["dice"] == player) {
        console.log(gamedata[`${player}_hash`]);

        if (gamedata[`${player}_hash`] == hash) {
          /// auth passs

          console.log("Hash code Verified ");

          var dice_value = functionList.rollDice();

          // var dice_value = 6;

          var possibleMoves = generateMoves.GenerateMoves(
            dice_value,
            gamedata,
            player
          );

          console.log("Generated Dice value : " + dice_value.toString());

          //// dice value is not 6

          if (
            possibleMoves[0] ||
            possibleMoves[1] ||
            possibleMoves[2] ||
            possibleMoves[3]
          ) {
            /// moves found

            var dice_update = await database.db.collection("games").updateOne(
              {
                gameid: gameid,

                // find
              },
              {
                $set: {
                  dice: "-",
                  move: player,
                  moves: possibleMoves,

                  dice_value: dice_value,
                  //  update values
                },
              }
            );

            if (dice_update.acknowledged) {
              console.log(
                "sending mqtt message to topic :  " + gamedata["roomcode"]
              );
              mqttClient.publishData(
                gamedata["roomcode"],
                JSON.stringify({
                  dice: "-",
                  move: player,
                  moves: possibleMoves,
                  dice_value: dice_value,
                  p1_p1_p: gamedata["p1_p1_p"],

                  p1_p2_p: gamedata["p1_p2_p"],

                  p1_p3_p: gamedata["p1_p3_p"],

                  p1_p4_p: gamedata["p1_p4_p"],

                  p2_p1_p: gamedata["p2_p1_p"],

                  p2_p2_p: gamedata["p2_p2_p"],

                  p2_p3_p: gamedata["p2_p3_p"],

                  p2_p4_p: gamedata["p2_p4_p"],
                })
              );
            } else {
              return false;
            }
          } else {
            //// no moves found

            var dice_update = await database.db.collection("games").updateOne(
              {
                gameid: gameid,

                // find
              },
              {
                $set: {
                  dice: player == "p1" ? "p2" : "p1",
                  move: "-",
                  moves: possibleMoves,
                  dice_value: dice_value,

                  //  update values
                },
              }
            );

            if (dice_update.acknowledged) {
              mqttClient.publishData(
                gameid,
                JSON.stringify({
                  dice: player == "p1" ? "p2" : "p1",
                  move: "-",
                  moves: possibleMoves,
                  dice_value: dice_value,

                  p1_p1_p: gamedata["p1_p1_p"],

                  p1_p2_p: gamedata["p1_p2_p"],

                  p1_p3_p: gamedata["p1_p3_p"],

                  p1_p4_p: gamedata["p1_p4_p"],

                  p2_p1_p: gamedata["p2_p1_p"],

                  p2_p2_p: gamedata["p2_p2_p"],

                  p2_p3_p: gamedata["p2_p3_p"],

                  p2_p4_p: gamedata["p2_p4_p"],
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
        console.log("player is not authorized to roll");
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
  rollDice,
};
