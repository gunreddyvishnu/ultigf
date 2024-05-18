const database = require("../database-functions.js");

const auth = require("../auth.js");
const mqttClient = require("../mqtt-client.js");
const values = require("../values.js");
const app = require("fastify")({ logger: true });
const walletMaster = require("../walletManager.js");
const functionList = require("../functions.js");
const movesList = require("./dicemoves.js");

function GenerateMoves(dice_value, gamedata, player) {
  var moves = [false, false, false, false];

  if (player == "p1") {
    if (
      57 - (movesList.p1_map.indexOf(gamedata[`${player}_p1_p`]) + 1) >=
      dice_value
    ) {
      moves[0] = true;
    }

    if (
      57 - (movesList.p1_map.indexOf(gamedata[`${player}_p2_p`]) + 1) >=
      dice_value
    ) {
      moves[1] = true;
    }
    if (
      57 - (movesList.p1_map.indexOf(gamedata[`${player}_p3_p`]) + 1) >=
      dice_value
    ) {
      moves[2] = true;
    }
    if (
      57 - (movesList.p1_map.indexOf(gamedata[`${player}_p4_p`]) + 1) >=
      dice_value
    ) {
      moves[3] = true;
    }
  } else {
    if (
      57 - (movesList.p2_map.indexOf(gamedata[`${player}_p1_p`]) + 1) >=
      dice_value
    ) {
      moves[0] = true;
    }

    if (
      57 - (movesList.p2_map.indexOf(gamedata[`${player}_p2_p`]) + 1) >=
      dice_value
    ) {
      moves[1] = true;
    }
    if (
      57 - (movesList.p2_map.indexOf(gamedata[`${player}_p3_p`]) + 1) >=
      dice_value
    ) {
      moves[2] = true;
    }
    if (
      57 - (movesList.p2_map.indexOf(gamedata[`${player}_p4_p`]) + 1) >=
      dice_value
    ) {
      moves[3] = true;
    }
  }

  return moves;
}




module.exports={GenerateMoves}