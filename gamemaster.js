const database = require("./database-functions.js");
const auth = require("./auth.js");
const mqttClient = require("./mqtt-client.js");
const values = require("./values.js");
const app = require("fastify")({ logger: true });
const walletMaster = require("./walletManager.js");
const functionList = require("./functions.js");
var player1map = [
  2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
  23, 24, 25, 26, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47,
  48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64,
];

var safeZones = [2, 10, 15, 23, 34, 42, 47, 55];

var player2map = [
  34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52,
  53, 54, 55, 56, 57, 58, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
  17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32,
];

function GenerateMoves(dice_value, gamedata, player) {
  if (player == "p1") {
    var moves = [false, false, false, false];

    if (57 - (player1map.indexOf(gamedata["p1_p1_p"]) + 1) >= dice_value) {
      moves[0] = true;
    }

    if (57 - (player1map.indexOf(gamedata["p1_p2_p"]) + 1) >= dice_value) {
      moves[1] = true;
    }
    if (57 - (player1map.indexOf(gamedata["p1_p3_p"]) + 1) >= dice_value) {
      moves[2] = true;
    }
    if (57 - (player1map.indexOf(gamedata["p1_p4_p"]) + 1) >= dice_value) {
      moves[3] = true;
    }

    return moves;
  } else {
    var moves = [false, false, false, false];

    if (57 - (player2map.indexOf(gamedata["p2_p1_p"]) + 1) >= dice_value) {
      moves[0] = true;
    }

    if (57 - (player2map.indexOf(gamedata["p2_p2_p"]) + 1) >= dice_value) {
      moves[1] = true;
    }
    if (57 - (player2map.indexOf(gamedata["p2_p3_p"]) + 1) >= dice_value) {
      moves[2] = true;
    }
    if (57 - (player2map.indexOf(gamedata["p2_p4_p"]) + 1) >= dice_value) {
      moves[3] = true;
    }

    return moves;
  }
}

async function ExecuteMove(pawn_id, gamedata) {
  /// pawn_id=[p1_p1]

  var playermove = pawn_id.split("_")[0];
  var pawn = pawn_id.split("_")[1];

  var dice_value = gamedata["dice_value"];

  var new_place = player1map.indexOf(gamedata[`p1_${pawn}_p`]) + dice_value;

  //// if safezone {}

  // else{}

  /// chnage pawn
  gamedata[`${playermove}_${pawn}_p`] = new_place;

  ///// dont distrub this
  if (safeZones.indexOf(new_place) != -1) {
    //// safe zone
    if (dice_value == 6) {
      gamedata["dice"] = `${playermove}`;

      gamedata["move"] = "-";
    } else {
      gamedata["dice"] = playermove == "p1" ? "p2" : "p1";

      gamedata["move"] = "-";
    }
  } else {
    /// default

    gamedata["dice"] = playermove == "p1" ? "p2" : "p1";

    gamedata["move"] = "-";

    //// kills

    if (gamedata[`${playermove == "p1" ? "p2" : "p1"}_p1_p`] == new_place) {
      gamedata[`${playermove == "p1" ? "p2" : "p1"}_p1_p`] =
        playermove == "p1" ? player2map[0] : player1map[0];

      gamedata["dice"] = playermove;

      gamedata["move"] = "-";
    }
    if (gamedata[`${playermove == "p1" ? "p2" : "p1"}_p2_p`] == new_place) {
      gamedata[`${playermove == "p1" ? "p2" : "p1"}_p2_p`] =
        playermove == "p1" ? player2map[0] : player1map[0];
      gamedata["dice"] = playermove;

      gamedata["move"] = "-";
    }

    if (gamedata[`${playermove == "p1" ? "p2" : "p1"}_p3_p`] == new_place) {
      gamedata[`${playermove == "p1" ? "p2" : "p1"}_p3_p`] =
        playermove == "p1" ? player2map[0] : player1map[0];
      gamedata["dice"] = playermove;

      gamedata["move"] = "-";
    }

    if (gamedata[`${playermove == "p1" ? "p2" : "p1"}_p4_p`] == new_place) {
      gamedata[`${playermove == "p1" ? "p2" : "p1"}_p4_p`] =
        playermove == "p1" ? player2map[0] : player1map[0];
      gamedata["dice"] = playermove;

      gamedata["move"] = "-";
    }
  }

  var dataupdate = await db.collection("games").updateOne(
    {
      _id: gamedata["_id"],
      // find
    },
    {
      $set: {
        move: gamedata["move"],
        dice: gamedata["dice"],

        p1_p1_p: gamedata["p1_p1_p"],
        p1_p2_p: gamedata["p1_p2_p"],
        p1_p3_p: gamedata["p1_p3_p"],
        p1_p4_p: gamedata["p1_p4_p"],

        p2_p1_p: gamedata["p2_p1_p"],
        p2_p2_p: gamedata["p2_p2_p"],
        p2_p3_p: gamedata["p2_p3_p"],
        p2_p4_p: gamedata["p2_p4_p"],

        p1_score: gamedata["p1_score"],
        p2_score: gamedata["p2_score"],
      },
    },
    {
      upsert: true,
    }
  );

  mqttClient.publishData(
    gamedata["roomcode"],
    {
      move: gamedata["move"],
      dice: gamedata["dice"],

      p1_p1_p: gamedata["p1_p1_p"],
      p1_p2_p: gamedata["p1_p2_p"],
      p1_p3_p: gamedata["p1_p3_p"],
      p1_p4_p: gamedata["p1_p4_p"],

      p2_p1_p: gamedata["p2_p1_p"],
      p2_p2_p: gamedata["p2_p2_p"],
      p2_p3_p: gamedata["p2_p3_p"],
      p2_p4_p: gamedata["p2_p4_p"],

      p1_score: gamedata["p1_score"],
      p2_score: gamedata["p2_score"],
    }.toString()
  );

  return gamedata;

  //// p2
}

function entryEligibilityTest(result, stake) {
  // {
  //   uid: '3629204147285731',
  //   mobile: '9666222330',
  //   blocked: false,
  //   deposit: 0,
  //   winnings: 0,
  //   promotional: null,
  //   kyc_status: 0,
  //   email_verified: false
  // }
  var stake_amount = stake;
  var stake_offer_apply =
    stake_amount * (0.01 * values.promotional_offer_apply);

  if (
    result.data["winnings"] >= stake_amount ||
    (result.data["winnings"] >= stake_amount - stake_offer_apply &&
      result.data["promotional"] >= stake_offer_apply)
  ) {
    return true;
  } else {
    return false;
  }
}

async function createGame(uid, stake, playername) {
  var res___cg = await walletMaster.deductBalance(uid, stake);

  if (res___cg) {
    var roomcode = "games/" + functionList.generateUuid();
    var hashpass = functionList.generateUuid();
    var gameid = functionList.generateUuid();
    var gamestatus = await database.db.collection("games").insertOne({
      p1_id: uid,
      p1_name:
        playername[0] +
        playername[1] +
        "xxxxxx" +
        playername[8] +
        playername[9],

      p1_hash: hashpass,

      p1_score: 0,

      p2_score: 0,

      /// setting positions
      // {
      p1_p1_p: 202,
      p1_p2_p: 202,
      p1_p3_p: 202,
      p1_p4_p: 202,

      p2_p1_p: 24,
      p2_p2_p: 24,
      p2_p3_p: 24,
      p2_p4_p: 24,

      // }

      gameid: gameid,
      status: 0,
      stake: stake,
      winnings: stake * 2,
      roomcode: roomcode,
    });

    if (gamestatus.acknowledged) {
      return {
        error: false,
        roomcode: roomcode,
        gameid: gameid,

        amount: stake,
        winnings: stake * 2,

        hash: hashpass,

        // String roomcode;
        // String token;
        // String uid;
        // String gameid;

        // String player;
      };
    } else {
      false;
    }
  }
}

async function joinGame(gamedetails, uid, playername) {
  var res___cg = await walletMaster.deductBalance(uid, gamedetails["stake"]);

  var starttime = Date.now();

  gamedetails["action_time"] = starttime;

  gamedetails["start_time"] = starttime;

  if (res___cg) {
    var hashpass = functionList.generateUuid();
    // var gamestatus = await database.db.collection("games").insertOne({
    //     player1_id: uid,
    //     player1_name:
    //       playername[0] +
    //       playername[1] +
    //       "xxxxxx" +
    //       playername[8] +
    //       playername[9],
    //     status: 0,
    //     stake:stake,
    //     roomcode: roomcode,
    //   });

    gamedetails["p2_hash"] = hashpass;

    var gamestatus = await database.db.collection("games").updateOne(
      {
        _id: gamedetails["_id"],
      },
      {
        $set: {
          p2_id: uid,

          p2_hash: hashpass,
          dice: "p1",
          action_time: starttime,

          start_time: starttime,

          p2_name:
            playername[0] +
            playername[1] +
            "xxxxxx" +
            playername[8] +
            playername[9],
          status: 1,

          //  update values
        },
      },
      {
        upsert: true, // Insert a new document if no matching document is found
      }
    );

    if (gamestatus.acknowledged) {
   
      return gamedetails;
    } else {
      return false;
    }
  }
}

async function getGameDetails(gameid) {
  var gamedata = await database.db.collection("games").findOne({
    gameid: gameid,
  });
  return gamedata;
}

// const rollDice = async (req, res) => {
//   const player = req.body["player"];

//   const hash = req.body["hash"];

//   const gameid = req.body["gameid"];

//   var gamedata = await database.db.collection("games").findOne(
//     {
//       gameid: gameid,
//     },
//     {
//       projection: {
//         _id: 0,
//       },
//     }
//   );

//   if (gamedata) {

//   } else {
//     return false;
//   }
// };

const movePawn = async (req, res) => {
  /// validator for pawn_id

  const gameToken = req.body["gameToken"];

  const player = req.body["player"];

  const playerhash = req.body["playerhash"];

  const pawn_id = req.body["pawn_id"];

  const gameid = req.body["gameid"];

  var gamedata = await database.db.collection("games").findOne({
    _id: gameid,
  });

  if (gamedata) {
    try {
      if (player == "p1") {
        if (gamedata["p1_hash"] == playerhash) {
          //// valid hash

          if (gamedata["move"] == "p1") {
            /// valid dice

            if (gamedata["valid_moves"][pawn_id - 1]) {
              ExecuteMove(`p1_p${pawn_id}`, gamedata);
            }

            //// needs to validate move
          } else {
            return false;
          }
        } else {
          //// invalid hash
        }
      } else if (player == "p2") {
        if (gamedata["p2_hash"] == playerhash) {
          //// valid hash

          if (gamedata["move"] == "p2") {
            /// valid dice

            if (gamedata["valid_moves"][pawn_id - 1]) {
              ExecuteMove(`p2_p${pawn_id}`, gamedata);
            }

            //// needs to validate move
          } else {
            return false;
          }
        } else {
          //// invalid hash
        }
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  } else {
    return false;
  }
};

module.exports = {
  entryEligibilityTest,
  createGame,
  getGameDetails,
  joinGame,

  // rollDice,
};
