const database = require("./database-functions.js");
const auth = require("./auth.js");
const mqttClient = require("./mqtt-client.js");
const values = require("./values.js");
const app = require("fastify")({ logger: true });

async function addBalance(uid, amount) {
  var txn = await database.db.collection("usersdata").updateOne(
    {
      // find
      uid: uid,
    },
    {
      $inc: { deposit: amount },
    }
  );

  if (txn.acknowledged) {
    return true;
  } else {
    return false;
  }
}

async function deductBalance(uid, amount) {
  var txn = await database.db.collection("usersdata").updateOne(
    {
      // find
      uid: uid,
    },
    {
      $inc: { deposit: 0-amount },
    }
  );

  if (txn.acknowledged) {
    return true;
  } else {
    return false;
  }
}




async function deductWithdrawlBalance(uid, amount) {
  var txn = await database.db.collection("usersdata").updateOne(
    {
      // find
      uid: uid,
    },
    {
      $inc: { winnings: 0-amount },
    }
  );

  if (txn.acknowledged) {
    return true;
  } else {
    return false;
  }
}



module.exports = {
  addBalance,
  deductBalance,
  deductWithdrawlBalance
};
