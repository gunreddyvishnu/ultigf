const database = require("./database-functions.js");
const auth = require("./auth.js");
const mqttClient = require("./mqtt-client.js");
const values = require("./values.js");
const app = require("fastify")({ logger: false });
const gameMaster = require("./gamemaster.js");
const fileUpload = require("fastify-file-upload");

const abhi = require("./abhi.js");

const rollDice = require("./gamefunctions/rolldice.js");

const movePawn = require("./gamefunctions/movepawn.js");
const { status, json } = require("express/lib/response.js");

const path = require("path");

const util = require("util");
const { pipeline } = require("stream");
const pump = util.promisify(pipeline);

const timer = require("./timers.js");
const { createOrder } = require("./payment.js");
const { deductBalance, deductWithdrawlBalance } = require("./walletManager.js");
const { generateUuid } = require("./functions.js");
const { notifications } = require("./notifications.js");
const { winningRatio, imagelist } = require("./pointsTable.js");

const fs = require("fs");
// const util = require('util');
// const { pipeline } = require('stream');
const { uploadFile } = require("./bucketdetails.js");
const { cancelgame } = require("./cancelgame.js");
// const pump = util.promisify(pipeline);

app.register(require("@fastify/multipart"), {
  throwFileSizeLimit: true,
  limits: {
    files: 1,
    fileSize: 6 * 1024 * 1024,
  },
});

// Serve static files from the 'images' folder
app.register(require("@fastify/static"), {
  root: path.join(__dirname, "images"),
  prefix: "/images/", // optional: default '/'
  // constraints: { host: 'example.com' } // optional: default {}
});

// app.register(require('fastify-multipart'), { attachFieldsToBody: true });

database.connectdb();

/////////////// routes

// */auth/login

app.get("/ludogames", async (req, res) => {
  var games = await database.db
    .collection("games")
    .find(
      {
        status: 0,
      },
      {
        projection: {
          _id: 0,
          p1_id: 1,
          gameid: 1,
          status: 1,
          status: 1,
          stake: 1,
          action_time: 1,
        },
      }
    )
    .toArray();

  res.send({
    error: false,
    data: games,
  });
});

app.get("/pub", (req, res) => {
  mqttClient.publishData("games/23", "heyyy");
});

// app.get('/images/:filename', async (req, res) => {

//   try {
//     const { filename } = req.params;

//     // Read the image file (you might need to adjust the path)
//     const imagePath = path.join(__dirname, 'images', filename);
//     console.log(imagePath);
//     // Return the image as a response
//     res.sendFile('myHtml.html')
//   } catch (error) {
//     console.log(error);
//     // Handle any errors (e.g., file not found)
//     // return reply.code(404).send('Image not found');
//   }
// });

app.post("/upload", (req, res) => {
  abhi.upload(req, res);
});

app.post(
  "/auth/login",
  {
    schema: {
      body: {
        type: "object",
        properties: {
          mobile: { type: "string", minLength: 10, maxLength: 10 },
          device: { type: "string" },
        },
        required: ["mobile", "device"],
      },
    },
  },
  async (req, res) => {
    var mobile = req.body["mobile"];
    var device = req.body["device"];

    var result = await auth.signInWithPhoneNumber(mobile, device);

    if (result["error"]) {
      res.status(401).send(result);
    } else {
      res.status(200).send(result);
    }
  }
);

// */auth/verifyotp
app.post(
  "/auth/verifyotp",
  {
    schema: {
      body: {
        type: "object",
        properties: {
          otp: { type: "string", minLength: 4, maxLength: 4 },
          token: { type: "string" },
          mobile: { type: "string" },
          device: { type: "string" },
        },
        required: ["mobile", "token", "otp", "device"],
      },
    },
  },
  async (req, res) => {
    var mobile = req.body["mobile"];
    var token = req.body["token"];
    var otp = req.body["otp"];

    var device = req.body["device"];

    var result = await auth.verifyOtp(mobile, token, otp, device);

    if (result["error"]) {
      res.status(401).send(result);
    } else {
      res.status(200).send(result);
    }
  }
);

const authenticate = (req, res, done) => {
  const authToken = req.headers["authorization"];

  if (authToken == undefined || authToken == null) {
    return res
      .status(401)
      .send({ message: "Unauthorized: Missing or invalid token" });
  }

  done();
};

const authenticate_d = (req, res, done) => {
  const authToken = req.headers["authorization"];

  const mobile = req.query["mobile"];

  if (authToken == undefined || authToken == null || mobile == undefined) {
    return res
      .status(401)
      .send({ message: "Unauthorized: Missing or invalid token" });
  }

  done();
};

app.get("/auth/user", { preHandler: authenticate }, async (req, res) => {
  const jwtToken = req.headers.authorization.split(" ")[1];

  var result = await auth.verifyIdToken(jwtToken);

  if (result["error"]) {
    res.status(401).send(result);
  } else {
    res.status(200).send(result);
  }
});

app.get("/auth/logout", { preHandler: authenticate_d }, async (req, res) => {
  const jwtToken = req.headers.authorization.split(" ")[1];

  var result = await auth.signOut(req.query["mobile"], jwtToken);

  if (result["error"]) {
    res.status(401).send(result);
  } else {
    res.status(200).send(result);
  }
});

//////////// GAME Http APIS

app.post(
  "/game/ludo/create",
  {
    preHandler: authenticate,
    schema: {
      body: {
        type: "object",
        properties: {
          stake: { type: "integer", minimum: values.min_game_stake },
        },
        required: ["stake"],
      },
    },
  },
  async (req, res) => {
    console.log("game masterrrrr  cganme");
    const jwtToken = req.headers.authorization.split(" ")[1];

    var result = await auth.verifyIdToken(jwtToken);

    if (result["error"]) {
      res.status(401).send(result);
    } else {

      var resp_gm = gameMaster.entryEligibilityTest(result, req.body["stake"]);

      if (resp_gm == true) {
        /// create Game function

    

        var gms___ = await gameMaster.createGame(

          result.data["uid"],
          req.body["stake"],
          result.data["mobile"],

          result.data["dp"]
        );

        if (gms___ != false) {
          res.send(gms___);
        } else {
          res.status(401).send({
            message: "Unable to create Game",
          });
        }
      } else {
        res.status(401).send({
          message: "insufficient funds",
          winnings: result.data["winnings"],
          promotional: result.data["promotional"],
        });
      }
    }
  }
);

app.post(
  "/game/ludo/join",
  {
    preHandler: authenticate,
    schema: {
      body: {
        type: "object",
        properties: {
          gameid: { type: "string" },
        },
        required: ["gameid"],
      },
    },
  },
  async (req, res) => {
    const jwtToken = req.headers.authorization.split(" ")[1];

    var result = await auth.verifyIdToken(jwtToken);

    if (result["error"]) {
      res.status(401).send(result);
    } else {
      var gamedetails = await gameMaster.getGameDetails(req.body["gameid"]);

      console.log(gamedetails);

      try {
        if (gamedetails) {
          if (gamedetails["status"] == 0) {
            var resp_gm = gameMaster.entryEligibilityTest(
              result,
              gamedetails["stake"]
            );

            if (resp_gm == true) {
              /// create Game function

              var gms___ = await gameMaster.joinGame(
                gamedetails,
                result["data"]["uid"],

                result["data"]["mobile"],
                result["data"]["dp"],
              );

              if (gms___ != false) {
                mqttClient.publishData(
                  gamedetails["roomcode"],
                  JSON.stringify({
                    action: "opponent-joined",
                    playername:
                      result["data"]["mobile"][0] +
                      result["data"]["mobile"][1] +
                      "xxxxxx" +
                      result["data"]["mobile"][8] +
                      result["data"]["mobile"][9],
                      joindp: result["data"]["dp"],

                    start_time: gms___["start_time"],
                    status: 1,
                    action_time: gms___["action_time"],
                  })
                );


                console.log("HOSTDP : ----" +gamedetails["hostdp"] );
                res.send({
                  error: false,

                  roomcode: gms___["roomcode"],
                  hash: gms___["p2_hash"],
                  gameid: gamedetails["gameid"],
                  start_time: gms___["start_time"],
                  hostdp:gamedetails["hostdp"] ,
                  joindp:result["data"]["dp"],

                  action_time: gms___["action_time"],
                });

                // res.send(gms___);
              } else {
                console.log("sending 401-1");

                res.status(401).send({
                  message: "Unable to create Game",
                });
              }
            } else {
              console.log("sending 401-2");
              res.status(401).send({
                message: "insufficient funds",
                winnings: result.data["winnings"],
                promotional: result.data["promotional"],
              });
            }
          } else {
            console.log("sending 401-3");
            res.status(401).send({
              error: true,
              message: "Game Already Started",
            });
          }
        } else {
          console.log("sending 401-3");
          res.status(401).send({
            error: true,
            message: "Game Already Started",
          });
        }
      } catch (Ee) {
        console.log("sending 401-4");
        console.log(Ee);
        res.status(401).send({
          error: true,
          message: "Game Already Started",
        });
      }
    }
  }
);

app.post(
  "/game/roll",

  async (req, res) => {
    var roll_status = await rollDice.rollDice(req, res);

    if (roll_status == true) {
      res.send({
        error: false,
      });
    } else {
      res.status(401).send({
        error: true,
      });
    }
  }
);

app.post(
  "/game/move",

  async (req, res) => {
    var roll_status = await movePawn.movePawn(req, res);

    if (roll_status == true) {
      res.send({
        error: false,
      });
    } else {
      res.status(401).send({
        error: true,
      });
    }
  }
);

app.post(
  "/auth/register",
  {
    preHandler: authenticate,
    schema: {
      body: {
        type: "object",
        properties: {
          name: { type: "string" },
          image: {
            type: 'string',
            format: 'uri',
            pattern: '^https://cdn\\.sixgames\\.fun/images/.*$', // Ensure it starts with the specified domain
          },
        },
        required: ["name","image"],
      },
    },
  },

  async (req, res) => {
    const jwtToken = req.headers.authorization.split(" ")[1];

    var result = await auth.verifyIdToken(jwtToken);

    if (result["error"]) {
      res.status(401).send(result);
    } else {
      // database.db.

      var ipo = await database.db.collection("usersdata").updateOne(
        {
          // find

          uid: result.data["uid"],
        },
        {
          $set: {
            name: req.body["name"],
            register:true,
            dp:req.body["image"]=="https://cdn.sixgames.fun/images/fun.png"?imagelist[Math.floor(Math.random()*imagelist.length)]:req.body["image"],

            //  update values
          },
        }
      );

      if (ipo.acknowledged) {
        res.send({
          error: false,
          message: "name updated",
        });
      }
    }
  }
);

app.get("/gamedata", async (req, res) => {
  var gameid = req.query["gameid"];

  if (gameid != undefined) {
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
      res.send({
        p1_name: gamedata["p1_name"],
        p2_name: gamedata["p2_name"],
        start_time: gamedata["start_time"],
      });
    } else {
      res.status(400).send({
        error: true,
      });
    }
  } else {
    res.status(400).send({
      error: true,
    });
  }
});

app.get("/addtime", async function (req, res) {
  console.log("Old Date : " + Date.now());
  var dbu = await database.db.collection("games").updateOne(
    {
      gameid: "7916525784420202",
      // find
    },
    {
      $set: {
        action_time: Date.now(),

        //  update values
      },
    },
    {
      upsert: true,
    }
  );

  if (dbu.acknowledged) {
    res.send(dbu);
  }
});

// app.get("/auth/user", { preHandler: authenticate }, async (req, res) => {
//   const jwtToken = req.headers.authorization.split(" ")[1];

// var result = await auth.verifyIdToken(jwtToken);

// if (result["error"]) {
//   res.status(401).send(result);
// } else {
//   res.status(200).send(result);
// }
// });

app.post(
  "/timeup",
  {
    schema: {
      body: {
        type: "object",
        properties: {
          gameid: { type: "string" },
          hash: { type: "string" },
          player: { type: "string" },
        },
        required: ["gameid", "hash", "player"],
      },
    },
  },
  async (req, res) => {
    console.log("Time up act");

    var gameid = req.body["gameid"];

    var hash = req.body["hash"];
    var player = req.body["player"];

    const fiveseconds = Date.now() - 1000 * 5;

    var gamedata = await database.db.collection("games").findOne(
      {
        status: 1,
        gameid: gameid,
      },
      {
        projection: {
          _id: 0,
        },
      }
    );

    if (gamedata) {
      if (gamedata["action_time"] <= fiveseconds) {
        var actiontime = Date.now();
        console.log("change condition true");
        if (gamedata["dice"] == "p1" || gamedata["dice"] == "p2") {
          var updateee = await database.db.collection("games").updateOne(
            {
              // find
              gameid: gamedata["gameid"],
              status: 1,
            },
            {
              $set: {
                dice: gamedata["dice"] == "p1" ? "p2" : "p1",
                action_time: actiontime,

                //  update values
              },
            }
          );

          if (updateee.acknowledged) {
            console.log("Update acknowged");

            mqttClient.publishData(
              gamedata["roomcode"],
              JSON.stringify({
                dice: gamedata["dice"] == "p1" ? "p2" : "p1",
                move: "-",
                action_time: actiontime,
                action: "chance",
              })
            );

            console.log("Update Completed");
            res.send({
              error: false,
            });
          } else {
            console.log("Update not acknowged");
          }
        } else if (gamedata["move"] == "p1" || gamedata["move"] == "p2") {
          var updateee = await database.db.collection("games").updateOne(
            {
              // find
              gameid: gamedata["gameid"],
            },
            {
              $set: {
                dice: gamedata["move"] == "p1" ? "p2" : "p2",
                move: "-",

                //  update values
              },
            }
          );

          if (updateee.acknowledged) {
            console.log("Update Completed");
            mqttClient.publishData(
              gamedata["roomcode"],

              JSON.stringify({
                dice: gamedata["move"] == "p1" ? "p2" : "p2",
                action: "chance",
                move: "-",
              })
            );

            res.send({
              error: false,
            });
          }
        } else {
          /// tie game
        }
      }
    } else {
      res.send({
        error: true,
      });
    }
  }
);

app.post(
  "/gameend",
  {
    schema: {
      body: {
        type: "object",
        properties: {
          gameid: { type: "string" },
          hash: { type: "string" },
          player: { type: "string" },
        },
        required: ["gameid", "hash", "player"],
      },
    },
  },
  async (req, res) => {
    var gameid = req.body["gameid"];

    var hash = req.body["hash"];
    var player = req.body["player"];

    const fivemins = Date.now() - 1000 * 60 * 5;

    var gamedata = await database.db.collection("games").findOne(
      {
        status: 1,
        gameid: gameid,
      },
      {
        projection: {
          _id: 0,
        },
      }
    );

    if (gamedata) {
      if (gamedata["start_time"] <= fivemins) {
        if (gamedata["p1_score"] > gamedata["p2_score"]) {
          //// player 1 win

          console.log("p1 win");

          var updateee = await database.db.collection("games").updateOne(
            {
              // find
              status: 1,
              gameid: gamedata["gameid"],
            },
            {
              $set: {
                status: 2,
                winner: "p1",

                //  update values
              },
            },
            {
              upsert: true,
            }
          );

          if (updateee.acknowledged) {
            var updatee1 = await database.db.collection("usersdata").updateOne(
              {
                uid: gamedata["p1_id"],
              },
              {
                $inc: {
                  winnings: gamedata["winnings"],
                  //  update values
                },
              }
            );

            if (updatee1.acknowledged) {
              mqttClient.publishData(
                gamedata["roomcode"],
                JSON.stringify({
                  win: "p1",
                  action: "game-end",
                  status: 2,
                })
              );

              res.send({
                error: false,
              });
            }
          }
        } else if (gamedata["p2_score"] > gamedata["p1_score"]) {
          console.log("p2 win");
          var updateee = await database.db.collection("games").updateOne(
            {
              // find
              gameid: gamedata["gameid"],
            },
            {
              $set: {
                status: 2,
                winner: "p2",

                //  update values
              },
            }
          );

          if (updateee.acknowledged) {
            var updatee1 = await database.db.collection("usersdata").updateOne(
              {
                uid: gamedata["p2_id"],
              },
              {
                $inc: {
                  winnings: gamedata["winnings"],
                  //  update values
                },
              }
            );

            if (updatee1.acknowledged) {
              mqttClient.publishData(
                gamedata["roomcode"],
                JSON.stringify({
                  win: "p2",
                  action: "game-end",
                  status: 2,
                })
              );

              res.send({
                error: false,
              });
            }
          }
        } else {
          console.log("TIE -- MATCH");
          /// tie game
        }
      } else {
        res.send({
          error: true,
        });
      }
    } else {
      res.send({
        error: true,
      });
    }
  }
);

app.post(
  "/withdrawl",
  {
    preHandler: authenticate,
    schema: {
      body: {
        type: "object",
        properties: {
          amount: { type: "integer" },

          withdrawlId: { type: "string" },
          //  age: { type: 'integer' },
          //  mobile: { type: 'string', minLength: 10 },
        },
        required: ["amount", "withdrawlId"],
      },
    },
  },

  async (req, res) => {
    const jwtToken = req.headers.authorization.split(" ")[1];
    var result = await auth.verifyIdToken(jwtToken);

    if (result["error"]) {
      res.status(401).send(result);
    } else {
      var amount = req.body["amount"];

      if (result.data["winnings"] >= amount) {
        var txnu = await deductWithdrawlBalance(
          result.data["uid"],
          req.body["amount"]
        );

        if (txnu) {
          var txnupdate = await database.db
            .collection("transactions")
            .insertOne({
              uid: result.data["uid"],
              amount: amount,
              mobile: result.data["mobile"],
              createdAt: Date.now(),
              orderid: generateUuid(),
              type: "withdrawl",
              txnid: generateUuid(),
              message: "Withdrawl request created",
              status: 0,
              withdrawlId: req.body["withdrawlId"],
            });

          if (txnupdate.acknowledged) {
            res.send({
              error: false,
              message: notifications.withdrawl_created,
            });
          } else {
            res.send({
              error: true,
              message: notifications.withdrawl_failed,
            });
          }
        }
      }
    }
  }
);

app.post(
  "/deposit",

  {
    preHandler: authenticate,
    schema: {
      body: {
        type: "object",
        properties: {
          amount: { type: "integer" },
          //  email: { type: 'string', format: 'email' },
          //  age: { type: 'integer' },
          //  mobile: { type: 'string', minLength: 10 },
        },
        required: ["amount"],
      },
    },
  },

  async (req, res) => {
    const jwtToken = req.headers.authorization.split(" ")[1];
    var result = await auth.verifyIdToken(jwtToken);

    if (result["error"]) {
      res.status(401).send(result);
    } else {
      var orderdetails = await createOrder({
        amount: 1,
        uid: result.data["uid"],
        mobile: result.data["mobile"],
      });

      console.log(orderdetails.data["order_id"]);
      // console.log(orderdetails.data["data"]["order_id"],);

      res.send({
        error: false,
        data: {
          orderid: orderdetails.data["order_id"],
          paymentid: orderdetails.data["payment_session_id"],
        },
      });

      if (orderdetails["error"] == false) {
        await database.db.collection("transactions").insertOne({
          uid: result.data["uid"],
          amount: req.body["amount"],
          mobile: result.data["mobile"],
          createdAt: Date.now(),
          type: "deposit",
          message: "Amount Deposited ",
          txnid: generateUuid(),
          orderid: orderdetails.data["order_id"],
          paymentid: orderdetails.data["payment_session_id"],
        });
      } else {
        res.send({
          error: true,
          message: "Unknown Error",
        });
      }
    }
  }
);

app.get(
  "/transactions",
  {
    preHandler: authenticate,
  },
  async (req, res) => {
    const jwtToken = req.headers.authorization.split(" ")[1];
    var result = await auth.verifyIdToken(jwtToken);
    if (result["error"]) {
      res.status(401).send(result);
    } else {
      var txns = await database.db
        .collection("transactions")
        .find(
          {
            uid: result.data["uid"],
          },
          {
            projection: {
              _id: 0,
            },
          }
        )
        .toArray();

      if (txns) {
        res.send({
          error: false,
          data: txns,
        });
      } else {
        res.send({
          error: true,
          message: notifications.txns_fetchfail,
        });
      }
    }
  }
);

//////   game functions

app.post("/callback", (req, res) => {
  console.log(req.body);

  // "${widget.gameid}/${widget.token}/p1")

  // {
  //   disconnected_at: 1715334218219,
  //   disconn_props: { 'User-Property': {} },
  //   proto_ver: 3,
  //   proto_name: 'MQIsdp',
  //   clientid: 'Zgbnakq[',
  //   username: 'user',
  //   event: 'client.disconnected',
  //   metadata: { rule_id: 'clientdisconnected_WH_D' },
  //   sockname: '192.168.1.3:1883',
  //   peername: '27.6.2.152:57081',
  //   timestamp: 1715334218224,
  //   reason: 'normal',
  //   node: 'emqx@127.0.0.1'
  // }

  res.send(req.body);
});

app.post("/api/upload", async function (req, res) {
  const data = await req.file();

  // console.log(data.file)

  var status = await uploadFile(data);
  if (status["error"] == true) {
    res.status(500).send({
      error: true,
      message: "please try again",
    });
  } else {
    res.status(200).send({
      error: false,
      image: status["img"],
    });
  }
  // Handle the uploaded file
  // For example, save it to disk:
  // await pump(data.file, fs.createWriteStream(data.filename));
  // reply.send('File uploaded successfully!');
});

app.get("/homescreen", async (req, res) => {
  res.send({
    error: false,
    data: {
      slider: [
        {
          
            image: "https://cdn.sixgames.fun/posters/Group%2075.png",
            link: "/"
          
        },
      ],

      games: [
        {
          name: "LUDO PARTY",
          disc: "Betway Sports is a leading online betting site that offers a full range of sports betting markets from around the world. We are certain to cover all the sports ...",
          logo: "https://cdn.sixgames.fun/posters/ludoicon.png",
          background:"",
          tumbnail: "https://cdn.sixgames.fun/posters/ludologo.png",
          playercount: 300,
          minimum_stake:10,

          link: "/ludo",
          live: true,
          margin: 0.8,
          tutorial: "https://dribbble.com/shots/18673715-Finance-App-Design",
        },

        {
          name: "LUDO PARTY",
          disc: "Betway Sports is a leading online betting site that offers a full range of sports betting markets from around the world. We are certain to cover all the sports ...",
          logo: "https://cdn.sixgames.fun/posters/ludoicon.png",
          tumbnail: "https://cdn.sixgames.fun/posters/ludologo.png",
          playercount: 300,
          link: "/ludo",
          live: true,
          margin: 0.8,
          tutorial: "https://dribbble.com/shots/18673715-Finance-App-Design",
        },
      ],

      refferbanner: "http://super360.oss-ap-south-1.aliyuncs.com/banner.png",

      footer: "https://cdn.sixgames.fun/posters/playulti.png",
    },
  });
});

app.get("/updategame", async (req, res) => {
  await database.db.collection("admindata").updateOne(
    {
      assetid: "games",
    },
    {
      $set: {
        data: [
          {
            name: "LUDO PARTY",
            disc: "Betway Sports is a leading online betting site that offers a full range of sports betting markets from around the world. We are certain to cover all the sports ...",
            logo: "https://cdn.sixgames.fun/posters/ludoicon.png",
            tumbnail: "https://cdn.sixgames.fun/posters/ludologo.png",
            playercount: 300,
            link: "ludo",
            live: true,
            margin: winningRatio,
            tutorial: "https://dribbble.com/shots/18673715-Finance-App-Design",
          },
        ],

        //  update values
      },
    }
  );
});







app.post('/cancelgame', {
schema: {
 body: {
type: 'object',
properties: {
  'gameid': { type: 'string' },
  'hash': { type: 'string' },
  'uid': { type: 'string' },

},
 required: ['gameid','hash','uid'], 
    }, 
  },
   },async (req, res) => { 



  var cancelstatus=await cancelgame({
    gameid:req.body["gameid"],
    hash:req.body["hash"],
    uid:req.body["uid"]
  })



  if(cancelstatus){
    res.status(200).send({
      "error":false,
      "message":"Your Game has Cancelled"

    })
  }
  else{
    res.status(200).send({
      "error":true,
      "message":"Your Game Already Started"

    })
  }






   }); 









app.listen(80, "0.0.0.0", (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  mqttClient.client;
  console.log("Server running on port 80");
});
// ./emqx/bin/emqx start

// ssh -i /Users/vishnu/Downloads/login\ \(2\).pem  ubuntu@ec2-13-48-44-7.eu-north-1.compute.amazonaws.com




// "sharp": "^0.32.6"

// npm i sharp@0.32.6